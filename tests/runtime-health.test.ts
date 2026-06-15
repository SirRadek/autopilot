import assert from 'node:assert/strict'
import test from 'node:test'

import { buildHealthPayload, buildReadyPayload, sanitizeReadinessReason } from '@/lib/runtime-health'

test('builds process health without requiring database readiness', () => {
  const payload = buildHealthPayload()

  assert.equal(payload.ok, true)
  assert.equal(payload.service, 'clientops-cms')
})

test('builds readiness payload for healthy database probe', () => {
  const payload = buildReadyPayload({ database: 'up' })

  assert.equal(payload.ok, true)
  assert.equal(payload.runtime.postgres_db.status, 'up')
  assert.equal(payload.runtime.payload_runtime.status, 'ok')
})

test('builds readiness payload for blocked database probe', () => {
  const payload = buildReadyPayload({ database: 'blocked', reason: 'ECONNREFUSED 127.0.0.1:5432' })

  assert.equal(payload.ok, false)
  assert.equal(payload.runtime.postgres_db.status, 'blocked')
  assert.equal(payload.runtime.payload_runtime.status, 'blocked')
})

test('redacts postgres connection strings from readiness reasons', () => {
  assert.equal(
    sanitizeReadinessReason('failed postgres://postgres:secret@127.0.0.1:5432/autopilot_clientops'),
    'failed postgres://[redacted]@127.0.0.1:5432/autopilot_clientops'
  )
})
