# Autopilot Decision Mesh

This root mesh governs Autopilot control-plane work only. It does not own product or client project state.

Covered surfaces:

- model provider availability and usage-limit status
- advisory model run lifecycle
- model-output evaluation and adoption records
- paid route approval gates
- provider failure, missing-output, and fallback stop conditions
- redacted control-plane observability evidence

Out of scope:

- ClientOps CMS operational state
- project-specific lead, task, opportunity, or content lifecycle
- runtime logs copied from supervised projects
- direct writes to project databases, connectors, deployments, or remote services

Project meshes remain separate. A supervised project must keep its own mesh under `docs/projects/<project-slug>/decision-mesh/` and may reference this root mesh only for advisory-provider governance.

Current project mesh:

- `docs/projects/clientops-cms/decision-mesh/`

## MCP/Router Source Contract

The active router may use this directory for Autopilot provider/advisory governance only. It must not read or emit `must_read` entries from `archive/**`.

Explicit stale denylist:

- `AGENTS.md`
- `GEMINI.md`
- `src/auth/session.ts`
- `src/data/delivery-system/**`
- `docs/autopilot/delivery-system-model-policy.md`
- `archive/autopilot-control-plane-v0.2.0/**`

If one of those paths is needed again, first migrate the relevant policy into `docs/autopilot/decision-mesh/` or `docs/projects/clientops-cms/decision-mesh/`, then point the router at the migrated active file.

## Router Regeneration Recommendation

Regenerate or repoint the active MCP/router with an explicit source manifest instead of filesystem-wide discovery:

1. Build the manifest from the active allowlist only: `docs/autopilot/decision-mesh/`, `docs/projects/clientops-cms/decision-mesh/`, `docs/projects/clientops-cms/v0.1-project-index.md`, `docs/projects/clientops-cms/work-log.md`, and active runtime source under `src/`.
2. Exclude `archive/**`, `node_modules/**`, `.next/**`, historical plans, and any legacy v0.2.0 control-plane paths.
3. Add a router smoke check that calls the MCP for a ClientOps CMS task and fails if any returned `must_read` path starts with `archive/` or names `AGENTS.md`, `GEMINI.md`, `src/data/delivery-system/**`, `src/auth/session.ts`, or `docs/autopilot/delivery-system-model-policy.md`.
4. Keep the generated manifest or router config in the active root if it is repo-owned; if it is external MCP state, record the regeneration date and smoke-check result in `docs/projects/clientops-cms/work-log.md`.
5. Treat any future archived path in router output as a stop condition until the policy is migrated into the active mesh.

Control-plane rule:

- Local repository evidence, tests, official docs, and human approval outrank model output.
- Claude, Gemini, GPT, and other provider outputs are advisory until accepted through a documented adoption record.
- A failed provider run, missing model output, unknown provider status, or unapproved paid route becomes `blocked` or `waiting_owner`; it must not be silently skipped.
- Redacted summaries and source pointers may be recorded here. Secrets, `.env` values, raw private logs, database dumps, and customer/contact data must not be stored in this mesh.

Primary docs:

- `provider-status.md`
- `routing-policy.md`
- `advisory-run-lifecycle.md`
- `output-quality-gates.md`
- `stop-conditions.md`
- `schemas/provider-status.schema.json`
- `schemas/advisory-run-record.schema.json`
