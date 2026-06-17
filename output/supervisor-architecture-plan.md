# Autopilot Supervisor Architecture Plan

**Version:** 0.1.0  
**Date:** 2026-06-17  
**Status:** Design — no implementation yet  
**Audience:** GPT analysis + brainstorming; Codex task decomposition  
**Repo root:** `C:\Programování\Codex`

---

## Executive Summary

This document specifies the complete architecture for replacing Codex as the primary
supervisor/orchestrator with Claude Opus (subscription, not API). The plan covers:

1. **Six supervisor capabilities** (learning, self-correction, rate-limit tracking,
   model selection, fallbacks, alerts) derived from an audit of what already exists
   in the repo and what is missing.
2. **Five new requirements** (session-state persistence, subscription tier switching,
   plugin/skill registry, dependency freshness + reuse-first gate, context-width
   selection).

The central finding: almost all *policy layer* exists (TypeScript const objects, YAML
mesh nodes, operating-model docs). What is missing is the *execution layer* — typed
interfaces that give Opus structured data to act on, a session-state contract Opus
can actually read, and a supervisor prompt that calls everything in the right order.

**Role assignments (fixed, non-negotiable):**

| Role | Provider | Access |
|---|---|---|
| Orchestrator / Architect / Reviewer | Claude Opus | `subscription_interactive` (Claude Code) |
| Implementation / Tests / Security / Business logic | GPT / Codex | `subscription_interactive` (OpenAI sub) |
| Brainstorming / Long-context analysis | Gemini | `subscription_cli` (Google sub) |
| Fast local fallback | Qwen local | `local` (Ollama, offline) |

**Subscription constraint:** no API keys, no per-token billing. All coordination
must be serial (one active worker at a time) and rate-limit-aware.

---

## Scope & Hard Constraints

- Do **not** add autonomous execution, background queues, or remote mutation without
  owner approval.
- Do **not** treat model output as source of truth.
- Do **not** run Gemini as default worker or automatic fallback for GPT.
- Claude Opus is orchestrator-only; it does **not** implement features.
- Every worker session starts from a written handoff packet.
- `npm.cmd run verify` must pass after every change.

---

## Component Map

```
GROUP A — Learning & Evaluation
  A1  Learning loop read-back          modelOutputEvaluation.ts (extend)
  A2  Self-correction loop             modelOutputEvaluation.ts (extend)

GROUP B — Provider Management
  B1  Session state contract           sessionState.ts (new) + session-state/ folder
  B2  Subscription budget + tiers      subscriptionBudget.ts (new)
  B3  Fallback chains                  fallbackChains.ts (new)
  B4  Supervisor alerts                supervisorAlerts.ts (new)

GROUP C — Routing & Selection
  C1  Layer → provider mapping         modelPolicy.ts (extend)
  C2  Context width selection          tokenEfficiency.ts (extend)
  C3  SupervisorRoutingDecision        modelPolicy.ts (new composite type)

GROUP D — Worker Tooling
  D1  Skill / plugin registry          toolInventory.ts (extend) + skill-registry.json
  D2  Dependency freshness + reuse     dependencyFreshness.ts (new) + reuse_gate.yaml

GROUP E — Infrastructure
  E1  modelPolicy.ts fixes             GPT subscription mode + credentialed policy entry
  E2  Handoff packet template          agent-handoff-packet-template.md (extend)
  E3  Mesh nodes (4 new)              subscription_worker_boundary + skill_registry_policy
                                       + reuse_gate + supervisor_execution_loop
  E4  Hook bridge                      autopilot-hook.mjs (extend, bridge to session-state)
  E5  Supervisor prompt                prompt-library/06-supervisor/claude-opus-supervisor.md
  E6  Worker prompt                    prompt-library/01-gpt/codex-bounded-worker.md
```

---

## Group A — Learning & Evaluation

### A1 — Learning Loop Read-Back

**File:** `src/data/delivery-system/modelOutputEvaluation.ts`

**Problem now:**  
`selectModelOutputEvaluationRoute()` *writes* and *scores* outputs but never *reads
back* existing eval records. Seven real records exist under `model-output-evals/records/`
but nothing extracts patterns from them to influence the next handoff packet. Learning
stops at the record file; it never reaches the next worker's instruction.

**What exists:**  
`ModelOutputEvaluationPhase`, `ModelOutputQualityState`, `promptTuningActions()`
per provider, acceptance threshold = 80, retry = 60, `repeatedFailureLimit` = 3.
Schema at `model-output-evals/model-output-eval-record.schema.json`.

**What is missing:**

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
  readonly recommendedDelta: string;
  // "tighten_allowed_files" | "decompose_task" | "switch_to_qwen" | "no_change"
  readonly confidenceSource: "eval_records" | "single_observation" | "no_data";
}

export function deriveLearningSignal(
  taskType: string,
  provider: ModelProviderFamily,
  records: readonly EvalRecordSummary[]
): SupervisorLearningSignal
```

**Acceptance criteria:**
- `deriveLearningSignal()` reads from `EvalRecordSummary[]` (caller loads from disk).
- Returns `recommendedDelta` that maps to a concrete handoff packet adjustment.
- Returns `confidenceSource: "no_data"` when fewer than 2 records match.
- Unit test: given 3 records with `state: "retry_with_prompt_or_input_tuning"` for
  `taskType: "bounded_coding"` + `provider: "openai"`, output `recentFailureCount: 3`
  and `recommendedDelta !== "no_change"`.

---

### A2 — Self-Correction Loop

**File:** `src/data/delivery-system/modelOutputEvaluation.ts`

**Problem now:**  
The correction loop concept exists in `nextActionsForState()` as string arrays, but
there is no typed contract. Without it Opus has no structured way to track iteration
count, know when to stop, or build a corrected handoff packet from a failed one.
The `agent-handoff-packet-template.md` has no "previous iteration" field.

**What is missing:**

```typescript
// Add to modelOutputEvaluation.ts

export interface CorrectionLoopEntry {
  readonly taskId: string;
  readonly provider: ModelProviderFamily;
  readonly iterationCount: number;           // starts at 1
  readonly maxIterations: 3;                 // hardcoded from repeatedFailureLimit
  readonly lastScore: number | undefined;
  readonly failureLabels: readonly string[];
  readonly correctionApplied: string;        // what changed in handoff packet
  readonly state: ModelOutputQualityState;
}

export interface WorkerOutputNormalization {
  readonly handoffId: string;
  readonly verifiedFacts: readonly string[];
  readonly assumptions: readonly string[];
  readonly risks: readonly string[];
  readonly openQuestions: readonly string[];
  readonly evaluationScore: number;
  readonly qualityState: ModelOutputQualityState;
  readonly correctionLoopState: CorrectionLoopEntry;
  readonly nextAction:
    | "accept"
    | "retry_with_correction"
    | "escalate_model_route"
    | "owner_decision"
    | "blocked";
}
```

**Acceptance criteria:**
- `nextAction: "retry_with_correction"` only when `iterationCount < maxIterations`.
- `nextAction: "escalate_model_route"` when `iterationCount >= maxIterations`.
- `nextAction: "blocked"` when `qualityState: "blocked"` regardless of count.
- Unit test: 3 iterations with score < 60 → `nextAction: "escalate_model_route"`.

---

## Group B — Provider Management

### B1 — Session State Contract

**Files (new):**
- `src/data/delivery-system/sessionState.ts`
- `docs/autopilot/session-state/` (gitignored folder — add `.gitignore` inside)

**Problem now:**  
Codex hooks write lifecycle events to `.codex/state/events.jsonl` and
`investigation-queue.jsonl`. These are Codex-specific paths, not read by Opus
automatically. `continuity.json` is empty. There is no unified session manifest
that Opus can read at startup to know: pending alerts, provider budget states,
active correction loops.

**What exists:**  
`events.jsonl` has good structure: `{version, timestamp, event, scope, session,
turn, tool, flags, result, input_fingerprint}`. The data is valuable but inaccessible
to Opus.

**What is missing:**

```typescript
// New file: src/data/delivery-system/sessionState.ts

