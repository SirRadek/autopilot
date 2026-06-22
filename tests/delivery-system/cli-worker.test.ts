import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { makeHandoffId } from "../../src/data/delivery-system/checkCompletionMatrix";
import {
  acquireWorkerLock,
  buildWorkerRunId,
  isWorkerLockStale,
  readWorkerLock,
  releaseWorkerLock,
  type CliVendor,
  type WorkerLockRecord
} from "../../src/data/delivery-system/cliWorker";
import {
  stripAnsi,
  extractJsonFromPtyOutput,
  decideAgyTerminalState,
  selectAgyFinalText,
  readStatusFlags,
  chooseAgyConversation,
  buildAgySideChannelPrompt,
  RETRYABLE_AGY_REASONS,
  type AgyCompletionSnapshot,
  type AgyLogSnapshot
} from "../../src/data/delivery-system/cliWorkerCapture";

const temporaryDirectories: string[] = [];

function createTempDir(): string {
  const d = mkdtempSync(join(tmpdir(), "autopilot-cli-worker-"));
  temporaryDirectories.push(d);
  return d;
}

afterEach(() => {
  for (const d of temporaryDirectories.splice(0)) {
    rmSync(d, { force: true, recursive: true });
  }
});

// ─── stripAnsi ───────────────────────────────────────────────────────────────

describe("stripAnsi", () => {
  it("removes CSI color codes", () => {
    expect(stripAnsi("\x1b[32mhello\x1b[0m")).toBe("hello");
  });

  it("removes CSI private mode sequences", () => {
    expect(stripAnsi("\x1b[?9001h\x1b[?25l{\"ok\":true}\x1b[?25h")).toBe('{"ok":true}');
  });

  it("removes OSC title sequences", () => {
    expect(stripAnsi('\x1b]0;some title\x07after')).toBe("after");
  });

  it("removes cursor movement sequences", () => {
    expect(stripAnsi("\x1b[2Jhello\x1b[0;0H")).toBe("hello");
  });

  it("passes through plain text unchanged", () => {
    expect(stripAnsi("plain text")).toBe("plain text");
  });

  it("handles real agy PTY prefix pattern", () => {
    const raw = "\x1b[?9001h\x1b[?1004h\x1b[?25l{\"vendor\":\"agy\",\"status\":\"ok\"}\r\n\x1b]0;agy.exe\x1b[?25h";
    expect(stripAnsi(raw)).toBe('{"vendor":"agy","status":"ok"}');
  });
});

// ─── extractJsonFromPtyOutput ─────────────────────────────────────────────────

describe("extractJsonFromPtyOutput", () => {
  it("extracts a JSON object from clean output", () => {
    expect(extractJsonFromPtyOutput('{"vendor":"agy","status":"ok"}')).toEqual({
      vendor: "agy",
      status: "ok"
    });
  });

  it("extracts JSON object preceded by text", () => {
    expect(extractJsonFromPtyOutput('some preamble\n{"answer":42}\ntrailing')).toEqual({
      answer: 42
    });
  });

  it("extracts JSON wrapped in markdown code fence", () => {
    expect(extractJsonFromPtyOutput("```json\n{\"x\":1}\n```")).toEqual({ x: 1 });
  });

  it("returns null when no JSON object present", () => {
    expect(extractJsonFromPtyOutput("just a sentence")).toBeNull();
  });
});

// ─── decideAgyTerminalState (heartbeat completion ladder) ─────────────────────

function snapshot(overrides: Partial<AgyCompletionSnapshot> = {}): AgyCompletionSnapshot {
  return {
    now: 10_000,
    startedAt: 0,
    exitCodeSeen: null,
    bound: false,
    streamCompleted: false,
    streamCompletedAgeMs: 0,
    vendorTimedOut: false,
    statusFinal: false,
    statusError: false,
    resultStable: false,
    resultNonEmpty: false,
    ptyNonEmpty: false,
    hasStatusFile: false,
    msSinceTranscriptGrowth: 0,
    transcriptIdleMs: 45_000,
    startupTimeoutMs: 30_000,
    streamGraceMs: 7_000,
    timeoutMs: 600_000,
    ...overrides
  };
}

