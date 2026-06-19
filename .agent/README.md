# `.agent/` — cross-vendor evidence & skills home

This directory is the **cross-vendor** layer for the Autopilot control plane. Boundary
(decided in `docs/autopilot/agent-stack-and-skills-operating-model.md` §3.1, to avoid a
second source of truth — `CAP-PARALLEL-001`):

- `.agent/` — cross-vendor **usage evidence**, **skills-core + adapters**, and skill **outputs**
- `prompt-library/` — prompt **contracts**
- `.codex/` — Codex **hooks + redacted lifecycle state**

## `.agent/usage/` — the shared evidence/ledger spine

One append-only, **redacted** store serves both **burn-rate governance** and the
**learning loop** (mesh-map gaps G2/G5). No raw prompts, secrets, or transcripts.

| File | What | Contract / validator |
|---|---|---|
| `usage-ledger.jsonl` | one line per meaningful model run | `UsageLedgerEntry` + `validateUsageLedgerEntry` |
| `provider-budget.json` | per-provider capacity snapshot | `ProviderBudget` + `validateProviderBudget` |

Typed mirror & traffic light live in
[`src/data/delivery-system/modelSpend.ts`](../../src/data/delivery-system/modelSpend.ts)
(`burnGovernancePolicy`, `classifyBudgetState`); row/snapshot types in
[`src/data/delivery-system/usageLedger.ts`](../../src/data/delivery-system/usageLedger.ts);
validators in
[`src/lib/delivery-system/usageLedger.ts`](../../src/lib/delivery-system/usageLedger.ts);
tests in `tests/delivery-system/usage-ledger.test.ts`.

### Rules

- `remaining_pct` is a **0..1 fraction** (matches Antigravity `remainingPercentage`),
  not 0..100.
- **Never fabricate a burn number.** No meter → `quota_source: unknown`,
  `measurement_confidence: unknown|low`, `remaining_pct: null`. `classifyBudgetState`
  then returns **`yellow`** (caution), never a fake green.
- **Do not equalize burn** across providers — route by suitability
  (`eligibility → privacy_fit → task_fit → cost_state → recent_quality → availability`);
  budget is a late-stage gate only.
- Update the budget snapshot from the real meter you have, e.g.
  `antigravity-usage.cmd quota --refresh --json`, **before** a Gemini-lane call.

The `*.example.*` files are committed templates. Live per-project ledgers are
git-ignored (they are evidence, often per supervised project, and can be noisy).

## `.agent/skills-core/` + `.agent/adapters/` — vendor-neutral skills

A skill's **process** (when to use, required steps, never-do, output contract) lives once
in `skills-core/<skill>/SKILL.md` + `contract.json`; each provider gets only a **thin
adapter** (`adapters/<vendor>/<skill>.md` + `<skill>.manifest.json`) that maps the steps
to that provider's tools — no policy of its own.

`npm run skills:validate` (in `verify`,
[`scripts/validate-skills.ts`](../scripts/validate-skills.ts)) enforces no drift:
adapter `skill_id`/`core_version` must match, every `required_steps` must be mapped,
every `forbidden_actions` must be preserved, and an adapter may not restate governance
language (`source of truth`, `stop condition`, ALL-CAPS `MUST`/`NEVER`). Pilot skill:
`safe-refactor` with `codex` / `claude` / `antigravity` adapters. Tests (incl. planted
drift) in `tests/skills-validate.test.ts`.
