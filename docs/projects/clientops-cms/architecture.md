# ClientOps CMS Architecture

Last updated: 2026-06-15
Status: active-local
Steward: Radek Siroky
Canonical local root: `C:\Users\sirok\Documents\Autopilot`
Canonical remote repository: pending first push
Project slug: `clientops-cms`

Project map: `docs/projects/clientops-cms/v0.1-project-index.md`

## Purpose

ClientOps CMS collects public website and project leads, stores client/project/site/content records, and creates workflow tasks that can be interpreted by a project-specific Decision Mesh.

For day-to-day planning, component status, and cleanup decisions, use `v0.1-project-index.md` as the current project map. This architecture document describes the system shape; the index describes what is active, experimental, disabled, deferred, or cleanup work.

## System Boundary

In scope:

- Payload CMS admin and REST routes; Payload GraphQL route files are intentionally disabled with `410`.
- Postgres-backed ClientOps data.
- Public lead intake API.
- Internal workflow task API.
- Project-specific Decision Mesh documents under `docs/projects/clientops-cms/decision-mesh/`.
- Opportunity monitor design and mesh governance.

Out of scope for this phase:

- Autonomous outbound actions.
- Direct model writes to canonical CMS fields.
- Production deployment.
- Push/outbox delivery to external services before auth, idempotency, retry, and health gates pass.
- Autopilot root provider usage/advisory-run control plane, which lives under `docs/autopilot/decision-mesh/`.

## Runtime Architecture

- Next.js App Router serves the public landing page, Payload admin, Payload REST API, disabled Payload GraphQL routes, and custom API routes.
- Payload CMS defines `users`, `clients`, `projects`, `sites`, `pages`, `forms`, `leads`, `tasks`, and `workflow-events`.
- Opportunity monitor collections define `opportunity-sources`, `opportunity-runs`, `opportunity-items`, and `opportunity-reviews`.
- Docker Compose runs Postgres 16 locally.
- `scripts/seed.ts` creates the first admin user and Radeq seed records.

## Data Flows

1. Public site submits JSON lead payload to `POST /api/public/leads`.
2. API validates and normalizes the payload.
3. Payload creates a `leads` record.
4. Workflow helper creates a `tasks` record.
5. Workflow helper appends a `workflow-events` record.
6. Project mesh interprets lead/task/event evidence but does not own canonical state.

Opportunity fixture flow:

1. Local seed creates the `fixture-cz-it` source with an allowed host.
2. `scripts/smoke-opportunities.ps1` posts a fixture row to `POST /api/opportunities/ingest`.
3. CMS validates source terms, allowed host, row fingerprint, and idempotency.
4. CMS writes an `opportunity-runs` record, an `opportunity-items` record, and PII-free workflow events.
5. `POST /api/opportunities/purge` can clear contact fields through a mesh-authenticated operator path.

Live opportunity flow:

1. `POST /api/opportunities/live/web-source` requires `OPPORTUNITY_LIVE_RUN_TOKEN`.
2. The route accepts a reviewed `sourceKey` plus either normalized `items` or explicit `urls`.
3. URL mode checks source enablement, terms review, robots review, allowed hosts, and bounded URL count before fetch.
4. Fetched HTML pages are normalized into the same opportunity ingest contract used by fixtures.
5. CMS stores opportunity items and PII-free workflow events.
6. Manual review remains required before outreach, lead creation, or project task conversion.

## Decision Mesh

Project mesh path: `docs/projects/clientops-cms/decision-mesh/`

The project mesh covers:

- source-of-truth boundaries
- event contracts
- runtime health
- retry and error policy
- manual override requirements
- external advisory model policy
- opportunity monitor, retention, and scrapeflow boundaries

Autopilot root mesh is not the ClientOps CMS product mesh.
Autopilot provider usage limits and advisory-run lifecycle are tracked under `docs/autopilot/decision-mesh/`.

## Verification Gates

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `docker compose up -d --wait`
- `docker compose exec -T postgres pg_isready -U postgres -d autopilot_clientops`
- `npm.cmd run seed` twice without duplicate seed records
- Smoke POST to `/api/public/leads` creates one lead, one lead-review task, and audit event
- Authenticated workflow GET returns task/event evidence with `MESH_SERVICE_TOKEN`
- Authenticated workflow POST/PATCH uses `WORKFLOW_MUTATION_TOKEN`
- Production public lead intake returns `503` unless edge/proxy rate limiting and body-size limit env are configured
- Payload GraphQL and GraphQL Playground return `410` until a future owner re-enable decision.

## Known Risks

- Docker Desktop daemon can be unavailable on Windows.
- Parallel external worker pools still need target-runtime verification of scoped tokens, atomic claim behavior, and repeated PATCH idempotency.
- Opportunity monitor collections, ingest endpoint, fixture tests, purge path, and generic live web-source route are implemented.
- Hlidac Statu remains a disabled optional adapter; its route returns `410`.
- Payload/GraphQL packages are patched to `3.85.1`; TypeScript is on `6.0.3`; root Sharp is on `0.35.1`; all transitive `esbuild` instances are pinned through `overrides.esbuild = 0.28.1` after install, audit, lint, typecheck, test, build, seed, and runtime health checks passed.
- ESLint remains on the current compatible 9.x line because current `eslint-plugin-import`, `eslint-plugin-react`, and `eslint-plugin-jsx-a11y` peer ranges do not support ESLint 10 yet.
- Node types remain on the current 24.x line because the active local/runtime Node version is 24.
