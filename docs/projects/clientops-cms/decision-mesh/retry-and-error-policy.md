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
- Opportunity source failures use opportunity-specific blocked evidence and must not mutate lead/task state directly.

Before external worker automation:

- A worker must claim a task through `lockedBy` and `lockedUntil` before performing retryable work.
- Concurrent workers must not execute the same task unless the previous lock is expired and an audit event explains the takeover.
- `PATCH /api/workflow/tasks` with `state: "claimed"` creates or renews the lock for the caller `actorId`.
- Worker state changes after claim require the same `actorId` and a non-expired `lockedUntil`; otherwise the API returns a lock failure.
- Terminal, retry, blocked, waiting-owner, and queued outcomes release the worker lock.
- Failure handlers must classify errors as retryable infrastructure failures or non-retryable validation, policy, or business failures.
- A task that reaches `maxAttempts` must move to `failed` and append terminal audit evidence before any further automation touches it.
- A task in `failed` or `cancelled` cannot move back to active states without `manual_override_applied`.
- A task in `retrying` must not be claimed before `nextRetryAt`.
- Expired locks are cleared only when a valid worker claim or terminal state update succeeds; operators should not expect a background lock cleanup loop in this phase.

Opportunity monitor failure classes:

- `source_terms_blocked`: source disabled until human review.
- `source_fetch_failed`: retry source run if retryable.
- `source_schema_mismatch`: block run and update scrapeflow contract.
- `source_host_not_allowed`: reject ingest row and block source review.
- `opportunity_duplicate`: skip duplicate row and append PII-free evidence.
- `opportunity_collision`: block review; do not overwrite existing item.
- `opportunity_ingest_unauthorized`: reject request before side effects.
- `opportunity_purge_failed`: block item and alert operator before further outreach.
