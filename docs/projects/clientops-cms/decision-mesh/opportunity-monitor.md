# Opportunity Monitor

The opportunity monitor belongs to the ClientOps CMS project mesh. It collects reviewable public opportunity evidence and keeps commercial decisions inside Payload/Postgres.

Canonical state owners:

- `opportunity-sources`: source configuration and terms-review status.
- `opportunity-runs`: one collection/import attempt and its import metrics.
- `opportunity-items.status`: opportunity lifecycle.
- `opportunity-items.personalDataExpiresAt`: retention deadline.
- `opportunity-items.personalDataPurgedAt`: authoritative purge marker.
- `opportunity-reviews`: human review decision evidence.
- `workflow-events`: append-only audit evidence with PII-free payloads.

Required lifecycle states:

- `new`
- `reviewing`
- `blocked`
- `responded`
- `converted`
- `ignored`
- `purged`

Deployment gates:

- Scrapeflow interface contract is documented before live source runs.
- Source terms and allowed hosts are reviewed before a source is enabled.
- Ingest endpoint uses `OPPORTUNITY_INGEST_TOKEN`, not `MESH_SERVICE_TOKEN`.
- `sourceKey + rowFingerprint` or a computed `dedupeKey` is unique.
- Replayed `idempotencyKey` returns the existing run or item.
- Contact fields receive `personalDataExpiresAt` at import.
- Contact fields are purged immediately after response or conversion and no later than the retention deadline.
- `GET /api/workflow/tasks` is authenticated before opportunity data can create linked workflow tasks.
- Opportunity event payloads do not include email, phone, requester name, raw snippet contact data, or normalized contact payloads.

Current local status:

- `opportunity-sources`, `opportunity-runs`, `opportunity-items`, and `opportunity-reviews` are implemented.
- `POST /api/opportunities/ingest` is protected by `OPPORTUNITY_INGEST_TOKEN`.
- `POST /api/opportunities/purge` is protected by `OPPORTUNITY_PURGE_TOKEN`.
- `POST /api/opportunities/live/web-source` is protected by `OPPORTUNITY_LIVE_RUN_TOKEN`.
- Live web-source URL mode checks enabled source, allowed hosts, `termsReviewedAt`, `robotsReviewedAt`, and `maxUrlsPerRun`.
- Fixture ingest, replay, duplicate, collision, and purge behavior is covered by automated tests.
- `scripts/smoke-opportunities.ps1` posts only the local fixture payload.
- Default live source is `reviewed-web-cz-it`; Hlidac Statu is disabled at the route and returns `410`.

Model usage:

- Model-generated summaries, fit reasons, and suggested responses are advisory only.
- Opportunity lifecycle changes require a human action or verified local worker event.
- Usage-limit and provider routing policy comes from the Autopilot root mesh, not this project mesh.
- The opportunity monitor must keep a deterministic-only mode that works when all external model providers are unavailable.

Stop conditions:

- source terms or allowed hosts are unknown
- ingest endpoint is unauthenticated or uses a broad workflow token
- purge or live-source endpoints use the broad mesh read token
- live URL source terms, robots review, or allowed-host evidence is missing
- event payloads contain contact data
- retention fields are missing
- purge path is untested
- dedupe uniqueness is not schema-enforced
- model output is used as canonical state
- direct lead creation happens without human conversion review
- live source is enabled before fixture smoke passes on the target runtime
