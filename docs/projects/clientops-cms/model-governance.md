# Model & Agent Governance (ClientOps)

Date: 2026-06-19
Status: v0.1 tooling — pure, deterministic, advisory-only
Scope: governs **how automation spends advisory model capacity**. It does not own state
(Payload/Postgres is canonical) and does not make model output authoritative.

Migrated from the archived `autopilot-control-plane-v0.2.0` (validated there by a real
3-vendor brainstorm: Claude Opus + OpenAI Codex + Antigravity Gemini 3.1 Pro), re-homed
into the active ClientOps structure per `archive/README.md`.

## What this adds

| Module | Purpose |
|---|---|
| `@/lib/model-spend` | burn-rate policy + `classifyBudgetState` traffic light |
| `@/lib/usage-ledger` | `UsageLedgerEntry` / `ProviderBudget` contracts + validators |
| `@/lib/lane-selector` | `selectLane` — fit-dominant routing, budget as a late gate |
| `@/lib/usage-dashboard` | work-share vs target + capacity dashboard (`npm run usage:dashboard`) |
| `@/lib/agent-dispatch` | guard: never dispatch a lost/empty prompt from a volatile path |
| `@/lib/failure-taxonomy` | fixed failure category set (`failure_tags`) |
| `@/lib/issue-ledger` | redacted issue entry + `lesson_learned` + validator |
| `@/lib/lessons-digest` | normalizes lessons into a routable digest, aggregated `by_category` (`npm run lessons:digest`) |
| `@/lib/advisory-boundary` | the wired entry point: guards + budget-gates an advisory consult and emits a workflow event |

Evidence lives under `.agent/usage/` and `.agent/lessons/` (redacted; templates and the
curated issue store committed, live ledgers git-ignored). See `.agent/README.md`.

## Runtime wiring — the advisory boundary

ClientOps has no advisory-model call site yet (the runtime is deterministic). When one is
added, it goes through `@/lib/advisory-boundary`. Design hardened by a 3-vendor review
(Opus + Codex + Gemini), which flagged two real issues in the first draft.

- **Policy primitive, not a hard boundary (honest framing).** `prepareAdvisoryConsultation`
  is pure — it *cannot* stop a caller from executing a model or writing canonical state.
  Real isolation also requires the model client + credentials to live only behind a
  sanctioned executor (a follow-up). What it guarantees is a guarded, budget-gated
  decision plus honest evidence.
- **Guard + budget gate.** `validateAgentDispatchPacket` (never an empty/lost prompt) +
  `classifyBudgetState`; a red budget blocks unless `allow_red_budget` is set.
- **Two-phase audit (the key fix).** A prepared event is not a model call. The boundary
  emits `advisory_consult_prepared`; after the caller runs the model it MUST emit the
  paired `advisory_consult_completed` via `recordAdvisoryOutcome` with the **actual**
  tokens, latency, provider txn id, and remaining budget — reconciling the pre-flight
  estimate with reality. Both event types are in `workflowEventTypes` (auto-propagated to
  the Payload `workflow-events` select); `actorType: 'mesh'` with `initiated_by` in the
  payload so accountability is not laundered.
- **Deterministic dedupe.** `consultation_key` is a hash over the durable inputs
  (correlationId, dispatch_id, lane, provider, model, task_type, prompt_path) and links the
  prepared and completed events; idempotency keys are `advisory:prepared:<key>` /
  `advisory:completed:<key>`.
- **Privacy.** Only the durable `prompt_path` and routing metadata are recorded — never the
  raw prompt.

Follow-ups surfaced by the review (not in this PR): a credential-owning `execute`
wrapper that makes isolation enforced rather than conventional; budget *reservation* for
concurrent workers; HITL routing for blocked/low-confidence consults; and admin-friendly
event labels/Payload rendering.

## Rules

- `remaining_pct` is a **0..1 fraction**; unmetered surfaces → `unknown`, classified as
  **yellow** (never a fabricated green).
- **Do not equalize burn** across providers — route by suitability
  (`eligibility → privacy_fit → task_fit → cost_state → recent_quality → availability`);
  budget is only a late gate.
- A model/agent prompt is **persisted to a durable path before dispatch** and is never
  empty — enforced by `validateAgentDispatchPacket`.
- All model output stays **advisory** until local code, tests, or a human decision adopts
  it (ClientOps core rule).

## Agent skills & Context7

- Vendor-neutral skills + thin per-vendor adapters under `.agent/skills-core/` +
  `.agent/adapters/`, with a drift check (`npm run skills:validate`,
  `scripts/validate-skills.ts`; also run by `npm test`). Skills: `safe-refactor`,
  `repo-review`.
- Context7 wiring for the Gemini lane: reviewable template + owner-apply instructions in
  `.agent/antigravity/` (the global `~/.gemini` config is an owner step; already applied).

The control-plane learning loop is fully migrated to ClientOps and wired to the workflow
event model through the advisory boundary.
