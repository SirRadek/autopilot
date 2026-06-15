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

Stop conditions are conditional gates. They describe states that must block automation when present; they are not a claim that every condition is currently true:

- missing project mesh
- workflow task mutation without auth
- missing idempotency for retryable inputs
- opportunity ingest without scoped auth
- workflow mutation, opportunity purge, or live-source run using the broad mesh read token
- lead, task, or opportunity contact data stored in workflow event payloads
- production public lead intake exposed without edge/proxy rate limiting and body-size limits
- opportunity purge path untested
- model output used as canonical state
- Docker/Postgres runtime claimed operational without health evidence
