# Autopilot ClientOps CMS

Version: `0.1.0`
Status: local v0.1 baseline

ClientOps CMS is a local-first operations backend for client work, lead intake, workflow tasks, and opportunity review. It is built with Next.js, Payload CMS, and PostgreSQL.

The project is intentionally split into a running core and a governance mesh:

- **Core Platform**: Payload CMS, PostgreSQL, collections, admin UI, APIs, scripts, and tests.
- **Workflow Mesh**: task state machine, workflow events, retry/dead-letter behavior, manual override, and claim locks.
- **Opportunity Monitor**: opportunity sources, import runs, items, reviews, ingest, purge, and reviewed live web-source runs.
- **Decision Mesh Governance**: docs and stop conditions that say what automation may and may not do.

Start with the project map:

- `docs/projects/clientops-cms/v0.1-project-index.md`
- `docs/projects/clientops-cms/architecture.md`
- `docs/projects/clientops-cms/decision-mesh/README.md`

## Core Rule

Payload/Postgres is the canonical source of truth. The Decision Mesh is not the database and does not own state. It governs how automation, workers, and advisory models are allowed to interpret or act on canonical CMS records.

Model output from Claude, Gemini, GPT, or any local model is advisory only unless local code, tests, source evidence, or a human decision adopts it.

## Repository Integration

The former `autopilot-control-plane` v0.2.0 repository state is preserved under `archive/autopilot-control-plane-v0.2.0/`.

That archive is linked into Git history for recovery and selective migration, but it is not active runtime code. Active v0.1 work happens in the ClientOps CMS root and in `docs/projects/clientops-cms/`.

Active Decision Mesh source roots are allowlisted to:

- `docs/projects/clientops-cms/decision-mesh/`
- `docs/autopilot/decision-mesh/`
- `docs/projects/clientops-cms/v0.1-project-index.md`
- `docs/projects/clientops-cms/work-log.md`
- active application source under `src/`

The active Decision Mesh MCP/router must not index `archive/**` or return archived paths as current `must_read` entries. Archived `AGENTS.md`, `GEMINI.md`, `src/data/delivery-system/**`, `src/auth/session.ts`, and `docs/autopilot/delivery-system-model-policy.md` are legacy v0.2.0 control-plane material only.

## Component Status

Use these labels before adding, removing, or changing a component:

| Label | Meaning |
| --- | --- |
| `active-v0.1` | Exists and is part of the v0.1 baseline. |
| `experimental-v0.1` | Exists and can be used manually, but is not ready for broad automation. |
| `disabled` | Exists but is intentionally blocked or switched off. |
| `designed-only` | Documented but not implemented as runtime behavior. |
| `deferred-v0.2` | Valid future work that must not block v0.1. |
| `cleanup` | Exists but needs naming, ownership, or docs cleanup. |
| `unused-review` | Suspected unused surface; verify before removing. |

The full inventory is in `docs/projects/clientops-cms/v0.1-project-index.md`.

## What Exists In v0.1

- Payload admin at `/admin`
- Payload REST API under `/api`
- Disabled Payload GraphQL routes at `/graphql` and `/graphql-playground`, returning `410`
- Public lead intake at `POST /api/public/leads`
- Internal workflow task API at `GET/POST/PATCH /api/workflow/tasks`
- Opportunity ingest at `POST /api/opportunities/ingest`
- Opportunity purge at `POST /api/opportunities/purge`
- Generic live web-source runner at `POST /api/opportunities/live/web-source`
- Disabled Hlidac Statu route at `POST /api/opportunities/live/hlidac-statu`, returning `410`
- Health route at `GET /api/health`
- Readiness route at `GET /api/ready`
- Postgres-backed collections for users, clients, projects, sites, pages, forms, leads, tasks, workflow events, and opportunity records
- Project Decision Mesh under `docs/projects/clientops-cms/decision-mesh/`
- Autopilot root control-plane mesh under `docs/autopilot/decision-mesh/`

## What Is Not v0.1

- Production deployment
- Autonomous outreach
- Broad scraping or crawling
- Login/paywall scraping
- Runtime usage-limit enforcement
- Parallel external worker pools
- Email/SMS delivery
- Hlidac Statu live use; the route is intentionally disabled
- Payload GraphQL integrations; the routes are intentionally disabled for the current operating scope
- Model output writing canonical CMS state

## Local Start

```powershell
Copy-Item .env.example .env
docker compose up -d --wait
npm.cmd install
npm.cmd run seed
npm.cmd run dev
```

Open:

- `http://localhost:3000/admin`
- `http://localhost:3000/api/health`
- `http://localhost:3000/api/ready`

## Verification

Run these before calling the local baseline or remediation slice clean:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Docker-backed smoke checks:

```powershell
docker compose up -d --wait
docker compose exec -T postgres pg_isready -U postgres -d autopilot_clientops
powershell -ExecutionPolicy Bypass -File scripts/smoke-clientops.ps1
powershell -ExecutionPolicy Bypass -File scripts/smoke-opportunities.ps1
```

## Docker Recovery

