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
- `opportunity_import_run_started`
- `opportunity_imported`
- `opportunity_duplicate_skipped`
- `opportunity_collision_blocked`
- `opportunity_review_decision`
- `opportunity_response_recorded`
- `opportunity_converted`
- `opportunity_personal_data_purged`
- `opportunity_source_blocked`

Rules:

- Every mesh-facing event must include `correlationId`.
- Replayed requests must return the existing lead/task where possible.
- Events are audit evidence and do not replace current state fields.
- Terminal-to-active task transitions must emit `manual_override_applied`; worker events alone are not enough.
- Dedupe collisions must create blocked review evidence instead of overwriting data.
- Workflow event payloads for leads, tasks, and opportunities must not include contact email, contact phone, requester name, lead name, company name, free-text private request content, or raw snippets containing contact data unless a future owner-approved exception is documented.
- `opportunity_personal_data_purged` records purge timestamp and field names cleared, not the purged values.
- Opportunity events are audit evidence; `opportunity-items.status` and retention fields remain canonical lifecycle state.
