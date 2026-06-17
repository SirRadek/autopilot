# Autopilot Supervisor Architecture Plan — v2

**Version:** 0.2.0  
**Date:** 2026-06-17  
**Replaces:** `output/supervisor-architecture-plan.md` (v0.1.0)  
**Status:** Design — no implementation  
**Audience:** GPT brainstorming + Codex task decomposition  
**Repo root:** `C:\Programování\Codex`

---

## What Changed from v0.1

| v0.1 state | Verified reality | Correction in v2 |
|---|---|---|
| Task 07 "add `large` to TokenBudgetClass" | `tokenEfficiency.ts:3` already has `"tiny" \| "small" \| "medium" \| "large"` | Task only adds `ContextWidthSpec` interface — `TokenBudgetClass` untouched |
| Task 12 "new hook bridge" | `.codex/hooks/autopilot-hook.mjs` + `.codex/hooks.json` already exist | Task 05 is *extension* of existing file, not a new bridge |
| `model-policy.test.ts` ignored | File exists at `tests/delivery-system/model-policy.test.ts`; tests `credentialedAdvisoryProviderPolicies`, `accessMode`, stop conditions | Every `modelPolicy.ts` change must update or preserve these tests |
| Gemini CLI flag `--flash` / `--model` | Run logs use `-m auto`, `-m <model>`; `v3-prompt-pack.md` confirms `-m auto` | `cliAccessPath` uses `-m <model>` syntax; unverified model names get `cliAccessPath: undefined` |
| Session-state: 4 files | Gemini verdict: simplify | 2 files only (`session.json` + `history.jsonl`); `pendingAlerts` embedded in manifest; `providerStatus` replaces full budget objects |
| Claude = "fixed non-negotiable" orchestrator | GPT verdict: when unavailable → `waiting_owner` | Claude = *preferred* high-trust orchestrator; unavailability → `waiting_owner`, not error |
| 16 tasks, monolithic | Both verdicts: too monolithic, no POC gate | Split into **Core POC** (Tasks 1–8) and **Advanced** (Tasks 9–19) |
| No enforcement schemas | GPT verdict: add runtime enforcement before policy docs | Tasks 01–02 create JSON schemas + completion matrix as first deliverables |
| SupervisorRoutingDecision missing fields | v1 C3 had `assignedTierId`, `learningSignal`, `buildSupervisorRoutingDecision()` | Task-12 now includes all three |
| `geminiKnownTiers` only 2 entries | v1 B2 had 3 tiers (auto, flash, pro) | Task-09 restores all 3; pro/flash marked `verifiedLocally: false` |
| dependencyFreshness.ts bare mention | v1 D2 had full type spec | Task-16 includes `DependencyCheckRecord`, `ReuseCheckResult`, `dependencyFreshnessPolicy` |
| Mesh edges YAML implicit | v1 E3 had full YAML for 4 edges | Task-17 includes full edge definitions |

---

## Hard Constraints (unchanged)

- No autonomous execution, background queues, or remote mutation without owner approval.
- No API keys, no per-token billing — all providers via subscription only.
- Serial worker delegation — one active worker session at a time.
- No `modelPolicy.ts` change without updating `tests/delivery-system/model-policy.test.ts`.
- No new Gemini CLI model names hardcoded until verified with `gemini --list-models` locally.
- `npm.cmd run verify` must pass after every phase (Windows: use `npm.cmd`, not `npm`).
- Never write raw prompts, commands, tool responses, secrets, or customer data anywhere.

---

## Role Assignments

| Role | Provider | Access mode | Availability fallback |
|---|---|---|---|
| Orchestrator / Architect / Reviewer | Claude Opus | `subscription_interactive` (Claude Code) | `waiting_owner` — cannot auto-substitute |
| Implementation / Tests / Security / Business | GPT / Codex | `subscription_interactive` (OpenAI sub) | `qwen_local` for simple tasks; `waiting_owner` for GPT-only tasks |
| Brainstorming / Long-context analysis | Gemini | `subscription_cli` (Google sub) | Try next tier → `blocked`; never substitute with GPT |
| Fast local fallback | Qwen local | `local` (Ollama, offline) | n/a — always available |

---

## Component Map

```
GROUP A — Learning & Evaluation
  A1  Learning loop read-back         modelOutputEvaluation.ts (extend) → Task-13
  A2  Self-correction loop            modelOutputEvaluation.ts (extend) → Task-13

GROUP B — Provider Management
  B1  Session state contract          sessionState.ts (new, simplified) → Task-04
  B2  Subscription budget + tiers     subscriptionBudget.ts (new) → Task-09
  B3  Fallback chains                 fallbackChains.ts (new) → Task-10
  B4  Supervisor alerts               supervisorAlerts.ts (new) → Task-03

GROUP C — Routing & Selection
  C1  Layer → provider mapping        modelPolicy.ts (extend) → Task-12
  C2  Context width selection         tokenEfficiency.ts (extend) → Task-14
  C3  SupervisorRoutingDecision       modelPolicy.ts (composite) → Task-12

GROUP D — Worker Tooling
  D1  Skill / plugin registry         toolInventory.ts (extend) + skill-registry.json → Task-15
  D2  Dependency freshness + reuse    dependencyFreshness.ts (new) → Task-16

GROUP E — Infrastructure
  E0  Output schemas + fixtures       worker-output.schema.json + reviewer-output.schema.json → Task-01
  E0b Completion matrix enforcement   checkCompletionMatrix.ts (new) → Task-02
  E1  modelPolicy.ts fixes            GPT subscription mode + lane updates → Task-11
  E2  Handoff packet template         agent-handoff-packet-template.md (extend) → Task-06
  E3  Mesh nodes (4 new)              subscription_worker_boundary, skill_registry_policy,
                                       reuse_gate, supervisor_execution_loop → Task-17
  E4  Hook bridge                     autopilot-hook.mjs (extend) → Task-05
  E5  Supervisor prompt               claude-opus-supervisor.md (new) → Task-07
  E6  Worker prompt                   codex-bounded-worker.md (new) → Task-07
```

---

## Structure

```
PART 1 — CORE SUPERVISOR POC  (Tasks 1–8)
  Focus: enforcement schemas + minimal typed contracts + manual spike
  Goal:  prove the Claude → Codex handoff loop works before infrastructure

  Phase 0A  Output schemas + fixtures         Task 01
  Phase 0B  Completion enforcement            Task 02
  Phase 0C  Foundation types                  Tasks 03–04
  Phase 1   Hook bridge extension             Task 05
  Phase 2   Handoff template + prompts        Tasks 06–07
  Phase 3   Manual spike + adoption record    Task 08

POC COMPLETION GATE — manual spike must validate before Part 2

PART 2 — ADVANCED AUTOMATION  (Tasks 9–19)
  Focus: provider routing, learning, context width, mesh, full automation
  Prerequisite: Part 1 complete and manual spike validated

  Phase 4   Provider management               Tasks 09–10
  Phase 5   Policy updates (test-guarded)     Tasks 11–12
  Phase 6   Learning + evaluation             Task 13
  Phase 7   Context width                     Task 14
  Phase 8   Worker tooling                    Tasks 15–16
  Phase 9   Mesh nodes                        Task 17
  Phase 10  Adoption record finalize          Task 18
  Phase 11  Full verification                 Task 19
```

---

## Závazné pořadí implementace

Toto pořadí je závazné (výstup z Gemini review, 2026-06-17). Žádná fáze nesmí
začít dříve, než předchozí fáze projde svými acceptance kritérii.

```
FÁZE 1 — Schemas + enforcement gate
  Task-01  worker-output.schema.json + reviewer-output.schema.json + fixtures
  Task-02  checkCompletionMatrix.ts + HandoffId branded type
  ↓ unblocks: Task-04 (session state imports HandoffId), Task-05 (hook uses schemas)

FÁZE 2 — Session state + hook bridge
  Task-03  supervisorAlerts.ts
  Task-04  sessionState.ts + .lock soubor + history trim spec
  Task-05  hook bridge extension (Gemini detector, Stop update, lock integration)
  ↓ unblocks: Task-07 (supervisor prompt reads session.json)

FÁZE 3 — Prompts + handoff loop spike
  Task-06  handoff packet template extension
  Task-07  claude-opus-supervisor.md + codex-bounded-worker.md (včetně verify-fail handling)
  Task-08  manual spike + adoption record
  ↓ POC GATE: spike musí projít než začne Fáze 4

FÁZE 4 — Provider routing, learning, mesh  [Part 2 — Advanced]
  Task-09  subscriptionBudget.ts (Gemini tiers — po lokální verifikaci CLI)
  Task-10  fallbackChains.ts
  Task-11  modelPolicy.ts fixes
  Task-12  layerProviderMapping + SupervisorRoutingDecision
  Task-13  learningSignal + self-correction (EvalRecordSummary z records/ only)
  Task-14  ContextWidthSpec
  Task-15  skillRegistry types
  Task-16  dependencyFreshness
  Task-17  mesh nodes (s failure_modes)
  Task-18  adoption record finalize
  Task-19  full verify
```

---

## PART 1 — CORE SUPERVISOR POC

---

### TASK-01 — Worker Output + Reviewer Output Schemas

**Why first:** Define what workers and reviewers must return before building any typed
module. Failing fixtures prove the schema catches bad output before any implementation.

**Files to create:**
- `model-output-evals/worker-output.schema.json`
- `model-output-evals/reviewer-output.schema.json`
- `model-output-evals/examples/valid-worker-output.json`
- `model-output-evals/examples/invalid-worker-output.json`
- `model-output-evals/examples/valid-reviewer-output.json`

**No-op check:**  
`grep -rn "worker-output.schema\|reviewer-output.schema" model-output-evals/`  
If files exist, read them and verify they match this spec before skipping.

