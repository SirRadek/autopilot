# `.agent/` — model & agent governance evidence

Cross-vendor governance tooling for ClientOps. It governs **how automation spends
advisory model capacity** — consistent with the core rule that model output is advisory
and Payload/Postgres is the source of truth. Nothing here is canonical state.

## `.agent/usage/` — shared evidence/ledger spine

One append-only, **redacted** store drives burn-rate governance (no raw prompts, secrets,
or transcripts).

| File | What | Contract / validator |
|---|---|---|
| `usage-ledger.jsonl` | one line per meaningful model run | `UsageLedgerEntry` + `validateUsageLedgerEntry` (`@/lib/usage-ledger`) |
| `provider-budget.json` | per-provider capacity snapshot | `ProviderBudget` + `validateProviderBudget` |

Dashboard: `npm run usage:dashboard` (`scripts/usage-dashboard.ts`) renders work-share vs
target and a capacity traffic light per provider; lane recommendation in
`@/lib/lane-selector`; traffic-light in `@/lib/model-spend` (`classifyBudgetState`).

### Rules

- `remaining_pct` is a **0..1 fraction**, not 0..100.
- **Never fabricate a burn number.** No meter → `quota_source: unknown`,
  `measurement_confidence: unknown|low`, `remaining_pct: null`; `classifyBudgetState`
  then returns **`yellow`** (caution).
- **Do not equalize burn** — route by suitability
  (`eligibility → privacy_fit → task_fit → cost_state → recent_quality → availability`);
  budget is a late-stage gate only.

The `*.example.*` files are committed templates; live ledgers are git-ignored.
