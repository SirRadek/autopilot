# ClientOps CMS Work Log

## 2026-06-12

Date: 2026-06-12
Request or trigger: Build first ClientOps CMS, recover Docker/Postgres, and connect workflow to a project-specific Decision Mesh.
Mode: WRITE_ALLOWED
Scope: Local repository scaffold, Docker runtime diagnosis and recovery, project mesh onboarding, workflow contract planning.
Files changed: Next/Payload scaffold, tests, Docker Compose, seed script, implementation plan, and project mesh planning artifacts.
Architecture impact: establishes ClientOps CMS as a supervised project with its own architecture record and project-specific Decision Mesh.
Decisions:

- Payload/Postgres owns canonical state.
- Workflow events are append-only audit evidence.
- Autopilot root mesh stays separate from ClientOps CMS project mesh.
- Claude/Gemini outputs are advisory only.
- Workflow automation waits for auth, idempotency, retry, and manual override gates.

Verification:

- Docker Desktop runtime recovered through `desktop-linux`.
- `docker compose up -d --wait` started healthy Postgres.
- `docker compose exec -T postgres pg_isready -U postgres -d autopilot_clientops` accepted connections.
- `npm.cmd run seed` completed twice and kept one user/client/project/site/form record each.
- `/admin` returned `200`.
- `/api/workflow/tasks` returned `200`.
- `POST /api/public/leads` returned `201` and created `leadId` plus `taskId`.
- `npm.cmd run typecheck` passed after fixing seed and workflow typing.
- `npm.cmd test -- tests/leads.test.ts tests/workflow.test.ts` passed.

Risks:

- `/api/workflow/tasks` still needs auth before mesh ingress.
- Idempotency, retry metadata, and manual override audit are planned but not fully implemented.
- Full build/lint verification still needs to be rerun after docs and runtime script changes.

Follow-up:

- Add health/readiness endpoints.
- Add mesh contract helpers and collection fields.
- Secure workflow task mutation with `MESH_SERVICE_TOKEN`.
- Add idempotent lead/task creation and retry/dead-letter helpers.

## 2026-06-12 Runtime And Auth Gate Slice

Date: 2026-06-12
Request or trigger: Continue implementation plan task-by-task and satisfy runtime/auth gates before further mesh automation.
Mode: WRITE_ALLOWED
Scope: Runtime health endpoints, smoke tooling, mesh contract helpers, workflow task mutation auth.
Files changed: `src/lib/runtime-health.ts`, `src/app/api/health/route.ts`, `src/app/api/ready/route.ts`, `tests/runtime-health.test.ts`, `scripts/smoke-clientops.ps1`, `src/lib/mesh-contracts.ts`, `tests/mesh-contracts.test.ts`, `src/lib/mesh-auth.ts`, `tests/api-auth.test.ts`, `src/app/api/workflow/tasks/route.ts`, `.env.example`, `.env`, `README.md`.
Architecture impact: adds explicit process health versus DB readiness, introduces shared mesh contract constants, and makes workflow task mutation token-gated before mesh ingress.
Decisions:

- `/api/health` proves the Next process is responding without requiring DB readiness.
- `/api/ready` proves Payload can query Postgres and returns `503` when DB-backed runtime is blocked.
- `POST /api/workflow/tasks` requires `MESH_SERVICE_TOKEN`.
- `GET /api/workflow/tasks` remains readable for local inspection until a separate read-boundary decision.

Verification:

- `npm.cmd test -- tests/runtime-health.test.ts` passed.
- `npm.cmd test -- tests/mesh-contracts.test.ts` passed.
- `npm.cmd test -- tests/api-auth.test.ts` passed.
- `npm.cmd run typecheck` passed after each slice.
- `/api/health` returned `200`.
- `/api/ready` returned `200`.
- `scripts/smoke-clientops.ps1` returned health `200`, ready `200`, workflow GET `200`, and public lead POST `201`.
- Unauthenticated `POST /api/workflow/tasks` returned `401`.
- Authenticated `POST /api/workflow/tasks` with local `MESH_SERVICE_TOKEN` returned `201`.
- `npm.cmd run lint` passed.
- `npm.cmd test` passed with 21 tests.
- `npm.cmd run build` passed and includes `/api/health` and `/api/ready` routes.
- `docker compose ps` reported `autopilot-postgres-1` as `healthy`.
- `npm.cmd audit --audit-level=moderate` still reports the known transitive `esbuild` issue under `@payloadcms/db-postgres`/`drizzle-kit`; no clean npm fix is available.