describe("decideAgyTerminalState", () => {
  it("fast-path: stable result + status final finishes done in ~8-10s (R1), not after idle", () => {
    // now=9s, well under the 45s transcript-idle fallback.
    const d = decideAgyTerminalState(snapshot({ now: 9_000, resultStable: true, statusFinal: true }));
    expect(d).toEqual({ terminal: true, reason: "done_result_md", exitCode: 0 });
  });

  it("fast-path also fires on stable result + cli-log stream_completed", () => {
    const d = decideAgyTerminalState(snapshot({ resultStable: true, streamCompleted: true }));
    expect(d).toEqual({ terminal: true, reason: "done_result_md", exitCode: 0 });
  });

  it("does NOT fast-path when result is present but not yet stable", () => {
    const d = decideAgyTerminalState(snapshot({ resultNonEmpty: true, resultStable: false, statusFinal: true }));
    expect(d).toEqual({ terminal: false });
  });

  it("status error is a retryable vendor failure", () => {
    const d = decideAgyTerminalState(snapshot({ statusError: true }));
    expect(d).toEqual({ terminal: true, reason: "vendor_error", exitCode: 1 });
    expect(RETRYABLE_AGY_REASONS.has("vendor_error")).toBe(true);
  });

  it("Print mode timed out maps to vendor_timeout", () => {
    const d = decideAgyTerminalState(snapshot({ vendorTimedOut: true }));
    expect(d).toEqual({ terminal: true, reason: "vendor_timeout", exitCode: 1 });
  });

  it("stream_completed without stable result waits for the grace, then finishes", () => {
    const pending = decideAgyTerminalState(snapshot({ streamCompleted: true, streamCompletedAgeMs: 3_000 }));
    expect(pending).toEqual({ terminal: false });
    const done = decideAgyTerminalState(snapshot({ streamCompleted: true, streamCompletedAgeMs: 8_000 }));
    expect(done).toEqual({ terminal: true, reason: "stream_completed", exitCode: 0 });
  });

  it("process exit with output uses the result/PTY ladder", () => {
    const withResult = decideAgyTerminalState(snapshot({ exitCodeSeen: 0, resultNonEmpty: true }));
    expect(withResult).toEqual({ terminal: true, reason: "process_exit", exitCode: 0 });
  });

  it("process exit with no output at all is pty_exit_no_output (→ MISSING path)", () => {
    const d = decideAgyTerminalState(snapshot({ exitCodeSeen: 3 }));
    expect(d).toEqual({ terminal: true, reason: "pty_exit_no_output", exitCode: 3 });
  });

  it("transcript idle while bound degrades to transcript_idle (or idle_with_result if stable)", () => {
    const idle = decideAgyTerminalState(snapshot({ bound: true, msSinceTranscriptGrowth: 46_000 }));
    expect(idle).toEqual({ terminal: true, reason: "transcript_idle", exitCode: 1 });
    const idleWithResult = decideAgyTerminalState(
      snapshot({ bound: true, msSinceTranscriptGrowth: 46_000, resultStable: true })
    );
    // resultStable+statusFinal would have fast-pathed; here only stable, no final/stream.
    expect(idleWithResult).toEqual({ terminal: true, reason: "idle_with_result", exitCode: 1 });
  });

  it("startup timeout keys off wall-clock since spawn, not PTY chatter (R7)", () => {
    const d = decideAgyTerminalState(snapshot({ now: 31_000, bound: false, hasStatusFile: false }));
    expect(d).toEqual({ terminal: true, reason: "startup_timeout", exitCode: 1 });
  });

  it("a present status file suppresses startup timeout (agy did start writing)", () => {
    const d = decideAgyTerminalState(snapshot({ now: 31_000, hasStatusFile: true }));
    expect(d).toEqual({ terminal: false });
  });

  it("hard wall-clock cap yields flat_timeout", () => {
    const d = decideAgyTerminalState(snapshot({ now: 601_000, bound: true, msSinceTranscriptGrowth: 1_000 }));
    expect(d).toEqual({ terminal: true, reason: "flat_timeout", exitCode: 1 });
  });

  it("returns non-terminal while still streaming", () => {
    const d = decideAgyTerminalState(snapshot({ bound: true, msSinceTranscriptGrowth: 2_000 }));
    expect(d).toEqual({ terminal: false });
  });
});

// ─── selectAgyFinalText (fallback ladder) ─────────────────────────────────────

