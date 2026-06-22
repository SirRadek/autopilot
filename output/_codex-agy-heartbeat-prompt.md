# Codex lead-investigator task: robust `agy` capture + liveness/heartbeat design

You are the **lead investigator** (codex_cli, max reasoning). Opus orchestrates and will
review/synthesize your output, but the diagnosis and concrete implementation design are
YOURS to drive. Be specific, opinionated, and produce real code (a concrete diff), not prose.

This is a DESIGN task only. Do NOT modify production files. Output your design as your final
message (markdown). Opus will save it. Do not touch the repo.

## Why you (not Claude) lead this

`agy` (Antigravity Gemini CLI, command `agy.exe`) is currently BROKEN for our capture path:
real long answers are not reliably recoverable. The owner's rule: agy = MISSING when capture
fails — no roleplay, no faking output. We need a robust capture + heartbeat redesign.

## Current production code (the thing to redesign)

File: `src/data/delivery-system/cliWorkerCapture.ts`, function `captureAgyResponse`
(plus `stripAnsi` / `extractJsonFromPtyOutput`). Current behavior:

```ts
export async function captureAgyResponse(prompt, opts = {}) {
  const ptyModule = await import("node-pty");
  const pty = ptyModule.default ?? ptyModule;
  const agyPath = resolveAgyPath(); // `where agy` -> agy.exe
  const args = ["--print", prompt, "--dangerously-skip-permissions",
                ...(opts.model ? ["--model", opts.model] : [])];
  // spawn pty (cols 220, rows 30), collect onData into `collected`
  // single setTimeout(opts.timeoutMs ?? 120000) -> kill + reject
  // onExit -> resolve { exitCode, rawOutput, cleanOutput: stripAnsi(collected),
  //                     parsedJson: extractJsonFromPtyOutput(cleanOutput), durationMs }
}
```

It returns `AgyCaptureResult { exitCode, rawOutput, cleanOutput, parsedJson, durationMs }`.
`runCliWorker` (cliWorker.ts) calls it for `vendor === "agy_cli"`, then treats empty
`rawOutput` as `errorReason = "empty_output"`. There is NO heartbeat, NO hang detection
beyond one flat timeout, and the only output source is the PTY buffer.

## Observed failure modes (owner)

- Real/long agy answers are NOT in `transcript.jsonl` `content` (only short probe text is)
  and NOT on stdout/stderr (0 B in non-PTY mode) -> the real text streams only to the PTY.
- A single flat 120s timeout cannot distinguish "still streaming" from "hung".
- Owner KILLED the idea of reading the final answer out of the per-conversation SQLite DB.
  Do NOT design SQLite as an output source. (SQLite size/mtime may be used ONLY as a coarse
  heartbeat, nothing else.)

## AUTHORITATIVE owner model (treat as spec — design the implementation for it)

Liveness/heartbeat signals, in priority order:
1. PID of `agy.exe` alive = only proves "process exists".
2. **`transcript.jsonl` grows** (Length / LastWriteTime / increasing `step_index`) = best
   practical "alive" signal.
3. cli log status lines (secondary, buffered): `Created conversation`, `Streaming`,
   `Stream completed` (= done), `Print mode: timed out` (= vendor timeout).
4. SQLite `.db` size/mtime = coarse heartbeat only, never an output source.

Loop: start agy -> hold PID -> find conversation-id of THIS run from the new cli-log line /
newest brain dir created AFTER start -> every 2-5 s stat transcript.jsonl -> growing = alive;
N seconds with no growth = hang suspect; `Stream completed` = done; `Print mode: timed out`
= vendor timeout.