Risks:

- Idempotency for public lead/task creation is still not fully implemented.
- Retry/dead-letter/manual override helpers are still pending.
- Collection-level mesh fields are still pending.
- Transitive `esbuild` audit risk remains accepted for this local tooling slice until upstream dependencies provide a clean upgrade path.

Follow-up:

- Implement collection mesh fields and idempotent lead/task creation.
- Add retry/dead-letter helpers and manual override audit.
- Re-run Claude/Gemini bounded advisory review before connecting any external automation.

## 2026-06-12 Mesh Contract And Retry Slice

Date: 2026-06-12
Request or trigger: Continue Docker/mesh implementation plan with collection mesh fields, idempotent lead intake, retry helpers, PATCH transitions, and external advisory re-review.
Mode: WRITE_ALLOWED
Scope: Payload collection mesh fields, idempotent public lead workflow, deterministic task IDs, retry/dead-letter helpers, PATCH transition validation, manual override audit hooks, bounded Gemini advisory review.
Files changed: `src/collections/Leads.ts`, `src/collections/Tasks.ts`, `src/collections/WorkflowEvents.ts`, `src/lib/leads.ts`, `src/lib/workflow.ts`, `src/app/api/public/leads/route.ts`, `src/app/api/workflow/tasks/route.ts`, `tests/leads.test.ts`, `tests/workflow.test.ts`, `tests/task-retry.test.ts`, `scripts/seed.ts`, `docs/projects/clientops-cms/advisory-prompt.md`, `docs/projects/clientops-cms/decision-mesh/retry-and-error-policy.md`, `docs/projects/clientops-cms/decision-mesh/manual-override.md`, `docs/projects/clientops-cms/decision-mesh/event-contracts.md`, `.gitignore`.
Architecture impact: mesh-facing lead/task/event records now carry correlation, idempotency, project, actor, retry, error, and audit metadata; public lead intake is replay-safe; workflow task mutation validates canonical state transitions.
Decisions:

- Existing legacy task states remain selectable during local migration, while new workflow writes use canonical `queued`, `running`, `failed`, and related mesh states.
- New workflow event fields remain optional at schema level for existing rows, but new code writes complete event envelopes.
- Public lead dedupe uses `source:idempotencyKey` and creates a blocked review task on collision instead of overwriting lead evidence.
- `scripts/seed.ts` loads `.env` before importing Payload config so local seed works outside a preloaded shell.
- External worker automation is still deferred until lock/claim semantics and retryable/non-retryable error classification are enforced.

Verification:

- Database backup captured at `backups/autopilot_clientops_20260612204400.sql` before schema changes.
- `npx.cmd payload generate:types` completed after collection changes.
- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed with 29 tests.
- `npm.cmd run build` passed.
- `docker compose up -d --wait` reported healthy Postgres.
- `npm.cmd run seed` passed twice after env-loading fix.
- `scripts/smoke-clientops.ps1` returned health `200`, ready `200`, workflow GET `200`, and public lead POST `201`.
- Public replay test returned first POST `201`, second POST `200`, same lead/task, and original `correlationId`.
- Public collision test returned `202` with `collision: true`; repeated collision returned the same blocked task.
- PATCH transition test returned unauthenticated `401`, valid transitions `200`, terminal-to-active without override `409`, and terminal-to-active with override `200`.
- Workflow event inspection showed `task_started`, `task_failed`, `task_blocked`, and `manual_override_applied` events with correlation and actor fields.

External advisory:

- Claude: current bounded re-review did not run because the CLI reported a session limit reset; no new Claude output was adopted. Earlier Claude architecture/security critique remains incorporated in the implementation plan as advisory-only input.
- Gemini: bounded advisory review completed. Must-fix before external automation: enforce task lock/claim semantics, classify retryable versus non-retryable failures, and keep terminal-to-active transitions behind manual override evidence.
- Adopted changes: project mesh retry/manual-override/event docs now record worker lock, failure classification, max-attempt terminal behavior, and terminal transition stop conditions.
- Rejected or deferred changes: scoped tokens, DLQ dashboard, retry jitter, and stronger admin UI reason capture are acceptable later until external workers are connected.

Risks:

- Admin Payload edits are audited with a generic `payload_admin_state_change` reason; a richer reason field should be added before non-technical operators use manual override heavily.
- Worker lock/claim enforcement is documented but not yet implemented as a claim endpoint; do not connect parallel workers yet.
- Transitive `esbuild` audit risk remains under Payload/Drizzle tooling until upstream dependencies provide a clean fix.

