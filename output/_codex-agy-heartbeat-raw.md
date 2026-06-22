A. Diagnosis
------------

Current `captureAgyResponse` has one data source: the PTY buffer. That is fragile for `agy` because observed real answers stream through the interactive PTY path but are not reliably materialized into stdout/stderr or transcript `content`. The flat 120s timer also treats “still streaming a valid long answer” and “stalled forever” as the same failure.

The fix should stop treating PTY text as authoritative. PTY becomes live preview/fallback only. The authoritative output must be a file contract created by the `agy` run itself:

- `.agent/runs/<run-id>/status.jsonl` for append-only progress/heartbeat
- `.agent/runs/<run-id>/result.md` for the final answer

The monitor should separately track process existence, Antigravity CLI logs, transcript growth, and coarse SQLite mtime/size, but never read SQLite as output.

B. Architecture
---------------

States:

- `starting`: PTY spawned, waiting for cli-log conversation binding or side-channel heartbeat
- `streaming`: transcript step/size/mtime is growing, PTY may also be updating
- `idle`: process alive but transcript has not grown for `transcriptIdleMs`
- `done`: `Stream completed for <uuid>` or process exit with stable `result.md`
- `timed_out`: `Print mode: timed out` or hard timeout
- `missing`: no trustworthy final output after retry

Thresholds I’d ship:

```ts
pollMs: 3000
startupTimeoutMs: 30000
transcriptIdleMs: 45000
resultStableMs: 2000
streamCompletedResultGraceMs: 7000
timeoutMs: opts.timeoutMs ?? 10 * 60_000
maxAttempts: 2
```

Conversation binding, race-safe order:

1. Record `startedAtMs` immediately before PTY spawn.
2. Hold `proc.pid`.
3. Scan `~/.gemini/antigravity-cli/log/cli-*.log` whose `birthtimeMs` or `mtimeMs` is after `startedAtMs - 5000`.
4. Parse glog lines:
   - `Created conversation <UUID>`
   - `Streaming conversation <UUID>`
   - `Stream completed for <UUID>, clearing ResponsePending`
   - `Print mode: timed out`
5. Score UUID candidates:
   - log PID equals `proc.pid`: strongest
   - brain dir exists and mtime is after spawn
   - SQLite db exists and mtime is after spawn
   - transcript contains the injected `run-id`: strongest fallback if PID does not match
6. Bind only if one candidate clearly wins. If ambiguous, keep monitoring side-channel/PTY and do not pretend the transcript belongs to this run.

When to read `result.md`:

- Read as authoritative only when:
  - `Stream completed` for bound conversation and `result.md` is non-empty and stable, or
  - process exits and `result.md` is non-empty, or
  - transcript is idle beyond threshold and `result.md` is non-empty and stable.
- Do not accept SQLite output.
- `Print mode: timed out` before accepted `result.md` means attempt failure and retry.
- After two failed attempts: `resultSource = "missing"` and `errorReason = "agy_missing:<reason>"`.

Fallback ladder:

1. `result.md` authoritative
2. PTY clean output, fallback only
3. transcript content, fallback only and marked `resultSource: "transcript"`
4. `missing`

C. Concrete Diff
----------------

Design patch only. I did not apply this.