export interface SessionStateManifest {
  readonly schemaVersion: "v1";
  readonly claudeSessionStartedAt: string;     // ISO timestamp
  readonly lastUpdatedAt: string;
  readonly activeTaskId: string | undefined;
  readonly workflowState: WorkflowState;       // from workflows.ts
  readonly investigationQueueDepth: number;    // count only, from .codex/state/
  readonly hookEventsThisSession: number;
}

export interface SessionStateFile {
  readonly manifest: SessionStateManifest;
  readonly providerBudgets: readonly SubscriptionSessionBudget[];  // from B2
  readonly pendingAlerts: readonly SupervisorAlert[];              // from B4
  readonly activeCorrectionLoops: readonly CorrectionLoopEntry[]; // from A2
}
```

**Folder structure (gitignored):**

```
docs/autopilot/session-state/
  .gitignore          ← *.json, *.jsonl
  session.json        ← SessionStateFile (main, Opus reads at startup)
  alerts.jsonl        ← append-only SupervisorAlert stream
  budgets.json        ← SubscriptionSessionBudget[] per provider
  deps-check.json     ← DependencyCheckRecord[] (from D2)
```

**Opus startup behaviour:**
1. Check if `docs/autopilot/session-state/session.json` exists.
2. If yes: parse `pendingAlerts` — if any `severity: "blocker"`, resolve before planning.
3. Parse `providerBudgets` — know which providers are available before routing.
4. If file missing: initialize empty `SessionStateFile`, write it.

**Acceptance criteria:**
- `session.json` is valid JSON matching `SessionStateFile` shape.
- Opus startup gate reads the file before calling MCP.
- If `pendingAlerts` contains a blocker, first action is alert review (not planning).
- File is gitignored; no session data reaches version control.

---

### B2 — Subscription Budget + Tier Switching

**File (new):** `src/data/delivery-system/subscriptionBudget.ts`

**Problem now:**  
`modelSpend.ts` has `google_ai_subscription_entitlement_confirmed_for_gemini_cli` as
a check and `gemini_api_key_or_paid_api_path_requested_without_owner_decision` as a
stop condition, but Gemini is modeled as a single provider with no tier distinction.
When Gemini hits a rate limit the only defined behaviour is "stop". In practice,
`gemini -m auto` and `gemini -m gemini-2.5-flash` have different quotas. No mechanism
exists to try the Flash tier before giving up.

Run log evidence: `v3-prompt-pack.md` documents that hardcoded `gemini-3.1-pro` fails
with `ModelNotFoundError`; run logs show `gemini -m auto --skip-trust --approval-mode plan`
as the standard access path; quota retry warnings were observed in session.

**What is missing:**

```typescript
// New file: src/data/delivery-system/subscriptionBudget.ts

export type SubscriptionRateLimitState =
  | "available"
  | "degraded"       // approaching limit — restrict to critical tasks
  | "rate_limited"   // hit limit for this tier
  | "unknown";

export interface ProviderTierSpec {
  readonly tierId: string;
  readonly displayName: string;
  readonly cliAccessPath: string | undefined;   // full CLI command or undefined
  readonly estimatedQuotaClass: "high" | "medium" | "low" | "unknown";
  readonly subscriptionRequired: boolean;
  readonly notes: string | undefined;
}

export interface SubscriptionSessionBudget {
  readonly provider: ReasoningProviderId;
  readonly activeTierId: string;
  readonly activeTierRateLimitState: SubscriptionRateLimitState;
  readonly rateLimitHitAt: string | undefined;
  readonly availableTiers: readonly ProviderTierSpec[];  // other tiers to try
  readonly exhaustedTierIds: readonly string[];          // already failed
  readonly sessionTaskCount: number;
  readonly lastSuccessfulTaskAt: string | undefined;
  readonly notes: string | undefined;
}

// Known Gemini tiers — from run log evidence
export const geminiKnownTiers: readonly ProviderTierSpec[] = [
  {
    tierId: "gemini_auto",
    displayName: "Gemini Auto (subscription)",
    cliAccessPath: "gemini -m auto --skip-trust --approval-mode plan",
    estimatedQuotaClass: "medium",
    subscriptionRequired: true,
    notes: "Default path used in run logs"
  },
  {
    tierId: "gemini_flash",
    displayName: "Gemini 2.5 Flash",
    cliAccessPath: "gemini -m gemini-2.5-flash --skip-trust --approval-mode plan",
    estimatedQuotaClass: "high",
    subscriptionRequired: false,
    notes: "Higher quota than auto/pro; lower capability — suitable for brainstorming"
  },
  {
    tierId: "gemini_pro",
    displayName: "Gemini 2.5 Pro",
    cliAccessPath: "gemini -m gemini-2.5-pro --skip-trust --approval-mode plan",
    estimatedQuotaClass: "low",
    subscriptionRequired: true,
    notes: "Highest capability, lowest quota"
  }
];
```

**Tier switching logic (Opus decision, not automated):**

```
When gemini_auto is rate_limited:
  1. Check availableTiers where tierId NOT IN exhaustedTierIds
  2. Select tier with estimatedQuotaClass: "high" (gemini_flash)
  3. Update activeTierId in budgets.json
  4. Log to alerts.jsonl: AlertTrigger.provider_tier_switched

When all Gemini tiers exhausted:
  → state = blocked; create SupervisorAlert(gemini_session_exhausted)
  → do NOT substitute Gemini with GPT or any other provider
  → wait or continue without Gemini analysis
```

**Acceptance criteria:**
- `SubscriptionSessionBudget` shape is valid TypeScript with no API-credit fields.
- `geminiKnownTiers` has at least 2 entries with distinct `estimatedQuotaClass`.
- Tier switch is a supervisor decision documented in `session.json`, not automatic.
- Stop condition `gemini_used_as_default_worker` added to mesh `reasoning_strategy.yaml`.

---

### B3 — Fallback Chains

**File (new):** `src/data/delivery-system/fallbackChains.ts`

**Problem now:**  
Fallbacks are described as negative stop conditions ("if X fails → stop") throughout
`modelSpend.ts`, `modelPolicy.ts`, and YAML nodes. There is no positive routing rule
("if X fails → try Y"). No `FallbackChain` type exists. For GPT rate limit there is
no documented path to Qwen local.

**What is missing:**

```typescript
// New file: src/data/delivery-system/fallbackChains.ts

export type FallbackTrigger =
  | "rate_limited"
  | "provider_unavailable"
  | "output_quality_below_threshold"
  | "repeated_failure"
  | "all_tiers_exhausted";

export interface FallbackChainStep {
  readonly trigger: FallbackTrigger;
  readonly fromProvider: ReasoningProviderId;
  readonly fromTierId: string | undefined;     // undefined = any tier
  readonly toProvider: ReasoningProviderId | "owner_decision" | "blocked";
  readonly toTierId: string | undefined;
  readonly condition: string;                  // human-readable condition
  readonly requiresCheckpoint: boolean;
  readonly requiresOwnerApproval: boolean;
}

