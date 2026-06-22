// Real codex_cli investigator run for WORKER-CLI-001 apply step.
// Owner model: Codex leads vendor/tooling investigation; Opus orchestrates + reviews.
// This drives a REAL codex_cli worker through runCliWorker (production path) and
// reads it back via buildSubagentTree as proof-of-real-Codex for the apply.
// Bounded ask => likely to finish; if it hangs, the orchestrator records the
// timeout honestly and proceeds with the already-Codex-authored §C baseline.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { runCliWorker } from "../src/data/delivery-system/cliWorker.ts";
import { buildSubagentTree } from "../src/data/delivery-system/subagentEvidence.ts";

const stateDir = join(process.cwd(), "output", "_agy-apply-state");
mkdirSync(stateDir, { recursive: true });

const parentSessionHash = "opus-agy-heartbeat-apply";

const prompt = [
  "You are the lead vendor/tooling investigator for Autopilot WORKER-CLI-001.",
  "Context: we are APPLYING the approved agy heartbeat-capture redesign to",
  "src/data/delivery-system/cliWorkerCapture.ts. The completion logic is being",
  "extracted into a PURE function decideAgyTerminalState(snapshot) so it is unit",
  "testable without a live (hanging) agy. The fast-path priority is:",
  "1) result.md present + size-stable + (status.jsonl has event:final OR cli-log",
  "   'Stream completed') => done immediately, then kill proc;",
  "2) status.jsonl event:error OR 'Print mode: timed out' => attempt failure/retry;",
  "3) process exit => result_md if non-empty else pty else pty_exit_no_output;",
  "4) transcript idle > 45s => idle_with_result if stable result else transcript_idle;",
  "5) wall-clock > timeoutMs => flat_timeout. Always kill the lingering agy proc.",
  "Reply with EXACTLY one line of minified JSON and nothing else, matching:",
  '{"ok":true,"agent":"codex_cli","fastpath_order_ok":true|false,',
  '"defects":["..."],"notes":"<=200 chars"}',
  "If the ordering is correct, fastpath_order_ok=true and defects=[]."
].join("\n");

const startWall = new Date().toISOString();
const res = await runCliWorker(
  {
    handoffId: "hp-agy-heartbeat-apply" as never,
    vendor: "codex_cli",
    prompt,
    parentSessionHash,
    parentTurnHash: "turn-apply-1",
    timeoutMs: 240000
  },
  stateDir
);

const tree = buildSubagentTree(parentSessionHash, stateDir);

const summary = {
  startWall,
  workerRunId: res.workerRunId,
  vendor: res.vendor,
  exitCode: res.exitCode,
  durationSeconds: Math.round(res.durationSeconds),
  lockStatus: res.lockStatus,
  errorReason: res.errorReason,
  parsedJson: res.parsedJson,
  rawOutputHead: (res.rawOutput || "").slice(0, 400),
  tree
};

writeFileSync(join(stateDir, "summary.json"), JSON.stringify(summary, null, 2), "utf8");
console.log("=== runCliWorker result (trimmed) ===");
console.log(JSON.stringify(summary, null, 2));