Follow-up:

- Add worker claim endpoint and lock expiration handling before external automation.
- Add explicit retryable/non-retryable error classification to worker payloads.
- Run Claude re-review again after the session limit resets if the next automation phase depends on Claude-specific critique.

## 2026-06-12 Final Verification Slice

Date: 2026-06-12
Request or trigger: Complete Docker and Decision Mesh baseline verification after implementing auth, idempotency, retry, PATCH transitions, and advisory review.
Mode: WRITE_ALLOWED
Scope: Final static verification, Docker-backed verification, audit check, and handoff evidence.
Architecture impact: confirms ClientOps CMS can operate locally with Postgres-backed Payload, project-specific Decision Mesh docs, token-gated workflow mutation, replay-safe public lead intake, and audited task transitions.
Verification:

- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed with 29 tests.
- `npm.cmd run build` passed.
- `docker compose up -d --wait` reported healthy Postgres.
- `docker compose exec -T postgres pg_isready -U postgres -d autopilot_clientops` accepted connections.
- `npm.cmd run seed` passed twice after clearing a stale local `tsx -` verification process that held a DB transaction.
- `powershell -ExecutionPolicy Bypass -File scripts/smoke-clientops.ps1` passed after cleanup: health `200`, ready `200`, workflow GET `200`, public lead POST `201`.
- `npm.cmd audit --audit-level=moderate` still reports the known transitive `esbuild <=0.24.2` advisory through `@payloadcms/db-postgres` -> `drizzle-kit` -> `@esbuild-kit/esm-loader`; no non-force fix is available.

Decisions:

- Do not run `npm audit fix --force`; the remaining finding is a moderate transitive development tooling issue with no clean upstream fix in the current Payload dependency chain.
- Keep `backups/`, `.env`, and generated `src/payload-types.ts` ignored.
- Do not connect parallel external workers until lock/claim semantics are implemented.

Risks:

- Many Node processes from Codex/MCP and Next dev can exist on the workstation; future diagnostics should filter by command line before stopping anything.
- The current local DB includes smoke-test leads/tasks/events; they are useful runtime evidence, not production data.

Follow-up:

- Add a worker claim endpoint and tests for `lockedBy`/`lockedUntil`.
- Add operator-facing manual override reason capture in Payload admin.
- Re-run Claude advisory after the subscription/session reset before the next automation phase.

## 2026-06-13 Worker Claim Lock Slice

Date: 2026-06-13
Request or trigger: Continue the next automation precondition after the Docker/mesh baseline.
Mode: WRITE_ALLOWED
Scope: Worker claim/lock helpers, `PATCH /api/workflow/tasks` lock enforcement, runtime claim verification, and mesh documentation.
Files changed: `src/lib/workflow.ts`, `src/app/api/workflow/tasks/route.ts`, `tests/task-retry.test.ts`, `README.md`, `docs/projects/clientops-cms/decision-mesh/retry-and-error-policy.md`, `docs/projects/clientops-cms/work-log.md`.
Architecture impact: worker mutations now require an explicit task claim through `lockedBy` and `lockedUntil`, reducing accidental parallel execution before external automation is connected.
Decisions:

- `state: "claimed"` creates or renews a worker lock for the supplied `actorId`.
- Non-manual worker transitions require the same `actorId` and an unexpired lock.
- Retry, blocked, waiting-owner, queued, failed, cancelled, and done outcomes release the worker lock.
- Manual override remains the only lock bypass path and records override evidence through the existing event contract.

Verification:

- `npm.cmd test -- tests/task-retry.test.ts` passed with worker lock helper coverage.
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed.
- Runtime API claim test on a new manual task passed: worker update without claim returned `423`, claim returned `200`, different worker returned `423`, owning worker moved `running` and `done` with `200`, and final `done` released `lockedBy`/`lockedUntil`.

Risks:

- Claim enforcement is application-level through Payload local API. Before high-concurrency worker pools, add a DB compare-and-set or transactional claim path.

## 2026-06-13 Opportunity And Usage Mesh Slice

