# ClientOps CMS Decision Mesh

This project mesh governs ClientOps CMS only. It does not replace Autopilot's root operational mesh.

Covered surfaces:

- lead intake
- opportunity monitor
- workflow task queue
- workflow event audit trail
- runtime health
- human override
- advisory model usage

Project-specific docs:

- `source-of-truth.md`
- `event-contracts.md`
- `manual-override.md`
- `retry-and-error-policy.md`
- `runtime-health.md`
- `opportunity-monitor.md`
- `opportunity-retention.md`
- `scrapeflow-contract.md`
- `live-sources.md`
- `follow-up-fixes.md`

Primary capability: `automation_mesh`

Supporting capabilities:

- `data_mesh`
- `observability_mesh`
- `bot_rag_mesh`

Stop conditions:

- missing project mesh
- workflow task mutation without auth
- missing idempotency for retryable inputs
- opportunity ingest without scoped auth
- opportunity contact data stored in event payloads
- opportunity purge path untested
- model output used as canonical state
- Docker/Postgres runtime claimed operational without health evidence