describe("selectAgyFinalText", () => {
  it("prefers result.md when the reason marks it usable", () => {
    const dir = createTempDir();
    const resultPath = join(dir, "result.md");
    writeFileSync(resultPath, "the authoritative answer", "utf8");
    const out = selectAgyFinalText({ resultPath, reason: "done_result_md", ptyClean: "pty junk", convId: null });
    expect(out).toEqual({ source: "result_md", text: "the authoritative answer" });
  });

  it("ignores result.md on a failure reason and falls back to PTY", () => {
    const dir = createTempDir();
    const resultPath = join(dir, "result.md");
    writeFileSync(resultPath, "stale", "utf8");
    const out = selectAgyFinalText({ resultPath, reason: "flat_timeout", ptyClean: "pty answer", convId: null });
    expect(out).toEqual({ source: "pty", text: "pty answer" });
  });

  it("returns missing when nothing usable exists (no disguise)", () => {
    const dir = createTempDir();
    const out = selectAgyFinalText({
      resultPath: join(dir, "nope.md"),
      reason: "pty_exit_no_output",
      ptyClean: "",
      convId: null
    });
    expect(out).toEqual({ source: "missing", text: "" });
  });
});

// ─── readStatusFlags ──────────────────────────────────────────────────────────

describe("readStatusFlags", () => {
  it("detects a final event line in status.jsonl", () => {
    const dir = createTempDir();
    const p = join(dir, "status.jsonl");
    writeFileSync(p, '{"event":"started"}\n{"event":"progress"}\n{"event":"final"}\n', "utf8");
    expect(readStatusFlags(p)).toEqual({ final: true, error: false });
  });

  it("detects an error event and tolerates partial trailing lines", () => {
    const dir = createTempDir();
    const p = join(dir, "status.jsonl");
    writeFileSync(p, '{"event":"started"}\n{"event":"error","message":"boom"}\n{bad-json', "utf8");
    expect(readStatusFlags(p)).toEqual({ final: false, error: true });
  });

  it("returns all-false when the file is absent", () => {
    expect(readStatusFlags(join(createTempDir(), "missing.jsonl"))).toEqual({ final: false, error: false });
  });
});

// ─── chooseAgyConversation (race-safe binding) ────────────────────────────────

function logSnapshot(pairs: Array<[string, number]>): AgyLogSnapshot {
  return {
    candidatePids: new Map(pairs),
    completedConvIds: new Set(),
    vendorTimedOut: false
  };
}

describe("chooseAgyConversation", () => {
  const UUID_A = "11111111-1111-1111-1111-111111111111";
  const UUID_B = "22222222-2222-2222-2222-222222222222";

  it("binds a single PID-matched candidate (score 100)", () => {
    const id = chooseAgyConversation(logSnapshot([[UUID_A, 4242]]), 0, 4242, "run-x");
    expect(id).toBe(UUID_A);
  });

  it("binds the PID-matched winner over a non-matching candidate", () => {
    const id = chooseAgyConversation(logSnapshot([[UUID_A, 999], [UUID_B, 4242]]), 0, 4242, "run-x");
    expect(id).toBe(UUID_B);
  });

  it("refuses to guess when candidates are ambiguous (no clear winner)", () => {
    const id = chooseAgyConversation(logSnapshot([[UUID_A, 111], [UUID_B, 222]]), 0, 4242, "run-x");
    expect(id).toBeNull();
  });

  it("returns null when there are no candidates", () => {
    expect(chooseAgyConversation(logSnapshot([]), 0, 4242, "run-x")).toBeNull();
  });
});

// ─── buildAgySideChannelPrompt (run-id contract) ──────────────────────────────

describe("buildAgySideChannelPrompt", () => {
  it("injects the run id, the contract, and absolute side-channel paths (R4)", () => {
    const dir = createTempDir();
    const out = buildAgySideChannelPrompt("DO THE THING", "cli-agy-hp-x-20260622T000000", dir);
    expect(out).toContain("DO THE THING");
    expect(out).toContain("AGY RUN ARTIFACT CONTRACT");
    expect(out).toContain("cli-agy-hp-x-20260622T000000");
    expect(out).toContain(join(dir, ".agent", "runs", "cli-agy-hp-x-20260622T000000", "status.jsonl"));
    expect(out).toContain(join(dir, ".agent", "runs", "cli-agy-hp-x-20260622T000000", "result.md"));
    expect(out).toContain("result.md is the ONLY authoritative final answer");
  });
});

// ─── buildWorkerRunId ─────────────────────────────────────────────────────────

