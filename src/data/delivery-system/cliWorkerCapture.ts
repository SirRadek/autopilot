import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { platform } from "node:process";

// ─── ANSI stripping ───────────────────────────────────────────────────────────

/**
 * Strips ANSI/VT100 escape sequences from raw PTY output.
 * Handles: CSI (color, cursor, private mode), OSC (window title), lone ESC.
 */
export function stripAnsi(raw: string): string {
  return raw
    .replace(/\x1b\[[\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e]/g, "") // CSI sequences
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "") // OSC with BEL or ST
    .replace(/\x1b\][^\r\n]*/g, "") // OSC without terminator (trailing)
    .replace(/\x1b[@-Z\\-_]/g, "") // 2-char ESC sequences
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

// ─── JSON extraction ──────────────────────────────────────────────────────────

/**
 * Extracts the first JSON object or array from clean (ANSI-stripped) PTY output.
 * Handles markdown code fences. Returns null if no JSON found.
 */
export function extractJsonFromPtyOutput(clean: string): unknown {
  // strip markdown code fences
  const stripped = clean.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "");

  // find first { ... } or [ ... ] block
  for (const pattern of [/\{[\s\S]*?\}/g, /\[[\s\S]*?\]/g]) {
    const candidates = stripped.match(pattern);
    if (candidates) {
      for (const candidate of candidates) {
        try {
          return JSON.parse(candidate);
        } catch {
          // try next candidate
        }
      }
    }
  }

  return null;
}

// ─── agy heartbeat capture (WORKER-CLI-001) ──────────────────────────────────
//
// agy does NOT reliably put its real answer on stdout/PTY (empirically ~16 bytes
// of PTY chatter), writes the authoritative answer to a side-channel result.md in
// ~8 s, then HANGS without a clean exit. So PTY is live-preview/fallback only; the
// authoritative output is a file contract the agy run writes itself:
//   .agent/runs/<run-id>/status.jsonl  (append-only heartbeat)
//   .agent/runs/<run-id>/result.md     (authoritative final answer)
// Completion is detected from those files + cli-log + transcript growth, never
// from process exit alone and never from SQLite. See
// output/agy-heartbeat-capture-design.md (Codex-led design + Opus R1–R8 review).

export interface AgyCaptureOptions {
  readonly model?: string;
  readonly cwd?: string;
  readonly timeoutMs?: number;
  /** Worker run id minted by runCliWorker; binds prompt, monitor and side-channel dir. */
  readonly runId?: string;
  readonly pollMs?: number;
  readonly startupTimeoutMs?: number;
  readonly transcriptIdleMs?: number;
  readonly resultStableMs?: number;
  /** Grace after "Stream completed" before accepting whatever output exists. */
  readonly streamGraceMs?: number;
  readonly maxAttempts?: number;
}

export type AgyResultSource = "result_md" | "pty" | "transcript" | "missing";

export type AgyLivenessReason =
  | "done_result_md"
  | "stream_completed"
  | "idle_with_result"
  | "process_exit"
  | "vendor_timeout"
  | "vendor_error"
  | "startup_timeout"
  | "transcript_idle"
  | "flat_timeout"
  | "pty_exit_no_output";

/** Liveness reasons that represent a failed attempt worth retrying. */
export const RETRYABLE_AGY_REASONS: ReadonlySet<AgyLivenessReason> = new Set<AgyLivenessReason>([
  "vendor_timeout",
  "vendor_error",
  "startup_timeout",
  "transcript_idle",
  "flat_timeout",
  "pty_exit_no_output"
]);

/** Reasons where result.md may be read as the authoritative answer. */
const RESULT_USABLE_REASONS: ReadonlySet<AgyLivenessReason> = new Set<AgyLivenessReason>([
  "done_result_md",
  "stream_completed",
  "idle_with_result",
  "process_exit"
]);

export interface AgyHeartbeat {
  readonly at: string;
  readonly kind: "pid" | "cli_log" | "transcript" | "sqlite" | "status_jsonl" | "pty";
  readonly convId?: string;
  readonly message?: string;
  readonly size?: number;
  readonly mtimeMs?: number;
  readonly stepIndex?: number;
}