**Worker output schema (JSON Schema draft 2020-12):**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://autopilot.local/worker-output.schema.json",
  "title": "Worker Output",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "handoff_id", "worker_id", "created", "files_changed",
    "tests_run", "open_questions", "blocked_items",
    "reuse_check_decision", "verify_result"
  ],
  "properties": {
    "handoff_id":          { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]*$" },
    "worker_id":           { "type": "string", "enum": ["openai_gpt", "qwen_local"] },
    "created":             { "type": "string", "format": "date-time" },
    "files_changed":       { "type": "array", "items": { "type": "string" } },
    "tests_run":           { "type": "array", "items": { "type": "string" } },
    "open_questions":      { "type": "array", "items": { "type": "string" } },
    "blocked_items":       { "type": "array", "items": { "type": "string" } },
    "reuse_check_decision": {
      "type": "string",
      "enum": ["implement_new", "reuse_existing", "extend_existing"]
    },
    "verify_result": {
      "type": "string",
      "enum": ["pass", "fail", "skipped"]
    },
    "verify_skip_reason": { "type": "string" }
  }
}
```

**Reviewer output schema:**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://autopilot.local/reviewer-output.schema.json",
  "title": "Reviewer Output",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "handoff_id", "reviewer_id", "created", "quality_state",
    "score_by_dimension", "next_action", "verified_facts", "risks"
  ],
  "properties": {
    "handoff_id":    { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]*$" },
    "reviewer_id":   { "type": "string", "enum": ["anthropic_claude_subscription"] },
    "created":       { "type": "string", "format": "date-time" },
    "quality_state": {
      "type": "string",
      "enum": ["accepted", "retry_with_correction", "escalate_model_route",
               "owner_decision", "blocked"]
    },
    "score_by_dimension": {
      "type": "object",
      "required": ["task_fit", "instruction_following", "source_grounding",
                   "format_contract", "verification_readiness"],
      "properties": {
        "task_fit":               { "type": "number", "minimum": 0, "maximum": 100 },
        "instruction_following":  { "type": "number", "minimum": 0, "maximum": 100 },
        "source_grounding":       { "type": "number", "minimum": 0, "maximum": 100 },
        "format_contract":        { "type": "number", "minimum": 0, "maximum": 100 },
        "verification_readiness": { "type": "number", "minimum": 0, "maximum": 100 }
      }
    },
    "next_action":     { "type": "string" },
    "verified_facts":  { "type": "array", "items": { "type": "string" } },
    "risks":           { "type": "array", "items": { "type": "string" } },
    "correction_note": { "type": "string" },
    "iteration_count": { "type": "integer", "minimum": 1, "maximum": 3 }
  }
}
```

**Failing-test-first rule:**  
Write a test asserting `invalid-worker-output.json` (missing `handoff_id`) fails
schema validation. Create the invalid fixture. Watch test pass. Then create valid fixture.

**Acceptance criteria:**
- `valid-worker-output.json` passes both schemas.
- `invalid-worker-output.json` (missing `handoff_id`) fails `worker-output.schema.json`.
- `npm.cmd run model-output:validate` passes (schemas don't break it).
- `npm.cmd run typecheck` unaffected (JSON files only).

---

### TASK-02 — Check-Completion-Matrix

**Why early:** Runtime enforcement before more policy docs. The completion matrix is the
mechanistic gate verifying a handoff packet has required fields before a worker session opens.

**Files to create:**
- `src/data/delivery-system/checkCompletionMatrix.ts`
- `tests/delivery-system/check-completion-matrix.test.ts`

**No-op check:**  
`grep -rn "checkCompletionMatrix\|validateHandoffPacket\|HandoffSection" src/`  
If found, read existing file and diff against this spec before adding.

**Failing-test-first:**  
Write `check-completion-matrix.test.ts` first. Add one test:
```typescript
it("returns valid: false when handoff_id is missing", () => {
  const result = validateHandoffPacket({ goal: "implement button" });
  expect(result.valid).toBe(false);
  expect(result.missingSections).toContain("handoff_id");
});
```
Run `npm.cmd test tests/delivery-system/check-completion-matrix.test.ts` — confirm it fails.
Then implement the minimum code to pass it.

```typescript
// src/data/delivery-system/checkCompletionMatrix.ts

export type HandoffSection =
  | "handoff_id"                    // NEW v2 — every packet needs a slug
  | "source_agent"
  | "target_agent"
  | "project"
  | "mode"
  | "goal"
  | "scope"
  | "allowed_files_or_surfaces"
  | "forbidden_actions"
  | "verified_facts"
  | "expected_output"
  | "required_checks"
  | "stop_conditions"
  | "reuse_check"                   // required for bounded_coding
  | "context_budget";               // required for all tasks

// Branded type — prevents mixing plain string with a handoff ID.
// Format: "hp-YYYYMMDD-<task-slug>" — e.g. "hp-20260617-add-context-width"
// Using brand pattern (no runtime overhead, pure TS nominal typing):
declare const __handoffIdBrand: unique symbol;
export type HandoffId = string & { readonly [__handoffIdBrand]: "HandoffId" };

export function makeHandoffId(slug: string): HandoffId {
  // Validates format at creation point; throws if malformed.
  if (!/^hp-\d{8}-[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error(`Invalid HandoffId format: "${slug}". Expected: hp-YYYYMMDD-<slug>`);
  }
  return slug as HandoffId;
}

export type HandoffMode =
  | "DRY_RUN"
  | "INSPECT_ONLY"
  | "WRITE_ALLOWED"
  | "REMOTE_MUTATION_APPROVED";

export interface ContextBudgetSummary {
  readonly profile: "caveman" | "standard_compact" | "review_compact" | "research_compact";
  readonly maxFilesInPacket: number;
  readonly maxContextLines: number;
}

export interface ReuseCheckSummary {
  readonly searchedPatterns: readonly string[];
  readonly existingMatches: readonly string[];
  readonly packageMatches: readonly string[];
  readonly decision: "implement_new" | "reuse_existing" | "extend_existing";
  readonly reuseTarget: string | undefined;
}

export interface HandoffPacket {
  readonly handoffId: HandoffId;                     // branded — use makeHandoffId()
  readonly sourceAgent: string;
  readonly targetAgent: string;
  readonly project: string;
  readonly mode: HandoffMode;
  readonly goal: string;
  readonly scope: string;
  readonly allowedFilesOrSurfaces: readonly string[];
  readonly forbiddenActions: readonly string[];
  readonly verifiedFacts: readonly string[];
  readonly expectedOutput: readonly string[];
  readonly requiredChecks: readonly string[];
  readonly stopConditions: readonly string[];
  readonly reuseCheck: ReuseCheckSummary | undefined;   // required if bounded_coding
  readonly contextBudget: ContextBudgetSummary | undefined;
}

export interface CompletionMatrixResult {
  readonly valid: boolean;
  readonly missingSections: readonly HandoffSection[];
  readonly warnings: readonly string[];
}

export const REQUIRED_SECTIONS_ALWAYS: readonly HandoffSection[] = [
  "handoff_id", "source_agent", "target_agent", "project", "mode",
  "goal", "scope", "allowed_files_or_surfaces", "forbidden_actions",
  "verified_facts", "expected_output", "required_checks", "stop_conditions",
  "context_budget"
];

export const REQUIRED_SECTIONS_BOUNDED_CODING: readonly HandoffSection[] = [
  ...REQUIRED_SECTIONS_ALWAYS,
  "reuse_check"
];

export function validateHandoffPacket(
  packet: Partial<HandoffPacket>,
  taskType?: "bounded_coding" | "review" | "analysis"
): CompletionMatrixResult

export function isHandoffPacket(value: unknown): value is HandoffPacket
```

**Acceptance criteria:**
- `validateHandoffPacket({})` → `valid: false`, all required sections listed.
- `validateHandoffPacket(fullPacket, "bounded_coding")` missing `reuseCheck` → `valid: false, missingSections: ["reuse_check"]`.
- `validateHandoffPacket(fullValidPacket)` → `valid: true, missingSections: []`.
- `makeHandoffId("hp-20260617-test")` succeeds; `makeHandoffId("raw-string")` throws.
- `HandoffPacket.handoffId` field accepts only `HandoffId` (branded), not plain `string`.
- `npm.cmd run typecheck` passes.
- `npm.cmd test tests/delivery-system/check-completion-matrix.test.ts` passes.

---

### TASK-03 — Supervisor Alerts (Minimal Types)

**Files to create:**
- `src/data/delivery-system/supervisorAlerts.ts`
- `tests/delivery-system/supervisor-alerts.test.ts`

**No-op check:**  
`grep -rn "SupervisorAlert\|AlertTrigger\|supervisorAlerts" src/`

**Failing-test-first:**  
Write test asserting `createAlert("correction_loop_exceeded", "ctx")` returns
`severity: "blocker"` before implementing.

```typescript
// src/data/delivery-system/supervisorAlerts.ts

export type AlertSeverity = "info" | "warning" | "blocker";

export type AlertTrigger =
  | "provider_rate_limited"
  | "provider_tier_switched"
  | "provider_unavailable"
  | "correction_loop_exceeded"      // iterationCount >= maxIterations
  | "stuck_workflow_state"          // same WorkflowState for N tasks in a row
  | "eval_score_below_threshold"
  | "missing_owner_decision"
  | "gemini_session_exhausted"
  | "reuse_check_skipped"
  | "skill_replacement_available";  // adopted replacement ignored

export interface SupervisorAlert {
  readonly id: string;               // slug: "alert-<trigger>-<seq>"
  readonly trigger: AlertTrigger;
  readonly severity: AlertSeverity;
  readonly provider: string | undefined;
  readonly context: string;          // redacted, no raw content
  readonly recommendedAction: string;
  readonly createdAt: string;
  readonly resolved: boolean;
  readonly resolvedAt: string | undefined;
}

const SEVERITY_MAP: Record<AlertTrigger, AlertSeverity> = {
  provider_rate_limited:        "warning",
  provider_tier_switched:       "info",
  provider_unavailable:         "blocker",
  correction_loop_exceeded:     "blocker",
  stuck_workflow_state:         "warning",
  eval_score_below_threshold:   "warning",
  missing_owner_decision:       "blocker",
  gemini_session_exhausted:     "warning",
  reuse_check_skipped:          "info",
  skill_replacement_available:  "info"
};

export function createAlert(
  trigger: AlertTrigger,
  context: string,
  provider?: string
): SupervisorAlert

export function resolveAlert(alert: SupervisorAlert): SupervisorAlert
```

**Acceptance criteria:**
- `createAlert("correction_loop_exceeded", "x")` → `severity: "blocker"`.
- `createAlert("provider_tier_switched", "x")` → `severity: "info"`.
- `createAlert("gemini_session_exhausted", "x")` → `severity: "warning"`.
- `createAlert("provider_unavailable", "x")` → `severity: "blocker"`.
- `npm.cmd run typecheck` passes.

---

### TASK-04 — Session State (2 Files Only)

**Simplification from v1:** Gemini verdict applied. Two files maximum:
- `session.json` — current state manifest (Opus reads at startup)
- `history.jsonl` — append-only event stream

v1 had 4 files (`session.json`, `alerts.jsonl`, `budgets.json`, `deps-check.json`).
In v2: `pendingAlerts` is embedded in the manifest; `providerStatus` is a simple `Record`
instead of full `SubscriptionSessionBudget[]`; deps are tracked in handoff packets.

**Files to create:**
- `src/data/delivery-system/sessionState.ts`
- `docs/autopilot/session-state/.gitignore`

**No-op check:**  
`ls docs/autopilot/session-state/ 2>$null` — if exists, check schema version.

```typescript
// src/data/delivery-system/sessionState.ts

import type { WorkflowState } from "./workflows";
import type { SupervisorAlert } from "./supervisorAlerts";

export interface SessionStateManifest {
  readonly schemaVersion: "v1";
  readonly claudeSessionStartedAt: string;
  readonly lastUpdatedAt: string;
  readonly activeHandoffId: string | undefined;  // slug of currently open handoff
  readonly workflowState: WorkflowState;
  readonly pendingAlerts: readonly SupervisorAlert[];  // replaces alerts.jsonl
  readonly activeCorrectionLoopCount: number;          // integer counter (not full array)
  readonly providerStatus: Readonly<Record<
    string,
    "available" | "rate_limited" | "unknown"
  >>;
  readonly hookEventCount: number;
  readonly investigationQueueDepth: number;
}

export interface SessionHistoryEntry {
  readonly timestamp: string;
  readonly event:
    | "session_start"
    | "handoff_created"
    | "worker_output_received"
    | "correction_loop_iteration"
    | "alert_created"
    | "alert_resolved"
    | "provider_status_changed"
    | "workflow_state_changed";
  readonly handoffId: string | undefined;
  readonly detail: string;    // redacted — no raw content, prompts, or secrets
}

export const SESSION_STATE_PATH   = "docs/autopilot/session-state/session.json";
export const SESSION_HISTORY_PATH = "docs/autopilot/session-state/history.jsonl";
export const SESSION_LOCK_PATH    = "docs/autopilot/session-state/worker.lock";

export const HISTORY_MAX_ENTRIES = 50;  // trim after this count; keep most recent 50

export function createInitialSessionState(): SessionStateManifest

export function createHistoryEntry(
  event: SessionHistoryEntry["event"],
  detail: string,
  handoffId?: string
): SessionHistoryEntry
```

`.gitignore` contents:
```
*.json
*.jsonl
*.lock
```

**Lock file (`worker.lock`):**  
Physical enforcement of "one active worker at a time". Format: single JSON line —
`{"lockedBy":"hp-YYYYMMDD-<slug>","lockedAt":"ISO timestamp"}`.

- Created when a handoff session opens (supervisor writes it via hook bridge).
- Deleted when worker output is received and normalized.
- If `worker.lock` already exists when a new handoff is attempted:
  `validateHandoffPacket()` adds `warnings: ["worker.lock already present — previous session may still be active"]`.
- The lock is advisory (not OS-level); it relies on the supervisor checking before delegation.

**`history.jsonl` trim:**  
The hook bridge (Task 05) trims `history.jsonl` to the most recent `HISTORY_MAX_ENTRIES`
lines before each append. Trim is read → slice last 49 → append new entry → write.
Implemented in a dedicated `trimAndAppendHistory(entry)` helper inside the hook.

**Acceptance criteria:**
- `schemaVersion: "v1"` is a literal type (not `string`).
- `SESSION_STATE_PATH`, `SESSION_HISTORY_PATH`, `SESSION_LOCK_PATH` are exported constants.
- `HISTORY_MAX_ENTRIES === 50` is exported (for hook bridge to import).
- No file I/O in this module — runtime writes are done by the hook bridge (Task 05).
- `npm.cmd run typecheck` passes.

---

### TASK-05 — Hook Bridge Extension

**Context to load:**
- `.codex/hooks/autopilot-hook.mjs` (full file — already exists, do not recreate)
- `src/data/delivery-system/supervisorAlerts.ts` (Task 03 — type shapes only)
- `src/data/delivery-system/sessionState.ts` (Task 04 — path constants)

**Files to edit:** `.codex/hooks/autopilot-hook.mjs` (additive only)  
**Do not edit:** `.codex/hooks.json` (hook registration unchanged)

**No-op check before editing:**  
`grep -n "session-state\|SESSION_STATE\|gemini.*capacity\|rate.limit.*phrase\|GEMINI_RATE_LIMIT" .codex/hooks/autopilot-hook.mjs`  
If any of these already exist, read those sections before adding — do not duplicate.

**Three additions (each wrapped in try/catch, each fails silently):**

**Addition 1 — Gemini capacity phrase detector**  
Scan `input.result` in `handlePostToolUse` for known Gemini rate-limit keywords:

```javascript
const GEMINI_RATE_LIMIT_PHRASES = [
  "quota", "rate limit", "resource_exhausted", "retry", "429",
  "RESOURCE_EXHAUSTED", "quota retry"
];

function detectGeminiCapacityPhrase(toolName, resultText) {
  if (!toolName?.toLowerCase().includes("gemini")) return false;
  const lower = (resultText ?? "").toLowerCase();
  return GEMINI_RATE_LIMIT_PHRASES.some(p => lower.includes(p.toLowerCase()));
}
```

If detected: append a `SessionHistoryEntry` to `docs/autopilot/session-state/history.jsonl`
with `event: "provider_status_changed"`, `detail: "gemini_rate_limit_phrase_detected"`.

**Addition 2 — Stop event completion evidence warning**  
In `handleStop`, if any turn has `flags.includes("governance_surface")` and
`result !== "completion_observed"`: read `session.json`, add a `SupervisorAlert`
for `missing_owner_decision` to `pendingAlerts`, write back. No raw content.

**Addition 3 — session.json manifest update on Stop**  
In `handleStop`: read `docs/autopilot/session-state/session.json` if it exists.
Update `lastUpdatedAt`, `hookEventCount`, `investigationQueueDepth`.
If file missing: write initial manifest from `createInitialSessionState()`.

**Addition 4 — lock file management**  
- On `SubagentStart` (new worker session): if `worker.lock` does not exist, create it
  with `{lockedBy: handoffId, lockedAt: ISO timestamp}`. Fail silently if path is unwriteable.
- On `SubagentStop`: delete `worker.lock` if it exists and `lockedBy` matches
  the current session's handoffId (prevents deleting another session's lock).

