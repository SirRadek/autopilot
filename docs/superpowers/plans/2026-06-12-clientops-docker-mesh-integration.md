# ClientOps Docker Mesh Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recover the local Docker/Postgres runtime, onboard ClientOps CMS into its own project-specific Decision Mesh, then harden lead/task workflow contracts so mesh automation can interpret work safely.

**Architecture:** ClientOps CMS keeps Payload/Postgres as the operational source of truth for leads, clients, projects, sites, pages, forms, and current task state. `workflow-events` becomes append-only audit evidence, while `docs/projects/clientops-cms/decision-mesh/` owns governance interpretation, stop conditions, source-of-truth rules, and advisory model policy. Mesh integration starts with a secure pull/controlled-ingress contract; push/outbox automation is deferred until auth, idempotency, retries, health checks, and manual override are verified.

**Tech Stack:** Next.js 16 App Router, Payload CMS 3, Postgres 16 via Docker Compose, TypeScript, Node test runner, ESLint 9 flat config, Claude Code CLI advisory review, Gemini CLI advisory brainstorming, Autopilot Decision Mesh read-only router.

---

## Non-Negotiable Invariants

- Autopilot root mesh is the control-plane mesh only. It must not become the ClientOps CMS project mesh.
- Payload/Postgres owns canonical operational state. Model output is advisory until accepted through a local evidence event or a human gate.
- `/api/workflow/tasks` must not be used as a mesh ingress without an explicit auth or network boundary.
- Public lead intake and workflow task creation must be idempotent before retries, workers, or external automations are connected.
- Every mesh-facing event must carry a `correlationId`; if a caller does not provide one, the system must create one and return it.
- Docker/Postgres runtime failure is a runtime health state, not evidence that Payload schema is broken.
- Destructive Docker actions such as `docker compose down -v` require an explicit owner decision.

## Model Advisory Protocol

- Use Claude and Gemini only for redacted advisory review, critique, planning, security review, and edge-case brainstorming.
- Do not give external advisory models secrets, raw logs containing private data, `.env` values, database dumps, or full unbounded repo context.
- Record provider status and whether model output was present before using the advice.
- If a model gives a broad or off-target answer, re-prompt with a narrower output schema, concrete current-state facts, and a maximum section list.
- Treat Gemini claims as brainstorm hypotheses until verified with local files, tests, Context7, or official docs.
- Treat Claude advice as higher-weight architecture/security critique, but still advisory.
- Never let advisory model output directly update canonical CMS fields.

## File Structure Map

- `docs/projects/clientops-cms/architecture.md`: current architecture, boundaries, runtime surfaces, data flows, verification gates, and known risks.
- `docs/projects/clientops-cms/work-log.md`: chronological work evidence and architecture/mesh impact statements.
- `docs/projects/clientops-cms/test-data.md`: deterministic lead/task payloads and expected records for smoke tests.
- `docs/projects/clientops-cms/decision-mesh/README.md`: project mesh overview and covered surfaces.
- `docs/projects/clientops-cms/decision-mesh/source-of-truth.md`: canonical data ownership and advisory model boundaries.
- `docs/projects/clientops-cms/decision-mesh/event-contracts.md`: canonical task/event envelope and event enum.
- `docs/projects/clientops-cms/decision-mesh/manual-override.md`: human override authority and audit requirements.
- `docs/projects/clientops-cms/decision-mesh/retry-and-error-policy.md`: retry states, attempt counters, dead-letter behavior, and logging.
- `docs/projects/clientops-cms/decision-mesh/runtime-health.md`: Docker/Postgres/Payload/seed health state contract.
- `docs/superpowers/plans/2026-06-12-clientops-docker-mesh-integration.md`: this implementation plan.
- `.env.example`: add mesh service token and local runtime defaults without secrets.
- `README.md`: document runtime recovery, mesh gates, health endpoints, smoke commands.
- `scripts/docker-doctor.ps1`: diagnose Docker Desktop, context, WSL, Postgres port, and Compose health.
- `scripts/smoke-clientops.ps1`: run seed and smoke lead/workflow endpoints after DB is healthy.
- `src/lib/mesh-contracts.ts`: shared constants, event types, state enums, correlation/idempotency helpers.
- `src/lib/workflow.ts`: deterministic task IDs, dedupe lookup, event creation, retry/manual override helpers.
- `src/lib/leads.ts`: extract correlation/idempotency from public payloads and headers.
- `src/collections/Leads.ts`: add mesh/correlation/source fields and status vocabulary.
- `src/collections/Tasks.ts`: add correlation/idempotency/retry/error/manual lock fields and state vocabulary.
- `src/collections/WorkflowEvents.ts`: canonical event fields, event enum, occurredAt, actor/policy/source fields.
- `src/app/api/health/route.ts`: process-level health endpoint that does not require DB.
- `src/app/api/ready/route.ts`: DB-backed readiness endpoint with bounded error output.
- `src/app/api/public/leads/route.ts`: correlation/idempotency headers, duplicate replay response, CORS preservation.
- `src/app/api/workflow/tasks/route.ts`: mesh token auth, contract validation, create/list/update transition handling.
- `tests/mesh-contracts.test.ts`: event enum, ID normalization, deterministic hashing.
- `tests/workflow.test.ts`: task ID determinism, dedupe behavior with fake Payload, retry/dead-letter helpers.
- `tests/leads.test.ts`: correlation/idempotency extraction and replay-safe CMS mapping.
- `tests/api-auth.test.ts`: workflow API token helper behavior.
- `tests/runtime-health.test.ts`: health payload helpers if route logic is factored.

## Phase Entry And Exit Gates