describe("buildWorkerRunId", () => {
  it("produces a deterministic-prefix id for codex_cli", () => {
    const id = buildWorkerRunId("codex_cli", "hp-20260618-test");
    expect(id).toMatch(/^cli-codex-hp-20260618-test-\d{8}T\d{6}$/);
  });

  it("produces a deterministic-prefix id for agy_cli", () => {
    const id = buildWorkerRunId("agy_cli", "hp-20260618-test");
    expect(id).toMatch(/^cli-agy-hp-20260618-test-\d{8}T\d{6}$/);
  });

  it("two calls at different times produce different ids", async () => {
    const a = buildWorkerRunId("codex_cli", "hp-20260618-x");
    await new Promise((r) => setTimeout(r, 1100));
    const b = buildWorkerRunId("codex_cli", "hp-20260618-x");
    expect(a).not.toBe(b);
  });
});

// ─── worker.lock ─────────────────────────────────────────────────────────────

function makeTestLock(overrides: Partial<WorkerLockRecord> = {}): WorkerLockRecord {
  return {
    schema_version: "v1",
    worker_run_id: "cli-codex-hp-20260618-test-20260618T120000",
    handoff_id: makeHandoffId("hp-20260618-test"),
    vendor: "codex_cli" satisfies CliVendor,
    model: "gpt-5.5",
    pid: null,
    started_at: new Date().toISOString(),
    lock_source: "supervisor_spawn",
    ttl_minutes: 30,
    ...overrides
  };
}

describe("acquireWorkerLock", () => {
  it("returns acquired and writes the lock file when none exists", () => {
    const dir = createTempDir();
    const lock = makeTestLock();
    const status = acquireWorkerLock(lock, dir);
    expect(status).toBe("acquired_supervisor_spawn");
    expect(existsSync(join(dir, "worker.lock"))).toBe(true);
    const written = JSON.parse(readFileSync(join(dir, "worker.lock"), "utf8"));
    expect(written.worker_run_id).toBe(lock.worker_run_id);
  });

  it("returns already_locked when a fresh lock exists", () => {
    const dir = createTempDir();
    const lock = makeTestLock();
    acquireWorkerLock(lock, dir);
    const status = acquireWorkerLock(makeTestLock({ worker_run_id: "other-run" }), dir);
    expect(status).toBe("already_locked");
  });

  it("returns stale_replaced when existing lock is past TTL", () => {
    const dir = createTempDir();
    const staleLock = makeTestLock({
      started_at: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
      ttl_minutes: 30
    });
    writeFileSync(join(dir, "worker.lock"), JSON.stringify(staleLock), "utf8");

    const freshLock = makeTestLock({ worker_run_id: "fresh-run" });
    const status = acquireWorkerLock(freshLock, dir);
    expect(status).toBe("stale_replaced");
    const written = JSON.parse(readFileSync(join(dir, "worker.lock"), "utf8"));
    expect(written.worker_run_id).toBe("fresh-run");
  });
});

describe("releaseWorkerLock", () => {
  it("removes the lock file when the run_id matches", () => {
    const dir = createTempDir();
    const lock = makeTestLock();
    acquireWorkerLock(lock, dir);
    releaseWorkerLock(lock.worker_run_id, dir);
    expect(existsSync(join(dir, "worker.lock"))).toBe(false);
  });

  it("does not remove the lock when run_id does not match", () => {
    const dir = createTempDir();
    acquireWorkerLock(makeTestLock(), dir);
    releaseWorkerLock("different-run-id", dir);
    expect(existsSync(join(dir, "worker.lock"))).toBe(true);
  });

  it("is a no-op when no lock file exists", () => {
    const dir = createTempDir();
    expect(() => releaseWorkerLock("anything", dir)).not.toThrow();
  });
});

describe("readWorkerLock", () => {
  it("returns null when file is absent", () => {
    expect(readWorkerLock(createTempDir())).toBeNull();
  });

  it("returns the lock record when present", () => {
    const dir = createTempDir();
    const lock = makeTestLock();
    acquireWorkerLock(lock, dir);
    const read = readWorkerLock(dir);
    expect(read?.worker_run_id).toBe(lock.worker_run_id);
  });
});

describe("isWorkerLockStale", () => {
  it("returns false for a fresh lock", () => {
    const lock = makeTestLock({ started_at: new Date().toISOString(), ttl_minutes: 30 });
    expect(isWorkerLockStale(lock)).toBe(false);
  });

  it("returns true for an expired lock", () => {
    const lock = makeTestLock({
      started_at: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
      ttl_minutes: 30
    });
    expect(isWorkerLockStale(lock)).toBe(true);
  });
});
