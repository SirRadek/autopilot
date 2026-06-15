import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createCorrelationId,
  createDeterministicTaskId,
  normalizeIdempotencyKey,
  taskStates,
  workflowEventTypes
} from '@/lib/mesh-contracts'

test('exposes canonical workflow event types', () => {
  assert.ok(workflowEventTypes.includes('lead_received'))
  assert.ok(workflowEventTypes.includes('task_retry_scheduled'))
  assert.ok(workflowEventTypes.includes('manual_override_applied'))
  assert.ok(workflowEventTypes.includes('opportunity_imported'))
  assert.ok(workflowEventTypes.includes('opportunity_personal_data_purged'))
  assert.ok(workflowEventTypes.includes('opportunity_source_blocked'))
})

test('exposes canonical task states', () => {
  assert.ok(taskStates.includes('queued'))
  assert.ok(taskStates.includes('waiting_owner'))
  assert.ok(taskStates.includes('failed'))
})

test('normalizes idempotency keys safely', () => {
  assert.equal(normalizeIdempotencyKey('  Lead:ABC  '), 'lead:abc')
  assert.equal(normalizeIdempotencyKey(''), '')
})

test('creates uuid-like correlation ids', () => {
  assert.match(createCorrelationId(), /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
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
  assert.match(first, /^LEAD_REVIEW-[A-F0-9]{12}$/)
})
