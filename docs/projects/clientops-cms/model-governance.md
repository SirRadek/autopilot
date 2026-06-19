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

Evidence lives under `.agent/usage/` and `.agent/lessons/` (redacted; templates and the
curated issue store committed, live ledgers git-ignored). See `.agent/README.md`.

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

## Follow-ups (staged)

- Vendor-neutral skills + `skills:validate` drift check.
- Context7 wiring for the Gemini lane (already applied to the owner's global Antigravity
  config; repo template to follow).
