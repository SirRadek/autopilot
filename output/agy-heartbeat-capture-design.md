# Robust `agy` capture + liveness/heartbeat — design (Codex-led, Opus-reviewed)

> **Status:** DESIGN ONLY. Nothing applied to production code. Not pushed.
> **Task:** WORKER-CLI-001 — `agy` capture is broken → MISSING (no roleplay).
> **Roles (owner taxonomy):** Codex = lead investigator / worker / design author.
> Opus = orchestration, empirical grounding, review/synthesis. agy = the broken vendor under test.

---

## 0. Provenance & proof-of-real-Codex

This design was **led by a real `codex_cli` run**, not a Claude stand-in.

| Artifact | What it proves | File |
|---|---|---|
| Codex design run | `codex exec -c model_reasoning_effort=high`, exit 0, **73,261 tokens**, 24.9 KB | `output/_codex-agy-heartbeat-raw.md` |
| Codex prompt | Exact handoff Codex received | `output/_codex-agy-heartbeat-prompt.md` |
| `buildSubagentTree` proof | Real `codex_cli` routed through `runCliWorker` → schema-valid evidence child | `output/_proof-subagent-tree.mts` (ran: exit 0, 20s) |
| agy file-write probe | Empirical: agy **does** write `result.md` in print mode | `output/_probe-agy-filewrite.mts` |

`buildSubagentTree` output (real, this session):

```json
{
  "parent_session_hash": "opus-agy-heartbeat-design-proof",
  "children": [{
    "agent_id": "cli-codex-hp-agy-heartbeat-proof-20260622T161425",
    "handoff_id": "hp-agy-heartbeat-proof",
    "evidence": {
      "agent_type": "codex_cli-external",
      "started_at": "2026-06-22T16:14:25.820Z",
      "stopped_at": "2026-06-22T16:14:46.526Z",
      "duration_seconds": 20,
      "lock_status": "acquired_supervisor_spawn"
    }
  }]
}
```

---

## 1. Empirical grounding (the part that turns assumptions into facts)

Opus mapped the live machine and ran a **bounded agy probe** before/while Codex designed. Key facts:

**Filesystem contract (real paths on this machine):**
- agy binary: `C:\Users\sirok\AppData\Local\Microsoft\WinGet\Links\agy.exe`
- CLI logs (glog): `~/.gemini/antigravity-cli/log/cli-<YYYYMMDD_HHMMSS>.log`
- The conversation UUID is **triple-bound** (use for race-safe id):
  `Created conversation <UUID>` in cli-log · `brain/<UUID>/` dir · `conversations/<UUID>.db`
- transcript: `~/.gemini/antigravity-cli/brain/<UUID>/.system_generated/logs/transcript.jsonl`
  keys: `step_index` (monotonic — strongest growth signal), `source, type, status, created_at, content, thinking`

**glog status-line formats (verified, UUID redacted):**
```
I0622 18:04:12.044478 28400 server.go:789] Created conversation <UUID>
I0622 18:04:12.047983 28400 conversation_manager.go:525] Streaming conversation <UUID>
I0622 18:04:15.666813 28400 conversation_manager.go:601] Stream completed for <UUID>, clearing ResponsePending
```
(col 3 `28400` = agy server PID.)

**agy file-write probe — the decisive result:**
```json
{ "durationSec": 8, "exitCode": null, "timedOut": true,
  "resultFileWritten": true, "resultFileContent": "AGY_CAN_WRITE_FILES",
  "ptyBytes": 16 }
```
Interpretation:
1. **agy executes file writes in `--print --dangerously-skip-permissions`** → the `result.md`
   side-channel is *viable*, not hypothetical. This was Codex's biggest flagged risk; **it is now retired.**
2. **PTY delivered 16 bytes** → confirms owner's diagnosis: real output is NOT on stdout/PTY.
3. **agy did not exit after writing** (`exitCode: null`, killed at cap) → the result file appears
   **before and independently of** process exit. *Completion must be detected from the file, not from exit.*

This third point is the most important design driver and is reflected in the Opus refinements (§4).

---

## 2. Codex-led design (summary; full text in `output/_codex-agy-heartbeat-raw.md`)

**A. Diagnosis.** Current `captureAgyResponse` has a single data source (PTY buffer), which agy
does not reliably populate, and one flat 120 s timer that cannot distinguish "streaming" from "hung".
Stop treating PTY as authoritative; make a **file contract** authoritative.

**B. Architecture.** State machine `starting → streaming → idle → done | timed_out | missing`, driven by
a 3 s poll over four independent signals (PID, transcript growth, cli-log status, coarse SQLite mtime).
Shipped thresholds: `pollMs 3000, startupTimeoutMs 30000, transcriptIdleMs 45000, resultStableMs 2000,
timeoutMs 10min, maxAttempts 2`.