export const subscriptionFallbackChains: readonly FallbackChainStep[] = [
  // Gemini: try Flash before blocked
  {
    trigger: "rate_limited",
    fromProvider: "gemini_cli", fromTierId: "gemini_auto",
    toProvider: "gemini_cli",   toTierId: "gemini_flash",
    condition: "gemini_auto rate limited — Flash tier has higher quota",
    requiresCheckpoint: false, requiresOwnerApproval: false
  },
  {
    trigger: "all_tiers_exhausted",
    fromProvider: "gemini_cli", fromTierId: undefined,
    toProvider: "blocked",      toTierId: undefined,
    condition: "All Gemini tiers exhausted — pause only, no provider substitution",
    requiresCheckpoint: false, requiresOwnerApproval: false
  },
  // GPT: local fallback for simple tasks
  {
    trigger: "rate_limited",
    fromProvider: "openai_gpt", fromTierId: undefined,
    toProvider: "qwen_local",   toTierId: undefined,
    condition: "task fits local scope (bounded_coding, micro_worker, test_generation)",
    requiresCheckpoint: true, requiresOwnerApproval: false
  },
  {
    trigger: "rate_limited",
    fromProvider: "openai_gpt", fromTierId: undefined,
    toProvider: "owner_decision", toTierId: undefined,
    condition: "task requires GPT (security, structured output, business logic)",
    requiresCheckpoint: true, requiresOwnerApproval: true
  },
  // Opus: no fallback
  {
    trigger: "provider_unavailable",
    fromProvider: "anthropic_claude_subscription", fromTierId: undefined,
    toProvider: "owner_decision", toTierId: undefined,
    condition: "Claude unavailable — orchestration cannot continue",
    requiresCheckpoint: true, requiresOwnerApproval: true
  }
];

export function resolveFallback(
  trigger: FallbackTrigger,
  fromProvider: ReasoningProviderId,
  budget: SubscriptionSessionBudget
): FallbackChainStep | undefined
```

**Acceptance criteria:**
- `resolveFallback()` returns the first matching step from `subscriptionFallbackChains`.
- Gemini → GPT substitution is never returned (no such step exists).
- Unit test: `resolveFallback("rate_limited", "gemini_cli", budget_with_flash_available)`
  returns `toProvider: "gemini_cli"` and `toTierId: "gemini_flash"`.

---

### B4 — Supervisor Alerts

**File (new):** `src/data/delivery-system/supervisorAlerts.ts`

**Problem now:**  
`.codex/state/investigation-queue.jsonl` captures PostToolUse failures but is
inaccessible to Opus. `ledgers.ts` has `IssueLedgerEntry` for post-hoc records.
No typed `SupervisorAlert` exists for real-time notification to the supervisor.
No loop-detection counter.

**What is missing:**

```typescript
// New file: src/data/delivery-system/supervisorAlerts.ts

export type AlertSeverity = "info" | "warning" | "blocker";

export type AlertTrigger =
  | "provider_rate_limited"
  | "provider_tier_switched"
  | "provider_unavailable"
  | "correction_loop_exceeded"     // iterationCount >= maxIterations
  | "stuck_workflow_state"         // same WorkflowState for N tasks in a row
  | "eval_score_below_threshold"
  | "missing_owner_decision"
  | "gemini_session_exhausted"
  | "reuse_check_skipped"
  | "skill_replacement_available"; // adopted replacement ignored

export interface SupervisorAlert {
  readonly id: string;                          // slug, e.g. "alert-gemini-exhausted-01"
  readonly trigger: AlertTrigger;
  readonly severity: AlertSeverity;
  readonly provider: ReasoningProviderId | undefined;
  readonly context: string;
  readonly recommendedAction: string;
  readonly createdAt: string;                   // ISO timestamp
  readonly resolved: boolean;
  readonly resolvedAt: string | undefined;
}

export function createAlert(
  trigger: AlertTrigger,
  context: string,
  provider?: ReasoningProviderId
): SupervisorAlert

export function resolveAlert(alert: SupervisorAlert): SupervisorAlert
```

Written to: `docs/autopilot/session-state/alerts.jsonl` (append-only JSONL).

**Acceptance criteria:**
- `createAlert("correction_loop_exceeded", ...)` returns `severity: "blocker"`.
- `createAlert("provider_tier_switched", ...)` returns `severity: "info"`.
- `createAlert("gemini_session_exhausted", ...)` returns `severity: "warning"`.
- Alerts are written to `session-state/alerts.jsonl` by the component that detects
  the condition, read by Opus at startup gate.

---

## Group C — Routing & Selection

### C1 — Layer → Provider Mapping

**File:** `src/data/delivery-system/modelPolicy.ts`

**Problem now:**  
`selectReasoningModelRoute()` returns `preferredProviders` that includes
`anthropic_claude_subscription` alongside `openai_gpt` for nearly every task lane.
There is no enforcement that `orchestrator` → always Opus and `bounded_coding` →
always GPT. `openai_gpt.accessMode` is `"api_or_self_hosted"` — wrong for a
subscription user; `subscription_entitlement_confirmed` check is missing.
No `credentialedAdvisoryProviderPolicy` entry for the GPT worker.

**What is missing:**

```typescript
// Add to modelPolicy.ts

// Fix: openai_gpt provider policy
// BEFORE: accessMode: "api_or_self_hosted"
// AFTER:
{
  id: "openai_gpt",
  accessMode: "subscription_interactive",       // CHANGED
  costGuard: "uses_owner_subscription_entitlement_not_api_credit",  // NEW
  requiredChecks: [
    // ADD:
    "subscription_entitlement_confirmed_for_subscription_tools",
    "serial_task_delegation_required"
  ],
  stopConditions: [
    // ADD:
    "subscription_entitlement_unverified",
    "parallel_subscription_calls_attempted",
    "mid_task_rate_limit_without_checkpoint"
  ]
}

// New explicit layer → provider mapping
export const layerProviderMapping = {
  orchestrator:      "anthropic_claude_subscription",
  architect:         "anthropic_claude_subscription",
  reviewer:          "anthropic_claude_subscription",
  tester:            "openai_gpt",
  micro_worker:      "openai_gpt",
  bounded_coding:    "openai_gpt",
  memory_summarizer: "gemini_cli",    // rate-limit guard applies
  copywriter:        "openai_gpt"
} as const satisfies Record<ModelPolicyLayer, ReasoningProviderId>;

// New function
export function selectModelForLayer(
  layer: ModelPolicyLayer,
  budgets: readonly SubscriptionSessionBudget[]
): ReasoningProviderId  // returns fallback if primary budget exhausted

// New credentialed policy entry (add to credentialedAdvisoryProviderPolicies)
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

**Acceptance criteria:**
- `layerProviderMapping.orchestrator === "anthropic_claude_subscription"`.
- `layerProviderMapping.bounded_coding === "openai_gpt"`.
- `openai_gpt.accessMode === "subscription_interactive"`.
- `selectModelForLayer("bounded_coding", budgets_with_gpt_available)` returns
  `"openai_gpt"`.
- `selectModelForLayer("bounded_coding", budgets_with_gpt_rate_limited)` returns
  `"qwen_local"` (per fallback chain B3).
- `npm.cmd run typecheck` passes.

---

### C2 — Context Width Selection

**File:** `src/data/delivery-system/tokenEfficiency.ts`

