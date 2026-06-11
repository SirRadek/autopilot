import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const root = process.cwd();
const hookPath = join(root, ".codex", "hooks", "autopilot-hook.mjs");
const temporaryDirectories: string[] = [];

function createStateDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "autopilot-hook-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

function runHook(input: Record<string, unknown>, stateDirectory = createStateDirectory()): string {
  return execFileSync(process.execPath, [hookPath], {
    cwd: root,
    encoding: "utf8",
    input: JSON.stringify({
      session_id: "session-test",
      transcript_path: null,
      cwd: root,
      model: "test-model",
      permission_mode: "default",
      ...input
    }),
    env: {
      ...process.env,
      AUTOPILOT_HOOK_STATE_DIR: stateDirectory
    }
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("Codex Autopilot hooks", () => {
  it("configures the report-first lifecycle events with command hooks", () => {
    const config = JSON.parse(
      readFileSync(join(root, ".codex", "hooks.json"), "utf8")
    ) as {
      hooks: Record<string, Array<{ hooks: Array<Record<string, unknown>> }>>;
    };

    expect(Object.keys(config.hooks)).toEqual(
      expect.arrayContaining([
        "SessionStart",
        "SubagentStart",
        "UserPromptSubmit",
        "PreToolUse",
        "PostToolUse",
        "PreCompact",
        "PostCompact",
        "SubagentStop",
        "Stop"
      ])
    );

    for (const groups of Object.values(config.hooks)) {
      for (const group of groups) {
        for (const hook of group.hooks) {
          expect(hook.type).toBe("command");
          expect(String(hook.command)).toContain("autopilot-hook.mjs");
          expect(String(hook.commandWindows)).toContain("autopilot-hook.mjs");
        }
      }
    }
  });

  it("injects the control-plane boundary at session start", () => {
    const output = runHook({
      hook_event_name: "SessionStart",
      source: "startup"
    });
    const response = JSON.parse(output) as {
      hookSpecificOutput: { additionalContext: string };
    };

    expect(response.hookSpecificOutput.additionalContext).toContain("report-first mode");
    expect(response.hookSpecificOutput.additionalContext).toContain("Decision Mesh");
  });

  it("warns about remote mutation without silently approving or denying it", () => {
    const output = runHook({
      hook_event_name: "PreToolUse",
      turn_id: "turn-risk",
      tool_name: "Bash",
      tool_use_id: "tool-risk",
      tool_input: { command: "git push origin main" }
    });
    const response = JSON.parse(output) as {
      hookSpecificOutput: Record<string, unknown> & { additionalContext: string };
    };

    expect(response.hookSpecificOutput.additionalContext).toContain("REMOTE_MUTATION_APPROVED");
    expect(response.hookSpecificOutput).not.toHaveProperty("permissionDecision");
    expect(response).not.toHaveProperty("decision");
  });

  it("detects secret-like prompt content without storing the raw prompt", () => {
    const stateDirectory = createStateDirectory();
    const secret = `sk-proj-${"a".repeat(32)}`;
    const output = runHook(
      {
        hook_event_name: "UserPromptSubmit",
        turn_id: "turn-secret",
        prompt: `Use this key ${secret}`
      },
      stateDirectory
    );
    const response = JSON.parse(output) as {
      hookSpecificOutput: { additionalContext: string };
    };
    const ledger = readFileSync(join(stateDirectory, "events.jsonl"), "utf8");

    expect(response.hookSpecificOutput.additionalContext).toContain("Potential credential");
    expect(ledger).toContain("secret_like_input");
    expect(ledger).not.toContain(secret);
    expect(ledger).not.toContain("Use this key");
  });

  it("returns valid JSON for stop hooks and reports turn failures", () => {
    const stateDirectory = createStateDirectory();
    runHook(
      {
        hook_event_name: "PostToolUse",
        turn_id: "turn-stop",
        tool_name: "Bash",
        tool_use_id: "tool-failed",
        tool_input: { command: "npm test" },
        tool_response: { exit_code: 1 }
      },
      stateDirectory
    );

    const output = runHook(
      {
        hook_event_name: "Stop",
        turn_id: "turn-stop",
        stop_hook_active: false,
        last_assistant_message: "Done."
      },
      stateDirectory
    );
    const response = JSON.parse(output) as {
      continue: boolean;
      systemMessage: string;
    };

    expect(response.continue).toBe(true);
    expect(response.systemMessage).toContain("failed");
  });

  it("writes a redacted investigator handoff for failed tool results", () => {
    const stateDirectory = createStateDirectory();
    const rawCommand = "npm test -- --runInBand";
    const output = runHook(
      {
        hook_event_name: "PostToolUse",
        turn_id: "turn-investigate",
        tool_name: "Bash",
        tool_use_id: "tool-failed",
        tool_input: { command: rawCommand },
        tool_response: { exit_code: 2, stderr: "secret raw failure text" }
      },
      stateDirectory
    );
    const response = JSON.parse(output) as {
      hookSpecificOutput: { additionalContext: string };
    };
    const queue = readFileSync(join(stateDirectory, "investigation-queue.jsonl"), "utf8");
    const handoff = JSON.parse(queue.trim()) as {
      target_agent: string;
      mode: string;
      failure_type: string;
      exit_code: number;
      required_checks: string[];
      forbidden_actions: string[];
    };

    expect(response.hookSpecificOutput.additionalContext).toContain("investigator handoff");
    expect(handoff.target_agent).toBe("investigator");
    expect(handoff.mode).toBe("INSPECT_ONLY");
    expect(handoff.failure_type).toBe("nonzero_exit_code");
    expect(handoff.exit_code).toBe(2);
    expect(handoff.required_checks).toContain("rerun_narrowest_relevant_check");
    expect(handoff.required_checks).toContain("stop_or_drain_affected_process_before_fix");
    expect(handoff.required_checks).toContain("restart_refreshed_session_after_fix");
    expect(handoff.required_checks).toContain("update_continuity_and_resume_from_last_state");
    expect(handoff.forbidden_actions).toContain("raw_project_log_copy");
    expect(handoff.forbidden_actions).toContain("fixing_live_process_without_stop_or_drain");
    expect(queue).not.toContain(rawCommand);
    expect(queue).not.toContain("secret raw failure text");
  });

  it("does not classify successful HTTP-style status codes as failures", () => {
    const output = runHook({
      hook_event_name: "PostToolUse",
      turn_id: "turn-http-success",
      tool_name: "mcp__example__read",
      tool_use_id: "tool-http-success",
      tool_input: { id: "example" },
      tool_response: { statusCode: 200, ok: true }
    });

    expect(output).toBe("");
  });
});