export interface AgyCaptureResult {
  readonly exitCode: number;
  readonly rawOutput: string;
  readonly cleanOutput: string;
  readonly parsedJson: unknown;
  readonly durationMs: number;
  readonly resultSource: AgyResultSource;
  readonly livenessReason: AgyLivenessReason;
  readonly convId: string | null;
  readonly runId: string;
  readonly runDir: string;
  readonly statusPath: string;
  readonly resultPath: string;
  readonly heartbeats: readonly AgyHeartbeat[];
}

// ─── Pure completion decision (unit-testable without a live agy) ───────────────

/**
 * Snapshot of all liveness signals at one poll tick. Kept pure/serialisable so
 * the completion ladder can be unit-tested without spawning agy.
 */
export interface AgyCompletionSnapshot {
  readonly now: number;
  readonly startedAt: number;
  /** Non-null once the PTY process has exited. */
  readonly exitCodeSeen: number | null;
  /** True once a conversation UUID has been race-safely bound. */
  readonly bound: boolean;
  /** cli-log "Stream completed for <convId>" observed for the bound conv. */
  readonly streamCompleted: boolean;
  /** ms since "Stream completed" was first seen (0 if never). */
  readonly streamCompletedAgeMs: number;
  /** cli-log "Print mode: timed out" for this run. */
  readonly vendorTimedOut: boolean;
  /** status.jsonl contains an {"event":"final"} line. */
  readonly statusFinal: boolean;
  /** status.jsonl contains an {"event":"error"} line. */
  readonly statusError: boolean;
  /** result.md exists, non-empty, and size-stable for resultStableMs. */
  readonly resultStable: boolean;
  /** result.md exists and is non-empty (may still be growing). */
  readonly resultNonEmpty: boolean;
  /** stripped PTY buffer is non-empty. */
  readonly ptyNonEmpty: boolean;
  /** any status.jsonl bytes have appeared. */
  readonly hasStatusFile: boolean;
  readonly msSinceTranscriptGrowth: number;
  readonly transcriptIdleMs: number;
  readonly startupTimeoutMs: number;
  readonly streamGraceMs: number;
  readonly timeoutMs: number;
}

export type AgyTerminalDecision =
  | { readonly terminal: false }
  | { readonly terminal: true; readonly reason: AgyLivenessReason; readonly exitCode: number };

/**
 * Priority ladder (fastest-true-signal first). R1: the fast-path lets a stable
 * result.md + a `final` status line (or "Stream completed") finish in ~8–10 s
 * instead of waiting out the 45 s transcript-idle fallback. R8: failure reasons
 * carry through honestly so the retry loop / MISSING verdict is never masked.
 */
export function decideAgyTerminalState(s: AgyCompletionSnapshot): AgyTerminalDecision {
  // 1. fast-path: authoritative result is present, stable, and agy says it is done.
  if (s.resultStable && (s.statusFinal || s.streamCompleted)) {
    return { terminal: true, reason: "done_result_md", exitCode: 0 };
  }
  // 2. explicit vendor failure signals → attempt failure (retried by the outer loop).
  if (s.statusError) return { terminal: true, reason: "vendor_error", exitCode: 1 };
  if (s.vendorTimedOut) return { terminal: true, reason: "vendor_timeout", exitCode: 1 };
  // 3. stream completed but result not yet stable: take what we have after a grace.
  if (s.streamCompleted && s.streamCompletedAgeMs > s.streamGraceMs) {
    return { terminal: true, reason: "stream_completed", exitCode: 0 };
  }
  // 4. process exited: result.md → PTY → no-output ladder.
  if (s.exitCodeSeen !== null) {
    if (s.resultNonEmpty || s.ptyNonEmpty) {
      return { terminal: true, reason: "process_exit", exitCode: s.exitCodeSeen };
    }
    return { terminal: true, reason: "pty_exit_no_output", exitCode: s.exitCodeSeen };
  }
  // 5. transcript idle (only meaningful once bound).
  if (s.bound && s.msSinceTranscriptGrowth > s.transcriptIdleMs) {
    return { terminal: true, reason: s.resultStable ? "idle_with_result" : "transcript_idle", exitCode: 1 };
  }
  // 6. startup timeout — keyed off wall-clock since spawn (R7), not PTY chatter.
  if (!s.bound && !s.hasStatusFile && !s.resultNonEmpty && s.now - s.startedAt > s.startupTimeoutMs) {
    return { terminal: true, reason: "startup_timeout", exitCode: 1 };
  }
  // 7. hard wall-clock cap.
  if (s.now - s.startedAt > s.timeoutMs) {
    return { terminal: true, reason: "flat_timeout", exitCode: 1 };
  }
  return { terminal: false };
}