**Problem now:**  
`tokenEfficiency.ts` has 4 profiles (`caveman / standard_compact / review_compact /
research_compact`) with `budgetClass: "tiny" | "small" | "medium"`. The profiles
define context *rules* (strings) but no *numeric limits*: no max files, no max
context lines, no list of which sections to include. `SupervisorRoutingDecision`
(planned in C3) has no `contextBudget` field. The handoff packet template has no
"Context Budget" section. Gemini's long-context advantage is implicit in
`preferredWorkerOrder` but not formally connected to context width.

**What exists (good foundation):**  
4 profiles, `budgetClass` enum, `contextRules` per profile, `firstMoves`, `preferredWorkerOrder`.

**What is missing:**

```typescript
// Add to tokenEfficiency.ts

export interface ContextWidthSpec {
  readonly budgetClass: TokenBudgetClass;
  readonly maxFilesInPacket: number;          // hard cap on files in handoff
  readonly maxContextLines: number;           // total lines across all included files
  readonly requiredSections: readonly string[]; // always include
  readonly optionalSections: readonly string[]; // include only if directly relevant
  readonly excludedSections: readonly string[]; // never include at this budget
  readonly preferredProviderForWidth:
    | "any_local"
    | "openai_gpt"
    | "gemini_cli"     // only at large budget
    | "anthropic_claude_subscription";
}

export const contextWidthSpecs: Record<TokenBudgetClass, ContextWidthSpec> = {
  tiny: {
    budgetClass: "tiny",
    maxFilesInPacket: 3,
    maxContextLines: 200,
    requiredSections: ["goal", "allowed_files", "forbidden_actions", "expected_output"],
    optionalSections: ["verified_facts", "stop_conditions"],
    excludedSections: [
      "full_mesh_packet", "architecture_records", "work_log",
      "dependency_records", "skill_registry"
    ],
    preferredProviderForWidth: "any_local"
  },
  small: {
    budgetClass: "small",
    maxFilesInPacket: 8,
    maxContextLines: 600,
    requiredSections: [
      "goal", "scope", "allowed_files", "forbidden_actions",
      "verified_facts", "expected_output", "required_checks"
    ],
    optionalSections: ["risks", "reuse_check", "open_questions"],
    excludedSections: ["full_mesh_packet", "full_work_log"],
    preferredProviderForWidth: "openai_gpt"
  },
  medium: {
    budgetClass: "medium",
    maxFilesInPacket: 20,
    maxContextLines: 2000,
    requiredSections: [
      "goal", "scope", "allowed_files", "forbidden_actions",
      "verified_facts", "assumptions", "risks", "expected_output",
      "required_checks", "stop_conditions", "reuse_check", "context_budget"
    ],
    optionalSections: [
      "architecture_records", "dependency_records",
      "learning_signal", "skill_registry_relevant"
    ],
    excludedSections: [],
    preferredProviderForWidth: "openai_gpt"
  },
  large: {
    budgetClass: "large",        // new class for Gemini long-context analysis
    maxFilesInPacket: 60,
    maxContextLines: 8000,
    requiredSections: [
      "goal", "scope", "allowed_files", "forbidden_actions",
      "full_mesh_packet", "verified_facts", "architecture_records",
      "risks", "expected_output", "required_checks"
    ],
    optionalSections: ["full_work_log", "dependency_records"],
    excludedSections: [],
    preferredProviderForWidth: "gemini_cli"  // Gemini only at large budget
  }
};

// New budget class
// BEFORE: export type TokenBudgetClass = "tiny" | "small" | "medium";
// AFTER:
export type TokenBudgetClass = "tiny" | "small" | "medium" | "large";

// New function (supervisor calls this to build context budget)
export function selectContextWidth(
  profile: TokenEfficiencyProfileId,
  taskComplexitySignals: readonly string[]
): ContextWidthSpec
```

**Acceptance criteria:**
- `large` budget class only returned when `taskComplexitySignals` include long-context
  analysis signals (brainstorm, multi-module, architecture, long document).
- `preferredProviderForWidth: "gemini_cli"` only for `large` budget.
- `maxFilesInPacket` is enforced — supervisor must not put more files in handoff.
- `npm.cmd run typecheck` passes.

---

### C3 — SupervisorRoutingDecision (Composite)

**File:** `src/data/delivery-system/modelPolicy.ts`

**Problem now:**  
Supervisor must call `selectTokenEfficiencyRoute()`, `selectReasoningModelRoute()`,
`selectModelForLayer()`, and check `SubscriptionSessionBudget` separately. No single
type holds the combined routing decision for a task. This makes the supervisor prompt
complex to implement correctly.

**What is missing:**

```typescript
// Add to modelPolicy.ts (wraps C1 + C2 + B2)

export interface SupervisorRoutingDecision {
  readonly taskId: string;
  readonly layer: ModelPolicyLayer;
  readonly tokenEfficiencyProfile: TokenEfficiencyProfileId;   // from C2
  readonly contextWidthSpec: ContextWidthSpec;                 // from C2
  readonly taskLane: ReasoningTaskLaneId;                      // from existing
  readonly assignedProvider: ReasoningProviderId;              // from C1
  readonly assignedTierId: string | undefined;                 // from B2
  readonly subscriptionBudgetState: SubscriptionRateLimitState; // from B2
  readonly fallbackProvider: ReasoningProviderId | "owner_decision"; // from B3
  readonly learningSignal: SupervisorLearningSignal | undefined;    // from A1
  readonly decisionReasoning: string;
}

export function buildSupervisorRoutingDecision(input: {
  taskId: string;
  taskDescription: string;
  layer: ModelPolicyLayer;
  budgets: readonly SubscriptionSessionBudget[];
  evalRecords: readonly EvalRecordSummary[];
}): SupervisorRoutingDecision
```

**Acceptance criteria:**
- `buildSupervisorRoutingDecision()` calls `selectTokenEfficiencyRoute()`,
  `selectContextWidth()`, `selectModelForLayer()`, `deriveLearningSignal()` internally.
- Returns a single typed object Opus can use to build the handoff packet.
- `contextWidthSpec.maxFilesInPacket` is reflected in the handoff packet's file list.

---

## Group D — Worker Tooling

### D1 — Skill / Plugin Registry

**Files:**
- `src/data/delivery-system/toolInventory.ts` (extend)
- `docs/autopilot/skill-registry.json` (new, committed)

**Problem now:**  
`toolInventory.ts` has `ToolInventorySnapshot` with `observedAt: "2026-06-11"` — a
static snapshot. No `SkillUsageRecord`, no `SkillReplacementCandidate`. Platform
plugins are used by default; there is no mechanism to prefer or track custom skills.

**What is missing:**

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
}
```

`docs/autopilot/skill-registry.json` shape:

```json
{
  "lastUpdatedAt": "YYYY-MM-DD",
  "skills": [],
  "usageRecords": [],
  "replacementCandidates": []
}
```

**Supervisor use:**  
At startup: load `skill-registry.json`, filter `replacementCandidates` where
`status: "adopted"`. For tasks in those categories, prefer `custom_local_skill`
over platform plugin. Write eval record after each use to compare.

**New mesh node:** `mesh/nodes/skill_registry_policy.yaml`  
Signals: `plugin replacement, skill evaluation, custom skill, tool inventory update`  
Required check: `skill_registry_checked_before_plugin_use`  
Stop condition: `platform_plugin_used_when_adopted_replacement_exists`

**Acceptance criteria:**
- `skill-registry.json` is valid JSON; committed to repo.
- `SkillReplacementCandidate.status` follows a one-way state machine:
  `proposed → in_development → evaluating → adopted | rejected`.
- Supervisor prompt includes step "check skill registry before plugin activation".

---

### D2 — Dependency Freshness + Reuse Gate

**Files (new):**
- `src/data/delivery-system/dependencyFreshness.ts`
- `mesh/nodes/reuse_gate.yaml`

**Problem now:**  
`npm run audit:deps` only finds security vulnerabilities, not outdated packages with
new features. No "reuse-first" check exists anywhere in the handoff pipeline.
`agent-handoff-packet-template.md` has no "Reuse Check" section. Workers can write
code that already exists in utilities or installed packages.

**What is missing:**

```typescript
// New file: src/data/delivery-system/dependencyFreshness.ts

