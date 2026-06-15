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