Date: 2026-06-13
Request or trigger: Brainstorm opportunity monitor deployment and Autopilot mesh usage limits with Claude, Gemini, GPT/Codex, then update mesh and process verified follow-up fixes.
Mode: WRITE_ALLOWED
Scope: Autopilot root control-plane mesh docs, ClientOps opportunity monitor mesh docs, workflow task API auth/retry hardening, advisory-output governance, and runtime verification.
Files changed: `docs/autopilot/decision-mesh/`, `docs/projects/clientops-cms/decision-mesh/`, `docs/superpowers/specs/2026-06-13-cz-sk-it-opportunity-monitor-design.md`, `docs/superpowers/specs/2026-06-13-autopilot-mesh-usage-limits-design.md`, `src/lib/mesh-contracts.ts`, `src/lib/workflow.ts`, `src/app/api/workflow/tasks/route.ts`, `src/collections/Leads.ts`, `src/collections/Tasks.ts`, `tests/mesh-contracts.test.ts`, `tests/task-retry.test.ts`, `scripts/smoke-clientops.ps1`, `.env.example`, `README.md`, `docs/projects/clientops-cms/architecture.md`.
Architecture impact: creates a separate Autopilot root control-plane mesh home and keeps ClientOps opportunity monitor governance inside the ClientOps project mesh. Workflow task read access now uses the same mesh token boundary as mutation, and retry claims respect backoff windows.

Decisions:

- Autopilot provider usage, model routing, advisory-run lifecycle, paid route approval, and model-output quality gates live under `docs/autopilot/decision-mesh/`.
- ClientOps opportunity monitor lifecycle, retention, and scrapeflow boundaries live under `docs/projects/clientops-cms/decision-mesh/`.
- Opportunity monitor implementation can proceed in deterministic-only mode without waiting for the usage-limit control plane.
- Live opportunity source runs remain blocked until fixture ingest, dedupe, collision, allowed-host, scoped-token, and purge tests exist.
- `OPPORTUNITY_INGEST_TOKEN` is the future ingest token; it must not be replaced by `MESH_SERVICE_TOKEN`.
- Opportunity workflow events must be PII-free.
- Advisory model output remains advisory until local verification, tests, official docs, source pointers, or human acceptance support adoption.

External advisory:

- Claude: full-repo sanitized advisory completed after retry with read-only tools. Adopted findings: root mesh must be separate, opportunity event types must precede event writes, workflow GET auth was a privacy blocker, opportunity retention/event payloads must be PII-free, and scoped ingest token is required.
- Gemini: full-repo advisory completed but focused mostly on workflow task automation. Adopted findings: protect workflow GET, respect `nextRetryAt`, server owns retry metadata, and transactional/compare-and-set claim remains a future blocker before parallel workers.
- GPT/Codex/local evidence: primary source of implementation truth. Every adopted model finding was checked against local code or mesh docs before patching.

Verification:

- `npx.cmd payload generate:types` completed after event type changes.
- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed with 34 tests.
- JSON parse validation passed for `docs/autopilot/decision-mesh/schemas/provider-status.schema.json` and `docs/autopilot/decision-mesh/schemas/advisory-run-record.schema.json`.
- `npm.cmd run build` passed.
- Docker Postgres remained healthy; `pg_isready` accepted connections.
- Temporary production server on port `3100` returned health `200`, ready `200`, authenticated workflow GET `200`, and public lead POST `201`.
- Port `3100` was confirmed closed after the temporary server was stopped.

Processed follow-up fixes:

- `GET /api/workflow/tasks` now requires `MESH_SERVICE_TOKEN`.
- `workflowEventTypes` includes opportunity event types before opportunity event writes are implemented.
- Worker claims are blocked until `nextRetryAt`.
- `PATCH /api/workflow/tasks` owns retry attempt/backoff updates for `state: "retrying"`.
- Retry exhaustion emits `task_dead_lettered` when the request to retry moves the task to `failed`.
- Manual override audit skip requires a truthy `skipManualOverrideAudit`.
- Smoke script avoids dumping raw workflow/lead payload content.

Deferred follow-up:

- Add opportunity collections, protected ingest endpoint, fixture import, dedupe/collision tests, and purge tests.
- Add opportunity relationships to workflow event evidence after opportunity collections exist.
- Add transactional or compare-and-set claim handling before parallel external worker pools.
- Add PATCH idempotency for repeated worker state updates.
- Add worker-scoped tokens and richer admin override reason capture before multi-worker or non-technical operator use.

## 2026-06-14 Opportunity Before-Live Slice