- **Gate A: Docker runtime gate.** Task 1 exits only when a live Docker daemon is selected, Postgres is healthy, `pg_isready` succeeds, and DB-backed Payload routes can be probed. If Docker Desktop cannot be started, implementation may continue only on documentation, pure library helpers, and tests that do not require DB state.
- **Gate B: Project mesh gate.** Task 2 exits only when architecture, work-log, test-data, and decision-mesh docs exist. No final handoff may claim mesh integration if these files are missing.
- **Gate C: Workflow auth gate.** Task 7 must be completed before any automation, smoke script, or external mesh caller exercises `POST` or `PATCH /api/workflow/tasks`. Library-only idempotency tests may be written earlier, but mesh-facing task mutation must not be used without auth.
- **Gate D: Migration rollback gate.** Before changing Payload collection fields in a database-backed environment, capture a DB backup or confirm the database is disposable local test data. If Payload admin fails after a schema change, halt and restore the previous code/database state before continuing.
- **Gate E: Advisory model isolation gate.** Claude/Gemini runs must receive bounded prompts and no write-capable credentials. If a model is given a path to mutate Payload/Postgres or a route token capable of writes, stop and redesign the advisory workflow.
- **Gate F: Dedupe collision gate.** `dedupeKey` must include source and normalized idempotency identity. If a collision is detected between different lead payloads, do not overwrite; create a blocked review task and append an audit event.
- **Gate G: Transition validation gate.** `PATCH /api/workflow/tasks` must reject unknown states and invalid transitions. No worker may move a task from `failed` or `cancelled` back to active states without a `manual_override_applied` event.

## Task 1: Recover Docker/Postgres Runtime

**Files:**
- Read: `docker-compose.yml`
- Read: `.env.example`
- Create: `scripts/docker-doctor.ps1`
- Modify: `README.md`
- Update: `docs/projects/clientops-cms/work-log.md` after docs exist in Task 2

- [ ] **Step 1: Record baseline diagnosis**

Run:

```powershell
docker version
docker context ls
docker --context desktop-linux version
docker --context default version
Get-Service com.docker.service, vmcompute -ErrorAction SilentlyContinue
wsl.exe -l -v
Test-Path \\.\pipe\dockerDesktopLinuxEngine
Test-Path \\.\pipe\docker_engine
Test-NetConnection 127.0.0.1 -Port 5432
```

Expected current failure before recovery:

```text
docker context: desktop-linux
com.docker.service: Stopped
docker API pipe missing
Postgres port closed unless another local Postgres is already running
```

- [ ] **Step 2: Start Docker Desktop service and app**

Run:

```powershell
Start-Service com.docker.service
Start-Process -WindowStyle Hidden -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 30
docker --context desktop-linux info
```

Expected: `docker info` exits `0` and reports a server section. If it fails, run:

```powershell
wsl.exe --shutdown
Start-Service com.docker.service
Start-Process -WindowStyle Hidden -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 45
docker --context desktop-linux version
```

- [ ] **Step 3: Use the working Docker context**

Run:

```powershell
docker context use desktop-linux
docker --context desktop-linux version
```

If `desktop-linux` is unavailable but `default` works:

```powershell
docker context use default
docker --context default version
```

Expected: one selected context points to a live Docker daemon.

- [ ] **Step 4: Bring up Postgres**

Run:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d --wait
docker compose ps
docker compose logs --tail 120 postgres
docker compose exec -T postgres pg_isready -U postgres -d autopilot_clientops
Test-NetConnection 127.0.0.1 -Port 5432
```

Expected: container `postgres` is healthy, `pg_isready` accepts connections, and port `5432` is open.

- [ ] **Step 5: Seed and smoke test Payload runtime**

Run:

```powershell
npm.cmd run seed
npm.cmd run seed
curl.exe -i --max-time 10 http://127.0.0.1:3000/admin
curl.exe -i --max-time 10 http://127.0.0.1:3000/api/workflow/tasks
curl.exe -i --max-time 10 -X POST -H "content-type: application/json" -d "{\"name\":\"Runtime Smoke\",\"email\":\"runtime-smoke@example.com\",\"project_type\":\"website\",\"message\":\"Smoke test lead\"}" http://127.0.0.1:3000/api/public/leads
```

Expected: seed is idempotent, `/admin` returns HTML, `/api/workflow/tasks` returns JSON, lead POST returns `201` with `leadId` and `taskId`.

- [ ] **Step 6: Create Docker doctor script**

Create `scripts/docker-doctor.ps1`:

```powershell
$ErrorActionPreference = "Continue"

Write-Host "== Docker CLI =="
docker version

Write-Host "`n== Docker Contexts =="
docker context ls

Write-Host "`n== Windows Services =="
Get-Service com.docker.service, vmcompute -ErrorAction SilentlyContinue | Format-Table Name, Status, StartType

Write-Host "`n== WSL =="
wsl.exe -l -v

Write-Host "`n== Docker Pipes =="
[pscustomobject]@{
  DockerDesktopLinuxEngine = Test-Path "\\.\pipe\dockerDesktopLinuxEngine"
  DockerEngine = Test-Path "\\.\pipe\docker_engine"
} | Format-List

Write-Host "`n== Compose =="
docker compose ps

Write-Host "`n== Postgres Port =="
Test-NetConnection 127.0.0.1 -Port 5432
```

- [ ] **Step 7: Verify doctor script**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/docker-doctor.ps1
```

Expected: script completes and prints Docker, WSL, Compose, and port status without requiring destructive actions.

## Task 2: Onboard ClientOps CMS Project Mesh

**Files:**
- Create: `docs/projects/clientops-cms/architecture.md`
- Create: `docs/projects/clientops-cms/work-log.md`
- Create: `docs/projects/clientops-cms/test-data.md`
- Create: `docs/projects/clientops-cms/decision-mesh/README.md`
- Create: `docs/projects/clientops-cms/decision-mesh/source-of-truth.md`
- Create: `docs/projects/clientops-cms/decision-mesh/event-contracts.md`
- Create: `docs/projects/clientops-cms/decision-mesh/manual-override.md`
- Create: `docs/projects/clientops-cms/decision-mesh/retry-and-error-policy.md`
- Create: `docs/projects/clientops-cms/decision-mesh/runtime-health.md`

- [ ] **Step 1: Create architecture record**

Create `docs/projects/clientops-cms/architecture.md` with:

```markdown
# ClientOps CMS Architecture

Last updated: 2026-06-12
Status: active-local
Steward: Radek Siroky
Canonical local root: `C:\Users\sirok\Documents\Autopilot`
Canonical remote repository: pending first push
Project slug: `clientops-cms`

## Purpose

ClientOps CMS collects public website/project leads, stores client/project/site/content records, and creates workflow tasks that can be interpreted by a project-specific Decision Mesh.

## System Boundary

In scope:
- Payload CMS admin and REST/GraphQL routes.
- Postgres-backed ClientOps data.
- Public lead intake API.
- Internal workflow task API.
- Project-specific Decision Mesh documents under `docs/projects/clientops-cms/decision-mesh/`.

Out of scope for this phase:
- Autonomous outbound actions.
- Direct model writes to canonical CMS fields.
- Production deployment.
- Push/outbox delivery to external services before auth, idempotency, retry, and health gates pass.

## Runtime Architecture

- Next.js App Router serves the public landing page, Payload admin, Payload API, GraphQL, and custom API routes.
- Payload CMS defines `users`, `clients`, `projects`, `sites`, `pages`, `forms`, `leads`, `tasks`, and `workflow-events`.
- Docker Compose runs Postgres 16 locally.
- `scripts/seed.ts` creates the first admin user and Radeq seed records.

## Data Flows

1. Public site submits JSON lead payload to `POST /api/public/leads`.
2. API validates and normalizes the payload.
3. Payload creates a `leads` record.
4. Workflow helper creates a `tasks` record.
5. Workflow helper appends a `workflow-events` record.
6. Project mesh interprets lead/task/event evidence but does not own canonical state.

## Decision Mesh

Project mesh path: `docs/projects/clientops-cms/decision-mesh/`

The project mesh covers:
- source-of-truth boundaries
- event contracts
- runtime health
- retry and error policy
- manual override requirements
- external advisory model policy

Autopilot root mesh is not the ClientOps CMS product mesh.

## Verification Gates

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `docker compose up -d --wait`
- `docker compose exec -T postgres pg_isready -U postgres -d autopilot_clientops`
- `npm.cmd run seed` twice without duplicate seed records
- Smoke POST to `/api/public/leads` creates one lead, one lead-review task, and audit event

## Known Risks

- Docker Desktop daemon can be unavailable on Windows.
- Workflow API currently requires a stronger auth boundary before mesh ingress.
- Idempotency and retry semantics are not fully implemented yet.
- Transitive `esbuild` audit finding remains under Payload Postgres tooling.
```

- [ ] **Step 2: Create work log**

Create `docs/projects/clientops-cms/work-log.md` with:

```markdown
# ClientOps CMS Work Log

## 2026-06-12

Date: 2026-06-12
Request or trigger: Build first ClientOps CMS, recover Docker/Postgres, and connect workflow to a project-specific Decision Mesh.
Mode: WRITE_ALLOWED
Scope: Local repository scaffold, Docker runtime diagnosis, project mesh onboarding, workflow contract planning.
Files changed: initial Next/Payload scaffold, tests, docs, and mesh planning artifacts.
Architecture impact: establishes ClientOps CMS as a supervised project with its own architecture record and project-specific Decision Mesh.
Decisions:
- Payload/Postgres owns canonical state.
- Workflow events are append-only audit evidence.
- Autopilot root mesh stays separate from ClientOps CMS project mesh.
- Claude/Gemini outputs are advisory only.
Verification:
- Existing scaffold passed lint, typecheck, tests, and build before this mesh planning slice.
- Docker/Postgres runtime remains pending until Docker Desktop daemon is available.
Risks:
- `/api/workflow/tasks` needs auth before mesh ingress.
- Idempotency and retry metadata need implementation before automation.
Follow-up:
- Recover Docker runtime.
- Add mesh contracts to collections and workflow helpers.
- Add health/readiness endpoints and smoke scripts.
```

- [ ] **Step 3: Create source-of-truth doc**

Create `docs/projects/clientops-cms/decision-mesh/source-of-truth.md` with:

```markdown
# Source Of Truth

- Public form payloads are evidence only until stored as `leads`.
- `leads.status` owns lead lifecycle.
- `tasks.state` owns actionable workflow state.
- `workflow-events` owns audit history and must be append-only in normal operation.
- Project mesh owns governance interpretation, policy mapping, routing guidance, and stop conditions.
- Runtime logs remain local runtime evidence; docs store redacted summaries and source pointers only.
- Claude/Gemini/GPT outputs are advisory. They cannot become canonical workflow state without human acceptance or local verification evidence.
```

- [ ] **Step 4: Create event contracts doc**

Create `docs/projects/clientops-cms/decision-mesh/event-contracts.md` with:

```markdown
# Event Contracts

Required envelope fields:

- `eventId`
- `eventType`
- `occurredAt`
- `correlationId`
- `idempotencyKey`
- `projectSlug`
- `source`
- `actorType`
- `actorId`
- `policyVersion`
- `payload`
- `result`
- `error`

Initial event types:

- `lead_received`
- `lead_rejected`
- `task_created`
- `task_claimed`
- `task_started`
- `task_progress`
- `task_retry_scheduled`
- `task_succeeded`
- `task_failed`
- `task_dead_lettered`
- `task_cancelled`
- `task_blocked`
- `manual_override_applied`
- `mesh_policy_checked`

Rules:

- Every mesh-facing event must include `correlationId`.
- Replayed requests must return the existing lead/task where possible.
- Events are audit evidence and do not replace current state fields.
```

- [ ] **Step 5: Create manual override doc**

Create `docs/projects/clientops-cms/decision-mesh/manual-override.md` with:

```markdown
# Manual Override

Humans with admin/editor authority may:

- move task state
- change assignment
- mark lead as spam, lost, won, blocked, or reviewing
- retry or cancel task execution
- correct bad metadata

Every override must record:

- actor identity
- reason
- previous value
- new value
- timestamp
- linked task or lead
- `manual_override_applied` workflow event

Overrides must not delete previous events. If old evidence is wrong, append a correction event.
```

- [ ] **Step 6: Create retry/error policy doc**

Create `docs/projects/clientops-cms/decision-mesh/retry-and-error-policy.md` with:

```markdown
# Retry And Error Policy

Task retry fields:

- `attempt`
- `maxAttempts`
- `nextRetryAt`
- `lastRetryAt`
- `retryDelayMs`
- `lockedBy`
- `lockedUntil`
- `lastErrorCode`
- `lastErrorMessage`
- `lastErrorAt`

Policy:

- Retryable failures move tasks to `retrying` and emit `task_retry_scheduled`.
- Exhausted failures move tasks to `failed` and emit `task_dead_lettered`.
- Non-retryable policy failures move tasks to `blocked` or `failed` with an event.
- External model failures are advisory provider failures, not product runtime facts.
```

- [ ] **Step 7: Create runtime health doc**

Create `docs/projects/clientops-cms/decision-mesh/runtime-health.md` with:

```markdown
# Runtime Health

Runtime health nodes:

- `docker_engine`: `up`, `down`, `blocked`
- `postgres_db`: `up`, `down`, `migrating`, `blocked`
- `payload_runtime`: `ok`, `degraded`, `error`, `blocked`
- `payload_admin`: `ok`, `degraded`, `error`, `blocked`
- `seed_state`: `not_run`, `applied`, `failing`, `blocked`

Failure propagation:

- If `docker_engine` is down, `postgres_db` is `blocked`.
- If `postgres_db` is down, Payload DB-backed APIs are `blocked` or `degraded`.
- Health endpoints must distinguish process health from DB readiness.
```

- [ ] **Step 8: Create project mesh README and test data**

Create `docs/projects/clientops-cms/decision-mesh/README.md`:

```markdown
# ClientOps CMS Decision Mesh

This project mesh governs ClientOps CMS only. It does not replace Autopilot's root operational mesh.

Covered surfaces:

- lead intake
- workflow task queue
- workflow event audit trail
- runtime health
- human override
- advisory model usage

Primary capability: `automation_mesh`
Supporting capabilities: `data_mesh`, `observability_mesh`, `bot_rag_mesh`
```

Create `docs/projects/clientops-cms/test-data.md`:

```markdown
# Test Data

Valid lead:

```json
{
  "name": "Runtime Smoke",
  "email": "runtime-smoke@example.com",
  "project_type": "website",
  "message": "Smoke test lead",
  "source_path": "/kontakt?utm_source=smoke",
  "referrer": "https://radeq.cz",
  "locale": "cs"
}
```

Expected result:

- one `leads` record
- one `lead_review` task
- one `lead_received` or `task_created` workflow event
- response includes `leadId`, `taskId`, and eventually `correlationId`
```

- [ ] **Step 9: Verify docs are present**

Run:

```powershell
Test-Path docs/projects/clientops-cms/architecture.md
Test-Path docs/projects/clientops-cms/work-log.md
Test-Path docs/projects/clientops-cms/decision-mesh/README.md
```

Expected: all return `True`.

## Task 3: Add Runtime Health And Smoke Tooling

**Files:**
- Create: `src/app/api/health/route.ts`
- Create: `src/app/api/ready/route.ts`
- Create: `src/lib/runtime-health.ts`
- Create: `tests/runtime-health.test.ts`
- Create: `scripts/smoke-clientops.ps1`
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Write runtime-health tests**

Create `tests/runtime-health.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { buildHealthPayload, buildReadyPayload } from '@/lib/runtime-health'

test('builds process health without requiring database readiness', () => {
  const payload = buildHealthPayload()

  assert.equal(payload.ok, true)
  assert.equal(payload.service, 'clientops-cms')
})

test('builds readiness payload for healthy database probe', () => {
  const payload = buildReadyPayload({ database: 'up' })

  assert.equal(payload.ok, true)
  assert.equal(payload.runtime.postgres_db.status, 'up')
})

test('builds readiness payload for blocked database probe', () => {
  const payload = buildReadyPayload({ database: 'blocked', reason: 'ECONNREFUSED 127.0.0.1:5432' })

  assert.equal(payload.ok, false)
  assert.equal(payload.runtime.postgres_db.status, 'blocked')
  assert.equal(payload.runtime.payload_runtime.status, 'blocked')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test -- tests/runtime-health.test.ts
```

Expected: FAIL because `src/lib/runtime-health.ts` does not exist.

- [ ] **Step 3: Implement runtime health helper**

Create `src/lib/runtime-health.ts`:

```ts
export type RuntimeStatus = 'up' | 'down' | 'blocked' | 'ok' | 'degraded' | 'error' | 'not_run' | 'applied' | 'failing'

interface ReadinessInput {
  database: 'up' | 'blocked' | 'down'
  reason?: string
}

export function buildHealthPayload() {
  return {
    ok: true,
    service: 'clientops-cms',
    checkedAt: new Date().toISOString()
  }
}

export function buildReadyPayload(input: ReadinessInput) {
  const dbOk = input.database === 'up'

  return {
    ok: dbOk,
    service: 'clientops-cms',
    checkedAt: new Date().toISOString(),
    runtime: {
      postgres_db: {
        status: input.database,
        reason: input.reason
      },
      payload_runtime: {
        status: dbOk ? 'ok' : 'blocked',
        reason: dbOk ? undefined : input.reason
      }
    }
  }
}
```

- [ ] **Step 4: Add health route**

Create `src/app/api/health/route.ts`:

```ts
import { buildHealthPayload } from '@/lib/runtime-health'

export const runtime = 'nodejs'

export function GET() {
  return Response.json(buildHealthPayload(), {
    headers: {
      'cache-control': 'no-store'
    }
  })
}
```

- [ ] **Step 5: Add readiness route**

Create `src/app/api/ready/route.ts`:

```ts
import config from '@payload-config'
import { getPayload } from 'payload'

import { buildReadyPayload } from '@/lib/runtime-health'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    await payload.find({
      collection: 'users',
      limit: 1,
      depth: 0,
      overrideAccess: true
    })

    return Response.json(buildReadyPayload({ database: 'up' }), {
      headers: { 'cache-control': 'no-store' }
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown readiness failure'

    return Response.json(buildReadyPayload({ database: 'blocked', reason }), {
      status: 503,
      headers: { 'cache-control': 'no-store' }
    })
  }
}
```

- [ ] **Step 6: Verify runtime health tests**

Run:

```powershell
npm.cmd test -- tests/runtime-health.test.ts
npm.cmd run typecheck
```

Expected: runtime-health tests pass and TypeScript passes.

- [ ] **Step 7: Create smoke script**