```diff
diff --git a/src/data/delivery-system/cliWorkerCapture.ts b/src/data/delivery-system/cliWorkerCapture.ts
--- a/src/data/delivery-system/cliWorkerCapture.ts
+++ b/src/data/delivery-system/cliWorkerCapture.ts
@@
 import { execSync } from "node:child_process";
-import { mkdirSync, writeFileSync } from "node:fs";
-import { tmpdir } from "node:os";
+import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
+import { homedir, tmpdir } from "node:os";
 import { join } from "node:path";
 import { platform } from "node:process";
@@
 export interface AgyCaptureOptions {
   readonly model?: string;
   readonly cwd?: string;
   readonly timeoutMs?: number;
+  readonly runId?: string;
+  readonly pollMs?: number;
+  readonly startupTimeoutMs?: number;
+  readonly transcriptIdleMs?: number;
+  readonly resultStableMs?: number;
+  readonly maxAttempts?: number;
 }
 
+export type AgyResultSource = "result_md" | "pty" | "transcript" | "missing";
+export type AgyLivenessReason =
+  | "stream_completed"
+  | "idle_with_result"
+  | "process_exit"
+  | "vendor_timeout"
+  | "startup_timeout"
+  | "transcript_idle"
+  | "flat_timeout"
+  | "pty_exit_no_output";
+
+export interface AgyHeartbeat {
+  readonly at: string;
+  readonly kind: "pid" | "cli_log" | "transcript" | "sqlite" | "status_jsonl" | "pty";
+  readonly convId?: string;
+  readonly message?: string;
+  readonly size?: number;
+  readonly mtimeMs?: number;
+  readonly stepIndex?: number;
+}
+
 export interface AgyCaptureResult {
   readonly exitCode: number;
   readonly rawOutput: string;
   readonly cleanOutput: string;
   readonly parsedJson: unknown;
   readonly durationMs: number;
+  readonly resultSource: AgyResultSource;
+  readonly livenessReason: AgyLivenessReason;
+  readonly convId: string | null;
+  readonly runId: string;
+  readonly runDir: string;
+  readonly statusPath: string;
+  readonly resultPath: string;
+  readonly heartbeats: readonly AgyHeartbeat[];
 }
@@
 export async function captureAgyResponse(
   prompt: string,
   opts: AgyCaptureOptions = {}
 ): Promise<AgyCaptureResult> {
+  const maxAttempts = opts.maxAttempts ?? 2;
+  let last: AgyCaptureResult | null = null;
+
+  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
+    last = await captureAgyResponseAttempt(prompt, opts, attempt);
+    if (last.resultSource !== "missing") return last;
+    if (!["vendor_timeout", "startup_timeout", "transcript_idle", "flat_timeout", "pty_exit_no_output"].includes(last.livenessReason)) {
+      return last;
+    }
+  }
+
+  return last ?? missingAgyResult(prompt, opts);
+}
+
+function agyRoot(): string {
+  return join(homedir(), ".gemini", "antigravity-cli");
+}
+
+function agyRunPaths(cwd: string, runId: string): { runDir: string; statusPath: string; resultPath: string } {
+  const runDir = join(cwd, ".agent", "runs", runId);
+  mkdirSync(runDir, { recursive: true });
+  return {
+    runDir,
+    statusPath: join(runDir, "status.jsonl"),
+    resultPath: join(runDir, "result.md")
+  };
+}
+
+export function buildAgySideChannelPrompt(prompt: string, runId: string, cwd = process.cwd()): string {
+  const { runDir, statusPath, resultPath } = agyRunPaths(cwd, runId);
+  return `${prompt}
+
+---
+
+AGY RUN ARTIFACT CONTRACT - MANDATORY
+
+You are running under Autopilot worker run id: ${runId}
+Current working directory: ${cwd}
+
+Before doing substantive work, create this directory if needed:
+${runDir}
+
+Append one compact JSON object per line to:
+${statusPath}
+
+Each status line must include:
+{"run_id":"${runId}","event":"started|progress|final|error","message":"short status","at":"ISO-8601 timestamp"}
+
+Write your final answer to:
+${resultPath}
+
+Rules:
+- result.md is the authoritative final answer.
+- Do not rely on stdout, terminal rendering, transcript storage, or SQLite for the final answer.
+- Write result.md only when the final answer is complete. Prefer writing result.md.tmp first, then renaming it to result.md.
+- After result.md is complete, append a final status line with event "final".
+- If you cannot complete, append an error status line and explain the blocker in result.md.`;
+}
+
+async function captureAgyResponseAttempt(
+  prompt: string,
+  opts: AgyCaptureOptions,
+  attempt: number
+): Promise<AgyCaptureResult> {
   // Dynamic import so TS compile doesn't fail in environments without node-pty
   const ptyModule = await import("node-pty");
   const pty = ptyModule.default ?? ptyModule;
 
   const agyPath = resolveAgyPath();
+  const cwd = opts.cwd ?? process.cwd();
+  const runId = opts.runId ?? `agy-${Date.now()}`;
+  const { runDir, statusPath, resultPath } = agyRunPaths(cwd, runId);
   const args = [
@@
   const startedAt = Date.now();
+  const timeoutMs = opts.timeoutMs ?? 10 * 60 * 1000;
+  const pollMs = opts.pollMs ?? 3000;
+  const startupTimeoutMs = opts.startupTimeoutMs ?? 30000;
+  const transcriptIdleMs = opts.transcriptIdleMs ?? 45000;
+  const resultStableMs = opts.resultStableMs ?? 2000;
   let collected = "";
   let settled = false;
+  let convId: string | null = null;
+  let exitCodeSeen: number | null = null;
+  let lastTranscriptGrowthAt = startedAt;
+  let lastPtyAt = startedAt;
+  let lastStepIndex = -1;
+  let lastTranscriptSize = 0;
+  let lastStatusSize = 0;
+  let resultStableSince = 0;
+  let lastResultSize = -1;
+  let lastResultMtime = -1;
+  let streamCompletedAt = 0;
+  const heartbeats: AgyHeartbeat[] = [];
 
   return new Promise((resolve, reject) => {
     const proc = pty.spawn(agyPath, args, {
@@
-      cwd: opts.cwd ?? process.cwd(),
+      cwd,
       env: process.env as Record<string, string>
     });
 
     proc.onData((data: string) => {
       collected += data;
+      lastPtyAt = Date.now();
+      heartbeats.push({ at: new Date().toISOString(), kind: "pty", size: collected.length, message: `attempt=${attempt}` });
     });
 
-    const timeoutHandle = setTimeout(() => {
-      if (!settled) {
-        settled = true;
-        try {
-          proc.kill();
-        } catch {
-          // process may already be dead
-        }
-        reject(new Error(`agy capture timed out after ${opts.timeoutMs ?? 120000}ms`));
-      }
-    }, opts.timeoutMs ?? 120000);
+    const finish = (reason: AgyLivenessReason, forcedExitCode = 1): void => {
+      if (settled) return;
+      settled = true;
+      clearInterval(pollHandle);
+      try { if (reason !== "stream_completed" && exitCodeSeen === null) proc.kill(); } catch { /* already dead */ }
+
+      const durationMs = Date.now() - startedAt;
+      const ptyClean = stripAnsi(collected);
+      const final = selectAgyFinalText({
+        resultPath,
+        resultUsable: ["stream_completed", "idle_with_result", "process_exit"].includes(reason),
+        ptyClean,
+        convId
+      });
+
+      resolve({
+        exitCode: exitCodeSeen ?? forcedExitCode,
+        rawOutput: collected,
+        cleanOutput: final.text,
+        parsedJson: extractJsonFromPtyOutput(final.text),
+        durationMs,
+        resultSource: final.source,
+        livenessReason: reason,
+        convId,
+        runId,
+        runDir,
+        statusPath,
+        resultPath,
+        heartbeats
+      });
+    };
 
     proc.onExit(({ exitCode }: { exitCode: number }) => {
-      if (!settled) {
-        settled = true;
-        clearTimeout(timeoutHandle);
-        const durationMs = Date.now() - startedAt;
-        const cleanOutput = stripAnsi(collected);
-        resolve({
-          exitCode,
-          rawOutput: collected,
-          cleanOutput,
-          parsedJson: extractJsonFromPtyOutput(cleanOutput),
-          durationMs
-        });
-      }
+      exitCodeSeen = exitCode;
+      const hasSideResult = safeStat(resultPath)?.size;
+      const hasPty = stripAnsi(collected).trim().length > 0;
+      finish(hasSideResult || hasPty ? "process_exit" : "pty_exit_no_output", exitCode);
     });
+
+    const pollHandle = setInterval(() => {
+      const now = Date.now();
+      heartbeats.push({ at: new Date().toISOString(), kind: "pid", message: `pid=${proc.pid};attempt=${attempt}` });
+
+      const logs = scanAgyCliLogs(startedAt, proc.pid, runId);
+      if (!convId) convId = chooseAgyConversation(logs, startedAt, proc.pid, runId);
+      if (logs.vendorTimedOut) return finish("vendor_timeout");
+      if (convId && logs.completedConvIds.has(convId) && !streamCompletedAt) {
+        streamCompletedAt = now;
+        heartbeats.push({ at: new Date().toISOString(), kind: "cli_log", convId, message: "stream_completed" });
+      }
+
+      const statusStat = safeStat(statusPath);
+      if (statusStat && statusStat.size !== lastStatusSize) {
+        lastStatusSize = statusStat.size;
+        heartbeats.push({ at: new Date().toISOString(), kind: "status_jsonl", size: statusStat.size, mtimeMs: statusStat.mtimeMs });
+      }
+
+      if (convId) {
+        const transcript = readTranscriptStats(convId, runId);
+        if (transcript && (transcript.maxStepIndex > lastStepIndex || transcript.size > lastTranscriptSize)) {
+          lastStepIndex = transcript.maxStepIndex;
+          lastTranscriptSize = transcript.size;
+          lastTranscriptGrowthAt = now;
+          heartbeats.push({
+            at: new Date().toISOString(),
+            kind: "transcript",
+            convId,
+            size: transcript.size,
+            mtimeMs: transcript.mtimeMs,
+            stepIndex: transcript.maxStepIndex
+          });
+        }
+
+        const db = safeStat(join(agyRoot(), "conversations", `${convId}.db`));
+        if (db) heartbeats.push({ at: new Date().toISOString(), kind: "sqlite", convId, size: db.size, mtimeMs: db.mtimeMs });
+      }
+
+      const resultStat = safeStat(resultPath);
+      const resultStable =
+        !!resultStat &&
+        resultStat.size > 0 &&
+        resultStat.mtimeMs >= startedAt - 1000 &&
+        observeStableResult(resultStat.size, resultStat.mtimeMs);
+
+      if (streamCompletedAt && (resultStable || now - streamCompletedAt > 7000)) {
+        return finish("stream_completed", 0);
+      }
+      if (convId && now - lastTranscriptGrowthAt > transcriptIdleMs) {
+        return finish(resultStable ? "idle_with_result" : "transcript_idle");
+      }
+      if (!convId && now - Math.max(lastPtyAt, startedAt) > startupTimeoutMs && !statusStat) {
+        return finish("startup_timeout");
+      }
+      if (now - startedAt > timeoutMs) {
+        return finish("flat_timeout");
+      }
+    }, pollMs);
+
+    function observeStableResult(size: number, mtimeMs: number): boolean {
+      const now = Date.now();
+      if (size !== lastResultSize || mtimeMs !== lastResultMtime) {
+        lastResultSize = size;
+        lastResultMtime = mtimeMs;
+        resultStableSince = now;
+        return false;
+      }
+      return now - resultStableSince >= resultStableMs;
+    }
   });
 }
+
+function safeStat(path: string): { size: number; mtimeMs: number; birthtimeMs: number } | null {
+  try {
+    const st = statSync(path);
+    return { size: st.size, mtimeMs: st.mtimeMs, birthtimeMs: st.birthtimeMs };
+  } catch {
+    return null;
+  }
+}
+
+const UUID_PATTERN = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
+
+interface AgyLogSnapshot {
+  readonly candidatePids: Map<string, number>;
+  readonly completedConvIds: Set<string>;
+  readonly vendorTimedOut: boolean;
+}
+
+function scanAgyCliLogs(startedAtMs: number, procPid: number, runId: string): AgyLogSnapshot {
+  const dir = join(agyRoot(), "log");
+  const candidatePids = new Map<string, number>();
+  const completedConvIds = new Set<string>();
+  let vendorTimedOut = false;
+  if (!existsSync(dir)) return { candidatePids, completedConvIds, vendorTimedOut };
+
+  for (const name of readdirSync(dir).filter((n) => /^cli-\d{8}_\d{6}\.log$/.test(n))) {
+    const path = join(dir, name);
+    const st = safeStat(path);
+    if (!st || Math.max(st.birthtimeMs, st.mtimeMs) < startedAtMs - 5000) continue;
+    const text = readFileSync(path, "utf8");
+    for (const line of text.split(/\r?\n/)) {
+      const parsed = line.match(/^[IWEF]\d{4}\s+\d\d:\d\d:\d\d\.\d+\s+(\d+)\s+.*?\]\s+(.*)$/);
+      if (!parsed) continue;
+      const pid = Number(parsed[1]);
+      const msg = parsed[2] ?? "";
+      if (msg.includes("Print mode: timed out") && (pid === procPid || text.includes(runId))) vendorTimedOut = true;
+      const created = msg.match(new RegExp(`Created conversation (${UUID_PATTERN})`));
+      const streaming = msg.match(new RegExp(`Streaming conversation (${UUID_PATTERN})`));
+      const completed = msg.match(new RegExp(`Stream completed for (${UUID_PATTERN})`));
+      const id = created?.[1] ?? streaming?.[1] ?? completed?.[1];
+      if (id) candidatePids.set(id, pid);
+      if (completed?.[1]) completedConvIds.add(completed[1]);
+    }
+  }
+  return { candidatePids, completedConvIds, vendorTimedOut };
+}
+
+function chooseAgyConversation(logs: AgyLogSnapshot, startedAtMs: number, procPid: number, runId: string): string | null {
+  const scored = [...logs.candidatePids.entries()].map(([id, pid]) => {
+    let score = pid === procPid ? 100 : 0;
+    const brain = safeStat(join(agyRoot(), "brain", id));
+    const db = safeStat(join(agyRoot(), "conversations", `${id}.db`));
+    const transcript = readTranscriptStats(id, runId);
+    if (brain && brain.mtimeMs >= startedAtMs - 5000) score += 20;
+    if (db && db.mtimeMs >= startedAtMs - 5000) score += 5;
+    if (transcript?.containsRunId) score += 80;
+    return { id, score };
+  }).sort((a, b) => b.score - a.score);
+
+  if (scored.length === 0) return null;
+  if (scored[0].score >= 80 && scored[0].score > (scored[1]?.score ?? -1)) return scored[0].id;
+  if (scored.length === 1 && scored[0].score >= 20) return scored[0].id;
+  return null;
+}
+
+function readTranscriptStats(convId: string, runId: string): { size: number; mtimeMs: number; maxStepIndex: number; containsRunId: boolean } | null {
+  const path = join(agyRoot(), "brain", convId, ".system_generated", "logs", "transcript.jsonl");
+  const st = safeStat(path);
+  if (!st) return null;
+  const text = readFileSync(path, "utf8");
+  let maxStepIndex = -1;
+  for (const line of text.split(/\r?\n/)) {
+    if (!line.trim()) continue;
+    try {
+      const row = JSON.parse(line) as { step_index?: unknown };
+      if (typeof row.step_index === "number") maxStepIndex = Math.max(maxStepIndex, row.step_index);
+    } catch { /* ignore partial JSONL line */ }
+  }
+  return { size: st.size, mtimeMs: st.mtimeMs, maxStepIndex, containsRunId: text.includes(runId) };
+}
+
+function selectAgyFinalText(args: {
+  resultPath: string;
+  resultUsable: boolean;
+  ptyClean: string;
+  convId: string | null;
+}): { source: AgyResultSource; text: string } {
+  if (args.resultUsable && existsSync(args.resultPath)) {
+    const text = readFileSync(args.resultPath, "utf8").trim();
+    if (text) return { source: "result_md", text };
+  }
+  if (args.ptyClean.trim()) return { source: "pty", text: args.ptyClean.trim() };
+  const transcript = args.convId ? extractTranscriptFallback(args.convId) : "";
+  if (transcript) return { source: "transcript", text: transcript };
+  return { source: "missing", text: "" };
+}
+
+function extractTranscriptFallback(convId: string): string {
+  const candidates = ["transcript_full.jsonl", "transcript.jsonl"].map((name) =>
+    join(agyRoot(), "brain", convId, ".system_generated", "logs", name)
+  );
+  for (const path of candidates) {
+    if (!existsSync(path)) continue;
+    const chunks: string[] = [];
+    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
+      try {
+        const row = JSON.parse(line) as { content?: unknown };
+        if (typeof row.content === "string" && row.content.trim()) chunks.push(row.content.trim());
+      } catch { /* ignore */ }
+    }
+    const text = chunks.slice(-8).join("\n\n").trim();
+    if (text) return text;
+  }
+  return "";
+}
+
+function missingAgyResult(prompt: string, opts: AgyCaptureOptions): AgyCaptureResult {
+  const cwd = opts.cwd ?? process.cwd();
+  const runId = opts.runId ?? `agy-${Date.now()}`;
+  const { runDir, statusPath, resultPath } = agyRunPaths(cwd, runId);
+  return {
+    exitCode: 1,
+    rawOutput: "",
+    cleanOutput: "",
+    parsedJson: null,
+    durationMs: 0,
+    resultSource: "missing",
+    livenessReason: "pty_exit_no_output",
+    convId: null,
+    runId,
+    runDir,
+    statusPath,
+    resultPath,
+    heartbeats: []
+  };
+}
diff --git a/src/data/delivery-system/cliWorker.ts b/src/data/delivery-system/cliWorker.ts
--- a/src/data/delivery-system/cliWorker.ts
+++ b/src/data/delivery-system/cliWorker.ts
@@
 import {
+  buildAgySideChannelPrompt,
   captureAgyResponse,
   captureCodexResponse,
   writePromptFile
 } from "./cliWorkerCapture";
@@
   readonly workerOutputPath: string | null;
   readonly errorReason: string | null;
+  readonly resultSource?: "result_md" | "pty" | "transcript" | "missing";
+  readonly livenessReason?: string;
+  readonly convId?: string | null;
 }
@@
   const startedAt = new Date().toISOString();
+  const workerPrompt = input.vendor === "agy_cli"
+    ? buildAgySideChannelPrompt(input.prompt, workerRunId, process.cwd())
+    : input.prompt;
 
   // Write handoff prompt to temp file (artifact pointer for evidence)
-  const handoffFilePath = writePromptFile(input.prompt, handoffSlug);
+  const handoffFilePath = writePromptFile(workerPrompt, handoffSlug);
@@
   let workerOutputPath: string | null = null;
   let errorReason: string | null = null;
+  let resultSource: CliWorkerResult["resultSource"];
+  let livenessReason: string | undefined;
+  let convId: string | null | undefined;
@@
       const result = await captureAgyResponse(input.prompt, {
+        runId: workerRunId,
         ...(input.model !== undefined ? { model: input.model } : {}),
         ...(input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {})
       });
       exitCode = result.exitCode;
       rawOutput = result.cleanOutput;
       parsedJson = result.parsedJson;
       durationSeconds = result.durationMs / 1000;
+      resultSource = result.resultSource;
+      livenessReason = result.livenessReason;
+      convId = result.convId;
 
-      // Persist the clean output to a file as the worker_output artifact
-      workerOutputPath = writeResponseFile(result.cleanOutput, workerRunId, stateDir);
+      workerOutputPath = result.resultSource === "result_md"
+        ? result.resultPath
+        : writeResponseFile(result.cleanOutput, workerRunId, stateDir);
@@
-    if (!rawOutput || rawOutput.trim() === "") {
-      errorReason = "empty_output: worker produced no output";
+    if (!rawOutput || rawOutput.trim() === "") {
+      errorReason = input.vendor === "agy_cli"
+        ? `agy_missing:${livenessReason ?? "empty_output"}`
+        : "empty_output: worker produced no output";
     }
@@
     workerOutputPath,
-    errorReason
+    errorReason,
+    resultSource,
+    livenessReason,
+    convId
   };
 }
```