export type DependencyFreshnessState =
  | "current"
  | "minor_update_available"
  | "major_update_available"
  | "deprecated"
  | "security_vulnerability"
  | "unknown";

export type UpdateDecision =
  | "update_when_convenient"
  | "research_needed"          // major version — check breaking changes
  | "urgent"                   // security vulnerability
  | "hold"
  | "pending";

export interface DependencyCheckRecord {
  readonly checkedAt: string;
  readonly packageName: string;
  readonly installedVersion: string;
  readonly latestVersion: string | undefined;
  readonly freshnessState: DependencyFreshnessState;
  readonly newFeaturesRelevantToProject: readonly string[];  // key addition
  readonly securityAdvisory: string | undefined;
  readonly updateDecision: UpdateDecision;
  readonly ownerApprovalRequired: boolean;   // always true for major
}

export type ReuseDecision = "implement_new" | "reuse_existing" | "extend_existing";

export interface ReuseCheckResult {
  readonly searchedPatterns: readonly string[];
  readonly existingMatches: readonly string[];  // file:line refs
  readonly packageMatches: readonly string[];
  readonly decision: ReuseDecision;
  readonly reuseTarget: string | undefined;
  readonly tokenSavingEstimate: "high" | "medium" | "low" | "none";
}

export const dependencyFreshnessPolicy = {
  checkCommands: ["npm.cmd outdated --json", "npm.cmd audit --json"],
  autoUpdateAllowed: false,          // always owner decision
  majorUpdateRequiresOwner: true,
  checkBeforeTaskTypes: [
    "architecture_review", "new_feature", "major_refactor", "security_audit"
  ],
  stopConditions: [
    "major_version_bump_without_owner_decision",
    "security_vulnerability_ignored",
    "new_code_written_when_library_update_would_provide_it"
  ]
} as const;
```

**Handoff packet template addition** (to `docs/autopilot/agent-handoff-packet-template.md`):

```markdown
## Reuse Check (required before first code change)
- Searched patterns: [list rg patterns used]
- Existing matches: [file:line or "none found"]
- Installed package matches: [package names or "none"]
- Decision: implement_new | reuse_existing | extend_existing
- Reuse target: [file:line if applicable]
- Token saving estimate: high | medium | low | none

## Context Budget
- Profile: caveman | standard_compact | review_compact | research_compact
- Max files: [N]
- Max context lines: [N]
- Included sections: [list]
```

**New mesh node** `mesh/nodes/reuse_gate.yaml`:  
Signals: `implement, new function, new component, new utility, add feature`  
Required check: `rg_search_for_existing_symbols`, `installed_packages_checked`  
Stop condition: `implementation_started_without_reuse_check`,
`duplicate_code_written_when_existing_match_found`

**Acceptance criteria:**
- `ReuseCheckResult` is required in every handoff packet for `bounded_coding` tasks.
- `DependencyCheckRecord` is written to `session-state/deps-check.json` before
  architecture or new-feature tasks.
- `newFeaturesRelevantToProject` is non-empty only when supervisor explicitly
  identifies a connection (not auto-filled).
- `autoUpdateAllowed: false` is enforced — no dep update without owner decision.

---

## Group E — Infrastructure

### E1 — modelPolicy.ts Fixes

**File:** `src/data/delivery-system/modelPolicy.ts`

All changes from C1. Summary:

| Change | Location | What |
|---|---|---|
| Fix `accessMode` | `openai_gpt` provider | `"api_or_self_hosted"` → `"subscription_interactive"` |
| Add `costGuard` | `openai_gpt` provider | `"uses_owner_subscription_entitlement_not_api_credit"` |
| Add required checks | `openai_gpt` | `subscription_entitlement_confirmed`, `serial_task_delegation_required` |
| Add stop conditions | `openai_gpt` | `subscription_entitlement_unverified`, `parallel_subscription_calls_attempted` |
| Add `gemini_cli` guards | `gemini_cli` provider | `gemini_session_budget_tracked`, `gemini_not_primary_worker` |
| Add stop conditions | `gemini_cli` | `gemini_rate_limit_exhausted_without_pause`, `gemini_used_as_default_worker` |
| Update lane | `bounded_coding_worker` | `preferredProviders[0]` = `openai_gpt` (was `qwen_local`) |
| Update lane | `agent_validation` | `preferredProviders[0]` = `anthropic_claude_subscription` |
| Add export | file level | `layerProviderMapping` const |
| Add function | file level | `selectModelForLayer()` |
| Add to credentials | `credentialedAdvisoryProviderPolicies` | `codex_gpt_worker` entry |

**Acceptance criteria:** `npm.cmd run typecheck` passes with no errors.

---

### E2 — Handoff Packet Template Extension

**File:** `docs/autopilot/agent-handoff-packet-template.md`

Add two new sections (after "Expected Output"):

1. **Reuse Check** — from D2 (required for `bounded_coding` tasks)
2. **Context Budget** — profile, max files, max lines, included sections

Also add a new optional section:

3. **Learning Signal** — `recommendedDelta` from `SupervisorLearningSignal` (from A1)

**Acceptance criteria:**
- Template passes a manual review against all required fields.
- Section is marked "(required)" or "(optional)" explicitly.
- The template is referenced from the supervisor prompt (E5).

---

### E3 — New Mesh Nodes

**Directory:** `mesh/nodes/`

Four new YAML nodes. Summary:

| File | ID | Purpose |
|---|---|---|
| `subscription_worker_boundary.yaml` | `subscription_worker_boundary` | Serial delegation constraint, tier awareness, no parallel calls |
| `skill_registry_policy.yaml` | `skill_registry_policy` | Skill replacement governance |
| `reuse_gate.yaml` | `reuse_gate` | Reuse-first gate before implementation |
| `supervisor_execution_loop.yaml` | `supervisor_execution_loop` | Full Opus orchestration loop: startup → route → delegate → eval → fallback → alert |

Each node requires:
- `id`, `type`, `name`, `question`, `why`
- `signals[]`, `related_agents[]`, `related_files[]`
- `required_checks[]`, `stop_conditions[]`, `must_not_assume[]`, `objective[]`

After adding nodes: `npm.cmd run mesh:check` must pass.

**Also add edges to `mesh/edges.yaml`:**

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

**Acceptance criteria:** `npm.cmd run mesh:check` passes with all 4 new nodes valid.

---

### E4 — Hook Bridge to Session-State

**File:** `.codex/hooks/autopilot-hook.mjs`

**Problem now:**  
Hook writes structured JSONL to `.codex/state/events.jsonl` but not to
`docs/autopilot/session-state/`. Opus cannot read hook-observed events at startup.

**What to add (minimal bridge — not logic, just writes):**

In `handlePostToolUse`: if `failed === true`, append a `SupervisorAlert` JSON line
to `docs/autopilot/session-state/alerts.jsonl` with:
- `trigger: "provider_unavailable"` (or appropriate)
- `severity` derived from `flags` array
- `context`: redacted summary (no raw input/output — same rules as current hook)
- `resolved: false`

In `handleStop`: update `docs/autopilot/session-state/session.json` manifest fields:
- `lastUpdatedAt`, `hookEventsThisSession`, `investigationQueueDepth` (count from
  investigation-queue.jsonl file size).

**Hard constraints on bridge code:**
- Never write raw prompts, commands, tool responses, or private data.
- Only write what already exists in `flags[]` and `result` fields.
- Bridge fails silently (try/catch) — hook must not block Codex session.

**Acceptance criteria:**
- After a failed tool call, `alerts.jsonl` has a new line.
- `session.json` is updated on Stop.
- No existing hook behaviour changes (only additive writes).
- Hook still passes `npm.cmd test`.

---

### E5 — Claude Opus Supervisor Prompt

**File:** `prompt-library/06-supervisor/claude-opus-supervisor.md`

**Problem now:**  
`autopilot-supervisor-base.md` exists (v0.1.0, status: candidate) but:
- Startup Gate calls `codex_app.read_thread_terminal` — a Codex App tool, not
  available in Claude Code.
- No explicit role declaration (Opus = orchestrator only, not implementor).
- No Gemini budget guard.
- No reference to `SupervisorRoutingDecision` or the new typed interfaces.
- No handoff packet construction steps.

**New file structure:**

```markdown
---
id: claude-opus-supervisor
model_family: anthropic-claude
task_type: agentic-supervisor
version: v0.1.0
status: draft
sources: [local-agents-md, claude-opus-supervisor, protective-supervision-operating-model]
risk_level: high
requires:
  - decision_mesh_packet
  - project_mesh_packet
  - session_state_file
  - handoff_packet_template
  - skill_registry
