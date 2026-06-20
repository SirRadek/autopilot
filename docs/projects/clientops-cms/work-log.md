# ClientOps CMS Work Log

## 2026-06-20

Date: 2026-06-20
Request or trigger: A control-plane branch (`claude/jovial-chaum-276e2e`, PR #13)
built expanded-domain prompt lanes on the pre-pivot root, which main had frozen
into `archive/`. Per the repo precedent (#7 -> #8), close the misdirected PR and
migrate only the portable concepts into the active structure.
Mode: WRITE_ALLOWED for active Decision Mesh governance docs only. No runtime,
schema, connector, or archive dependency changed.
Scope: add the role taxonomy and the capability-plus-data-privacy two-axis rule
as an explicit layer over the existing routing policy and lane selector.
Files changed:

- `docs/autopilot/decision-mesh/role-taxonomy.md` (new)
- `docs/autopilot/decision-mesh/README.md` (primary-docs index)
- `docs/autopilot/decision-mesh/routing-policy.md` (cross-link)
- `docs/projects/clientops-cms/work-log.md`

Architecture impact: makes explicit the decision-owner plus opponents pattern
(Opus decision owner; Codex implementation/technical opponent; Gemini strategic
opponent, redacted; Qwen local private worker) and the data-privacy axis
(canonical/private data stays with owner-subscription or local models; free-cloud
gets redacted packets only). It complements, and does not duplicate,
`model-governance.md` and `routing-policy.md`. No new runtime or source of truth.
Decisions:

- Do not bulk-port the archived prompt-library; the active structure stays lean.
- The broader domain framings (business, design, analysis, research, copywriting)
  remain archived migration source material, not active ClientOps lanes.
- PR #13 closed; branch `claude/jovial-chaum-276e2e` preserved as the
  control-plane reference snapshot.
- New work verified against `origin/main` before building (the recorded
  `pr-targeted-frozen-archive` lesson).

Verification:

- Docs-only change (new markdown plus index/cross-link edits); it does not touch
  the lint, type, test, or build surface.
- `npm run lint` and `npm run typecheck` were not run here because ClientOps
  dependencies are not installed in this worktree (`eslint` missing,
  `@types/node`/`payload` unresolved) — an environment gap, not a change effect.
  Re-run after `npm install` on a full ClientOps checkout.
- Manual check: no `archive/**` path is referenced as active source, so the
  Decision Mesh router source contract in `README.md` is preserved.

Risks:

- Role taxonomy is governance documentation; it has no runtime enforcement until
  the first real advisory provider integration uses it through the executor.

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
- `npm.cmd audit --audit-level=moderate` still reported the known transitive `esbuild` issue under `@payloadcms/db-postgres`/`drizzle-kit`; superseded by the 2026-06-15 dependency hygiene slice.

Risks:

- Idempotency for public lead/task creation is still not fully implemented.
- Retry/dead-letter/manual override helpers are still pending.
- Collection-level mesh fields are still pending.
- Transitive `esbuild` audit risk was accepted for this historical local tooling slice; superseded by the 2026-06-15 dependency hygiene slice.

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
- Transitive `esbuild` audit risk remained under Payload/Drizzle tooling in this historical slice; superseded by the 2026-06-15 dependency hygiene slice.

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

## 2026-06-15 Audit Remediation Safe Fixes Slice

Date: 2026-06-15
Request or trigger: Remediate high-confidence audit findings that already have clear Decision Mesh rules; leave unresolved policy choices for owner decision.
Mode: WRITE_ALLOWED
Scope: Payload access boundaries, workflow event append-only enforcement, PII-free workflow event payloads, lead idempotency collision strength, manual override attribution, opportunity purge redaction, project docs alignment, and remediation plan.
Files changed: `src/access/isAdmin.ts`, `src/collections/`, `src/globals/SiteSettings.ts`, `src/lib/workflow.ts`, `src/lib/opportunities.ts`, `src/app/api/workflow/tasks/route.ts`, `tests/access.test.ts`, `tests/workflow.test.ts`, `tests/workflow-route.test.ts`, `tests/opportunities.test.ts`, `README.md`, `docs/projects/clientops-cms/v0.1-project-index.md`, `docs/projects/clientops-cms/decision-mesh/README.md`, `docs/projects/clientops-cms/decision-mesh/event-contracts.md`, `docs/superpowers/plans/2026-06-15-audit-remediation-safe-fixes.md`, `docs/projects/clientops-cms/work-log.md`.
Architecture impact: normal Payload access is now staff-only for operational records, workflow events are append-only through trusted server code, lead/task/opportunity workflow event payloads avoid contact values, and manual override evidence requires an explicit human actor id.

Decisions:

- `workflow-events` create/update/delete is denied through normal Payload access; server helpers still write events with `overrideAccess`.
- Mesh-required workflow event envelope fields are required at schema level.
- Lead workflow task titles and event payloads no longer include lead name, email, company, message, budget, referrer, or other private free-text fields.
- Lead idempotency collisions compare all canonical normalized lead fields instead of only email/project/message.
- Collision evidence records mismatched field names, not submitted/current contact values.
- Manual override API calls with `manualOverrideReason` require an explicit `actorId`.
- Opportunity purge redacts email/phone-like contact data from `description` when present, without changing `status` to `purged`.
- Baseline cleanup plan is historical; current next work is audit remediation and owner decisions.

Verification:

- `node --import tsx --test tests/access.test.ts tests/mesh-contracts.test.ts` passed with 9 tests in the access worker.
- `npm.cmd test -- tests/workflow.test.ts` passed in the lead worker; due the package script, the full `tests/*.test.ts` suite also ran and reported 65 passing tests.
- `npm.cmd test -- tests/opportunities.test.ts` passed in the opportunity worker; due the package script, the full `tests/*.test.ts` suite also ran and reported 58 passing tests at that time.
- `npm.cmd test -- tests/workflow-route.test.ts` passed during local manual-override work; due the package script, the full suite plus explicit route test reported 58 passing tests at that time.
- Final `npm.cmd run lint` passed.
- Final `npm.cmd run typecheck` passed.
- Final `npm.cmd test` passed with 65 tests.
- Final `npm.cmd run build` passed and still included `/graphql` and `/graphql-playground`; a later owner follow-up slice disabled those route handlers with `410`.

Deferred owner decisions:

- Refresh or repoint the active Decision Mesh MCP/router so it does not use archived control-plane paths as current root source pointers.
- Superseded by owner follow-up: Payload GraphQL and GraphQL Playground are disabled with `410`.
- Superseded by owner follow-up: Payload packages are patched to `3.85.1`; remaining audit findings are isolated to Drizzle/@esbuild-kit `esbuild`.
- Superseded by owner follow-up: opportunity purge keeps `personalDataPurgedAt` as the canonical purge marker and does not change business `status`.
- Decide production-grade public lead and live-source rate limiting architecture.

## 2026-06-15 Owner Decision Remediation Slice

Date: 2026-06-15
Request or trigger: Owner decisions after audit remediation review.
Mode: WRITE_ALLOWED
Scope: Active mesh source-root documentation, scoped runtime tokens, production lead-intake guard, atomic worker claims, disabled Hlidac route, scripts/docs alignment.
Files changed: `.env.example`, `README.md`, `archive/README.md`, `docs/autopilot/decision-mesh/`, `docs/projects/clientops-cms/`, `src/app/api/public/leads/route.ts`, `src/app/api/workflow/tasks/route.ts`, `src/app/api/opportunities/`, `scripts/seed.ts`, `scripts/run-web-source-opportunities.ps1`, `tests/leads.test.ts`, `tests/workflow-route.test.ts`, `tests/opportunity-routes.test.ts`.
Architecture impact: workflow reads remain separated from workflow mutations, opportunity purge/live runs no longer share the broad mesh token, production public lead intake has a fail-closed guard, worker claim acquisition uses a DB-level compare-and-set predicate, and Hlidac live execution is disabled before auth/body/provider work.

Decisions implemented:

- Document active Decision Mesh source allowlist and archive denylist in active root docs.
- Keep `client` role out of operational collections through staff-only access helpers.
- Use `WORKFLOW_MUTATION_TOKEN` for `POST/PATCH /api/workflow/tasks`.
- Use `OPPORTUNITY_PURGE_TOKEN` for `POST /api/opportunities/purge`.
- Use `OPPORTUNITY_LIVE_RUN_TOKEN` for `POST /api/opportunities/live/web-source` and its runner script.
- Block production `POST /api/public/leads` unless edge/proxy rate limiting is declared and `PUBLIC_LEAD_BODY_SIZE_LIMIT_BYTES` is configured.
- Reject oversized public lead requests when `content-length` exceeds `PUBLIC_LEAD_BODY_SIZE_LIMIT_BYTES`.
- Use a single Postgres `UPDATE ... WHERE ... RETURNING` statement with task id, current state, lock, and retry-window predicates for worker `state: "claimed"` acquisition.
- Disable `POST /api/opportunities/live/hlidac-statu` with `410` before auth, body parsing, Payload, or provider fetch.
- Remove the Hlidac live runner script from active runnable scripts.

Verification:

- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed with 74 tests.
- `npm.cmd run build` passed.
- `git diff --check` passed; only CRLF conversion warnings were reported.
- Secret regex scans found placeholders, historical docs, and test env names only; no active private key/API key pattern was found.
- `npm.cmd audit --audit-level=moderate` still failed with the known Payload/GraphQL/Drizzle/tsx/esbuild advisory chain in this slice; superseded by the 2026-06-15 dependency hygiene slice.
- External re-review passed the atomic claim and missing-`Content-Length` body-size findings after fixes.

Remaining:

- Active Decision Mesh MCP/router still needs external regeneration or repointing; this repo now documents the active allowlist, but no active router config exists in the repo to mutate.
- Payload GraphQL/Playground policy was resolved in the owner follow-up slice: routes return `410`.
- Dependency remediation was completed in a later dependency hygiene slice: Payload/tsx upgraded and transitive `esbuild` pinned to `0.28.1`.
- Opportunity purge status was resolved in the owner follow-up slice: keep PII redaction without changing business `status`.
- Before real parallel external workers: add repeated worker PATCH idempotency and verify scoped tokens plus atomic claim behavior against the target runtime.

## 2026-06-15 Owner Follow-Up Decisions Slice

Date: 2026-06-15
Request or trigger: Owner follow-up on remaining Decision Mesh router, GraphQL, dependency audit, and purge status decisions.
Mode: WRITE_ALLOWED
Scope: Mesh router recommendation, Payload GraphQL disablement, dependency-audit remediation, purge status decision documentation.
Files changed: `package.json`, `package-lock.json`, `src/app/(payload)/graphql/route.ts`, `src/app/(payload)/graphql-playground/route.ts`, `tests/payload-routes.test.ts`, `README.md`, `docs/autopilot/decision-mesh/README.md`, `docs/projects/clientops-cms/architecture.md`, `docs/projects/clientops-cms/v0.1-project-index.md`, `docs/projects/clientops-cms/decision-mesh/follow-up-fixes.md`, `docs/projects/clientops-cms/work-log.md`.
Architecture impact: Payload GraphQL is no longer an available v0.1 integration surface; opportunity purge remains a privacy redaction action that does not alter business status.

Decisions implemented:

- Recommend regenerating/repointing the active Decision Mesh MCP/router from an explicit active-source manifest, with a smoke check that fails on archive or legacy v0.2.0 paths.
- Disable `/graphql` and `/graphql-playground` with `410` because GraphQL is not required for the current lead/workflow/opportunity operating focus.
- Keep opportunity purge as PII redaction without changing `opportunity-items.status`.
- Patch Payload packages to `3.85.1` and keep top-level `tsx` on `^4.22.4`.
- Initially leave the remaining Drizzle/@esbuild-kit `esbuild` audit chain for upstream remediation or a dedicated override compatibility branch; a later dependency hygiene slice accepted the override after full verification.

Verification:

- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed with 76 tests.
- `npm.cmd run build` passed; `/graphql` and `/graphql-playground` still appear as Next route files but return `410`.
- `npm.cmd install` passed without `--legacy-peer-deps` after the lockfile was recalculated.
- `npm.cmd audit --audit-level=moderate` improved from 11 findings to 5 findings after the Payload/tsx patch upgrade; a later dependency hygiene slice reduced this to 0 findings with an `esbuild` override.

Remaining:

- Active Decision Mesh MCP/router still needs external regeneration or repointing because no active router config exists in this repo to mutate.
- Dependency audit was completed in a later dependency hygiene slice; remaining package work is major-upgrade compatibility review.
- Before real parallel external workers: add repeated worker PATCH idempotency and verify scoped tokens plus atomic claim behavior against the target runtime.

## 2026-06-15 Dependency Hygiene And Tooling Currency Slice

Date: 2026-06-15
Request or trigger: Keep dependencies and tooling as current as safely possible, including the remaining Drizzle/@esbuild-kit `esbuild` audit chain.
Mode: WRITE_ALLOWED
Scope: npm dependency tree, overrides, audit, static/test/build verification, local Payload/Drizzle seed verification, runtime health checks.
Files changed: `package.json`, `package-lock.json`, `README.md`, `docs/projects/clientops-cms/architecture.md`, `docs/projects/clientops-cms/v0.1-project-index.md`, `docs/projects/clientops-cms/decision-mesh/follow-up-fixes.md`, `docs/projects/clientops-cms/work-log.md`.
Architecture impact: all transitive `esbuild` instances are intentionally unified to `0.28.1` through npm overrides after compatibility checks passed.

Decisions implemented:

- Keep Payload packages on `3.85.1` and top-level `tsx` on `^4.22.4`.
- Add `overrides.esbuild = 0.28.1` to eliminate vulnerable nested `esbuild` versions from Drizzle/@esbuild-kit tooling.
- Keep direct major upgrades out of this slice; a later compatibility follow-up upgraded TypeScript and Sharp, while keeping ESLint and Node types on compatible lines.

Verification:

- `npm.cmd install` passed without `--force` and without `--legacy-peer-deps`.
- `npm.cmd audit --audit-level=moderate` passed with 0 vulnerabilities.
- `npm.cmd ls esbuild @esbuild-kit/core-utils @esbuild-kit/esm-loader drizzle-kit --all` showed all `esbuild` instances resolved to `0.28.1`.
- `npm.cmd outdated --json` reported only major-upgrade candidates outside current dependency ranges: `@types/node` 25, ESLint 10, Sharp 0.35, and TypeScript 6; a later compatibility follow-up resolved Sharp and TypeScript.
- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed with 76 tests.
- `npm.cmd run build` passed.
- `npm.cmd run seed` passed after a local-only backfill of 3 historical `workflow_events` rows missing mesh envelope fields.
- Runtime `GET /api/health` and `GET /api/ready` returned `200`.
- Runtime `POST /graphql` and `GET /graphql-playground` returned `410`.
- `scripts/smoke-clientops.ps1` passed health, ready, workflow task read, and lead intake checks.

Local data note:

- The local Postgres database had 3 historical `workflow_events` rows from 2026-06-12 with null `event_id`, `occurred_at`, `correlation_id`, `idempotency_key`, and `actor_id`.
- Those rows were backfilled deterministically as `legacy-event-<id>` / `legacy-correlation-<id>` with `occurred_at = created_at` and `actor_id = clientops-cms`; no payload or business data was deleted.

Remaining:

- `scripts/smoke-opportunities.ps1` was blocked by local `.env` missing `OPPORTUNITY_INGEST_TOKEN`; `.env.example` already documents the required scoped token.
- Direct major-upgrade candidates were evaluated in a later compatibility follow-up.

## 2026-06-15 Direct Dependency Compatibility Follow-Up Slice

Date: 2026-06-15
Request or trigger: Resolve the remaining direct dependency/tooling currency items after the dependency hygiene slice.
Mode: WRITE_ALLOWED
Scope: TypeScript, Sharp, ESLint compatibility, Node type alignment, production smoke checks with scoped tokens.
Files changed: `package.json`, `package-lock.json`, `tsconfig.json`, `README.md`, `docs/projects/clientops-cms/architecture.md`, `docs/projects/clientops-cms/v0.1-project-index.md`, `docs/projects/clientops-cms/decision-mesh/follow-up-fixes.md`, `docs/projects/clientops-cms/work-log.md`.
Architecture impact: TypeScript 6 and Sharp 0.35 are adopted; ESLint remains on the latest compatible 9.x line until the Next ESLint plugin stack supports ESLint 10; Node types remain aligned with the active Node 24 runtime.

Decisions implemented:

- Upgrade TypeScript to `6.0.3`.
- Add `compilerOptions.ignoreDeprecations = "6.0"` as an explicit transition marker for the existing `baseUrl` alias setup.
- Upgrade root Sharp to `0.35.1`.
- Keep `@types/node` on 24.x because the active local/runtime Node is `v24.14.0`; `@types/node` 25 would model APIs ahead of runtime.
- Attempt ESLint 10, then revert to `9.39.4` after lint failed and `npm ls` showed invalid peer ranges from `eslint-plugin-import`, `eslint-plugin-react`, and `eslint-plugin-jsx-a11y`.

Verification:

- `npm.cmd install` passed.
- `npm.cmd audit --audit-level=moderate` passed with 0 vulnerabilities.
- `npm.cmd ls eslint typescript sharp @types/node eslint-config-next next --depth=1` showed a valid tree with ESLint 9.39.4, TypeScript 6.0.3, root Sharp 0.35.1, and Node types 24.13.2.
- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd test` passed with 76 tests.
- `npm.cmd run build` passed.
- `npm.cmd run seed` passed.
- `scripts/smoke-opportunities.ps1` passed against a temporary `next start` server on port 3001 with a process-only local `OPPORTUNITY_INGEST_TOKEN`.
- `scripts/smoke-clientops.ps1` passed against a temporary `next start` server on port 3001 with production lead guard env values set for the process.

Remaining:

- `npm.cmd outdated --json` now reports only `@types/node` 25 and ESLint 10.
- Revisit `@types/node` 25 after runtime Node moves to 25.
- Revisit ESLint 10 after the Next ESLint plugin stack publishes ESLint 10 peer support.