One small correction in the consumption patch: the call should pass `workerPrompt`, not the original prompt:

```diff
-      const result = await captureAgyResponse(input.prompt, {
+      const result = await captureAgyResponse(workerPrompt, {
```

D. Handoff-Prompt Addendum Text
-------------------------------

Inject this into every `agy` handoff after generating `workerRunId` and before spawning `agy`:

```md
---

AGY RUN ARTIFACT CONTRACT - MANDATORY

You are running under Autopilot worker run id: <RUN_ID>
Current working directory: <CWD>

Before doing substantive work, create this directory if needed:

.agent/runs/<RUN_ID>/

Append one compact JSON object per line to:

.agent/runs/<RUN_ID>/status.jsonl

Each status line must include:

{"run_id":"<RUN_ID>","event":"started|progress|final|error","message":"short status","at":"ISO-8601 timestamp"}

Write your final answer to:

.agent/runs/<RUN_ID>/result.md

Rules:

- result.md is the authoritative final answer.
- Do not rely on stdout, terminal rendering, transcript storage, or SQLite for the final answer.
- Write result.md only when the final answer is complete.
- Prefer writing result.md.tmp first, then renaming it to result.md.
- After result.md is complete, append a final status line with event "final".
- If you cannot complete, append an error status line and explain the blocker in result.md.
```

Run-id contract:

- `runCliWorker` generates `workerRunId`.
- `runCliWorker` injects that id into the prompt.
- `captureAgyResponse` receives the same `runId`.
- `agy` runs with repo root as `cwd`, so relative `.agent/runs/<run-id>/...` resolves inside the workspace.

E. Open Risks / Unknowns
------------------------

- ASSUMPTION: `node-pty` `proc.pid` matches the PID shown in Antigravity glog lines. Verify with one probe by logging `proc.pid` and comparing to the glog PID column.
- ASSUMPTION: the injected `runId` appears in `transcript.jsonl` or `transcript_full.jsonl` often enough to use as a tie-breaker. Verify by running a unique run id and searching both transcript files.
- `agy` may not reliably follow the file-writing instruction. That is why the fallback ladder exists, but long answers without `result.md` should still be treated as degraded and, if empty, `MISSING`.
- Atomic rename from `result.md.tmp` depends on the model choosing to use shell/file tools correctly. The monitor still requires non-empty stable `result.md` before accepting idle completion.
- Concurrent `agy` runs remain possible. The design avoids unsafe binding by refusing ambiguous conversation IDs instead of guessing from newest brain dir alone.