**C. Race-safe conversation binding.** Score UUID candidates from recent cli-logs:
`+100` log-PID == `proc.pid`; `+80` injected run-id found in transcript; `+20` brain-dir mtime > spawn;
`+5` db mtime > spawn. **Bind only on a clear winner; refuse ambiguous** (never guess "newest brain dir").

**D. Fallback ladder.** `result.md` (authoritative) → PTY clean → transcript `content` (last 8) → `missing`.
On 2 failed attempts: `resultSource:"missing"`, `errorReason:"agy_missing:<reason>"`.

**E. Handoff addendum + run-id contract.** `runCliWorker` generates `workerRunId`, injects it into the
prompt, passes the same id to `captureAgyResponse`; agy runs with repo root as cwd and must write
`.agent/runs/<run-id>/status.jsonl` (heartbeat) + `.agent/runs/<run-id>/result.md` (authoritative).

Codex's honest open risks: PID-match assumption; run-id-in-transcript assumption; agy may ignore the
file instruction; `.tmp`→rename depends on the model; concurrent runs.

The full concrete diff (≈220 lines, new types `AgyResultSource`/`AgyLivenessReason`/`AgyHeartbeat`,
`captureAgyResponseAttempt`, `scanAgyCliLogs`, `chooseAgyConversation`, `readTranscriptStats`,
`selectAgyFinalText`, `buildAgySideChannelPrompt`, plus `cliWorker.ts` consumption) is in
`output/_codex-agy-heartbeat-raw.md` §C and is the implementation baseline.

---

## 3. Opus review of Codex's diff — defects & gaps to fix before applying

Codex's design is sound and the diff is close to applyable. The following must be addressed:

**R1 — (BLOCKER, probe-driven) Completion is too slow for the real agy behavior.**
The probe shows agy writes `result.md` in ~8 s then **hangs** (no clean exit). Codex's diff only
accepts `result.md` on `stream_completed`, `process_exit`, or `transcript_idle`. If the hung process
never emits `Stream completed` and never exits, completion falls through to `transcriptIdleMs = 45 s`
→ ~45 s wasted on every successful run. **Fix:** add a fast-path — once `result.md` is present,
size-stable for `resultStableMs`, **and** `status.jsonl` contains a `final`/`error` line (or
`Stream completed` seen), finish immediately as `done` and **kill the lingering proc**. The
`status.jsonl` `final` line is the cheap, authoritative "I'm done" the owner's model already asks for.

**R2 — (BLOCKER) `stream_completed` path leaks the agy process.**
`finish()` does `if (reason !== "stream_completed") proc.kill()`. Combined with R1 (agy hangs),
not killing on the done-path orphans `agy.exe`. **Fix:** always `proc.kill()` after the authoritative
read completes, regardless of reason. We've already harvested `result.md`; there is nothing to lose.

**R3 — (correctness) cwd inconsistency between prompt and monitor.**
`buildAgySideChannelPrompt(input.prompt, workerRunId, process.cwd())` is called in `cliWorker.ts`, but
`captureAgyResponse` recomputes `runDir` from `opts.cwd ?? process.cwd()` and `cliWorker` passes **no
`cwd`** to `captureAgyResponse`. If a caller ever sets `cwd`, the path agy is told to write and the path
the monitor watches diverge. **Fix:** thread one `cwd` value: compute `runDir/statusPath/resultPath`
once in `runCliWorker` and pass `cwd` + `runId` to both the prompt builder and `captureAgyResponse`.

**R4 — (correctness) absolute vs relative path mismatch in the addendum.**
`buildAgySideChannelPrompt` injects **absolute** paths; the documented addendum (§D) uses **relative**
`.agent/runs/<id>/`. Pick one. Recommend **absolute** in the injected prompt (removes cwd ambiguity for
agy) and keep the relative form only as human documentation.

**R5 — (hygiene) side-channel writes pollute the repo working tree.**
`.agent/runs/<run-id>/` under repo root will show in `git status`. **Fix:** add `.agent/` to
`.gitignore` (and prefer `process.cwd()` repo root only when that's intended; otherwise write under a
state dir). One-line change, do it in the same PR.

**R6 — (perf, non-blocking) full re-read every 3 s.**
`scanAgyCliLogs` reads all recent cli-logs and `readTranscriptStats` parses the whole transcript each
poll, and `chooseAgyConversation` does this per-candidate until bound. Fine for MVP (files are small),
but track a byte offset / cache parsed `maxStepIndex` once transcripts grow. Mark as a follow-up, not a
blocker.

**R7 — (robustness) `startupTimeoutMs` can be starved by a chatty PTY.**
The guard `!convId && now - max(lastPtyAt) > startupTimeoutMs && !statusStat` never fires if agy dribbles
PTY bytes. Prefer keying startup-timeout off **wall-clock since spawn** OR "no `status.jsonl` AND no
conv binding AND no result.md", independent of PTY chatter.

