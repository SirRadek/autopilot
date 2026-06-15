import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildAtomicTaskClaimSql,
  PATCH as workflowPatch,
  POST as workflowPost,
  resolveWorkflowPatchActor
} from '@/app/api/workflow/tasks/route'

test('requires explicit human actor id for manual override events', () => {
  const result = resolveWorkflowPatchActor({
    manualOverrideReason: 'Owner approved retry'
  })

  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.status, 400)
    assert.match(result.error, /actorId/)
  }
})

test('keeps worker fallback only for non-human worker events', () => {
  const result = resolveWorkflowPatchActor({})

  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.actorType, 'worker')
    assert.equal(result.actorId, 'clientops-worker')
    assert.equal(result.workerId, 'clientops-worker')
  }
})

test('uses explicit actor id for accepted manual override events', () => {
  const result = resolveWorkflowPatchActor({
    actorId: 'owner@example.com',
    manualOverrideReason: 'Owner approved retry'
  })

  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.actorType, 'human')
    assert.equal(result.actorId, 'owner@example.com')
    assert.equal(result.workerId, undefined)
    assert.equal(result.manualOverrideReason, 'Owner approved retry')
  }
})

test('workflow task mutations reject the broad mesh read token', async () => {
  const previousMeshToken = process.env.MESH_SERVICE_TOKEN
  const previousMutationToken = process.env.WORKFLOW_MUTATION_TOKEN
  process.env.MESH_SERVICE_TOKEN = 'read-token'
  process.env.WORKFLOW_MUTATION_TOKEN = 'mutation-token'

  try {
    const response = await workflowPost(
      new Request('http://localhost/api/workflow/tasks', {
        method: 'POST',
        headers: {
          authorization: 'Bearer read-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ title: 'Do not create' })
      })
    )
    const patchResponse = await workflowPatch(
      new Request('http://localhost/api/workflow/tasks', {
        method: 'PATCH',
        headers: {
          authorization: 'Bearer read-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ taskId: 'TASK-1', state: 'claimed', actorId: 'worker-a' })
      })
    )

    assert.equal(response.status, 401)
    assert.equal(patchResponse.status, 401)
  } finally {
    restoreEnv('MESH_SERVICE_TOKEN', previousMeshToken)
    restoreEnv('WORKFLOW_MUTATION_TOKEN', previousMutationToken)
  }
})

test('atomic task claim SQL updates only the same task state and claimable lock window', () => {
  const query = buildAtomicTaskClaimSql({
    tableName: 'public.tasks',
    taskId: 123,
    currentState: 'queued',
    actorId: 'worker-a',
    lockedUntil: '2026-06-15T10:15:00.000Z',
    resultPayload: {},
    errorPayload: {},
    now: new Date('2026-06-15T10:00:00.000Z')
  })

  assert.match(query.text, /^UPDATE "public"\."tasks" SET /)
  assert.match(query.text, /WHERE "id" = \$7/)
  assert.match(query.text, /AND "state" = \$8/)
  assert.match(query.text, /"locked_by" IS NULL/)
  assert.match(query.text, /"locked_by" = \$2/)
  assert.match(query.text, /"locked_until" IS NULL/)
  assert.match(query.text, /"locked_until" <= \$6/)
  assert.match(query.text, /"next_retry_at" IS NULL/)
  assert.match(query.text, /"next_retry_at" <= \$6/)
  assert.match(query.text, /RETURNING "id"$/)
  assert.deepEqual(query.values, [
    'claimed',
    'worker-a',
    '2026-06-15T10:15:00.000Z',
    '{}',
    '{}',
    '2026-06-15T10:00:00.000Z',
    123,
    'queued'
  ])
})

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key]
    return
  }

  process.env[key] = value
}