// ─── Fallback ladder: result.md → PTY → transcript → missing ──────────────────

export function selectAgyFinalText(args: {
  readonly resultPath: string;
  readonly reason: AgyLivenessReason;
  readonly ptyClean: string;
  readonly convId: string | null;
}): { source: AgyResultSource; text: string } {
  if (RESULT_USABLE_REASONS.has(args.reason) && existsSync(args.resultPath)) {
    const text = readFileSync(args.resultPath, "utf8").trim();
    if (text) return { source: "result_md", text };
  }
  if (args.ptyClean.trim()) return { source: "pty", text: args.ptyClean.trim() };
  const transcript = args.convId ? extractTranscriptFallback(args.convId) : "";
  if (transcript) return { source: "transcript", text: transcript };
  return { source: "missing", text: "" };
}

function resolveAgyPath(): string {
  try {
    return execSync("where agy", { encoding: "utf8" }).trim().split("\n")[0]?.trim() ?? "agy";
  } catch {
    return "agy";
  }
}

function resolveCodexCommand(): { codexPath: string; bashPath: string | null } {
  let codexPath = "codex";
  let bashPath: string | null = null;

  if (platform === "win32") {
    try {
      const found = execSync("where codex.cmd", { encoding: "utf8" }).trim().split("\n")[0]?.trim();
      if (found) codexPath = found.replace(/\\/g, "/");
    } catch { /* fall through */ }

    // Prefer Git Bash for reliable stdin piping on Windows
    const candidates = [
      "C:/Program Files/Git/bin/bash.exe",
      "C:/Program Files (x86)/Git/bin/bash.exe"
    ];
    for (const candidate of candidates) {
      try {
        execSync(`"${candidate}" --version`, { encoding: "utf8", timeout: 3000 });
        bashPath = candidate;
        break;
      } catch { /* try next */ }
    }
  }

  return { codexPath, bashPath };
}

function agyRoot(): string {
  return join(homedir(), ".gemini", "antigravity-cli");
}

function agyRunPaths(cwd: string, runId: string): { runDir: string; statusPath: string; resultPath: string } {
  const runDir = join(cwd, ".agent", "runs", runId);
  mkdirSync(runDir, { recursive: true });
  return {
    runDir,
    statusPath: join(runDir, "status.jsonl"),
    resultPath: join(runDir, "result.md")
  };
}

/**
 * Injects the AGY RUN ARTIFACT CONTRACT (absolute paths, R4) into a handoff so
 * agy writes status.jsonl + result.md under the exact dir the monitor watches.
 */
export function buildAgySideChannelPrompt(prompt: string, runId: string, cwd = process.cwd()): string {
  const { runDir, statusPath, resultPath } = agyRunPaths(cwd, runId);
  return `${prompt}

---

AGY RUN ARTIFACT CONTRACT - MANDATORY

You are running under Autopilot worker run id: ${runId}
Current working directory: ${cwd}

1. Ensure this directory exists: ${runDir}
2. Append one compact JSON object per line to: ${statusPath}
   {"run_id":"${runId}","event":"started|progress|final|error","message":"short status","at":"ISO-8601 timestamp"}
3. Write your FINAL answer to: ${resultPath}

Rules:
- result.md is the ONLY authoritative final answer. Do not rely on stdout, terminal
  rendering, transcript storage, or SQLite for the final answer.
- Write result.md.tmp first, then rename it to result.md (atomic).
- Immediately after result.md is complete, append a status line with event "final".
- If you cannot complete, append an event "error" line and write the blocker into result.md.`;
}

