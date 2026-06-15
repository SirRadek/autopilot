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

Processed on 2026-06-15:

- Split workflow task mutation to `WORKFLOW_MUTATION_TOKEN` while keeping workflow reads on `MESH_SERVICE_TOKEN`.
- Split opportunity purge to `OPPORTUNITY_PURGE_TOKEN`.
- Split live-source runs to `OPPORTUNITY_LIVE_RUN_TOKEN`.
- Disable the Hlidac Statu live route with `410` before auth, body parsing, Payload, or provider fetch.
- Add a production public lead intake guard requiring declared edge/proxy rate limiting and a positive body-size limit.
- Replace the worker claim `find` + `update` path with a DB-level compare-and-set predicate for `state: "claimed"` mutations.
- Disable Payload GraphQL and GraphQL Playground with `410` because they are not required for the current ClientOps CMS focus.
- Keep opportunity purge as PII redaction without changing the business `status`.
- Patch Payload packages to `3.85.1` and keep top-level `tsx` on `^4.22.4`.
- Pin transitive `esbuild` to `0.28.1` through npm overrides after verifying install, audit, lint, typecheck, tests, build, seed, and runtime health.
- Upgrade TypeScript to `6.0.3` with the explicit `ignoreDeprecations: "6.0"` transition marker for the existing `baseUrl` alias setup.
- Upgrade root Sharp to `0.35.1`.

Queued before live opportunity source runs:

- Add real opportunity hosts to `reviewed-web-cz-it` only after terms and robots review.
- Run `scripts/run-web-source-opportunities.ps1` against the target runtime.
- For URL fetch mode, pass a payload with explicit allowlisted URLs and confirm `robotsReviewedAt`.
- Decide whether manual purge is enough for the first live source or add scheduled purge.

Queued before parallel external workers:

- Add PATCH idempotency for repeated worker state updates.
- Verify atomic claim behavior under target-runtime concurrent workers.
- Add per-worker token rotation or identities when more than one external worker exists.
- Add operator-facing manual override reason capture in Payload admin.
- Add a dead-letter queue admin view or saved filter.
- Revisit ESLint 10 only after `eslint-plugin-import`, `eslint-plugin-react`, and `eslint-plugin-jsx-a11y` publish ESLint 10 peer support.
- Revisit `@types/node` 25 only after the local/runtime Node version moves from 24 to 25.