forbidden:
  - raw_agent_output_as_next_prompt
  - remote_mutation_without_owner_approval
  - self_approval
  - implementation_work
  - parallel_worker_sessions
---

# Claude Opus Supervisor Prompt

## Role (Fixed)
You are Claude Opus acting as Autopilot Orchestrator.
Allowed: planning · architecture · orchestration · review · approval.
Forbidden: writing code · implementing features · approving own work.

## Startup Gate (replaces codex_app.read_thread_terminal)
1. Read docs/autopilot/session-state/session.json
   → if pendingAlerts with severity: "blocker" → resolve alerts first, stop planning
   → load providerBudgets → know which providers are available
2. Call MCP: select_capabilities → get_relevant_subgraph → build_agent_packet
3. Read AGENTS.md + CLAUDE.md
4. Read project mesh packet (if supervised project task)
5. Read docs/autopilot/skill-registry.json

## Per-Task Routing
For each task:
1. buildSupervisorRoutingDecision(taskId, description, layer, budgets, evalRecords)
2. Check contextWidthSpec.maxFilesInPacket before building handoff packet
3. Run ReuseCheck (rg search + package scan) → fill Reuse Check section
4. Write handoff packet to docs/autopilot/ (include Context Budget + Reuse Check)
5. Check Gemini budget if layer = memory_summarizer before activating

## Delegation Rules (Subscription Constraint)
- ONE worker session at a time — never parallel
- Write handoff packet BEFORE opening any worker session
- After worker completes: run selectModelOutputEvaluationRoute() → WorkerOutputNormalization
- If retry_with_correction: increment CorrectionLoopEntry, fix handoff packet, redelegate
- If escalate_model_route: run resolveFallback() → next step
- Write eval record to model-output-evals/records/ after every worker output

## Gemini Budget Guard
Before using Gemini:
1. Check budget.activeTierRateLimitState for gemini_cli
2. If rate_limited: check availableTiers for non-exhausted entry
3. If all exhausted: createAlert(gemini_session_exhausted) → skip Gemini, continue without
4. Never use Gemini as fallback for GPT rate limit

## Output Normalization (never raw output as next prompt)
Normalize every worker output to WorkerOutputNormalization before next step.
```

**Acceptance criteria:**
- Prompt is valid per `prompt.schema.json` metadata.
- Startup Gate does not reference `codex_app.read_thread_terminal`.
- Role section explicitly forbids implementation work.
- Gemini budget guard is present and actionable.
- `npm.cmd run prompt:validate` passes.

---

### E6 — GPT Bounded Worker Prompt

**File:** `prompt-library/01-gpt/codex-bounded-worker.md`

**Problem now:**  
No prompt exists for the GPT/Codex worker that establishes: receive handoff packet →
implement bounded task → report back structured output. Workers currently receive
ad-hoc instructions.

```markdown
---
id: codex-bounded-worker
model_family: openai-gpt
task_type: bounded-implementation
version: v0.1.0
status: draft
risk_level: medium
requires: [handoff_packet]
forbidden: [architecture_decisions, governance_approval, scope_expansion, self_approval]
---

# Codex Bounded Worker Prompt

## Role
You are a bounded implementation worker.
Supervisor: Claude Opus (Autopilot Orchestrator).
You receive one handoff packet per session.

## Rules
- Implement only what is declared in the handoff packet.
- Check the Reuse Check section before writing any new code.
- Do not expand scope or make architecture decisions.
- If you hit a stop condition or ambiguity: STOP and report — do not guess.
- If rate limit is approaching: checkpoint progress, record open items, stop cleanly.

## Required Output (structured, for supervisor normalization)
- files_changed: [path:summary]
- tests_run: [command + result]
- open_questions: [list]
- blocked_items: [list with reason]
- reuse_check_result: implement_new | reuse_existing | extend_existing (+ target)
```

**Acceptance criteria:**
- Prompt is valid per `prompt.schema.json` metadata.
- Output section maps directly to `WorkerOutputNormalization` fields.
- `npm.cmd run prompt:validate` passes.

---

## Implementation Roadmap

### Phase 0 — Foundation Types (no dependencies, all parallel)

| Task | File | Scope |
|---|---|---|
| 0-A | `src/data/delivery-system/sessionState.ts` | New module, types only |
| 0-B | `src/data/delivery-system/subscriptionBudget.ts` | New module, types + `geminiKnownTiers` |
| 0-C | `src/data/delivery-system/fallbackChains.ts` | New module, types + `subscriptionFallbackChains` |
| 0-D | `src/data/delivery-system/supervisorAlerts.ts` | New module, types + `createAlert()` |
| 0-E | `docs/autopilot/session-state/.gitignore` | New file, gitignore pattern |

**Verify:** `npm.cmd run typecheck` passes. No runtime code yet.

### Phase 1 — Policy Updates (depends on Phase 0 types)

| Task | File | Scope |
|---|---|---|
| 1-A | `modelPolicy.ts` | E1 fixes + C1 mapping + `selectModelForLayer()` |
| 1-B | `modelOutputEvaluation.ts` | A1 + A2 extensions |
| 1-C | `tokenEfficiency.ts` | C2: `ContextWidthSpec` + `large` budget class |
| 1-D | `toolInventory.ts` | D1: skill registry types |
| 1-E | `dependencyFreshness.ts` | D2: new module |

**Verify:** `npm.cmd run typecheck` + `npm.cmd test` pass.

### Phase 2 — Composite Routing (depends on Phase 0 + 1)

| Task | File | Scope |
|---|---|---|
| 2-A | `modelPolicy.ts` | C3: `SupervisorRoutingDecision` + `buildSupervisorRoutingDecision()` |
| 2-B | `docs/autopilot/skill-registry.json` | D1: initial committed file (empty arrays) |
| 2-C | `docs/autopilot/agent-handoff-packet-template.md` | E2: add Reuse Check + Context Budget sections |

**Verify:** `npm.cmd run typecheck` + `npm.cmd run contracts:validate` pass.

### Phase 3 — Mesh Nodes (depends on Phase 1 types for signal accuracy)

| Task | File | Scope |
|---|---|---|
| 3-A | `mesh/nodes/subscription_worker_boundary.yaml` | E3 |
| 3-B | `mesh/nodes/skill_registry_policy.yaml` | E3 |
| 3-C | `mesh/nodes/reuse_gate.yaml` | E3 |
| 3-D | `mesh/nodes/supervisor_execution_loop.yaml` | E3 |
| 3-E | `mesh/edges.yaml` | Add 4 edges from E3 |

**Verify:** `npm.cmd run mesh:check` passes.

### Phase 4 — Hook Bridge (depends on Phase 0 alert types)

| Task | File | Scope |
|---|---|---|
| 4-A | `.codex/hooks/autopilot-hook.mjs` | E4: bridge writes to session-state/ |

**Verify:** `npm.cmd test` passes. Manual smoke: trigger a hook event, verify
`docs/autopilot/session-state/alerts.jsonl` gets a new line.

### Phase 5 — Prompts (depends on all above)

| Task | File | Scope |
|---|---|---|
| 5-A | `prompt-library/06-supervisor/claude-opus-supervisor.md` | E5 |
| 5-B | `prompt-library/01-gpt/codex-bounded-worker.md` | E6 |

**Verify:** `npm.cmd run prompt:validate` passes.

### Phase 6 — Full Verification

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
```