export async function captureAgyResponse(
  prompt: string,
  opts: AgyCaptureOptions = {}
): Promise<AgyCaptureResult> {
  const maxAttempts = opts.maxAttempts ?? 2;
  let last: AgyCaptureResult | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    last = await captureAgyResponseAttempt(prompt, opts, attempt);
    if (last.resultSource !== "missing") return last;
    if (!RETRYABLE_AGY_REASONS.has(last.livenessReason)) return last;
  }

  return last ?? missingAgyResult(opts, "pty_exit_no_output");
}

async function captureAgyResponseAttempt(
  prompt: string,
  opts: AgyCaptureOptions,
  attempt: number
): Promise<AgyCaptureResult> {
  // Dynamic import so TS compile doesn't fail in environments without node-pty
  const ptyModule = await import("node-pty");
  const pty = ptyModule.default ?? ptyModule;

  const agyPath = resolveAgyPath();
  const cwd = opts.cwd ?? process.cwd();
  const runId = opts.runId ?? `agy-${Date.now()}`;
  const { runDir, statusPath, resultPath } = agyRunPaths(cwd, runId);
  const args = [
    "--print",
    prompt,
    "--dangerously-skip-permissions",
    ...(opts.model ? ["--model", opts.model] : [])
  ];

  const startedAt = Date.now();
  const timeoutMs = opts.timeoutMs ?? 10 * 60 * 1000;
  const pollMs = opts.pollMs ?? 3000;
  const startupTimeoutMs = opts.startupTimeoutMs ?? 30000;
  const transcriptIdleMs = opts.transcriptIdleMs ?? 45000;
  const resultStableMs = opts.resultStableMs ?? 2000;
  const streamGraceMs = opts.streamGraceMs ?? 7000;

  let collected = "";
  let settled = false;
  let convId: string | null = null;
  let exitCodeSeen: number | null = null;
  let lastTranscriptGrowthAt = startedAt;
  let lastStepIndex = -1;
  let lastTranscriptSize = 0;
  let lastStatusSize = 0;
  let statusFinal = false;
  let statusError = false;
  let resultStableSince = 0;
  let lastResultSize = -1;
  let lastResultMtime = -1;
  let streamCompletedAt = 0;
  const heartbeats: AgyHeartbeat[] = [];

  function observeStableResult(size: number, mtimeMs: number): boolean {
    const now = Date.now();
    if (size !== lastResultSize || mtimeMs !== lastResultMtime) {
      lastResultSize = size;
      lastResultMtime = mtimeMs;
      resultStableSince = now;
      return false;
    }
    return now - resultStableSince >= resultStableMs;
  }

  return new Promise<AgyCaptureResult>((resolve) => {
    const proc = pty.spawn(agyPath, args, {
      name: "xterm-color",
      cols: 220,
      rows: 30,
      cwd,
      env: process.env as Record<string, string>
    });

    proc.onData((data: string) => {
      collected += data;
      heartbeats.push({ at: new Date().toISOString(), kind: "pty", size: collected.length, message: `attempt=${attempt}` });
    });

    // R2: always kill the lingering agy proc once a terminal state reads its
    // output — agy hangs after writing result.md, so the done-path must not orphan it.
    const finish = (reason: AgyLivenessReason, exitCode: number): void => {
      if (settled) return;
      settled = true;
      clearInterval(pollHandle);
      try { proc.kill(); } catch { /* already dead */ }

      const durationMs = Date.now() - startedAt;
      const ptyClean = stripAnsi(collected);
      const final = selectAgyFinalText({ resultPath, reason, ptyClean, convId });

      resolve({
        exitCode,
        rawOutput: collected,
        cleanOutput: final.text,
        parsedJson: extractJsonFromPtyOutput(final.text),
        durationMs,
        resultSource: final.source,
        livenessReason: reason,
        convId,
        runId,
        runDir,
        statusPath,
        resultPath,
        heartbeats
      });
    };

    proc.onExit(({ exitCode }: { exitCode: number }) => {
      exitCodeSeen = exitCode;
    });

    const pollHandle = setInterval(() => {
      const now = Date.now();
      heartbeats.push({ at: new Date().toISOString(), kind: "pid", message: `pid=${proc.pid};attempt=${attempt}` });

      const logs = scanAgyCliLogs(startedAt, proc.pid, runId);
      if (!convId) convId = chooseAgyConversation(logs, startedAt, proc.pid, runId);
      if (convId && logs.completedConvIds.has(convId) && !streamCompletedAt) {
        streamCompletedAt = now;
        heartbeats.push({ at: new Date().toISOString(), kind: "cli_log", convId, message: "stream_completed" });
      }

      const statusStat = safeStat(statusPath);
      if (statusStat && statusStat.size !== lastStatusSize) {
        lastStatusSize = statusStat.size;
        const flags = readStatusFlags(statusPath);
        statusFinal = flags.final;
        statusError = flags.error;
        heartbeats.push({ at: new Date().toISOString(), kind: "status_jsonl", size: statusStat.size, mtimeMs: statusStat.mtimeMs });
      }

      if (convId) {
        const transcript = readTranscriptStats(convId, runId);
        if (transcript && (transcript.maxStepIndex > lastStepIndex || transcript.size > lastTranscriptSize)) {
          lastStepIndex = transcript.maxStepIndex;
          lastTranscriptSize = transcript.size;
          lastTranscriptGrowthAt = now;
          heartbeats.push({
            at: new Date().toISOString(),
            kind: "transcript",
            convId,
            size: transcript.size,
            mtimeMs: transcript.mtimeMs,
            stepIndex: transcript.maxStepIndex
          });
        }
        const db = safeStat(join(agyRoot(), "conversations", `${convId}.db`));
        if (db) heartbeats.push({ at: new Date().toISOString(), kind: "sqlite", convId, size: db.size, mtimeMs: db.mtimeMs });
      }

      const resultStat = safeStat(resultPath);
      const resultNonEmpty = !!resultStat && resultStat.size > 0;
      const resultStable =
        resultNonEmpty &&
        resultStat.mtimeMs >= startedAt - 1000 &&
        observeStableResult(resultStat.size, resultStat.mtimeMs);

      const decision = decideAgyTerminalState({
        now,
        startedAt,
        exitCodeSeen,
        bound: convId !== null,
        streamCompleted: streamCompletedAt > 0,
        streamCompletedAgeMs: streamCompletedAt > 0 ? now - streamCompletedAt : 0,
        vendorTimedOut: logs.vendorTimedOut,
        statusFinal,
        statusError,
        resultStable,
        resultNonEmpty,
        ptyNonEmpty: stripAnsi(collected).trim().length > 0,
        hasStatusFile: statusStat !== null,
        msSinceTranscriptGrowth: now - lastTranscriptGrowthAt,
        transcriptIdleMs,
        startupTimeoutMs,
        streamGraceMs,
        timeoutMs
      });

      if (decision.terminal) finish(decision.reason, decision.exitCode);
    }, pollMs);
  });
}