Create `scripts/smoke-clientops.ps1`:

```powershell
$ErrorActionPreference = "Stop"

$BaseUrl = if ($env:NEXT_PUBLIC_APP_URL) { $env:NEXT_PUBLIC_APP_URL } else { "http://127.0.0.1:3000" }

Write-Host "== Health =="
Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/health" | Select-Object StatusCode

Write-Host "== Ready =="
Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/ready" | Select-Object StatusCode

Write-Host "== Workflow tasks =="
Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/workflow/tasks" | Select-Object StatusCode

Write-Host "== Lead intake =="
$body = @{
  name = "Runtime Smoke"
  email = "runtime-smoke@example.com"
  project_type = "website"
  message = "Smoke test lead"
  source_path = "/kontakt?utm_source=smoke"
  referrer = "https://radeq.cz"
  locale = "cs"
} | ConvertTo-Json

Invoke-WebRequest -UseBasicParsing -Method POST "$BaseUrl/api/public/leads" -ContentType "application/json" -Body $body | Select-Object StatusCode, Content
```

## Task 4: Add Mesh Contract Types And Tests

**Files:**
- Create: `src/lib/mesh-contracts.ts`
- Create: `tests/mesh-contracts.test.ts`
- Modify: `src/lib/workflow.ts`

- [ ] **Step 1: Write mesh contract tests**

Create `tests/mesh-contracts.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createCorrelationId,
  createDeterministicTaskId,
  normalizeIdempotencyKey,
  workflowEventTypes
} from '@/lib/mesh-contracts'

test('exposes canonical workflow event types', () => {
  assert.ok(workflowEventTypes.includes('lead_received'))
  assert.ok(workflowEventTypes.includes('task_retry_scheduled'))
  assert.ok(workflowEventTypes.includes('manual_override_applied'))
})

test('normalizes idempotency keys safely', () => {
  assert.equal(normalizeIdempotencyKey('  Lead:ABC  '), 'lead:abc')
  assert.equal(normalizeIdempotencyKey(''), '')
})

test('creates uuid-like correlation ids', () => {
  assert.match(createCorrelationId(), /^[0-9a-f-]{36}$/)
})

test('creates deterministic task ids from stable inputs', () => {
  const first = createDeterministicTaskId({
    taskType: 'lead_review',
    correlationId: 'corr-1',
    idempotencyKey: 'lead:test@example.com',
    subjectId: 'lead-1'
  })
  const second = createDeterministicTaskId({
    taskType: 'lead_review',
    correlationId: 'corr-1',
    idempotencyKey: 'lead:test@example.com',
    subjectId: 'lead-1'
  })

  assert.equal(first, second)
  assert.match(first, /^LEAD_REVIEW-/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test -- tests/mesh-contracts.test.ts
```

Expected: FAIL because `src/lib/mesh-contracts.ts` does not exist.

- [ ] **Step 3: Implement mesh contract helpers**

Create `src/lib/mesh-contracts.ts`:

```ts
import { createHash, randomUUID } from 'node:crypto'

export const projectSlug = 'clientops-cms'
export const meshPolicyVersion = 'clientops-cms-mesh-v1'

export const workflowEventTypes = [
  'lead_received',
  'lead_rejected',
  'task_created',
  'task_claimed',
  'task_started',
  'task_progress',
  'task_retry_scheduled',
  'task_succeeded',
  'task_failed',
  'task_dead_lettered',
  'task_cancelled',
  'task_blocked',
  'manual_override_applied',
  'mesh_policy_checked'
] as const

export type WorkflowEventType = (typeof workflowEventTypes)[number]

export const taskStates = [
  'queued',
  'claimed',
  'running',
  'waiting_owner',
  'retrying',
  'blocked',
  'done',
  'failed',
  'cancelled'
] as const

export type TaskState = (typeof taskStates)[number]

export function createCorrelationId(): string {
  return randomUUID()
}

export function normalizeIdempotencyKey(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase().slice(0, 180) : ''
}

export function createDeterministicTaskId(input: {
  taskType: string
  correlationId: string
  idempotencyKey: string
  subjectId: string
}): string {
  const seed = [input.taskType, input.correlationId, input.idempotencyKey, input.subjectId].join('|')
  const digest = createHash('sha256').update(seed).digest('hex').slice(0, 12)
  return `${input.taskType}-${digest}`.replace(/[^a-z0-9]+/gi, '_').replace(/_$/, '').toUpperCase()
}
```

- [ ] **Step 4: Verify mesh contract tests**

Run:

```powershell
npm.cmd test -- tests/mesh-contracts.test.ts
npm.cmd run typecheck
```

Expected: tests pass and TypeScript passes.

## Task 5: Extend Payload Collections For Mesh Contracts

**Files:**
- Modify: `src/collections/Leads.ts`
- Modify: `src/collections/Tasks.ts`
- Modify: `src/collections/WorkflowEvents.ts`
- Modify: `src/lib/workflow.ts`
- Test: `npm.cmd run typecheck`

- [ ] **Step 1: Extend lead fields**

Add these fields to `src/collections/Leads.ts` near source/audit fields:

```ts
{ name: 'correlationId', type: 'text', index: true },
{ name: 'idempotencyKey', type: 'text', index: true },
{ name: 'dedupeKey', type: 'text', unique: true },
{ name: 'source', type: 'text', defaultValue: 'public_lead_api' },
{ name: 'projectSlug', type: 'text', defaultValue: 'clientops-cms' },
{ name: 'meshRunId', type: 'text' },
```

Also update status options to include `queued`, `working`, `blocked`, `closed`, and `failed` while keeping existing business states if still needed.

- [ ] **Step 2: Extend task fields**

Add these fields to `src/collections/Tasks.ts`:

```ts
{ name: 'correlationId', type: 'text', index: true },
{ name: 'idempotencyKey', type: 'text', index: true },
{ name: 'sourceTaskId', type: 'text' },
{ name: 'projectSlug', type: 'text', defaultValue: 'clientops-cms' },
{ name: 'workflowRunId', type: 'text' },
{ name: 'attempt', type: 'number', defaultValue: 0, required: true },
{ name: 'maxAttempts', type: 'number', defaultValue: 3, required: true },
{ name: 'nextRetryAt', type: 'date' },
{ name: 'lastRetryAt', type: 'date' },
{ name: 'retryDelayMs', type: 'number', defaultValue: 0 },
{ name: 'lockedBy', type: 'text' },
{ name: 'lockedUntil', type: 'date' },
{ name: 'lastErrorCode', type: 'text' },
{ name: 'lastErrorMessage', type: 'textarea' },
{ name: 'lastErrorAt', type: 'date' },
```

Update task state options to canonical values: `queued`, `claimed`, `running`, `waiting_owner`, `retrying`, `blocked`, `done`, `failed`, `cancelled`.

- [ ] **Step 3: Extend workflow event fields**

Replace `eventType` text with select options from the canonical event set and add:

```ts
{ name: 'eventId', type: 'text', required: true, unique: true },
{ name: 'occurredAt', type: 'date', required: true },
{ name: 'correlationId', type: 'text', required: true, index: true },
{ name: 'idempotencyKey', type: 'text', index: true },
{ name: 'projectSlug', type: 'text', defaultValue: 'clientops-cms', required: true },
{ name: 'workflowRunId', type: 'text' },
{ name: 'actorType', type: 'select', options: ['system', 'human', 'mesh', 'worker'], defaultValue: 'system', required: true },
{ name: 'actorId', type: 'text' },
{ name: 'policyVersion', type: 'text', defaultValue: 'clientops-cms-mesh-v1' },
{ name: 'source', type: 'text', defaultValue: 'clientops-cms' },
{ name: 'result', type: 'json', defaultValue: {} },
{ name: 'error', type: 'json', defaultValue: {} },
{ name: 'attempt', type: 'number', defaultValue: 0 },
{ name: 'retryable', type: 'checkbox', defaultValue: false },
```

- [ ] **Step 4: Typecheck collection changes**

Run:

```powershell
npm.cmd run typecheck
```

Expected: TypeScript passes.

## Task 6: Add Idempotent Lead Intake And Deterministic Task Creation

**Entry Gate:** Complete Task 7 before executing any endpoint-level mutation against `/api/workflow/tasks`. Steps in this task that only exercise pure helpers or public lead intake may run before Task 7, but mesh-facing task mutation must wait for the workflow auth gate.

**Files:**
- Modify: `src/lib/leads.ts`
- Modify: `src/lib/workflow.ts`
- Modify: `src/app/api/public/leads/route.ts`
- Modify: `tests/leads.test.ts`
- Modify: `tests/workflow.test.ts`

- [ ] **Step 1: Add tests for correlation and idempotency extraction**

Extend `tests/leads.test.ts`:

```ts
test('maps correlation and idempotency metadata to CMS fields', () => {
  const result = validateLeadSubmission({
    ...completeLead,
    correlation_id: '11111111-1111-4111-8111-111111111111',
    idempotency_key: 'Lead:Jan@example.com'
  })
  assert.equal(result.ok, true)
  if (!result.ok) return

  const data = leadToCMSData(result.data, {
    ...completeLead,
    correlation_id: '11111111-1111-4111-8111-111111111111',
    idempotency_key: 'Lead:Jan@example.com'
  })

  assert.equal(data.correlationId, '11111111-1111-4111-8111-111111111111')
  assert.equal(data.idempotencyKey, 'lead:jan@example.com')
  assert.equal(data.dedupeKey, 'public_lead_api:lead:jan@example.com')
})
```

- [ ] **Step 2: Add workflow tests for deterministic task IDs**

Update `tests/workflow.test.ts` so `createTaskId` takes stable input:

```ts
test('creates deterministic workflow task ids for replay-safe task creation', () => {
  const first = createTaskId('lead_review', {
    correlationId: 'corr-1',
    idempotencyKey: 'lead:test@example.com',
    subjectId: 'lead-1'
  })
  const second = createTaskId('lead_review', {
    correlationId: 'corr-1',
    idempotencyKey: 'lead:test@example.com',
    subjectId: 'lead-1'
  })

  assert.equal(first, second)
})
```

- [ ] **Step 3: Run tests to verify failures**

Run:

```powershell
npm.cmd test -- tests/leads.test.ts tests/workflow.test.ts
```

Expected: FAIL because correlation/idempotency mapping and deterministic task ID signature are not implemented.

- [ ] **Step 4: Implement lead metadata mapping**

Update `src/lib/leads.ts` to:

- accept optional `correlation_id`
- accept optional `idempotency_key`
- normalize idempotency with `normalizeIdempotencyKey`
- generate fallback correlation IDs in route layer when absent
- produce `correlationId`, `idempotencyKey`, `dedupeKey`, `source`, and `projectSlug` in `leadToCMSData`

- [ ] **Step 5: Implement task dedupe contract**

Update `src/lib/workflow.ts` to:

- use `createDeterministicTaskId`
- lookup existing leads by `dedupeKey` before creating a duplicate
- return `{ leadId, taskId, deduplicated }`
- create canonical workflow event payloads with `eventId`, `occurredAt`, `correlationId`, and `idempotencyKey`
- detect a `dedupeKey` collision when the existing lead email/message/project type differs from the incoming payload and return a blocked review response instead of overwriting

- [ ] **Step 6: Verify tests**

Run:

```powershell
npm.cmd test -- tests/leads.test.ts tests/workflow.test.ts tests/mesh-contracts.test.ts
npm.cmd run typecheck
```

Expected: tests and typecheck pass.

## Task 7: Secure Workflow API Boundary

**Execution Note:** This task is the auth gate for mesh-facing task mutation. Execute it before running any integration smoke test or worker that posts or patches workflow tasks.

**Files:**
- Modify: `.env.example`
- Create: `src/lib/mesh-auth.ts`
- Create: `tests/api-auth.test.ts`
- Modify: `src/app/api/workflow/tasks/route.ts`
- Modify: `README.md`

- [ ] **Step 1: Add mesh service token example**

Add to `.env.example`:

```text
MESH_SERVICE_TOKEN=replace-with-local-dev-token
```

- [ ] **Step 2: Write auth tests**