---

## Codex Task Decomposition

Each task below is designed to be independently assignable to a Codex session.
Every task specifies: context to load, files to touch, acceptance criteria.

---

### TASK-01 — Foundation Types: Session State

**Context to load:** `src/data/delivery-system/workflows.ts` (for `WorkflowState`)  
**Files to create:** `src/data/delivery-system/sessionState.ts`  
**Allowed changes:** create new file only; do not edit existing files  
**Forbidden:** runtime logic, file I/O, imports from non-existent modules  

**Deliverable:** TypeScript module exporting `SessionStateManifest`,
`SessionStateFile`, `CorrectionLoopEntry` (placeholder, full type in TASK-06).
Types must compile; module has no runtime dependencies beyond `workflows.ts`.

**Acceptance criteria:**
- `npm.cmd run typecheck` passes.
- All exports are `readonly`.
- `schemaVersion: "v1"` is a literal type, not `string`.

---

### TASK-02 — Foundation Types: Subscription Budget + Tiers

**Context to load:** `src/data/delivery-system/modelPolicy.ts` (for `ReasoningProviderId`)  
**Files to create:** `src/data/delivery-system/subscriptionBudget.ts`  
**Allowed changes:** create new file only  

**Deliverable:** `SubscriptionRateLimitState`, `ProviderTierSpec`, `SubscriptionSessionBudget`,
`geminiKnownTiers` const array (3 entries: auto, flash, pro).

**Acceptance criteria:**
- `npm.cmd run typecheck` passes.
- `geminiKnownTiers.length === 3`.
- `gemini_flash.estimatedQuotaClass === "high"`.
- `SubscriptionSessionBudget.exhaustedTierIds` is `readonly string[]`.

---

### TASK-03 — Foundation Types: Fallback Chains

**Context to load:** `src/data/delivery-system/subscriptionBudget.ts` (TASK-02),
`src/data/delivery-system/modelPolicy.ts`  
**Files to create:** `src/data/delivery-system/fallbackChains.ts`  

**Deliverable:** `FallbackTrigger`, `FallbackChainStep`, `subscriptionFallbackChains`
(5 entries as specified), `resolveFallback()` function.

**Acceptance criteria:**
- `npm.cmd run typecheck` passes.
- No step has `fromProvider: "gemini_cli"` and `toProvider` !== `"gemini_cli"` and
  !== `"blocked"` (Gemini never falls back to another provider).
- `resolveFallback("rate_limited", "anthropic_claude_subscription", anyBudget)`
  returns `toProvider: "owner_decision"`.

---

### TASK-04 — Foundation Types: Supervisor Alerts

**Context to load:** `src/data/delivery-system/modelPolicy.ts`  
**Files to create:** `src/data/delivery-system/supervisorAlerts.ts`  

**Deliverable:** `AlertSeverity`, `AlertTrigger` (9 triggers as specified),
`SupervisorAlert`, `createAlert()`, `resolveAlert()`.

**Acceptance criteria:**
- `npm.cmd run typecheck` passes.
- `createAlert("correction_loop_exceeded", ...)` returns `severity: "blocker"`.
- `createAlert("provider_tier_switched", ...)` returns `severity: "info"`.
- `createAlert("gemini_session_exhausted", ...)` returns `severity: "warning"`.

---

### TASK-05 — modelPolicy.ts Fixes (GPT subscription mode)

**Context to load:** `src/data/delivery-system/modelPolicy.ts` (full file)  
**Files to edit:** `src/data/delivery-system/modelPolicy.ts`  
**Do not touch:** function signatures of `selectReasoningModelRoute()` or routing logic  

**Deliverable:**
1. `openai_gpt.accessMode` changed to `"subscription_interactive"`.
2. `openai_gpt` gets `costGuard`, 2 new required checks, 3 new stop conditions.
3. `gemini_cli` gets 2 new required checks, 2 new stop conditions, 2 new `avoidFor` entries.
4. `bounded_coding_worker.preferredProviders[0]` = `"openai_gpt"`.
5. `agent_validation.preferredProviders[0]` = `"anthropic_claude_subscription"`.
6. New `codex_gpt_worker` entry added to `credentialedAdvisoryProviderPolicies`.

**Acceptance criteria:**
- `npm.cmd run typecheck` passes.
- `openai_gpt.accessMode === "subscription_interactive"`.
- `credentialedAdvisoryProviderPolicies` has 2 entries (claude_code + codex_gpt_worker).

---

### TASK-06 — Learning Signal + Self-Correction Types

**Context to load:** `src/data/delivery-system/modelOutputEvaluation.ts` (full)  
**Files to edit:** `src/data/delivery-system/modelOutputEvaluation.ts`  

**Deliverable:**
1. `EvalRecordSummary` interface.
2. `SupervisorLearningSignal` interface.
3. `deriveLearningSignal()` function.
4. `CorrectionLoopEntry` interface (finalise from TASK-01 placeholder).
5. `WorkerOutputNormalization` interface.

**Acceptance criteria:**
- `npm.cmd run typecheck` passes.
- `npm.cmd test` passes (existing tests must not break).
- `deriveLearningSignal()` returns `confidenceSource: "no_data"` when `records.length < 2`.
- `WorkerOutputNormalization.nextAction` covers all 5 cases specified.

---

### TASK-07 — Context Width Selection

**Context to load:** `src/data/delivery-system/tokenEfficiency.ts` (full)  
**Files to edit:** `src/data/delivery-system/tokenEfficiency.ts`  

**Deliverable:**
1. Add `"large"` to `TokenBudgetClass`.
2. `ContextWidthSpec` interface.
3. `contextWidthSpecs` const (4 entries: tiny, small, medium, large).
4. `selectContextWidth()` function.