BEST design (owner's preferred): require `agy`, via the handoff prompt, to write its OWN
status side-channel:
- `.agent/runs/<run-id>/status.jsonl` = heartbeat (append-only progress lines), and
- `.agent/runs/<run-id>/result.md` = **authoritative final result**.
PTY = live capture / preview only. Authoritative result = `result.md` file. Heartbeat =
`status.jsonl`. This is more robust than stdout/transcript/SQL. Hang detection: transcript
stagnation for N s OR `Print mode: timed out` -> kill + retry -> on repeat failure MISSING.

## REAL grounded evidence (Opus mapped the live machine — use these exact paths/formats)

- agy resolves to: `C:\Users\sirok\AppData\Local\Microsoft\WinGet\Links\agy.exe`.
- CLI logs (glog format): `~/.gemini/antigravity-cli/log/cli-<YYYYMMDD_HHMMSS>.log`.
  Exact status-line formats observed (UUID redacted):
  - `I0622 18:04:12.044478 28400 server.go:789] Created conversation <UUID>`
  - `I0622 18:04:12.047983 28400 conversation_manager.go:525] Streaming conversation <UUID>`
  - `I0622 18:04:15.666813 28400 conversation_manager.go:601] Stream completed for <UUID>, clearing ResponsePending`
  (PID `28400` is the agy server pid in column 3 of the glog line.)
- The conversation-id is the SAME UUID in THREE places (triple binding — use for race-free id):
  - cli-log `Created conversation <UUID>` line,
  - brain dir name: `~/.gemini/antigravity-cli/brain/<UUID>/`,
  - sqlite file: `~/.gemini/antigravity-cli/conversations/<UUID>.db`.
- transcript path: `~/.gemini/antigravity-cli/brain/<UUID>/.system_generated/logs/transcript.jsonl`
  (also `transcript_full.jsonl`). Each line keys observed:
  `step_index (number), source, type, status, created_at (ISO), content, thinking`.
  `step_index` is monotonic -> strongest growth signal (stronger than mtime).
- Multiple cli-<ts>.log files exist (one per invocation); pick the newest by mtime created
  AFTER your start timestamp, OR tail the one whose `Created conversation` UUID matches the
  newest brain dir created after start. Solve the race: there are concurrent agy runs on this
  machine, so "newest brain dir" alone is not safe — correlate via the cli-log line printed
  after your spawn, and confirm the brain dir mtime > spawn time.
- Platform: Windows 11, Node, `node-pty` IS installed. Code runs from PowerShell; repo uses
  `npm.cmd`. Keep it cross-platform-tolerant but Windows is the real target.

## YOUR DELIVERABLE (be concrete)

1. Redesigned `captureAgyResponse` + a new liveness/heartbeat monitor implementing the owner
   model: PTY live capture + transcript heartbeat poll (step_index/size/mtime) + cli-log
   status parse + the mandatory `.agent/runs/<run-id>/{status.jsonl,result.md}` side-channel
   with `result.md` authoritative. Give the new TypeScript: full function bodies or a precise
   unified diff against the current `cliWorkerCapture.ts`. Define any new return-type fields
   (e.g. `livenessReason`, `resultSource: "result_md" | "pty" | "transcript" | "missing"`,
   `heartbeats`, `convId`) and how `runCliWorker` should consume them.
2. Robustness: exact algorithm to find THIS run's conversation-id without races; WHEN to read
   `result.md` (only after `Stream completed` or transcript idle + result.md present?); full
   fallback ladder when agy does NOT write the status file (PTY capture -> transcript content
   -> MISSING); concrete hang thresholds (e.g. transcript idle > N s) and retry/MISSING policy;
   error handling for: agy never creates a brain dir, cli-log never appears, `Print mode:
   timed out`, partial result.md, pty death.
3. A concrete handoff-prompt ADDENDUM (the exact instruction text we inject into every agy
   handoff) that makes `agy` write `.agent/runs/<run-id>/status.jsonl` (append a JSON line per
   step) and `.agent/runs/<run-id>/result.md` (final answer), including the run-id contract
   (who generates run-id, how agy learns it — e.g. we pass it in the prompt and set CWD).

Structure your answer as:
A. Diagnosis (root cause of why current capture loses the answer)
B. Architecture (the monitor + capture data flow, states: starting/streaming/idle/done/
   timed_out/missing)
C. Concrete diff for cliWorkerCapture.ts (+ runCliWorker consumption changes)
D. Handoff-prompt addendum text
E. Open risks / what you are UNSURE about (be honest; if a path assumption could be wrong,
   say how to verify it)

Do not invent vendor behavior you cannot ground; if you must assume, label it ASSUMPTION and
give a one-line verification step. Prioritize the `.agent/runs` side-channel as the primary
path and the PTY/transcript as fallback, exactly as the owner specified.
