import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildDeadLetterUpdate,
  buildRetryUpdate,
  buildTaskClaimUpdate,
  canClaimTask,
  shouldReleaseWorkerLock,
  validateWorkerLock,
  validateTaskTransition
} from '@/lib/workflow'

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
  assert.equal(update.retryDelayMs, 4000)
  assert.ok(update.nextRetryAt)
})

test('builds failed update when retry attempts are exhausted', () => {
  const update = buildRetryUpdate({
    attempt: 2,
    maxAttempts: 3,
    errorCode: 'UPSTREAM_TIMEOUT',
    errorMessage: 'Timed out'
  })

  assert.equal(update.state, 'failed')
  assert.equal(update.attempt, 3)
  assert.equal(update.retryDelayMs, 0)
  assert.equal(update.nextRetryAt, undefined)
})

test('builds dead-letter update when max attempts are exhausted', () => {
  const update = buildDeadLetterUpdate({
    attempt: 3,
    errorCode: 'UPSTREAM_TIMEOUT',
    errorMessage: 'Timed out'
  })

  assert.equal(update.state, 'failed')
  assert.equal(update.attempt, 3)
  assert.equal(update.lastErrorCode, 'UPSTREAM_TIMEOUT')
})

test('requires manual override before moving terminal tasks back to active states', () => {
  const rejected = validateTaskTransition({
    currentState: 'failed',
    nextState: 'running'
  })
  assert.equal(rejected.ok, false)

  const accepted = validateTaskTransition({
    currentState: 'failed',
    nextState: 'running',
    manualOverrideReason: 'Retry after owner review'
  })
  assert.equal(accepted.ok, true)
  if (accepted.ok) {
    assert.equal(accepted.eventType, 'manual_override_applied')
  }
})

test('builds worker claim locks with bounded expiry', () => {
  const claim = buildTaskClaimUpdate({
    workerId: 'worker-a',
    now: new Date('2026-06-13T10:00:00.000Z'),
    lockMs: 60_000
  })

  assert.equal(claim.state, 'claimed')
  assert.equal(claim.lockedBy, 'worker-a')
  assert.equal(claim.lockedUntil, '2026-06-13T10:01:00.000Z')
})

test('allows claims for unlocked, same-worker, or expired locks only', () => {
  const now = new Date('2026-06-13T10:00:00.000Z')

  assert.equal(canClaimTask({ workerId: 'worker-a', now }), true)
  assert.equal(
    canClaimTask({
      workerId: 'worker-a',
      lockedBy: 'worker-a',
      lockedUntil: '2026-06-13T10:10:00.000Z',
      now
    }),
    true
  )
  assert.equal(
    canClaimTask({
      workerId: 'worker-a',
      lockedBy: 'worker-b',
      lockedUntil: '2026-06-13T09:59:59.000Z',
      now
    }),
    true
  )
  assert.equal(
    canClaimTask({
      workerId: 'worker-a',
      lockedBy: 'worker-b',
      lockedUntil: '2026-06-13T10:10:00.000Z',
      now
    }),
    false
  )
})

test('blocks claims until retry backoff window opens', () => {
  const now = new Date('2026-06-13T10:00:00.000Z')

  assert.equal(
    canClaimTask({
      workerId: 'worker-a',
      nextRetryAt: '2026-06-13T10:01:00.000Z',
      now
    }),
    false
  )

  assert.equal(
    canClaimTask({
      workerId: 'worker-a',
      nextRetryAt: '2026-06-13T09:59:59.000Z',
      now
    }),
    true
  )
})

test('requires an unexpired worker-owned lock for worker state changes', () => {
  const now = new Date('2026-06-13T10:00:00.000Z')

  assert.deepEqual(
    validateWorkerLock({
      workerId: 'worker-a',
      lockedBy: 'worker-a',
      lockedUntil: '2026-06-13T10:10:00.000Z',
      now
    }),
    { ok: true }
  )

  assert.equal(
    validateWorkerLock({
      workerId: 'worker-a',
      lockedBy: 'worker-b',
      lockedUntil: '2026-06-13T10:10:00.000Z',
      now
    }).ok,
    false
  )

  assert.equal(
    validateWorkerLock({
      workerId: 'worker-a',
      lockedBy: 'worker-a',
      lockedUntil: '2026-06-13T09:59:59.000Z',
      now
    }).ok,
    false
  )
})

test('releases worker locks when tasks leave active execution', () => {
  assert.equal(shouldReleaseWorkerLock('running'), false)
  assert.equal(shouldReleaseWorkerLock('done'), true)
  assert.equal(shouldReleaseWorkerLock('retrying'), true)
  assert.equal(shouldReleaseWorkerLock('blocked'), true)
})
