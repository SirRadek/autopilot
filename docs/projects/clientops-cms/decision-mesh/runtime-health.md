# Runtime Health

Runtime health nodes:

- `docker_engine`: `up`, `down`, `blocked`
- `postgres_db`: `up`, `down`, `migrating`, `blocked`
- `payload_runtime`: `ok`, `degraded`, `error`, `blocked`
- `payload_admin`: `ok`, `degraded`, `error`, `blocked`
- `seed_state`: `not_run`, `applied`, `failing`, `blocked`
- `workflow_task_api`: `ok`, `auth_failed`, `degraded`, `blocked`
- `opportunity_ingest_api`: `not_built`, `ok`, `auth_failed`, `degraded`, `blocked`
- `opportunity_live_web_source`: `not_configured`, `precondition_blocked`, `ok`, `degraded`, `blocked`
- `opportunity_live_hlidac_statu`: `optional_disabled`, `not_configured`, `precondition_blocked`, `ok`, `degraded`, `blocked`
- `scrapeflow_runner`: `not_configured`, `ok`, `degraded`, `blocked`
- `opportunity_retention_purge`: `not_built`, `manual_only`, `ok`, `failing`, `blocked`

Failure propagation:

- If `docker_engine` is down, `postgres_db` is `blocked`.
- If `postgres_db` is down, Payload DB-backed APIs are `blocked` or `degraded`.
- Health endpoints must distinguish process health from DB readiness.
- Opportunity live source runs are blocked until `opportunity_ingest_api`, `scrapeflow_runner`, and `opportunity_retention_purge` have local fixture evidence.

Current local evidence from 2026-06-12:

- Docker context `desktop-linux` reached a live daemon after starting Docker Desktop.
- Postgres container `autopilot-postgres-1` reached `healthy`.
- `pg_isready` accepted connections for `autopilot_clientops`.
- Payload admin and workflow API returned `200`.
- Public lead intake returned `201` after fixing numeric relationship IDs.

Current local evidence from 2026-06-13:

- Root Autopilot provider usage mesh now has a document home under `docs/autopilot/decision-mesh/`.

Current local evidence from 2026-06-14:

- Opportunity collections and protected ingest/purge routes are implemented.
- Automated tests cover fixture import, replay, duplicate skip, collision block, PII-free events, and idempotent purge.
- Generic live web-source runner is implemented and mesh-token gated.
- Live web URL fetch is `precondition_blocked` unless source terms, allowed hosts, and robots review are configured.
- Hlidac Statu remains optional and disabled unless token, attribution, and commercial approval are confirmed.