**Addition 5 — `trimAndAppendHistory()` helper**  
A private helper used by additions 1 and 2 instead of raw fs.appendFile:
```javascript
async function trimAndAppendHistory(entry) {
  // HISTORY_MAX_ENTRIES = 50 (imported from sessionState constants)
  try {
    let lines = [];
    try { lines = fs.readFileSync(HISTORY_PATH, "utf8").split("\n").filter(Boolean); } catch {}
    lines = lines.slice(-(HISTORY_MAX_ENTRIES - 1));   // keep last 49
    lines.push(JSON.stringify(entry));
    fs.writeFileSync(HISTORY_PATH, lines.join("\n") + "\n", "utf8");
  } catch { /* fail silently — must not block hook */ }
}
```

**Timeout and error handling for session.json writes:**  
All `session.json` read-modify-write operations (Additions 2 and 3) must complete
in ≤ 200ms total. Pattern:
```javascript
async function writeSessionJsonSafe(updateFn) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("session.json write timeout")), 200)
  );
  try {
    await Promise.race([doSessionWrite(updateFn), timeout]);
  } catch {
    // Log to .codex/state/events.jsonl only — do not rethrow
  }
}
```
The hook must NEVER throw or reject from a session-state write — the Codex session
must continue even if all session-state writes fail.

**Hard constraints:**
- Never write raw prompts, commands, tool output, or secrets.
- Only write event types, flag names, result classifications, and detail strings.
- All additions in separate try/catch blocks.
- Every existing test in `tests/codex-hooks.test.ts` must still pass.

**Acceptance criteria:**
- `npm.cmd test tests/codex-hooks.test.ts` passes (no regression).
- Simulated Gemini rate-limit result → `history.jsonl` has new entry.
- `session.json` updated on Stop within 200ms timeout.
- `worker.lock` created on SubagentStart; deleted on SubagentStop.
- `history.jsonl` never exceeds `HISTORY_MAX_ENTRIES + 1` lines after a write.
- A forced write failure (e.g. read-only path) does not throw or block the hook.
- No PII, no raw content in written files.

---

### TASK-06 — Handoff Packet Template Extension

**Context to load:** `docs/autopilot/agent-handoff-packet-template.md`  
**Files to edit:** `docs/autopilot/agent-handoff-packet-template.md`

**No-op check:**  
`grep -n "Handoff ID\|Reuse Check\|Context Budget\|Learning Signal\|handoff_id" docs/autopilot/agent-handoff-packet-template.md`  
If sections already exist with matching content, skip.

**Four additions:**

1. `## Handoff ID` — first section before Source Agent:
   ```
   ## Handoff ID
   hp-YYYYMMDD-<task-slug>
   (slug: lowercase, hyphens only, unique per task)
   ```

2. `## Reuse Check (required for bounded_coding tasks)` — after Expected Output:
   ```
   ## Reuse Check (required for bounded_coding tasks)
   - Searched patterns: [rg patterns used — e.g. "functionName", "ComponentName"]
   - Existing matches: [file:line or "none found"]
   - Installed package matches: [package names or "none"]
   - Decision: implement_new | reuse_existing | extend_existing
   - Reuse target: [file:line if applicable]
   - Token saving estimate: high | medium | low | none
   ```

3. `## Context Budget (required)` — after Reuse Check:
   ```
   ## Context Budget (required)
   - Profile: caveman | standard_compact | review_compact | research_compact
   - Max files: [N]
   - Max context lines: [N]
   - Included sections: [list from ContextWidthSpec.requiredSections]
   ```