Date: 2026-06-14
Request or trigger: Continue with the opportunity monitor and complete everything required before live opportunity source runs.
Mode: WRITE_ALLOWED
Scope: Local deterministic opportunity collections, ingest route, purge route, fixture source, fixture smoke, tests, and mesh documentation.
Files changed: `src/collections/OpportunitySources.ts`, `src/collections/OpportunityRuns.ts`, `src/collections/OpportunityItems.ts`, `src/collections/OpportunityReviews.ts`, `src/lib/opportunities.ts`, `src/app/api/opportunities/ingest/route.ts`, `src/app/api/opportunities/purge/route.ts`, `src/payload.config.ts`, `src/collections/WorkflowEvents.ts`, `src/lib/workflow.ts`, `tests/opportunities.test.ts`, `tests/opportunity-routes.test.ts`, `scripts/seed.ts`, `scripts/fixtures/opportunity-ingest.json`, `scripts/smoke-opportunities.ps1`, `README.md`, `docs/projects/clientops-cms/architecture.md`, `docs/projects/clientops-cms/decision-mesh/`, `docs/superpowers/specs/2026-06-13-cz-sk-it-opportunity-monitor-design.md`.
Architecture impact: ClientOps CMS now has local deterministic opportunity ingest and purge foundations. Live source collection is still deliberately blocked until a reviewed source adapter is added.

Decisions:

- `opportunity-sources` owns source configuration, enabled state, allowed hosts, and terms-review evidence.
- `opportunity-runs` owns import run idempotency and import metrics.
- `opportunity-items` owns opportunity lifecycle and personal-data retention state.
- `opportunity-reviews` owns human decision evidence.
- `workflow-events` may link to opportunity source/run/item records, but event payloads stay PII-free.
- `OPPORTUNITY_INGEST_TOKEN` is scoped to ingest only. Manual purge uses `MESH_SERVICE_TOKEN`.
- Fixture smoke uses `portal.example.cz` only and does not call live portals.

Verification:

- `npx.cmd payload generate:types` completed after collection and event relationship changes.
- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed with 40 tests.
- `npm.cmd run build` passed and includes `/api/opportunities/ingest` and `/api/opportunities/purge`.
- Backup captured at `backups/autopilot_clientops_before_opportunities_20260614072940.sql` before runtime schema use.
- `npm.cmd run seed` completed and created/updated the fixture opportunity source.
- Temporary production server on port `3100` returned health `200`, ready `200`, workflow GET `200`, public lead POST `201`, and opportunity fixture ingest `201`.
- Replaying the same opportunity fixture through the endpoint returned `200`.
- Port `3100` was confirmed closed after the temporary server stopped.

Processed follow-up:

- Opportunity collections implemented.
- Protected opportunity ingest endpoint implemented.
- Protected manual purge endpoint implemented.
- Fixture import/replay/duplicate/collision/purge tests implemented.
- Workflow events can reference opportunity source/run/item records.
- Seed and smoke scripts support local fixture verification.

Remaining before live source runs:

- Review source terms and allowed hosts for the first real source.
- Add a concrete scrapeflow adapter for that reviewed source.
- Run fixture smoke on the target runtime before enabling the source.
- Decide whether manual purge is enough for the first live source or add scheduled purge.

Remaining before parallel external workers:

- Add transactional or compare-and-set claim handling.
- Add PATCH idempotency for repeated worker state updates.
- Add worker-scoped tokens if more than one external worker is connected.

## 2026-06-14 Hlídač Státu Live Runner Slice

Date: 2026-06-14
Request or trigger: Continue opportunity monitor and make it live.
Mode: WRITE_ALLOWED
Scope: First live opportunity source runner, explicit provider token/commercial approval gates, source seed, docs, and tests.
Files changed: `src/lib/live-opportunities.ts`, `src/app/api/opportunities/live/hlidac-statu/route.ts`, `tests/live-opportunities.test.ts`, `scripts/run-hlidac-live-opportunities.ps1`, `scripts/seed.ts`, `.env.example`, `README.md`, `docs/projects/clientops-cms/architecture.md`, `docs/projects/clientops-cms/decision-mesh/live-sources.md`, `docs/projects/clientops-cms/decision-mesh/opportunity-monitor.md`, `docs/projects/clientops-cms/decision-mesh/runtime-health.md`, `docs/projects/clientops-cms/decision-mesh/follow-up-fixes.md`, `docs/superpowers/specs/2026-06-13-cz-sk-it-opportunity-monitor-design.md`.
Architecture impact: first live provider route exists and maps public procurement results into the same audited opportunity ingest contract. It is intentionally precondition-gated because provider search requires an API token and explicit commercial/license approval.