// ─── Side-channel + cli-log + transcript readers ──────────────────────────────

function safeStat(path: string): { size: number; mtimeMs: number; birthtimeMs: number } | null {
  try {
    const st = statSync(path);
    return { size: st.size, mtimeMs: st.mtimeMs, birthtimeMs: st.birthtimeMs };
  } catch {
    return null;
  }
}

/** Scans status.jsonl for the agy-reported terminal events. */
export function readStatusFlags(statusPath: string): { final: boolean; error: boolean } {
  let final = false;
  let error = false;
  try {
    for (const line of readFileSync(statusPath, "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line) as { event?: unknown };
        if (row.event === "final") final = true;
        if (row.event === "error") error = true;
      } catch { /* ignore partial JSONL line */ }
    }
  } catch { /* status file absent */ }
  return { final, error };
}

const UUID_PATTERN = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

export interface AgyLogSnapshot {
  readonly candidatePids: Map<string, number>;
  readonly completedConvIds: Set<string>;
  readonly vendorTimedOut: boolean;
}

export function scanAgyCliLogs(startedAtMs: number, procPid: number, runId: string): AgyLogSnapshot {
  const dir = join(agyRoot(), "log");
  const candidatePids = new Map<string, number>();
  const completedConvIds = new Set<string>();
  let vendorTimedOut = false;
  if (!existsSync(dir)) return { candidatePids, completedConvIds, vendorTimedOut };

  for (const name of readdirSync(dir).filter((n) => /^cli-\d{8}_\d{6}\.log$/.test(n))) {
    const path = join(dir, name);
    const st = safeStat(path);
    if (!st || Math.max(st.birthtimeMs, st.mtimeMs) < startedAtMs - 5000) continue;
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const parsed = line.match(/^[IWEF]\d{4}\s+\d\d:\d\d:\d\d\.\d+\s+(\d+)\s+.*?\]\s+(.*)$/);
      if (!parsed) continue;
      const pid = Number(parsed[1]);
      const msg = parsed[2] ?? "";
      if (msg.includes("Print mode: timed out") && (pid === procPid || text.includes(runId))) vendorTimedOut = true;
      const created = msg.match(new RegExp(`Created conversation (${UUID_PATTERN})`));
      const streaming = msg.match(new RegExp(`Streaming conversation (${UUID_PATTERN})`));
      const completed = msg.match(new RegExp(`Stream completed for (${UUID_PATTERN})`));
      const id = created?.[1] ?? streaming?.[1] ?? completed?.[1];
      if (id) candidatePids.set(id, pid);
      if (completed?.[1]) completedConvIds.add(completed[1]);
    }
  }
  return { candidatePids, completedConvIds, vendorTimedOut };
}