The local app uses Docker only for PostgreSQL. If Payload admin/API routes fail with `ECONNREFUSED 127.0.0.1:5432`, verify Docker Desktop and Postgres before changing app code:

```powershell
Start-Process -WindowStyle Hidden -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe"
docker context use desktop-linux
docker --context desktop-linux info
docker compose up -d --wait
docker compose exec -T postgres pg_isready -U postgres -d autopilot_clientops
powershell -ExecutionPolicy Bypass -File scripts/docker-doctor.ps1
```

Do not run `docker compose down -v` unless the local database volume is intentionally disposable.

## Tokens

Opportunity ingest requires `OPPORTUNITY_INGEST_TOKEN`.
Opportunity purge requires `OPPORTUNITY_PURGE_TOKEN`.
Opportunity live-source runs require `OPPORTUNITY_LIVE_RUN_TOKEN`.
Workflow task reads require `MESH_SERVICE_TOKEN`; workflow task creation and mutation require `WORKFLOW_MUTATION_TOKEN`.

Do not reuse provider API keys as mesh tokens. Do not commit `.env`.

## Lead Intake

`POST /api/public/leads`

Production guard: do not enable this route in production unless an edge/proxy rate limit and body-size limit are configured. The route returns `503` in production unless `PUBLIC_LEAD_EDGE_RATE_LIMIT_ENABLED=true` and `PUBLIC_LEAD_BODY_SIZE_LIMIT_BYTES` is a positive integer.

Required fields:

- `name`
- `email`
- `project_type`
- `message`

Optional replay-safe headers:

- `x-correlation-id`
- `x-idempotency-key`
- `idempotency-key`

Repeated requests with the same idempotency key return the existing lead/task. Reusing the same idempotency key for different lead content returns a collision response and creates a blocked review task instead of overwriting evidence.

## Workflow Tasks

Workflow task reads use `MESH_SERVICE_TOKEN`. Workflow task creation and mutation use `WORKFLOW_MUTATION_TOKEN`.

```powershell
Invoke-WebRequest http://localhost:3000/api/workflow/tasks `
  -Headers @{ 'x-mesh-service-token' = $env:MESH_SERVICE_TOKEN }
```

Canonical task states include `queued`, `claimed`, `running`, `waiting_owner`, `retrying`, `blocked`, `done`, `failed`, and `cancelled`.

Terminal-to-active transitions require `manualOverrideReason`. Worker mutations require a valid claim unless a human override is recorded.

## Opportunity Monitor

The opportunity monitor is for supervised opportunity review, not automatic outreach.

Core rules:

- Use `OPPORTUNITY_INGEST_TOKEN` for source-row ingest.
- Use `OPPORTUNITY_PURGE_TOKEN` for purge.
- Use `OPPORTUNITY_LIVE_RUN_TOKEN` for live run control.
- Keep workflow event payloads PII-free.
- Store and respect `publishedAt`, `sourceUpdatedAt`, `deadlineAt`, and `sourceStatus`.
- Purge personal/contact data after response/conversion or retention expiry.
- Do not run live sources unless source terms, robots, allowed hosts, and URL bounds are reviewed.

Fixture smoke:

```powershell
npm.cmd run seed
powershell -ExecutionPolicy Bypass -File scripts/smoke-opportunities.ps1
```

Manual generic live source run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-web-source-opportunities.ps1
```

Every live URL host must already be configured in `opportunity-sources.allowedHosts`, with `termsReviewedAt` and `robotsReviewedAt` set.

## Documentation Map

```text
README.md
docs/projects/clientops-cms/v0.1-project-index.md
docs/projects/clientops-cms/architecture.md
docs/projects/clientops-cms/work-log.md
docs/projects/clientops-cms/decision-mesh/
docs/autopilot/decision-mesh/
docs/superpowers/specs/
docs/superpowers/plans/
```

Design specs in `docs/superpowers/specs/` explain how decisions were reached. The current operating map is `docs/projects/clientops-cms/v0.1-project-index.md`.

## Next Work

Only pick work that maps to the project index. Current priority:

1. Regenerate or repoint the active Decision Mesh MCP/router from the active allowlist only, then run the archive-path smoke check described in `docs/autopilot/decision-mesh/README.md`.
2. Keep dependency hygiene current: run `npm.cmd outdated`, `npm.cmd audit --audit-level=moderate`, `npm.cmd ls esbuild`, and the full verification gate before each release slice.
3. Revisit ESLint 10 only after `eslint-plugin-import`, `eslint-plugin-react`, and `eslint-plugin-jsx-a11y` publish ESLint 10 peer support.
4. Revisit `@types/node` 25 only after the local/runtime Node version moves from 24 to 25.
5. Add scheduled/operator purge flow for expired opportunity contact data; keep purge as PII redaction without changing business status.
6. Add reviewed source registry workflow for live portals.
7. Add repeated worker PATCH idempotency and verify scoped tokens plus atomic task claims against the target runtime before parallel external workers.
8. Configure actual production edge/proxy rate limiting and body-size limits before public lead intake is exposed outside local use.
9. Implement runtime usage-limit enforcement only after a concrete provider integration needs it.
