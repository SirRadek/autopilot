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
import { stripAnsi, extractJsonFromPtyOutput } from "../../src/data/delivery-system/cliWorkerCapture";

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