Decisions:

- Use Hlídač Státu public procurement API as the first live source instead of scraping HTML demand portals.
- Route provider results through `createOpportunityImport` so dedupe, collision, retention, and PII-free event rules stay shared.
- Keep provider token server-side in `HLIDAC_STATU_API_TOKEN`.
- Require `HLIDAC_STATU_COMMERCIAL_APPROVED=true` before provider fetch.
- Use `MESH_SERVICE_TOKEN` for the local live run endpoint.
- Keep contact email/phone blank for this source; no outreach automation is added.

Provider evidence checked on 2026-06-14:

- Swagger declares API version, terms URL, CC BY 3.0 CZ license, and 4 req/s rate limit.
- API docs state token authorization is required and free-license reuse requires attribution.
- Swagger description for `/api/v2/verejnezakazky/hledat` says the public procurement search API is for commercial-license holders, with limited testing without commercial license.

Verification:

- New tests cover URL construction, tender-to-opportunity mapping, no-fetch gating without token/approval, and mocked live provider import.
- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed with 44 tests.
- `npm.cmd run build` passed and includes `/api/opportunities/live/hlidac-statu`.
- `npm.cmd run seed` completed and created/updated source `hlidac-statu-vz-it`.
- Runtime smoke passed for health, ready, workflow GET, public lead POST, and opportunity fixture ingest.
- Runtime precondition check for `/api/opportunities/live/hlidac-statu` returned `412` when `HLIDAC_STATU_API_TOKEN` and commercial approval were absent, before provider fetch.
- Local `.env` currently has no Hlídač token and no commercial approval flag, so no real provider request was made.

Remaining:

- Configure real `HLIDAC_STATU_API_TOKEN` and set `HLIDAC_STATU_COMMERCIAL_APPROVED=true` only after license/account confirmation.
- Run `scripts/run-hlidac-live-opportunities.ps1` against the target runtime.
- Add attribution display/export before publishing or sharing provider-derived data outside the local CMS.

## 2026-06-14 Generic Web-Source Live Runner Slice

Date: 2026-06-14
Request or trigger: Hlidac Statu is not required if other websites are connected and can provide opportunity information.
Mode: WRITE_ALLOWED
Scope: Make the default live opportunity path source-agnostic, keep Hlidac optional, and gate direct web fetches through reviewed source metadata.
Files changed: `src/lib/live-opportunities.ts`, `src/app/api/opportunities/live/web-source/route.ts`, `src/collections/OpportunitySources.ts`, `tests/live-opportunities.test.ts`, `tests/opportunity-routes.test.ts`, `scripts/seed.ts`, `scripts/run-web-source-opportunities.ps1`, `scripts/fixtures/opportunity-web-source.json`, `.env.example`, `README.md`, `docs/projects/clientops-cms/architecture.md`, `docs/projects/clientops-cms/decision-mesh/live-sources.md`, `docs/projects/clientops-cms/decision-mesh/opportunity-monitor.md`, `docs/projects/clientops-cms/decision-mesh/runtime-health.md`, `docs/projects/clientops-cms/decision-mesh/follow-up-fixes.md`, `docs/superpowers/specs/2026-06-13-cz-sk-it-opportunity-monitor-design.md`.
Architecture impact: default live import no longer depends on a single provider token or Hlidac license approval. A generic `web-source` runner can import normalized rows or fetch explicit allowlisted URLs after source terms and robots review.

Decisions:

- Default live source is `reviewed-web-cz-it`.
- `POST /api/opportunities/live/web-source` uses `MESH_SERVICE_TOKEN`.
- Source configuration now records `sourceType`, `robotsReviewedAt`, and `maxUrlsPerRun`.
- URL mode fetches only explicit URLs, never crawls a full site.
- Hlidac Statu remains available as a disabled optional API adapter.

Verification:

- Added tests for HTML-to-opportunity mapping, host allowlist blocking, robots blocking, mocked web fetch import, and unauthenticated route rejection.
- `npm.cmd test -- tests/live-opportunities.test.ts` passed with 49 tests.
- `npm.cmd test -- tests/opportunity-routes.test.ts` passed with 49 tests.

Remaining:

- Add real hosts to `reviewed-web-cz-it` in Payload after terms and robots review.
- Run `scripts/run-web-source-opportunities.ps1` on the target runtime.
- Decide whether manual purge is enough for the first real web-source run or add scheduled purge.
