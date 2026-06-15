External advisory review only. Do not modify files. Do not request secrets.

Current verified facts:
- ClientOps CMS is a local Next.js 16 + Payload 3 + Postgres project at project slug `clientops-cms`.
- Docker/Postgres is healthy locally; `docker compose up -d --wait` and `pg_isready` pass.
- Project mesh docs exist at `docs/projects/clientops-cms/decision-mesh/`.
- Payload/Postgres owns canonical lead/task state; `workflow-events` is append-only audit evidence.
- Workflow mutation uses `MESH_SERVICE_TOKEN`; unauthenticated `POST/PATCH /api/workflow/tasks` returns 401.
- Public lead intake writes `correlationId`, normalized `idempotencyKey`, `dedupeKey`, `source`, and `projectSlug`.
- Public lead replay with the same idempotency key returns the existing lead/task; collision returns 202 with a blocked review task.
- Tasks now carry correlation, idempotency, retry/error, lock, result, and current error fields.
- Workflow events now carry eventId, occurredAt, correlationId, idempotencyKey, actor, policy, result, error, attempt, retryable, and project fields.
- `PATCH /api/workflow/tasks` rejects unknown states, rejects terminal-to-active transitions without `manualOverrideReason`, and appends workflow events.
- Admin lead/task state hooks append `manual_override_applied` events and skip only when workflow code passes `skipManualOverrideAudit`.
- Verification currently passing: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, Docker readiness, seed, smoke, lead replay/collision, PATCH transition checks.

Question:
Critique only these remaining risks: auth boundary, idempotency, retry/dead-letter, manual override, source-of-truth, Docker health, and advisory model isolation.

Return exactly:
1. must-fix before automation
2. acceptable later
3. stop conditions
4. prompt was too broad? yes/no and why