/**
 * Race-safe conversation binding: score UUID candidates and bind only on a clear
 * winner; refuse ambiguous (never guess "newest brain dir"). PID match (+100) and
 * injected run-id found in transcript (+80) are the strong signals.
 */
export function chooseAgyConversation(
  logs: AgyLogSnapshot,
  startedAtMs: number,
  procPid: number,
  runId: string
): string | null {
  const scored = [...logs.candidatePids.entries()].map(([id, pid]) => {
    let score = pid === procPid ? 100 : 0;
    const brain = safeStat(join(agyRoot(), "brain", id));
    const db = safeStat(join(agyRoot(), "conversations", `${id}.db`));
    const transcript = readTranscriptStats(id, runId);
    if (brain && brain.mtimeMs >= startedAtMs - 5000) score += 20;
    if (db && db.mtimeMs >= startedAtMs - 5000) score += 5;
    if (transcript?.containsRunId) score += 80;
    return { id, score };
  }).sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;
  if (scored[0]!.score >= 80 && scored[0]!.score > (scored[1]?.score ?? -1)) return scored[0]!.id;
  if (scored.length === 1 && scored[0]!.score >= 20) return scored[0]!.id;
  return null;
}

export function readTranscriptStats(
  convId: string,
  runId: string
): { size: number; mtimeMs: number; maxStepIndex: number; containsRunId: boolean } | null {
  const path = join(agyRoot(), "brain", convId, ".system_generated", "logs", "transcript.jsonl");
  const st = safeStat(path);
  if (!st) return null;
  const text = readFileSync(path, "utf8");
  let maxStepIndex = -1;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as { step_index?: unknown };
      if (typeof row.step_index === "number") maxStepIndex = Math.max(maxStepIndex, row.step_index);
    } catch { /* ignore partial JSONL line */ }
  }
  return { size: st.size, mtimeMs: st.mtimeMs, maxStepIndex, containsRunId: text.includes(runId) };
}

function extractTranscriptFallback(convId: string): string {
  const candidates = ["transcript_full.jsonl", "transcript.jsonl"].map((name) =>
    join(agyRoot(), "brain", convId, ".system_generated", "logs", name)
  );
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const chunks: string[] = [];
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      try {
        const row = JSON.parse(line) as { content?: unknown };
        if (typeof row.content === "string" && row.content.trim()) chunks.push(row.content.trim());
      } catch { /* ignore */ }
    }
    const text = chunks.slice(-8).join("\n\n").trim();
    if (text) return text;
  }
  return "";
}