4. `## Learning Signal (optional)` — after Context Budget:
   ```
   ## Learning Signal (optional)
   - Based on eval records: [task_type + provider pattern or "no data"]
   - Recommended delta: tighten_allowed_files | decompose_task | switch_to_qwen | no_change
   - Confidence: eval_records | single_observation | no_data
   ```

**Acceptance criteria:**
- Template is valid Markdown.
- `handoff_id` slug format `hp-YYYYMMDD-<slug>` is documented.
- All four sections present; required/optional labeled.
- Section names match `HandoffSection` enum in `checkCompletionMatrix.ts`.

---

### TASK-07 — Supervisor Prompt POC + Worker Prompt POC

**Context to load:**
- `prompt-library/06-supervisor/autopilot-supervisor-base.md` (read-only reference — do not edit)
- `prompt.schema.json`
- `docs/autopilot/agent-handoff-packet-template.md` (after Task 06)

**Files to create:**
- `prompt-library/06-supervisor/claude-opus-supervisor.md`
- `prompt-library/01-gpt/codex-bounded-worker.md`

**No-op check:**  
`ls prompt-library/06-supervisor/ prompt-library/01-gpt/` — if either file exists,
read it before proceeding; do not overwrite a more complete version.

**Claude Opus Supervisor prompt metadata:**
```yaml
---
id: claude-opus-supervisor
model_family: anthropic-claude
task_type: agentic-supervisor
version: v0.1.0-poc
status: draft
last_reviewed: 2026-06-17
sources:
  - local-agents-md
  - decision-mesh-policy
  - protective-supervision-operating-model
  - token-efficiency-operating-model
risk_level: high
requires:
  - decision_mesh_packet
  - session_state_file
  - handoff_packet_template
  - skill_registry
forbidden:
  - raw_agent_output_as_next_prompt
  - remote_mutation_without_owner_approval
  - self_approval
  - implementation_work
  - parallel_worker_sessions
  - codex_app_tools
---
```

Key differences from `autopilot-supervisor-base.md`:

| Section | autopilot-supervisor-base | claude-opus-supervisor |
|---|---|---|
| Bridge check | `codex_app.read_thread_terminal` | Read `session.json` |
| Role | Generic supervisor | Claude Opus; implementation explicitly forbidden |
| Startup | No alert check | Check `pendingAlerts` first; resolve blockers before planning |
| Gemini guard | Not present | Explicit budget guard before any Gemini use |
| Handoff | Generic | References `validateHandoffPacket()` gate; requires `handoffId` slug |
| Worker output | Not present | References `worker-output.schema.json` |

**Startup gate (replaces `codex_app.read_thread_terminal`):**
```markdown
## Startup Gate
1. Read docs/autopilot/session-state/session.json
   - If pendingAlerts contains severity: "blocker" → resolve alerts first, stop planning
   - Read providerStatus → know which providers available before routing
   - If file missing → create initial manifest, write it
2. Call MCP: select_capabilities → get_relevant_subgraph → build_agent_packet
3. Read AGENTS.md + CLAUDE.md
4. Read project mesh (if supervised project task)
5. Read docs/autopilot/skill-registry.json
```

**Forbidden tool check (Gemini verdict):**  
The `forbidden` list must include `codex_app_tools` so prompt validation can detect
if a supervisor variant accidentally references `codex_app.read_thread_terminal`.

**Worker prompt — Required Output section must include `verify_result`:**
```markdown
## Required Output (structured — for supervisor normalization)
- handoff_id: [must match input packet handoff_id]
- files_changed: [path:summary]
- tests_run: [command + result]
- verify_result: pass | fail | skipped
- verify_skip_reason: [if skipped: exact reason why npm.cmd run verify was not run]
- open_questions: [list]
- blocked_items: [list with reason]
- reuse_check_decision: implement_new | reuse_existing | extend_existing

## Verify failure handling
If `npm.cmd run verify` fails:
1. Do NOT keep iterating on guesses. Stop, report `verify_result: fail`.
2. Include in `blocked_items` the exact failing command and first error line.
3. Do NOT mark the task as done. Set `open_questions` with the failing step.
4. If verify could not be run at all (e.g. environment issue, missing deps):
   set `verify_result: skipped` with `verify_skip_reason` explaining the obstacle.
5. Never mark work done without a passing verify or an explicit skip reason
   accepted by the supervisor.
```

**Acceptance criteria:**
- `npm.cmd run prompt:validate` passes for both files.
- `claude-opus-supervisor.md` has no reference to `codex_app`.
- `codex-bounded-worker.md` Required Output includes `verify_result`.
- Both files pass `prompt.schema.json` metadata validation.

---

### TASK-08 — Manual Spike Documentation + Adoption Record Template

**Purpose:** Gemini verdict applied — verify the Opus→Codex handoff loop manually
before building full infrastructure.

**Files to create:**
- `docs/autopilot/spike-supervisor-handoff.md`
- `docs/autopilot/adoption-record-template.md`

**`spike-supervisor-handoff.md`:**
```markdown
# Spike: Manual Supervisor → Worker Handoff

## Goal
Prove end-to-end: Claude Opus creates a handoff packet → Codex executes it →
Opus reviews the structured output. All three schema validations must pass.

## Preconditions
- [ ] Tasks 01–07 complete
- [ ] worker-output.schema.json and reviewer-output.schema.json exist
- [ ] Handoff template has Handoff ID, Reuse Check, Context Budget sections
- [ ] claude-opus-supervisor.md and codex-bounded-worker.md pass prompt:validate

## Steps
1. In Claude Code: paste claude-opus-supervisor.md + a small bounded task.
2. Claude generates a handoff packet with valid handoff_id slug (hp-YYYYMMDD-*).
3. Run validateHandoffPacket() on the packet — must return valid: true.
4. Open Codex: paste codex-bounded-worker.md + handoff packet.
5. Codex executes; produces structured output matching worker-output.schema.json.
6. Validate worker output: run `node scripts/validate-spike-artifacts.mjs worker <output-file>`.
7. Return to Claude: paste reviewer-output.schema.json + worker output.
8. Claude produces reviewer output; validate: run `node scripts/validate-spike-artifacts.mjs reviewer <output-file>`.

## Validation script
The spike creates `scripts/validate-spike-artifacts.mjs` to verify artifacts:
```javascript
// scripts/validate-spike-artifacts.mjs
// Usage: node validate-spike-artifacts.mjs <worker|reviewer> <artifact.json>
import { readFileSync } from "fs";
import Ajv from "ajv/dist/2020.js";

