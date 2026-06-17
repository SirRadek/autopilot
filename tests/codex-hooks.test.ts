import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

const root = process.cwd();
const hookPath = join(root, ".codex", "hooks", "autopilot-hook.mjs");
const HOOK_SUBPROCESS_TIMEOUT_MS = 5000;
const temporaryDirectories: string[] = [];

interface HookTestInternals {
  createSupervisorAlert: (
    trigger: string,
    context: string,
    provider?: string | null
  ) => { severity: string; recommendedAction: string };
}

function createStateDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "autopilot-hook-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

function runHook(
  input: Record<string, unknown>,
  stateDirectory = createStateDirectory(),
  extraEnv: Record<string, string> = {}
): string {
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
      AUTOPILOT_HOOK_STATE_DIR: stateDirectory,
      AUTOPILOT_SESSION_STATE_DIR: join(stateDirectory, "session-state"),
      ...extraEnv
    }
  });
}

function readSessionStateFile(stateDirectory: string, file: string): string {
  return readFileSync(join(stateDirectory, "session-state", file), "utf8");
}

async function importHookTestInternals(): Promise<HookTestInternals> {
  const hookModule = (await import(pathToFileURL(hookPath).href)) as {
    hookTestInternals: HookTestInternals;
  };

  return hookModule.hookTestInternals;
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
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

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
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

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
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

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
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

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
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

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
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

  it("records Gemini capacity phrases as redacted session history", () => {
    const stateDirectory = createStateDirectory();
    runHook(
      {
        hook_event_name: "PostToolUse",
        turn_id: "turn-gemini-capacity",
        tool_name: "gemini_cli",
        tool_use_id: "tool-gemini",
        tool_input: { command: "gemini --model auto" },
        tool_response: {
          exit_code: 1,
          stderr: "You have exhausted your capacity on this model."
        }
      },
      stateDirectory
    );

    const history = readSessionStateFile(stateDirectory, "history.jsonl");
    const entry = JSON.parse(history.trim()) as { event: string; detail: string };

    expect(entry.event).toBe("provider_status_changed");
    expect(entry.detail).toBe("gemini_rate_limit_phrase_detected");
    expect(history).not.toContain("exhausted your capacity");
    expect(history).not.toContain("gemini --model auto");
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

  it("keeps hook supervisor alert blocker mappings aligned with supervisor alerts", async () => {
    const internals = await importHookTestInternals();

    expect(internals.createSupervisorAlert("provider_unavailable", "ctx").severity).toBe("blocker");
    expect(internals.createSupervisorAlert("correction_loop_exceeded", "ctx").severity).toBe("blocker");
    expect(internals.createSupervisorAlert("missing_owner_decision", "ctx").severity).toBe("blocker");
    expect(internals.createSupervisorAlert("provider_tier_switched", "ctx").severity).toBe("info");
    expect(internals.createSupervisorAlert("gemini_session_exhausted", "ctx").severity).toBe("warning");
  });

  it("detects Gemini capacity phrases from result payloads", () => {
    const stateDirectory = createStateDirectory();
    runHook(
      {
        hook_event_name: "PostToolUse",
        turn_id: "turn-gemini-result-capacity",
        tool_name: "gemini_cli",
        tool_use_id: "tool-gemini-result",
        result: {
          stderr: "retry"
        }
      },
      stateDirectory
    );

    const history = readSessionStateFile(stateDirectory, "history.jsonl");
    const entry = JSON.parse(history.trim()) as { event: string; detail: string };

    expect(entry.event).toBe("provider_status_changed");
    expect(entry.detail).toBe("gemini_rate_limit_phrase_detected");
    expect(history).not.toContain("retry");

    const session = JSON.parse(readSessionStateFile(stateDirectory, "session.json")) as {
      providerStatus: Record<string, string>;
      pendingAlerts: Array<{ trigger: string; provider: string | null }>;
    };
    expect(session.providerStatus.gemini_cli).toBe("rate_limited");
    expect(session.pendingAlerts).toContainEqual(
      expect.objectContaining({
        trigger: "gemini_session_exhausted",
        provider: "gemini_cli"
      })
    );
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

  it("updates session.json on stop without storing raw assistant text", () => {
    const stateDirectory = createStateDirectory();
    runHook(
      {
        hook_event_name: "Stop",
        turn_id: "turn-session-json",
        stop_hook_active: false,
        last_assistant_message: "Raw assistant completion text should not be stored."
      },
      stateDirectory
    );

    const session = JSON.parse(readSessionStateFile(stateDirectory, "session.json")) as {
      schemaVersion: string;
      hookEventCount: number;
      investigationQueueDepth: number;
    };
    const sessionText = readSessionStateFile(stateDirectory, "session.json");

    expect(session.schemaVersion).toBe("v1");
    expect(session.hookEventCount).toBeGreaterThan(0);
    expect(session.investigationQueueDepth).toBe(0);
    expect(sessionText).not.toContain("Raw assistant completion text");
    expect(readdirSync(join(stateDirectory, "session-state")).filter((file) => file.endsWith(".tmp"))).toEqual([]);
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

  it("creates and releases worker.lock for matching subagent handoff ids", () => {
    const stateDirectory = createStateDirectory();
    const handoffId = "hp-20260617-hook-lock";

    runHook(
      {
        hook_event_name: "SubagentStart",
        turn_id: "turn-lock",
        handoff_id: handoffId
      },
      stateDirectory
    );

    const lockPath = join(stateDirectory, "session-state", "worker.lock");
    const lock = JSON.parse(readFileSync(lockPath, "utf8")) as { lockedBy: string; lockedAt: string };
    expect(lock.lockedBy).toBe(handoffId);
    expect(lock.lockedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    runHook(
      {
        hook_event_name: "SubagentStop",
        turn_id: "turn-lock",
        handoff_id: handoffId
      },
      stateDirectory
    );

    expect(existsSync(lockPath)).toBe(false);
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

  it("does not silently acquire worker.lock when another handoff is active", () => {
    const stateDirectory = createStateDirectory();
    const sessionStateDirectory = join(stateDirectory, "session-state");
    mkdirSync(sessionStateDirectory, { recursive: true });
    const lockPath = join(sessionStateDirectory, "worker.lock");
    writeFileSync(
      lockPath,
      `${JSON.stringify({ lockedBy: "hp-20260617-existing", lockedAt: new Date().toISOString() })}\n`,
      "utf8"
    );

    const output = runHook(
      {
        hook_event_name: "SubagentStart",
        turn_id: "turn-lock-existing",
        handoff_id: "hp-20260617-new"
      },
      stateDirectory
    );
    const response = JSON.parse(output) as { hookSpecificOutput: { additionalContext: string } };
    const lock = JSON.parse(readFileSync(lockPath, "utf8")) as { lockedBy: string };

    expect(lock.lockedBy).toBe("hp-20260617-existing");
    expect(response.hookSpecificOutput.additionalContext).toContain("worker.lock already present");
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

  it("reports missing handoff ids instead of silently skipping worker.lock", () => {
    const stateDirectory = createStateDirectory();
    const output = runHook(
      {
        hook_event_name: "SubagentStart",
        turn_id: "turn-lock-missing-handoff"
      },
      stateDirectory
    );
    const response = JSON.parse(output) as { hookSpecificOutput: { additionalContext: string } };

    expect(response.hookSpecificOutput.additionalContext).toContain("handoff_id is missing");
    expect(existsSync(join(stateDirectory, "session-state", "worker.lock"))).toBe(false);
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

  it("replaces stale worker.lock files left by abandoned worker sessions", () => {
    const stateDirectory = createStateDirectory();
    const sessionStateDirectory = join(stateDirectory, "session-state");
    mkdirSync(sessionStateDirectory, { recursive: true });
    const lockPath = join(sessionStateDirectory, "worker.lock");
    writeFileSync(
      lockPath,
      `${JSON.stringify({ lockedBy: "hp-20260617-abandoned", lockedAt: "2020-01-01T00:00:00.000Z" })}\n`,
      "utf8"
    );

    const output = runHook(
      {
        hook_event_name: "SubagentStart",
        turn_id: "turn-lock-stale",
        handoff_id: "hp-20260617-new"
      },
      stateDirectory
    );
    const response = JSON.parse(output) as { hookSpecificOutput: { additionalContext: string } };
    const lock = JSON.parse(readFileSync(lockPath, "utf8")) as { lockedBy: string };

    expect(lock.lockedBy).toBe("hp-20260617-new");
    expect(response.hookSpecificOutput.additionalContext).toContain("stale worker.lock was replaced");
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

  it("trims session history to the most recent 50 entries", () => {
    const stateDirectory = createStateDirectory();
    const sessionStateDirectory = join(stateDirectory, "session-state");
    mkdirSync(sessionStateDirectory, { recursive: true });
    writeFileSync(
      join(sessionStateDirectory, "history.jsonl"),
      Array.from({ length: 52 }, (_, index) =>
        JSON.stringify({
          timestamp: new Date(0).toISOString(),
          event: "session_start",
          detail: `old-${index}`,
          handoffId: undefined
        })
      ).join("\n") + "\n",
      "utf8"
    );

    runHook(
      {
        hook_event_name: "PostToolUse",
        turn_id: "turn-history-trim",
        tool_name: "gemini_cli",
        tool_use_id: "tool-history-trim",
        tool_response: { stderr: "RESOURCE_EXHAUSTED retry later" }
      },
      stateDirectory
    );

    const lines = readSessionStateFile(stateDirectory, "history.jsonl").trim().split(/\r?\n/);
    const lastEntry = JSON.parse(lines.at(-1) ?? "{}") as { detail: string };

    expect(lines.length).toBe(50);
    expect(lastEntry.detail).toBe("gemini_rate_limit_phrase_detected");
  }, HOOK_SUBPROCESS_TIMEOUT_MS);

  it("continues when session.json writes fail", () => {
    const stateDirectory = createStateDirectory();
    const blockedPath = join(stateDirectory, "not-a-directory");
    writeFileSync(blockedPath, "file blocks directory creation", "utf8");

    const output = runHook(
      {
        hook_event_name: "Stop",
        turn_id: "turn-session-write-fail",
        stop_hook_active: false
      },
      stateDirectory,
      { AUTOPILOT_SESSION_STATE_DIR: blockedPath }
    );
    const response = JSON.parse(output) as { continue: boolean };

    expect(response.continue).toBe(true);
  }, HOOK_SUBPROCESS_TIMEOUT_MS);
});