function missingAgyResult(opts: AgyCaptureOptions, reason: AgyLivenessReason): AgyCaptureResult {
  const cwd = opts.cwd ?? process.cwd();
  const runId = opts.runId ?? `agy-${Date.now()}`;
  const { runDir, statusPath, resultPath } = agyRunPaths(cwd, runId);
  return {
    exitCode: 1,
    rawOutput: "",
    cleanOutput: "",
    parsedJson: null,
    durationMs: 0,
    resultSource: "missing",
    livenessReason: reason,
    convId: null,
    runId,
    runDir,
    statusPath,
    resultPath,
    heartbeats: []
  };
}

// ─── File-based capture for codex exec ────────────────────────────────────────

export interface CodexCaptureOptions {
  readonly model?: string;
  readonly outputSchemaPath?: string;
  readonly cwd?: string;
  readonly timeoutMs?: number;
}

export interface CodexCaptureResult {
  readonly exitCode: number;
  readonly outputFilePath: string;
  readonly rawFileContent: string;
  readonly parsedJson: unknown;
  readonly durationMs: number;
}

export async function captureCodexResponse(
  prompt: string,
  opts: CodexCaptureOptions = {}
): Promise<CodexCaptureResult> {
  const { spawnSync } = await import("node:child_process");
  const { readFileSync } = await import("node:fs");

  const outputDir = join(tmpdir(), "autopilot-codex-captures");
  mkdirSync(outputDir, { recursive: true });
  const outputFile = join(outputDir, `codex-${Date.now()}.json`);
  const schemaArgs = opts.outputSchemaPath
    ? ["--output-schema", opts.outputSchemaPath]
    : [];

  const { codexPath, bashPath } = resolveCodexCommand();

  // Write prompt to a temp file — avoids shell quoting issues with JSON prompts.
  const promptFile = join(outputDir, `prompt-${Date.now()}.txt`);
  writeFileSync(promptFile, prompt, "utf8");

  const schemaFlag = schemaArgs.length > 0 ? `${schemaArgs[0]} "${schemaArgs[1]}" ` : "";
  const modelFlag = opts.model ? `-m "${opts.model}" ` : "";
  const safeOut = outputFile.replace(/\\/g, "/");
  const safePrompt = promptFile.replace(/\\/g, "/");

  const startedAt = Date.now();
  let result: ReturnType<typeof spawnSync>;

  if (bashPath) {
    // Windows: use Git Bash so stdin redirection works reliably
    const bashCmd = `"${codexPath}" exec ${schemaFlag}${modelFlag}-o "${safeOut}" - < "${safePrompt}"`;
    result = spawnSync(bashPath, ["-c", bashCmd], {
      encoding: "utf8",
      cwd: opts.cwd ?? process.cwd(),
      timeout: opts.timeoutMs ?? 120000,
      env: process.env
    });
  } else {
    // POSIX: direct spawnSync with stdin input
    result = spawnSync("codex", [
      "exec", ...schemaArgs, "-o", outputFile,
      ...(opts.model ? ["-m", opts.model] : []), "-"
    ], {
      input: prompt,
      encoding: "utf8",
      cwd: opts.cwd ?? process.cwd(),
      timeout: opts.timeoutMs ?? 120000,
      env: process.env
    });
  }

  const durationMs = Date.now() - startedAt;
  let rawFileContent = "";
  let parsedJson: unknown = null;

  try {
    rawFileContent = readFileSync(outputFile, "utf8").trim();
    if (rawFileContent) {
      parsedJson = JSON.parse(rawFileContent);
    }
  } catch {
    // file absent or not valid JSON — caller checks exitCode
  }

  return {
    exitCode: result.status ?? 1,
    outputFilePath: outputFile,
    rawFileContent,
    parsedJson,
    durationMs
  };
}

// ─── Prompt file writer (shared) ──────────────────────────────────────────────

export function writePromptFile(prompt: string, handoffSlug: string): string {
  const dir = join(tmpdir(), "autopilot-handoffs");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${handoffSlug}-${Date.now()}.md`);
  writeFileSync(path, prompt, "utf8");
  return path;
}