const [,, type, file] = process.argv;
const schemaPath = `model-output-evals/${type}-output.schema.json`;
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const artifact = JSON.parse(readFileSync(file, "utf8"));
const ajv = new Ajv({ strict: true });
const validate = ajv.compile(schema);
if (!validate(artifact)) {
  console.error("VALIDATION FAILED:", JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
console.log(`OK: ${file} validates against ${schemaPath}`);
```
Also verify handoff_id consistency across all three artifacts:
```javascript
const handoffId = artifact.handoff_id;
// Cross-check that handoffId matches the source handoff packet slug.
```
This script is part of the spike only — not production code, lives in `scripts/`.

## Success criteria
- Both schema validations pass (exit 0).
- handoff_id is identical across handoff packet, worker output, and reviewer output.
- verify_result is present and either "pass" or "skipped" with a reason.
- No raw prompts, secrets, or log data appear anywhere.

## Record result
Fill in docs/autopilot/adoption-record-template.md and save as
docs/autopilot/adoption-records/2026-MMDD-supervisor-handoff-spike.md
```

**`adoption-record-template.md`:**
```markdown
# Adoption Record

## Decision ID
## Date
## What was proposed
## Decision: adopted | rejected | deferred
## Who decided
## Reason
## What was changed (file paths)
## Tests or evidence
## Supersedes (previous decision ID if applicable)
```

**Acceptance criteria:**
- Both files are valid Markdown.
- Spike doc references only artifacts from Tasks 01–07.
- Adoption record template has all 8 fields.
- `docs/autopilot/adoption-records/` directory exists (committed, initially empty except `.gitkeep`).

---

## PART 1 — POC COMPLETION GATE

Before starting Part 2, all of the following must be green:

```
npm.cmd run typecheck
npm.cmd test tests/delivery-system/check-completion-matrix.test.ts
npm.cmd test tests/delivery-system/supervisor-alerts.test.ts
npm.cmd test tests/codex-hooks.test.ts
npm.cmd run prompt:validate
npm.cmd run model-output:validate
npm.cmd run mesh:check
```

**And:** Complete the manual spike (Task 08) and write a filed adoption record.  
**Do not start Part 2 until the spike validates the handoff loop end-to-end.**

---

## PART 2 — ADVANCED AUTOMATION

---

### TASK-09 — Subscription Budget + Gemini Tiers

**Files to create:** `src/data/delivery-system/subscriptionBudget.ts`  
**Files to create:** `tests/delivery-system/subscription-budget.test.ts`

**No-op check:**  
`grep -rn "SubscriptionSessionBudget\|geminiKnownTiers\|ProviderTierSpec" src/`

**Gemini CLI flag verification (before coding):**  
The plan lists `-m gemini-2.5-flash` and `-m gemini-2.5-pro` as tier access paths.
Before writing these as string constants, verify: run `gemini --help` or check
the CLI reference for exact model names. Mark constants `verifiedLocally: false`
until confirmed. Only `gemini -m auto` (from run logs) is `verifiedLocally: true`.

```typescript
// src/data/delivery-system/subscriptionBudget.ts

export type SubscriptionRateLimitState =
  | "available"
  | "degraded"       // approaching limit — restrict to critical tasks
  | "rate_limited"   // hit limit for this tier
  | "unknown";

export interface ProviderTierSpec {
  readonly tierId: string;
  readonly displayName: string;
  readonly cliAccessPath: string | undefined;    // full CLI command; undefined = unverified
  readonly estimatedQuotaClass: "high" | "medium" | "low" | "unknown";
  readonly subscriptionRequired: boolean;
  readonly verifiedLocally: boolean;             // false until tested on this machine
  readonly notes: string | undefined;
}

export interface SubscriptionSessionBudget {
  readonly provider: string;
  readonly activeTierId: string;
  readonly activeTierRateLimitState: SubscriptionRateLimitState;
  readonly rateLimitHitAt: string | undefined;
  readonly lastAttemptedAt: string | undefined;     // ISO; when provider was last tried (any result)
  readonly availableTiers: readonly ProviderTierSpec[];
  readonly exhaustedTierIds: readonly string[];
  readonly sessionTaskCount: number;
  readonly lastSuccessfulTaskAt: string | undefined;
  readonly notes: string | undefined;
}
// lastAttemptedAt enables backoff decisions:
// if (now - lastAttemptedAt) < backoffWindow → skip tier without trying again

// Known Gemini tiers. cliAccessPath uses "-m <model>" pattern from run logs.
// Only gemini_auto is confirmed; flash and pro must be verified locally.
export const geminiKnownTiers: readonly ProviderTierSpec[] = [
  {
    tierId: "gemini_auto",
    displayName: "Gemini Auto (subscription)",
    cliAccessPath: "gemini -m auto --skip-trust --approval-mode plan",
    estimatedQuotaClass: "medium",
    subscriptionRequired: true,
    verifiedLocally: true,   // confirmed: 2026-05-10 run log, version 0.41.2
    notes: "Default path from run logs"
  },
  {
    tierId: "gemini_flash",
    displayName: "Gemini 2.5 Flash",
    cliAccessPath: undefined,   // TODO: verify model name with `gemini --list-models`
    estimatedQuotaClass: "high",
    subscriptionRequired: false,
    verifiedLocally: false,  // NOT confirmed on this machine
    notes: "Higher quota than auto/pro; lower capability — suitable for brainstorming"
  },
  {
    tierId: "gemini_pro",
    displayName: "Gemini 2.5 Pro",
    cliAccessPath: undefined,   // TODO: verify model name with `gemini --list-models`
    estimatedQuotaClass: "low",
    subscriptionRequired: true,
    verifiedLocally: false,  // NOT confirmed on this machine
    notes: "Highest capability, lowest quota"
  }
];
```

**Tier switching logic (Opus decision, not automated):**

```
When gemini_auto is rate_limited:
  1. Check availableTiers where tierId NOT IN exhaustedTierIds
  2. Select tier with estimatedQuotaClass: "high" (→ gemini_flash)
  3. Update activeTierId in session.json providerStatus
  4. Log to history.jsonl: event: "provider_status_changed"

When all Gemini tiers exhausted:
  → providerStatus["gemini_cli"] = "rate_limited"
  → create SupervisorAlert(gemini_session_exhausted)
  → do NOT substitute Gemini with GPT or any other provider
  → wait or continue without Gemini analysis
```

**Acceptance criteria:**
- `npm.cmd run typecheck` passes.
- `geminiKnownTiers.length === 3`.
- `geminiKnownTiers.find(t => t.tierId === "gemini_auto")?.verifiedLocally === true`.
- `geminiKnownTiers.find(t => t.tierId === "gemini_flash")?.verifiedLocally === false`.
- `SubscriptionSessionBudget` has `lastAttemptedAt: string | undefined` field.
- Tier switching logic is a supervisor decision, not automated code.

---

### TASK-10 — Fallback Chains

**Files to create:** `src/data/delivery-system/fallbackChains.ts`  
**Files to create:** `tests/delivery-system/fallback-chains.test.ts`

**No-op check:**  
`grep -rn "FallbackChainStep\|subscriptionFallbackChains\|resolveFallback" src/`

**Failing-test-first:**  
Write these tests before implementing:
```typescript
it("resolves Gemini flash when auto is rate-limited", () => {
  const result = resolveFallback("rate_limited", "gemini_cli", budgetWithFlash);
  expect(result?.toProvider).toBe("gemini_cli");
  expect(result?.toTierId).toBe("gemini_flash");
});
it("returns blocked when all Gemini tiers exhausted", () => {
  const result = resolveFallback("rate_limited", "gemini_cli", budgetAllExhausted);
  expect(result?.toProvider).toBe("blocked");
});
it("Claude unavailability routes to owner_decision not another provider", () => {
  const result = resolveFallback("provider_unavailable", "anthropic_claude_subscription", anyBudget);
  expect(result?.toProvider).toBe("owner_decision");
});
```

```typescript
// src/data/delivery-system/fallbackChains.ts

export type FallbackTrigger =
  | "rate_limited"
  | "provider_unavailable"
  | "output_quality_below_threshold"
  | "repeated_failure"
  | "all_tiers_exhausted";

export interface FallbackChainStep {
  readonly trigger: FallbackTrigger;
  readonly fromProvider: string;
  readonly fromTierId: string | undefined;    // undefined = any tier
  readonly toProvider: string | "owner_decision" | "blocked";
  readonly toTierId: string | undefined;
  readonly condition: string;
  readonly requiresCheckpoint: boolean;
  readonly requiresOwnerApproval: boolean;
}

export const subscriptionFallbackChains: readonly FallbackChainStep[] = [
  // Gemini: try Flash before giving up (not blocked, just tier switch)
  {
    trigger: "rate_limited",
    fromProvider: "gemini_cli", fromTierId: "gemini_auto",
    toProvider: "gemini_cli",   toTierId: "gemini_flash",
    condition: "gemini_auto rate limited — Flash has higher quota",
    requiresCheckpoint: false, requiresOwnerApproval: false
  },
  // Gemini: all tiers exhausted → blocked, never substitute
  {
    trigger: "all_tiers_exhausted",
    fromProvider: "gemini_cli", fromTierId: undefined,
    toProvider: "blocked",      toTierId: undefined,
    condition: "All Gemini tiers exhausted — pause only, no provider substitution",
    requiresCheckpoint: false, requiresOwnerApproval: false
  },
  // GPT: simple task → local fallback (qwen)
  {
    trigger: "rate_limited",
    fromProvider: "openai_gpt", fromTierId: undefined,
    toProvider: "qwen_local",   toTierId: undefined,
    condition: "task fits local scope: bounded_coding, micro_worker, test_generation",
    requiresCheckpoint: true, requiresOwnerApproval: false
  },
  // GPT: complex task → owner decision
  {
    trigger: "rate_limited",
    fromProvider: "openai_gpt",       fromTierId: undefined,
    toProvider: "owner_decision",     toTierId: undefined,
    condition: "task requires GPT: security, structured output, business logic",
    requiresCheckpoint: true, requiresOwnerApproval: true
  },
  // Opus: no fallback — orchestration cannot continue without owner
  {
    trigger: "provider_unavailable",
    fromProvider: "anthropic_claude_subscription", fromTierId: undefined,
    toProvider: "owner_decision",                  toTierId: undefined,
    condition: "Claude unavailable — orchestration blocked; owner must resume",
    requiresCheckpoint: true, requiresOwnerApproval: true
  }
];

export function resolveFallback(
  trigger: FallbackTrigger,
  fromProvider: string,
  budget: SubscriptionSessionBudget
): FallbackChainStep | undefined
```

**Invariants enforced in tests:**
- No step has `fromProvider: "gemini_cli"` with `toProvider !== "gemini_cli"` and `toProvider !== "blocked"`.
  (Gemini never falls back to GPT or any other provider.)
- `fromProvider: "anthropic_claude_subscription"` always routes to `"owner_decision"`.

**Acceptance criteria:**
- All three failing-test-first tests pass.
- Both invariants pass.
- `npm.cmd run typecheck` passes.

---

### TASK-11 — modelPolicy.ts: GPT Subscription Fix + Lane Updates

**Split rationale (GPT verdict):** Changes to `modelPolicy.ts` in 2 tasks to keep
diffs reviewable. This task: minimal fixes + lane updates. Task 12: new exports.

**Context to load:**
- `src/data/delivery-system/modelPolicy.ts` (full file)
- `tests/delivery-system/model-policy.test.ts` (full — read before any edit)

**Files to edit:** `src/data/delivery-system/modelPolicy.ts`  
**Files to edit:** `tests/delivery-system/model-policy.test.ts`

**No-op check:**  
`grep -n "subscription_interactive\|serial_task_delegation_required" src/data/delivery-system/modelPolicy.ts`  
If `openai_gpt.accessMode` is already `subscription_interactive`, skip that specific change.

**Changes to `modelPolicy.ts`:**

Provider policy fixes:
1. `openai_gpt.accessMode`: `"api_or_self_hosted"` → `"subscription_interactive"`
2. `openai_gpt`: add `costGuard: "uses_owner_subscription_entitlement_not_api_credit"`
3. `openai_gpt.requiredChecks`: add `"subscription_entitlement_confirmed_for_subscription_tools"`, `"serial_task_delegation_required"`
4. `openai_gpt.stopConditions`: add `"subscription_entitlement_unverified"`, `"parallel_subscription_calls_attempted"`, `"mid_task_rate_limit_without_checkpoint"`
5. `gemini_cli.requiredChecks`: add `"gemini_session_budget_tracked"`, `"gemini_not_primary_worker"`
6. `gemini_cli.stopConditions`: add `"gemini_rate_limit_exhausted_without_pause"`, `"gemini_used_as_default_worker"`
7. `gemini_cli.avoidFor`: add `"primary implementation worker"`, `"default fallback when GPT unavailable"`

Lane preference updates:
8. `bounded_coding_worker` task lane: move `openai_gpt` to `preferredProviders[0]` (was `qwen_local`)
9. `agent_validation` task lane: move `anthropic_claude_subscription` to `preferredProviders[0]`

**New test to add:**
```typescript
it("configures openai_gpt as subscription_interactive, not api_or_self_hosted", () => {
  const gpt = reasoningProviderPolicies.find(p => p.id === "openai_gpt");
  expect(gpt?.accessMode).toBe("subscription_interactive");
  expect(gpt?.requiredChecks).toContain("subscription_entitlement_confirmed_for_subscription_tools");
  expect(gpt?.stopConditions).toContain("parallel_subscription_calls_attempted");
});

it("prefers openai_gpt as first provider for bounded_coding_worker lane", () => {
  const lane = reasoningTaskLanes.find(l => l.id === "bounded_coding_worker");
  expect(lane?.preferredProviders[0]).toBe("openai_gpt");
});
```

**Acceptance criteria:**
- ALL existing `model-policy.test.ts` tests still pass (no regression).
- New tests pass.
- `npm.cmd run typecheck` passes.

---

### TASK-12 — modelPolicy.ts: Layer Mapping + SupervisorRoutingDecision

**Prerequisite:** Task 11 complete and green.

**Context to load:** same as Task 11 + `src/data/delivery-system/subscriptionBudget.ts` (Task 09),
`src/data/delivery-system/tokenEfficiency.ts` (Task 14 spec for `ContextWidthSpec`).

**Note:** `ContextWidthSpec` is defined in Task 14. If Task 12 is implemented before
Task 14, use a forward-reference placeholder type and update after Task 14 completes.

**No-op check:**  
`grep -n "layerProviderMapping\|SupervisorRoutingDecision\|buildSupervisorRoutingDecision" src/data/delivery-system/modelPolicy.ts`

**Additions to `modelPolicy.ts`:**

```typescript
// Layer → provider mapping (deterministic, subscription-aware)
export const layerProviderMapping = {
  orchestrator:      "anthropic_claude_subscription",
  architect:         "anthropic_claude_subscription",
  reviewer:          "anthropic_claude_subscription",
  tester:            "openai_gpt",
  micro_worker:      "openai_gpt",
  bounded_coding:    "openai_gpt",
  memory_summarizer: "gemini_cli",    // Gemini only; rate-limit guard applies
  copywriter:        "openai_gpt"
} as const satisfies Record<ModelPolicyLayer, ReasoningProviderId>;

// Full routing decision — composite output for one task
export interface SupervisorRoutingDecision {
  readonly taskId: string;
  readonly layer: ModelPolicyLayer;
  readonly tokenEfficiencyProfile: TokenEfficiencyProfileId;   // from selectTokenEfficiencyRoute()
  readonly contextWidthSpec: ContextWidthSpec;                 // from Task-14 selectContextWidth()
  readonly taskLane: ReasoningTaskLaneId;
  readonly assignedProvider: ReasoningProviderId;              // from layerProviderMapping
  readonly assignedTierId: string | undefined;                 // active tier from SubscriptionSessionBudget
  readonly subscriptionBudgetState: SubscriptionRateLimitState; // from budget
  readonly fallbackProvider: ReasoningProviderId | "owner_decision" | "blocked"; // from resolveFallback()
  readonly learningSignal: SupervisorLearningSignal | undefined;  // from deriveLearningSignal()
  readonly decisionReasoning: string;
}

// Composite builder — calls selectTokenEfficiencyRoute, selectContextWidth,
// selectModelForLayer, deriveLearningSignal internally
export function buildSupervisorRoutingDecision(input: {
  readonly taskId: string;
  readonly taskDescription: string;
  readonly layer: ModelPolicyLayer;
  readonly budgets: readonly SubscriptionSessionBudget[];
  readonly evalRecords: readonly EvalRecordSummary[];
}): SupervisorRoutingDecision

export function selectModelForLayer(
  layer: ModelPolicyLayer,
  providerStatuses: Readonly<Record<string, SubscriptionRateLimitState>>
): ReasoningProviderId

// New credentialed policy entry for GPT worker
// Add to credentialedAdvisoryProviderPolicies:
{
  id: "codex_gpt_worker",
  provider: "openai",
  tool: "codex",
  accessMode: "subscription_interactive",
  costGuard: "uses_owner_subscription_entitlement_not_api_credit",
  allowedUse: [
    "bounded implementation with handoff packet",
    "test generation", "security implementation",
    "business logic", "focused bugfix", "refactor within declared scope"
  ],
  forbiddenUse: [
    "architecture decisions", "governance approval",
    "orchestration planning", "self-approval",
    "scope expansion without supervisor handoff"
  ],
  requiredChecks: [
    "handoff_packet_received_before_start",
    "subscription_entitlement_confirmed_for_subscription_tools",
    "serial_task_delegation_required",
    "allowed_files_declared", "forbidden_actions_declared"
  ]
}
```

**New tests:**
```typescript
it("maps orchestrator layer to claude subscription", () => {
  expect(layerProviderMapping.orchestrator).toBe("anthropic_claude_subscription");
  expect(layerProviderMapping.bounded_coding).toBe("openai_gpt");
  expect(layerProviderMapping.memory_summarizer).toBe("gemini_cli");
});

it("SupervisorRoutingDecision has assignedTierId and learningSignal fields", () => {
  // type-level check — ensure the interface compiles with these fields
  const decision: SupervisorRoutingDecision = {
    taskId: "t1", layer: "bounded_coding",
    tokenEfficiencyProfile: "standard_compact",
    contextWidthSpec: contextWidthSpecs.small,
    taskLane: "bounded_coding_worker",
    assignedProvider: "openai_gpt",
    assignedTierId: undefined,
    subscriptionBudgetState: "available",
    fallbackProvider: "qwen_local",
    learningSignal: undefined,
    decisionReasoning: "test"
  };
  expect(decision.assignedTierId).toBeUndefined();
});

it("registers codex_gpt_worker as subscription_interactive", () => {
  const worker = credentialedAdvisoryProviderPolicies.find(p => p.id === "codex_gpt_worker");
  expect(worker?.accessMode).toBe("subscription_interactive");
  expect(worker?.forbiddenUse).toContain("architecture decisions");
  expect(worker?.requiredChecks).toContain("handoff_packet_received_before_start");
});
```

**Acceptance criteria:**
- All existing + new tests pass.
- `layerProviderMapping` covers all 8 `ModelPolicyLayer` members.
- `SupervisorRoutingDecision` has all fields: `assignedTierId`, `learningSignal`, `contextWidthSpec`.
- `buildSupervisorRoutingDecision()` is exported.
- `npm.cmd run typecheck` passes.

---

### TASK-13 — Learning Signal + Self-Correction Types

**Files to edit:** `src/data/delivery-system/modelOutputEvaluation.ts`  
**No-op check:** `grep -n "SupervisorLearningSignal\|WorkerOutputNormalization\|CorrectionLoopEntry\|EvalRecordSummary" src/data/delivery-system/modelOutputEvaluation.ts`

**Source restriction for `EvalRecordSummary`:**  
`EvalRecordSummary` instances are loaded **only** from `model-output-evals/records/`.
The caller (supervisor) is responsible for reading that directory and constructing
the summary array. `deriveLearningSignal()` must NOT attempt file I/O internally —
it accepts only a pre-built `readonly EvalRecordSummary[]`. This keeps the function
pure and testable without filesystem access. The path constant:
```typescript
export const EVAL_RECORDS_PATH = "model-output-evals/records/";
// Caller reads *.json files from this path, parses them, builds EvalRecordSummary[],
// then passes the array to deriveLearningSignal(). Function never touches the FS.
```

**Failing-test-first:**  
Add to `tests/delivery-system/model-output-evaluation-policy.test.ts`:
```typescript
it("returns no_data confidence when fewer than 2 records match", () => {
  const signal = deriveLearningSignal("bounded_coding", "openai", []);
  expect(signal.confidenceSource).toBe("no_data");
  expect(signal.recentFailureCount).toBe(0);
});

it("returns escalate after 3 iterations below threshold", () => {
  // WorkerOutputNormalization type-level test
  const loop: CorrectionLoopEntry = {
    taskId: "t1", handoffId: "hp-20260617-test",
    provider: "openai", iterationCount: 3, maxIterations: 3,
    lastScore: 55, failureLabels: ["format_contract"],
    correctionApplied: "added output schema reference",
    state: "retry_with_prompt_or_input_tuning"
  };
  const norm: WorkerOutputNormalization = {
    handoffId: "hp-20260617-test",
    verifiedFacts: [], assumptions: [], risks: [], openQuestions: [],
    evaluationScore: 55, qualityState: "retry_with_prompt_or_input_tuning",
    correctionLoopState: loop,
    nextAction: "escalate_model_route"   // 3 >= maxIterations
  };
  expect(norm.nextAction).toBe("escalate_model_route");
});
```

**Types to add:**

```typescript
// Add to modelOutputEvaluation.ts

export interface EvalRecordSummary {
  readonly taskType: string;
  readonly provider: ModelProviderFamily;
  readonly state: ModelOutputQualityState;
  readonly scoreAverage: number;
  readonly failureLabels: readonly string[];
  readonly rerunCount: number;
}

export interface SupervisorLearningSignal {
  readonly taskType: string;
  readonly provider: ModelProviderFamily;
  readonly recentFailureCount: number;
  readonly lastFailureLabels: readonly string[];
  readonly recommendedDelta:
    | "tighten_allowed_files"
    | "decompose_task"
    | "switch_to_qwen"
    | "no_change";
  readonly confidenceSource: "eval_records" | "single_observation" | "no_data";
}

export interface CorrectionLoopEntry {
  readonly taskId: string;
  readonly handoffId: string;      // NEW v2 — links to source handoff packet
  readonly provider: ModelProviderFamily;
  readonly iterationCount: number; // starts at 1
  readonly maxIterations: 3;       // hardcoded from repeatedFailureLimit: 3
  readonly lastScore: number | undefined;
  readonly failureLabels: readonly string[];
  readonly correctionApplied: string;  // what changed in the handoff packet
  readonly state: ModelOutputQualityState;
}

export interface WorkerOutputNormalization {
  readonly handoffId: string;      // must match source handoff packet
  readonly verifiedFacts: readonly string[];
  readonly assumptions: readonly string[];
  readonly risks: readonly string[];
  readonly openQuestions: readonly string[];
  readonly evaluationScore: number;
  readonly qualityState: ModelOutputQualityState;
  readonly correctionLoopState: CorrectionLoopEntry;
  readonly nextAction:
    | "accept"
    | "retry_with_correction"     // only when iterationCount < maxIterations
    | "escalate_model_route"      // when iterationCount >= maxIterations
    | "owner_decision"
    | "blocked";                  // when qualityState: "blocked" regardless of count
}

export function deriveLearningSignal(
  taskType: string,
  provider: ModelProviderFamily,
  records: readonly EvalRecordSummary[]
): SupervisorLearningSignal
```

**Logic invariants (test-enforced):**
- `nextAction: "retry_with_correction"` only when `iterationCount < maxIterations`.
- `nextAction: "escalate_model_route"` when `iterationCount >= maxIterations`.
- `nextAction: "blocked"` when `qualityState: "blocked"` regardless of iteration count.

**Acceptance criteria:**
- Existing `model-output-evaluation-policy.test.ts` tests pass (no regression).
- New `no_data` and escalation tests pass.
- `handoffId` is required in both `CorrectionLoopEntry` and `WorkerOutputNormalization`.
- `npm.cmd run typecheck` passes.

---

### TASK-14 — Context Width Selection (ContextWidthSpec Only)

**CRITICAL: `TokenBudgetClass` already has `"large"` at line 3 of `tokenEfficiency.ts`.**  
Do NOT add it again. This task ONLY adds `ContextWidthSpec` and `contextWidthSpecs`.

**Files to edit:** `src/data/delivery-system/tokenEfficiency.ts`  
**No-op check:** `grep -n "ContextWidthSpec\|contextWidthSpecs\|maxFilesInPacket\|selectContextWidth" src/data/delivery-system/tokenEfficiency.ts`

**Failing-test-first:**  
Add to `tests/delivery-system/token-efficiency-policy.test.ts`:
```typescript
it("does not double-add large to TokenBudgetClass", () => {
  // Type-level check: ensure the union hasn't grown
  const classes: TokenBudgetClass[] = ["tiny", "small", "medium", "large"];
  expect(classes).toHaveLength(4);
});
it("maps large budget exclusively to gemini_cli preferred provider", () => {
  expect(contextWidthSpecs.large.preferredProviderForWidth).toBe("gemini_cli");
  expect(contextWidthSpecs.tiny.maxFilesInPacket).toBe(3);
});
```

```typescript
// Add to tokenEfficiency.ts — do NOT touch TokenBudgetClass

export interface ContextWidthSpec {
  readonly budgetClass: TokenBudgetClass;
  readonly maxFilesInPacket: number;
  readonly maxContextLines: number;
  readonly requiredSections: readonly string[];
  readonly optionalSections: readonly string[];
  readonly excludedSections: readonly string[];
  readonly preferredProviderForWidth:
    | "any_local"
    | "openai_gpt"
    | "gemini_cli"
    | "anthropic_claude_subscription";
}

export const contextWidthSpecs: Record<TokenBudgetClass, ContextWidthSpec> = {
  tiny: {
    budgetClass: "tiny",
    maxFilesInPacket: 3, maxContextLines: 200,
    requiredSections: ["goal", "allowed_files", "forbidden_actions", "expected_output"],
    optionalSections: ["verified_facts", "stop_conditions"],
    excludedSections: ["full_mesh_packet", "architecture_records", "work_log",
                       "dependency_records", "skill_registry"],
    preferredProviderForWidth: "any_local"
  },
  small: {
    budgetClass: "small",
    maxFilesInPacket: 8, maxContextLines: 600,
    requiredSections: ["goal", "scope", "allowed_files", "forbidden_actions",
                       "verified_facts", "expected_output", "required_checks"],
    optionalSections: ["risks", "reuse_check", "open_questions"],
    excludedSections: ["full_mesh_packet", "full_work_log"],
    preferredProviderForWidth: "openai_gpt"
  },
  medium: {
    budgetClass: "medium",
    maxFilesInPacket: 20, maxContextLines: 2000,
    requiredSections: ["goal", "scope", "allowed_files", "forbidden_actions",
                       "verified_facts", "assumptions", "risks", "expected_output",
                       "required_checks", "stop_conditions", "reuse_check", "context_budget"],
    optionalSections: ["architecture_records", "dependency_records",
                       "learning_signal", "skill_registry_relevant"],
    excludedSections: [],
    preferredProviderForWidth: "openai_gpt"
  },
  large: {
    budgetClass: "large",
    maxFilesInPacket: 60, maxContextLines: 8000,
    requiredSections: ["goal", "scope", "allowed_files", "forbidden_actions",
                       "full_mesh_packet", "verified_facts", "architecture_records",
                       "risks", "expected_output", "required_checks"],
    optionalSections: ["full_work_log", "dependency_records"],
    excludedSections: [],
    preferredProviderForWidth: "gemini_cli"  // Gemini only at large budget
  }
};

export function selectContextWidth(
  profile: TokenEfficiencyProfileId,
  taskComplexitySignals: readonly string[]
): ContextWidthSpec
```

**Acceptance criteria:**
- `TokenBudgetClass` is unchanged (still exactly 4 members: `"tiny" | "small" | "medium" | "large"`).
- Existing `token-efficiency-policy.test.ts` tests pass (no regression).
- New tests pass.
- `contextWidthSpecs.large.preferredProviderForWidth === "gemini_cli"`.
- `npm.cmd run typecheck` passes.

---

### TASK-15 — Skill Registry Types + Initial File

**Files to edit:** `src/data/delivery-system/toolInventory.ts`  
**Files to create:** `docs/autopilot/skill-registry.json`

**No-op check:**  
`grep -n "SkillReplacementCandidate\|SkillUsageRecord\|SkillCapabilitySpec" src/data/delivery-system/toolInventory.ts`

**Types to add:**

```typescript
// Add to toolInventory.ts

export type SkillSource =
  | "platform_plugin"
  | "platform_skill"
  | "custom_local_skill";

export interface SkillCapabilitySpec {
  readonly taskCategories: readonly string[];
  readonly tokenCostClass: "high" | "medium" | "low" | "free";
  readonly requiresExternalAccess: boolean;
  readonly projectAware: boolean;      // knows about mesh / AGENTS.md?
  readonly customizable: boolean;
}

export interface SkillUsageRecord {
  readonly skillId: string;
  readonly lastUsedAt: string;
  readonly sessionUseCount: number;
  readonly evalScoreAverage: number | undefined;
  readonly commonFailureLabels: readonly string[];
}

export interface SkillReplacementCandidate {
  readonly existingSkillId: string;
  readonly candidateId: string;
  readonly candidateSource: "custom_local_skill";
  readonly candidatePromptPath: string | undefined;  // in prompt-library/
  readonly expectedBenefits: readonly string[];
  readonly evaluationCriteria: readonly string[];
  readonly status: "proposed" | "in_development" | "evaluating" | "adopted" | "rejected";
  readonly statusReason: string | undefined;
  // State machine: proposed → in_development → evaluating → adopted | rejected
}
```

`skill-registry.json` initial content:
```json
{
  "lastUpdatedAt": "2026-06-17",
  "schemaVersion": "v1",
  "skills": [],
  "usageRecords": [],
  "replacementCandidates": []
}
```

**Supervisor use:**  
At startup: load `skill-registry.json`, filter `replacementCandidates` where
`status: "adopted"`. For tasks in those categories, prefer `custom_local_skill`
over platform plugin. Write eval record after each use to compare.

**Acceptance criteria:**
- Existing `tool-inventory.test.ts` tests pass (no regression).
- `skill-registry.json` is valid JSON with all 5 keys including `schemaVersion`.
- `SkillReplacementCandidate.status` follows the documented one-way state machine.
- `npm.cmd run typecheck` passes.

---

### TASK-16 — Dependency Freshness + Reuse Gate Module

**Files to create:** `src/data/delivery-system/dependencyFreshness.ts`  
**Files to create:** `tests/delivery-system/dependency-freshness.test.ts`

**No-op check:**  
`grep -rn "DependencyCheckRecord\|ReuseCheckResult\|dependencyFreshnessPolicy\|dependencyFreshness" src/`

**Failing-test-first:**
```typescript
it("autoUpdateAllowed is false (not just falsy)", () => {
  expect(dependencyFreshnessPolicy.autoUpdateAllowed).toBe(false);
  expect(typeof dependencyFreshnessPolicy.autoUpdateAllowed).toBe("boolean");
});
it("checkCommands uses npm.cmd not npm", () => {
  dependencyFreshnessPolicy.checkCommands.forEach(cmd => {
    expect(cmd).toMatch(/^npm\.cmd /);
  });
});
```

```typescript
// src/data/delivery-system/dependencyFreshness.ts

export type DependencyFreshnessState =
  | "current"
  | "minor_update_available"
  | "major_update_available"
  | "deprecated"
  | "security_vulnerability"
  | "unknown";

export type UpdateDecision =
  | "update_when_convenient"
  | "research_needed"           // major version — check breaking changes first
  | "urgent"                    // security vulnerability
  | "hold"
  | "pending";

export interface DependencyCheckRecord {
  readonly checkedAt: string;
  readonly packageName: string;
  readonly installedVersion: string;
  readonly latestVersion: string | undefined;
  readonly freshnessState: DependencyFreshnessState;
  readonly newFeaturesRelevantToProject: readonly string[];  // only if supervisor confirms link
  readonly securityAdvisory: string | undefined;
  readonly updateDecision: UpdateDecision;
  readonly ownerApprovalRequired: boolean;  // always true for major updates
}

export type ReuseDecision = "implement_new" | "reuse_existing" | "extend_existing";

export interface ReuseCheckResult {
  readonly searchedPatterns: readonly string[];
  readonly existingMatches: readonly string[];  // file:line references
  readonly packageMatches: readonly string[];
  readonly decision: ReuseDecision;
  readonly reuseTarget: string | undefined;
  readonly tokenSavingEstimate: "high" | "medium" | "low" | "none";
}

export const dependencyFreshnessPolicy = {
  checkCommands: [
    "npm.cmd outdated --json",   // Windows: npm.cmd not npm
    "npm.cmd audit --json"
  ],
  autoUpdateAllowed: false as const,   // literal false — never automated
  majorUpdateRequiresOwner: true,
  checkBeforeTaskTypes: [
    "architecture_review",
    "new_feature",
    "major_refactor",
    "security_audit"
  ],
  stopConditions: [
    "major_version_bump_without_owner_decision",
    "security_vulnerability_ignored",
    "new_code_written_when_library_update_would_provide_it"
  ]
} as const;
```

**Acceptance criteria:**
- `dependencyFreshnessPolicy.autoUpdateAllowed === false` (literal, not just falsy).
- All `checkCommands` start with `"npm.cmd "` (not `"npm "`).
- `ReuseCheckResult` has `tokenSavingEstimate` field.
- `DependencyCheckRecord.newFeaturesRelevantToProject` is `readonly string[]`.
- `npm.cmd run typecheck` passes.

---

### TASK-17 — Mesh Nodes (4 New)

**Files to create:**
- `mesh/nodes/subscription_worker_boundary.yaml`
- `mesh/nodes/skill_registry_policy.yaml`
- `mesh/nodes/reuse_gate.yaml`
- `mesh/nodes/supervisor_execution_loop.yaml`

**Files to edit:** `mesh/edges.yaml` (append 4 edges)

**No-op check:**  
`ls mesh/nodes/ | grep -E "subscription_worker|skill_registry|reuse_gate|supervisor_execution"`  
For each file found, read it before adding — do not duplicate nodes.

Each YAML node requires these keys: `id`, `type`, `name`, `question`, `why`,
`signals[]`, `related_agents[]`, `related_files[]`, `required_checks[]`,
`stop_conditions[]`, `must_not_assume[]`, `objective[]`, `failure_modes[]`.

**`failure_modes` required content (per node):**

| Node | Failure modes |
|---|---|
| `subscription_worker_boundary` | `worker_lock_already_held`, `parallel_session_detected`, `tier_exhausted_no_backoff`, `handoff_packet_missing_before_session_open` |
| `skill_registry_policy` | `platform_plugin_used_when_adopted_replacement_exists`, `skill_registry_file_missing_at_startup`, `replacement_status_skipped_proposed_to_adopted` |
| `reuse_gate` | `implementation_started_without_rg_search`, `duplicate_code_written_when_existing_match_found`, `package_not_checked_before_implementing_utility` |
| `supervisor_execution_loop` | `correction_loop_exceeded_without_escalation`, `worker_output_not_normalized_before_next_step`, `gemini_used_without_budget_check`, `eval_record_not_written_after_output` |

**Node signal keywords (for each node):**

| Node | Key signals |
|---|---|
| `subscription_worker_boundary` | "subscription", "worker session", "rate limit", "parallel", "serial", "quota", "gemini tier", "tier switch", "flash", "pro tier" |
| `skill_registry_policy` | "plugin", "skill", "replacement", "tool inventory", "custom skill", "platform skill" |
| `reuse_gate` | "implement", "new function", "new component", "new utility", "add feature", "write code" |
| `supervisor_execution_loop` | "supervisor", "orchestrator", "delegate", "handoff", "worker output", "correction", "eval", "routing decision" |

**Edges to add to `mesh/edges.yaml`:**

```yaml
- from: supervisor_execution_loop
  to: subscription_worker_boundary
  relation: requires
  weight: 0.95
  why: "Every supervisor delegation must go through subscription worker boundary checks."

- from: supervisor_execution_loop
  to: reuse_gate
  relation: requires
  weight: 0.88
  why: "Reuse check is mandatory before any bounded_coding task delegation."

- from: supervisor_execution_loop
  to: skill_registry_policy
  relation: informs
  weight: 0.75
  why: "Supervisor checks skill registry before activating platform plugins."

- from: subscription_worker_boundary
  to: model_spend_policy
  relation: depends_on
  weight: 0.90
  why: "Subscription worker boundary inherits all model spend guardrails."
```

**Acceptance criteria:**
- `npm.cmd run mesh:check` passes with all 4 new nodes valid.
- Each node has all required YAML keys.
- All 4 edges are in `mesh/edges.yaml`.
- Edge targets (`model_spend_policy`) exist before edges are added — check with `grep -n "id: model_spend_policy" mesh/nodes/*.yaml`.

---

### TASK-18 — Adoption Record: Finalize

**Prerequisite:** Task 08 adoption record template exists; manual spike completed.

**Files to edit:** `docs/autopilot/adoption-record-template.md` (if gaps found)  
**Files to create:** `docs/autopilot/adoption-record.schema.json`  
**Files to create:** `docs/autopilot/adoption-records/2026-0617-claude-opus-orchestrator.md`

**Schema:**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://autopilot.local/adoption-record.schema.json",
  "title": "Adoption Record",
  "type": "object",
  "required": ["decision_id", "date", "what_was_proposed", "decision",
               "who_decided", "reason", "files_changed", "evidence"],
  "properties": {
    "decision_id":       { "type": "string" },
    "date":              { "type": "string", "format": "date" },
    "what_was_proposed": { "type": "string" },
    "decision":          { "type": "string", "enum": ["adopted", "rejected", "deferred"] },
    "who_decided":       { "type": "string" },
    "reason":            { "type": "string" },
    "files_changed":     { "type": "array", "items": { "type": "string" } },
    "evidence":          { "type": "array", "items": { "type": "string" } },
    "supersedes":        { "type": "string" }
  }
}
```

**First adoption record** (`2026-0617-claude-opus-orchestrator.md`):  
Document the decision to use Claude Opus as primary supervisor (replacing Codex as
orchestrator). Source: this architecture plan. Decision: adopted. Evidence: this plan.

**Acceptance criteria:**
- Schema is valid JSON Schema draft 2020-12.
- First adoption record passes schema validation.
- `docs/autopilot/adoption-records/` is committed (with `.gitkeep` if no records yet).

---

### TASK-19 — Full Verification Pass

**No new logic.** Run the complete verification suite:

```
npm.cmd run mesh:check
npm.cmd run prompt:validate
npm.cmd run model-output:validate
npm.cmd run pdos:validate
npm.cmd run contracts:validate
npm.cmd run diff:check
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Or the single composite script: `npm.cmd run verify`

**Acceptance criteria:** All commands exit 0.  
**If any fail:** fix in the task that owns the broken module; do not patch here.

---

## Revised Task Dependency Graph

```
PART 1 — CORE POC (serial entry gate)

TASK-01 (schemas + fixtures)   — no deps
TASK-02 (completion matrix)    — no deps (TASK-01 shapes fixture format)
TASK-03 (alerts types)         — no deps
TASK-04 (session state)        — depends on TASK-03 (SupervisorAlert type)
        ↓
TASK-05 (hook bridge)          — depends on TASK-03 + TASK-04
TASK-06 (handoff template)     — depends on TASK-02 (HandoffSection enum names)
        ↓
TASK-07 (prompts POC)          — depends on TASK-01 + TASK-06
TASK-08 (manual spike)         — depends on TASK-01 through TASK-07 complete

                ← POC COMPLETION GATE — spike must pass ←

PART 2 — ADVANCED (can parallelize within phase constraints)

TASK-09 (subscription budget)  — no deps
TASK-10 (fallback chains)      — depends on TASK-09 (ProviderTierSpec, SubscriptionSessionBudget)
TASK-11 (modelPolicy fix)      — no deps (read tests first)
TASK-12 (layer mapping + SRD)  — depends on TASK-09 (budget types) + TASK-11 (tests green)
                                  references TASK-14 (ContextWidthSpec) — use placeholder if needed
TASK-13 (learning types)       — depends on TASK-02 (HandoffPacket, handoffId field)
TASK-14 (context width)        — no deps (tokenEfficiency standalone)
TASK-15 (skill registry)       — no deps
TASK-16 (dep freshness)        — no deps
        ↓
TASK-17 (mesh nodes)           — depends on TASK-09–16 (accurate signal keywords)
TASK-18 (adoption record)      — depends on TASK-08 (template); can run anytime after
        ↓
TASK-19 (full verify)          — depends on all above
```

**Parallelism opportunities in Part 2:**
- Tasks 09, 11, 13, 14, 15, 16 have no inter-dependencies → can run in parallel Codex sessions.
- Task 10 must follow Task 09 (needs `ProviderTierSpec`).
- Task 12 must follow Task 11 (tests must be green first).
- Task 17 must follow all others (accurate signals depend on final type names).

---

## No-Op / Migration Check Protocol (every task)

Before any edit or creation:

1. Run the no-op check command listed in the task.
2. If target symbol or file already exists: read it, diff against spec.
3. If matches spec: mark task done, do not re-create.
4. If partially matches: extend, do not overwrite.
5. If conflicts: surface the conflict as a `NEEDS_DECISION` comment; do not silently overwrite.

---

## Failing-Test-First Protocol (every task with a `.test.ts`)

1. Write the test file with at least one failing assertion.
2. Run `npm.cmd test <test-file>` — confirm it fails with a specific error.
3. Implement the minimum code to make the test pass.
4. Run `npm.cmd run typecheck` — confirm no type errors.
5. Only then add additional features or tests.

---

## Gemini CLI Verification Protocol (Task 09)

Before writing any Gemini CLI model name as a string constant:

1. Open a terminal and run: `gemini --help` or `gemini --list-models` (if available).
2. Alternatively, check the official CLI reference for model identifiers.
3. Update `geminiKnownTiers` with `verifiedLocally: true` only for confirmed names.
4. Unconfirmed tiers stay with `cliAccessPath: undefined` and `verifiedLocally: false`.
5. Never hardcode a model name based on documentation alone — always verify locally first.

---

## Verified Repo Facts (audited 2026-06-17)

These facts were verified against the real repository before writing this plan.
Do not treat this list as authoritative — re-verify with `grep` before implementing.

| Claim | Verified |
|---|---|
| `TokenBudgetClass` already has `"large"` at `tokenEfficiency.ts:3` | ✓ confirmed |
| `ContextWidthSpec` does NOT exist in `tokenEfficiency.ts` | ✓ confirmed (add it) |
| `.codex/hooks/autopilot-hook.mjs` already exists | ✓ confirmed (extend, not new) |
| `.codex/hooks.json` already exists | ✓ confirmed (do not touch) |
| `tests/delivery-system/model-policy.test.ts` has substantive tests | ✓ confirmed |
| `worker-output.schema.json` does NOT exist | ✓ confirmed (create it) |
| `check-completion-matrix.ts` does NOT exist | ✓ confirmed (create it) |
| Gemini CLI uses `-m auto` not `--flash` | ✓ confirmed from run logs |
| `docs/autopilot/session-state/` does NOT exist | ✓ confirmed (create it) |
| `src/data/delivery-system/sessionState.ts` does NOT exist | ✓ confirmed (create it) |
| `npm.cmd run verify` script exists in `package.json:30` | ✓ confirmed |

---

*End of plan. 19 Codex tasks, 2 phases (Core POC + Advanced Automation).*  
*All v1 components present: Groups A–E, 11 capabilities, Implementation Roadmap.*