Create `tests/api-auth.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { isAuthorizedMeshRequest } from '@/lib/mesh-auth'

test('rejects missing mesh service token when configured', () => {
  assert.equal(isAuthorizedMeshRequest(undefined, 'secret'), false)
})

test('accepts bearer token when it matches configured token', () => {
  assert.equal(isAuthorizedMeshRequest('Bearer secret', 'secret'), true)
})

test('accepts x-mesh-service-token when it matches configured token', () => {
  assert.equal(isAuthorizedMeshRequest('secret', 'secret'), true)
})
```

- [ ] **Step 3: Implement auth helper**

Create `src/lib/mesh-auth.ts`:

```ts
export function isAuthorizedMeshRequest(headerValue: string | undefined | null, configuredToken: string | undefined): boolean {
  if (!configuredToken) {
    return process.env.NODE_ENV !== 'production'
  }

  if (!headerValue) {
    return false
  }

  const value = headerValue.startsWith('Bearer ') ? headerValue.slice('Bearer '.length) : headerValue
  return value === configuredToken
}

export function getMeshAuthHeader(request: Request): string | null {
  return request.headers.get('authorization') ?? request.headers.get('x-mesh-service-token')
}
```

- [ ] **Step 4: Protect workflow POST and future PATCH**

In `src/app/api/workflow/tasks/route.ts`, require auth for `POST`:

```ts
const authHeader = getMeshAuthHeader(request)
if (!isAuthorizedMeshRequest(authHeader, process.env.MESH_SERVICE_TOKEN)) {
  return Response.json({ ok: false, error: 'Unauthorized workflow request.' }, { status: 401 })
}
```

Keep `GET` read behavior local for development until a separate read auth decision is made, or protect it too if the project mesh classifies it as non-public.

- [ ] **Step 5: Verify**

Run:

```powershell
npm.cmd test -- tests/api-auth.test.ts
npm.cmd run typecheck
```

Expected: tests and typecheck pass.

## Task 8: Add Retry, Error, Manual Override, And Admin Audit Helpers

**Files:**
- Modify: `src/lib/workflow.ts`
- Modify: `src/app/api/workflow/tasks/route.ts`
- Modify: `src/collections/Leads.ts`
- Modify: `src/collections/Tasks.ts`
- Create: `tests/task-retry.test.ts`

- [ ] **Step 1: Write retry helper tests**

Create `tests/task-retry.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { buildRetryUpdate, buildDeadLetterUpdate } from '@/lib/workflow'

test('builds retry update before max attempts are exhausted', () => {
  const update = buildRetryUpdate({
    attempt: 1,
    maxAttempts: 3,
    errorCode: 'UPSTREAM_TIMEOUT',
    errorMessage: 'Timed out'
  })

  assert.equal(update.state, 'retrying')
  assert.equal(update.attempt, 2)
  assert.equal(update.lastErrorCode, 'UPSTREAM_TIMEOUT')
})

test('builds dead-letter update when max attempts are exhausted', () => {
  const update = buildDeadLetterUpdate({
    attempt: 3,
    errorCode: 'UPSTREAM_TIMEOUT',
    errorMessage: 'Timed out'
  })

  assert.equal(update.state, 'failed')
  assert.equal(update.lastErrorCode, 'UPSTREAM_TIMEOUT')
})
```

- [ ] **Step 2: Implement retry helpers**

Add to `src/lib/workflow.ts`:

```ts
export function buildRetryUpdate(input: {
  attempt: number
  maxAttempts: number
  errorCode: string
  errorMessage: string
}) {
  const nextAttempt = input.attempt + 1
  return {
    state: nextAttempt >= input.maxAttempts ? 'failed' : 'retrying',
    attempt: nextAttempt,
    lastErrorCode: input.errorCode,
    lastErrorMessage: input.errorMessage,
    lastErrorAt: new Date().toISOString(),
    retryDelayMs: nextAttempt >= input.maxAttempts ? 0 : Math.min(60000, 1000 * 2 ** nextAttempt)
  }
}

export function buildDeadLetterUpdate(input: { attempt: number; errorCode: string; errorMessage: string }) {
  return {
    state: 'failed',
    attempt: input.attempt,
    lastErrorCode: input.errorCode,
    lastErrorMessage: input.errorMessage,
    lastErrorAt: new Date().toISOString(),
    retryDelayMs: 0
  }
}
```

- [ ] **Step 3: Add workflow update endpoint**

Add `PATCH` to `src/app/api/workflow/tasks/route.ts` requiring mesh auth and accepting:

```ts
{
  "taskId": "LEAD_REVIEW-...",
  "state": "running",
  "result": {},
  "error": {},
  "actorId": "clientops-worker"
}
```

The handler must:

- find task by `taskId`
- update allowed state/result/error fields
- append a canonical workflow event
- reject unknown states
- reject invalid transitions such as `failed` to `running` unless the request includes a manual override reason
- return `{ ok: true, task }`

- [ ] **Step 4: Add Admin UI audit hooks for lead/task state changes**

Update `src/collections/Leads.ts` and `src/collections/Tasks.ts` with `afterChange` hooks that detect state/status changes made through Payload admin and append a `manual_override_applied` event. The hook must record previous value, new value, collection, document id, actor type `human`, and reason `payload_admin_state_change`.

If the hook cannot safely create a workflow event because the changed document is not linked to a task or lead yet, it must skip event creation rather than blocking the admin save.

- [ ] **Step 5: Verify**

Run:

```powershell
npm.cmd test -- tests/task-retry.test.ts
npm.cmd run typecheck
```

Expected: tests and typecheck pass.

## Task 9: Claude/Gemini Re-Review Before Automation

**Files:**
- Create: `docs/projects/clientops-cms/advisory-prompt.md`
- Update: `docs/projects/clientops-cms/work-log.md`

- [ ] **Step 1: Prepare bounded prompt packet**

Create `docs/projects/clientops-cms/advisory-prompt.md` with:

```text
External advisory review only. Do not modify files. Do not request secrets.

Current verified facts:
- Docker/Postgres recovery is required before DB-backed Payload admin/API can be called operational.
- Project mesh docs are expected at docs/projects/clientops-cms/decision-mesh/.
- Workflow auth is expected through MESH_SERVICE_TOKEN and src/lib/mesh-auth.ts.
- Idempotency is expected through correlationId, idempotencyKey, dedupeKey, and deterministic task IDs.
- Verification commands are npm.cmd run lint, npm.cmd run typecheck, npm.cmd test, npm.cmd run build, docker compose up -d --wait, npm.cmd run seed, and scripts/smoke-clientops.ps1.

Question:
Critique only these remaining risks: auth boundary, idempotency, retry/dead-letter, manual override, source-of-truth, Docker health. Return:
1. must-fix before automation
2. acceptable later
3. stop conditions
4. prompt was too broad? yes/no and why
```

- [ ] **Step 2: Run Claude**

Run:

```powershell
$prompt = Get-Content docs\projects\clientops-cms\advisory-prompt.md -Raw
claude -p $prompt --permission-mode plan --tools "" --no-session-persistence --output-format text
```

Expected: model output present. If output is broad, re-prompt with "Return only a JSON object with keys `mustFix`, `later`, `stopConditions`."

- [ ] **Step 3: Run Gemini**

Run:

```powershell
$prompt = Get-Content docs\projects\clientops-cms\advisory-prompt.md -Raw
gemini.cmd --skip-trust --approval-mode plan --output-format text --prompt $prompt
```

Expected: model output present. If output is broad, re-prompt with the same JSON-only schema.

- [ ] **Step 4: Record advisory result**

Append to `docs/projects/clientops-cms/work-log.md`:

```markdown
External advisory:
- Claude: reviewed auth, idempotency, retry/dead-letter, manual override, source-of-truth, and Docker health as advisory-only critique.
- Gemini: reviewed the same bounded prompt as advisory-only brainstorming; broad or off-target output was not adopted without local evidence.
- Adopted changes: keep workflow auth/idempotency before automation; keep HITL for model-proposed state changes; keep Docker health separate from schema health.
- Rejected changes: autonomous enrichment, QA bots, and push/outbox delivery remain future work until baseline gates pass.
```

## Task 10: Final Verification And Handoff

**Files:**
- Modify: `README.md`
- Modify: `docs/projects/clientops-cms/work-log.md`

- [ ] **Step 1: Run static verification**

Run:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Expected: all pass.

- [ ] **Step 2: Run Docker-backed verification**

Run when Docker daemon is available:

```powershell
docker compose up -d --wait
npm.cmd run seed
powershell -ExecutionPolicy Bypass -File scripts/smoke-clientops.ps1
```

Expected:

- DB is ready.
- seed is idempotent.
- health endpoint returns `200`.
- ready endpoint returns `200`.
- workflow task list returns JSON.
- lead POST returns one lead/task event chain.

- [ ] **Step 3: Run audit and record risk**

Run:

```powershell
npm.cmd audit --audit-level=moderate
```

Expected: if only transitive `esbuild` under Payload/Drizzle remains, record accepted moderate transitive tooling risk in work log. Do not run `npm audit fix --force`.

- [ ] **Step 4: Update README**

Ensure README includes:

- Docker recovery commands
- `scripts/docker-doctor.ps1`
- `scripts/smoke-clientops.ps1`
- health/readiness endpoints
- mesh docs location
- workflow auth env var
- Claude/Gemini advisory protocol summary

- [ ] **Step 5: Update work log**

Append:

```markdown
Date: 2026-06-12
Request or trigger: Implement Docker recovery and Decision Mesh integration baseline.
Mode: WRITE_ALLOWED
Scope: Runtime health, project mesh, workflow contracts, auth/idempotency/retry foundations.
Files changed: docs/projects/clientops-cms/architecture.md; docs/projects/clientops-cms/work-log.md; docs/projects/clientops-cms/test-data.md; docs/projects/clientops-cms/advisory-prompt.md; docs/projects/clientops-cms/decision-mesh/README.md; docs/projects/clientops-cms/decision-mesh/source-of-truth.md; docs/projects/clientops-cms/decision-mesh/event-contracts.md; docs/projects/clientops-cms/decision-mesh/manual-override.md; docs/projects/clientops-cms/decision-mesh/retry-and-error-policy.md; docs/projects/clientops-cms/decision-mesh/runtime-health.md; scripts/docker-doctor.ps1; scripts/smoke-clientops.ps1; src/app/api/health/route.ts; src/app/api/ready/route.ts; src/app/api/public/leads/route.ts; src/app/api/workflow/tasks/route.ts; src/lib/runtime-health.ts; src/lib/mesh-contracts.ts; src/lib/mesh-auth.ts; src/lib/leads.ts; src/lib/workflow.ts; src/collections/Leads.ts; src/collections/Tasks.ts; src/collections/WorkflowEvents.ts; tests/runtime-health.test.ts; tests/mesh-contracts.test.ts; tests/api-auth.test.ts; tests/task-retry.test.ts; tests/leads.test.ts; tests/workflow.test.ts; README.md; .env.example.
Architecture impact: ClientOps CMS now has a project-specific mesh and explicit source-of-truth/runtime-health contracts.
Decisions: Payload/Postgres remains canonical state; workflow-events remain append-only audit evidence; Autopilot root mesh stays separate; Claude/Gemini outputs remain advisory; workflow automation waits for auth, idempotency, retry, and Docker readiness gates.
Verification: npm.cmd run lint; npm.cmd run typecheck; npm.cmd test; npm.cmd run build; docker compose up -d --wait when Docker is available; npm.cmd run seed twice; powershell -ExecutionPolicy Bypass -File scripts/smoke-clientops.ps1.
Risks: Docker Desktop can still be unavailable; transitive esbuild audit finding can remain until upstream dependency changes; external push/outbox delivery is intentionally deferred.
Follow-up: implement external outbox/push delivery only after secure pull/controlled-ingress mode is proven.
```

- [ ] **Step 6: Stop conditions check**

Do not claim completion if any of these are true:

- Docker/Postgres not verified and the claim says runtime is operational.
- Project mesh docs missing.
- Workflow POST remains unauthenticated.
- Idempotency is missing on lead/task creation.
- No test covers retry/dead-letter helper behavior.
- Claude/Gemini advisory output is treated as canonical state.
- Work log lacks verification evidence.
