# Follow-Up Fixes

This list captures advisory findings that were checked against local code or mesh docs.

Processed on 2026-06-13:

- Authenticate `GET /api/workflow/tasks` with `MESH_SERVICE_TOKEN`.
- Add opportunity event types to `workflowEventTypes`.
- Block task claims before `nextRetryAt`.
- Let the server own retry attempt/backoff updates when `PATCH` requests `state: "retrying"`.
- Emit `task_dead_lettered` when retry exhaustion turns a retry request into `failed`.
- Make `skipManualOverrideAudit` require a truthy context value.
- Add `OPPORTUNITY_INGEST_TOKEN` to local environment documentation.
- Create Autopilot root control-plane mesh docs under `docs/autopilot/decision-mesh/`.
- Create ClientOps opportunity monitor, retention, and scrapeflow mesh docs.

Processed on 2026-06-14:

- Implement `opportunity-sources`, `opportunity-runs`, `opportunity-items`, and `opportunity-reviews` collections.
- Add unique opportunity row identity (`sourceKey + rowFingerprint` or computed `dedupeKey`).
- Add protected opportunity ingest endpoint using `OPPORTUNITY_INGEST_TOKEN`.
- Add fixture ingest, replay, duplicate, collision, and purge tests.
- Add relationship support for opportunity item/run/source evidence in workflow events after the collections exist.
- Add mesh-authenticated manual purge endpoint with idempotent replay.
- Add local fixture source seeding and `scripts/smoke-opportunities.ps1`.
- Add token-gated generic live web-source runner at `/api/opportunities/live/web-source`.
- Add source metadata for `sourceType`, `robotsReviewedAt`, and `maxUrlsPerRun`.
- Add `reviewed-web-cz-it` seed source and `scripts/run-web-source-opportunities.ps1`.
- Park `hlidac-statu-vz-it` as an optional disabled API adapter.

Queued before live opportunity source runs:

- Add real opportunity hosts to `reviewed-web-cz-it` only after terms and robots review.
- Run `scripts/run-web-source-opportunities.ps1` against the target runtime.
- For URL fetch mode, pass a payload with explicit allowlisted URLs and confirm `robotsReviewedAt`.
- Decide whether manual purge is enough for the first live source or add scheduled purge.

Queued before parallel external workers:

- Replace app-level find/update claim flow with a compare-and-set or transactional claim path.
- Add PATCH idempotency for repeated worker state updates.
- Add worker-scoped tokens when more than one external worker exists.
- Add operator-facing manual override reason capture in Payload admin.
- Add a dead-letter queue admin view or saved filter.
