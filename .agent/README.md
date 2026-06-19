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

## `.agent/skills-core/` + `.agent/adapters/` — vendor-neutral skills

A skill's **process** (when to use, required steps, never-do, output contract) lives once
in `skills-core/<skill>/SKILL.md` + `contract.json`; each provider gets only a **thin
adapter** (`adapters/<vendor>/<skill>.md` + `<skill>.manifest.json`) that maps the steps
to that provider's tools — no policy of its own.

`npm run skills:validate` (`scripts/validate-skills.ts`, also covered by `npm test`)
enforces no drift: adapter `skill_id`/`core_version` must match, every `required_steps`
must be mapped, every `forbidden_actions` must be preserved, and an adapter may not
restate governance language (`source of truth`, `stop condition`, ALL-CAPS `MUST`/`NEVER`).
Skills: `safe-refactor`, `repo-review` with `codex` / `claude` / `antigravity` adapters.

## `.agent/lessons/` — issue-ledger memory

`issues.jsonl` is a curated, redacted issue store (`@/lib/issue-ledger`); `npm run
lessons:digest` aggregates it by failure category.

## `.agent/antigravity/` — Context7 wiring for the Gemini lane

A reviewable template + owner-apply instructions for adding Context7 to the owner's global
`~/.gemini/config/mcp_config.json` (outside this repo). See
[`.agent/antigravity/README.md`](antigravity/README.md).