**Acceptance criteria:**
- `npm.cmd run typecheck` passes.
- `contextWidthSpecs.large.preferredProviderForWidth === "gemini_cli"`.
- `contextWidthSpecs.tiny.maxFilesInPacket === 3`.
- `selectContextWidth("caveman", [])` returns `budgetClass: "tiny"`.

---

### TASK-08 — SupervisorRoutingDecision Composite

**Context to load:** All Phase 0 + 1 modules  
**Files to edit:** `src/data/delivery-system/modelPolicy.ts`  

**Deliverable:**
1. `layerProviderMapping` const.
2. `selectModelForLayer()` function.
3. `SupervisorRoutingDecision` interface.
4. `buildSupervisorRoutingDecision()` function.

**Acceptance criteria:**
- `npm.cmd run typecheck` passes.
- `layerProviderMapping.orchestrator === "anthropic_claude_subscription"`.
- `buildSupervisorRoutingDecision()` calls all 4 sub-functions internally.
- Return type is `SupervisorRoutingDecision` (not `any`).

---

### TASK-09 — Skill Registry Types + Initial File

**Context to load:** `src/data/delivery-system/toolInventory.ts` (full)  
**Files to edit:** `src/data/delivery-system/toolInventory.ts`  
**Files to create:** `docs/autopilot/skill-registry.json`  

**Deliverable:**
1. `SkillSource`, `SkillCapabilitySpec`, `SkillUsageRecord`, `SkillReplacementCandidate`
   types added to `toolInventory.ts`.
2. `docs/autopilot/skill-registry.json` created with empty arrays and
   `"lastUpdatedAt": "2026-06-17"`.

**Acceptance criteria:**
- `npm.cmd run typecheck` passes.
- `skill-registry.json` is valid JSON with keys `lastUpdatedAt`, `skills`,
  `usageRecords`, `replacementCandidates`.
- `SkillReplacementCandidate.status` union type has exactly 5 members.

---

### TASK-10 — Dependency Freshness Module + Reuse Types

**Context to load:** `package.json` (for available scripts)  
**Files to create:** `src/data/delivery-system/dependencyFreshness.ts`  

**Deliverable:** `DependencyFreshnessState`, `UpdateDecision`, `DependencyCheckRecord`,
`ReuseDecision`, `ReuseCheckResult`, `dependencyFreshnessPolicy` const.

**Acceptance criteria:**
- `npm.cmd run typecheck` passes.
- `dependencyFreshnessPolicy.autoUpdateAllowed === false` (literal `false`, not `boolean`).
- `dependencyFreshnessPolicy.checkCommands` uses `npm.cmd` not `npm`.
- `DependencyCheckRecord.newFeaturesRelevantToProject` is `readonly string[]`.

---

### TASK-11 — Mesh Nodes (4 new)

**Context to load:** existing mesh nodes as reference (e.g. `mesh/nodes/model_output_evaluation_policy.yaml`)  
**Files to create:** 4 new YAML files in `mesh/nodes/`  
**Files to edit:** `mesh/edges.yaml` (add 4 edges)  

**Deliverable:** All 4 nodes + 4 edges as specified in E3.

**Acceptance criteria:**
- `npm.cmd run mesh:check` passes with 0 errors.
- Each node has all required YAML keys: `id`, `type`, `name`, `question`, `why`,
  `signals`, `related_agents`, `related_files`, `required_checks`, `stop_conditions`,
  `must_not_assume`, `objective`.
- Each edge has: `from`, `to`, `relation`, `weight`, `why`.

---

### TASK-12 — Hook Bridge to Session-State

**Context to load:** `.codex/hooks/autopilot-hook.mjs` (full),
`src/data/delivery-system/supervisorAlerts.ts` (types, for shape reference)  
**Files to edit:** `.codex/hooks/autopilot-hook.mjs`  
**Files to create:** `docs/autopilot/session-state/.gitignore`  

**Deliverable:**
1. On `PostToolUse` with `failed === true`: append alert JSON line to
   `docs/autopilot/session-state/alerts.jsonl`.
2. On `Stop`: update `docs/autopilot/session-state/session.json` with
   `lastUpdatedAt`, `hookEventsThisSession`, `investigationQueueDepth`.
3. `.gitignore` with `*.json` and `*.jsonl`.

**Hard constraints:**
- No raw prompts, commands, tool responses, or private data in writes.
- Bridge code is wrapped in try/catch; failures are silent (append to messages only).
- All existing hook behaviour preserved.

**Acceptance criteria:**
- `npm.cmd test` passes.
- After simulating a failed hook call, `alerts.jsonl` contains a valid JSON line.
- `session.json` after Stop has `schemaVersion: "v1"`.

---

### TASK-13 — Handoff Packet Template Extension

**Context to load:** `docs/autopilot/agent-handoff-packet-template.md`  
**Files to edit:** `docs/autopilot/agent-handoff-packet-template.md`  

**Deliverable:** Add "Reuse Check" and "Context Budget" sections after
"Expected Output"; add "Learning Signal (optional)" section.

**Acceptance criteria:**
- Template is valid Markdown.
- Each new section is marked `(required)` or `(optional)`.
- Section names match exactly the field names in `ReuseCheckResult` and
  `ContextWidthSpec`.

---

### TASK-14 — Supervisor Prompt

**Context to load:** `prompt-library/06-supervisor/autopilot-supervisor-base.md`,
`prompt.schema.json`, `AGENTS.md`  
**Files to create:** `prompt-library/06-supervisor/claude-opus-supervisor.md`  
**Do not edit:** `autopilot-supervisor-base.md`  

**Deliverable:** New prompt file with valid metadata (per `prompt.schema.json`)
and body as specified in E5.

**Acceptance criteria:**
- `npm.cmd run prompt:validate` passes.
- No reference to `codex_app.read_thread_terminal`.
- Role section present with forbidden list.
- Gemini budget guard present.
- Startup Gate references `docs/autopilot/session-state/session.json`.

---

### TASK-15 — Worker Prompt

**Context to load:** `prompt.schema.json`, `prompt-library/01-gpt/` existing files  
**Files to create:** `prompt-library/01-gpt/codex-bounded-worker.md`  

**Deliverable:** New prompt file with valid metadata and body as specified in E6.

**Acceptance criteria:**
- `npm.cmd run prompt:validate` passes.
- Required Output section present with all 5 fields.
- `forbidden` metadata includes `architecture_decisions`, `self_approval`.

---

### TASK-16 — Full Verification Pass

**Context to load:** none (runs scripts only)  
**Allowed actions:** fix any typecheck or validation errors found; no new logic  

**Command sequence:**
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
```

**Acceptance criteria:** All commands exit 0.

---

## Dependency Graph (Codex task order)

```
TASK-01, 02, 03, 04 (parallel — foundation types, no deps)
    ↓
TASK-05, 06, 07 (parallel — depend on foundation types)
    ↓
TASK-08 (depends on 05, 06, 07)
TASK-09, 10 (parallel with 08 — no dep on 08)
    ↓
TASK-11 (mesh nodes — should reflect finalized type names from 05-10)
TASK-12 (hook bridge — needs alert type from 04)
TASK-13 (template — no code deps, can run after 09-10)
    ↓
TASK-14 (supervisor prompt — needs all types to be named correctly)
TASK-15 (worker prompt — can run parallel with 14)
    ↓
TASK-16 (full verify — runs last)
```

---

*End of plan. 16 Codex tasks, 5 component groups, 4 implementation phases.*