**R8 — (minor) `missingAgyResult` hard-codes `livenessReason:"pty_exit_no_output"`.**
The retry loop already returns the real last attempt (`last`) so this is mostly a dead `??` branch, but
if reached it discards the true reason. Carry the last reason through.

None of R1–R8 invalidate the architecture; R1/R2 are the only ones that change *behavior* materially and
both are driven by the empirical probe.

---

## 4. Opus-refined completion logic (delta over Codex §B/§C)

Replace the poll's terminal checks with this priority (fastest-true-signal first):

```
1. result.md present AND size-stable(resultStableMs) AND
   (status.jsonl has a {"event":"final"} line  OR  cli-log "Stream completed for <convId>")
        -> finish("done_result_md"); kill proc; resultSource = "result_md"      // ~8–10 s typical
2. status.jsonl has {"event":"error"}  OR  cli-log "Print mode: timed out"
        -> attempt failure -> retry (maxAttempts) -> else "missing"
3. process exit:
        result.md non-empty -> "result_md" ; else PTY non-empty -> "pty" ; else "pty_exit_no_output"
4. transcript idle > transcriptIdleMs:
        result.md non-empty+stable -> "idle_with_result" ; else -> "transcript_idle" (degraded/missing)
5. wall-clock > timeoutMs -> "flat_timeout" -> retry/missing
```

Always `proc.kill()` once a terminal state reads its output. The `final` status line is what lets path 1
beat the 45 s idle fallback — it is the owner's "authoritative status" doing real work.

**Hang detection (owner spec, made concrete):** `transcript idle > 45 s` OR `Print mode: timed out` OR
`wall-clock > 10 min` → kill + retry; second failure → `MISSING` (`errorReason:"agy_missing:<reason>"`).
agy is never faked: empty/ambiguous = MISSING.

---

## 5. Handoff-prompt addendum (final, absolute-path form)

Inject after generating `workerRunId`, with `<RUN_DIR>`/`<STATUS>`/`<RESULT>` as **absolute** paths:

```md
---
AGY RUN ARTIFACT CONTRACT — MANDATORY

Autopilot worker run id: <RUN_ID>
Working directory: <CWD>

1. Ensure this directory exists: <RUN_DIR>            (= <CWD>/.agent/runs/<RUN_ID>)
2. Append one compact JSON line per step to: <STATUS> (= <RUN_DIR>/status.jsonl)
   {"run_id":"<RUN_ID>","event":"started|progress|final|error","message":"...","at":"<ISO-8601>"}
3. Write your FINAL answer to: <RESULT>               (= <RUN_DIR>/result.md)

Rules:
- result.md is the ONLY authoritative final answer. Do not rely on stdout, terminal
  rendering, transcript storage, or SQLite.
- Write result.md.tmp first, then rename to result.md (atomic).
- Immediately after result.md is complete, append a status line with event "final".
- On failure: append event "error" and write the blocker into result.md.
```

**Run-id contract:** `runCliWorker` mints `workerRunId` → injects absolute paths into the prompt →
passes the same `runId` **and** `cwd` to `captureAgyResponse` → agy writes under that exact dir →
monitor watches the identical absolute paths (fixes R3/R4).

---

## 6. Recommended apply order (when owner approves implementation — Codex executes)

1. `.gitignore += .agent/` (R5).
2. `cliWorkerCapture.ts`: apply Codex §C diff **with** R1/R2/R3/R4/R7/R8 folded in (§3–§5 here).
3. `cliWorker.ts`: thread `cwd`+`runId` to both prompt builder and capture; surface
   `resultSource`/`livenessReason`/`convId` (already in Codex diff).
4. Verify on the live machine the two remaining assumptions:
   - PID match: log `proc.pid` vs glog col-3 for one real run.
   - run-id-in-transcript: search transcript for the injected `<RUN_ID>` (probe already shows agy
     can write arbitrary content, so this is likely; confirm placement).
5. `npm.cmd run typecheck` + a single real agy round-trip; assert `resultSource==="result_md"` and
   completion < 15 s, then a forced-timeout case asserts `MISSING`.

Implementation is **not** done here per the owner's Codex-only-implementation model; this document is the
bounded handoff Codex implements against.

---

## 7. Honest status

- Real Codex: **succeeded** (design + diff produced; token/exit evidence above).
- `buildSubagentTree` proof: **succeeded** (real codex_cli child, schema-valid evidence).
- agy file-write probe: **succeeded and decisive** — agy writes `result.md`, PTY is ~empty, agy hangs
  after writing. This both validates the owner's preferred design and forces the R1/R2 completion fix.
- Not done / deferred to implementation: live PID-match and run-id-in-transcript confirmation (step 4);
  perf offset-tracking (R6); actual code application (Codex, on approval).
```
