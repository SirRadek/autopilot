import assert from 'node:assert/strict'
import test from 'node:test'

import { validateAgentDispatchPacket } from '@/lib/agent-dispatch'

const validPacket = {
  dispatch_id: '2026-06-19-orchestration-technical',
  lane: 'technical',
  provider: 'openai',
  model: 'codex',
  prompt: 'Act as the hard technical opponent to the merged concept and return fatal issues.',
  prompt_path: '.agent/dispatch/2026-06-19-orchestration-technical.md',
  created_at: '2026-06-19T08:00:00.000Z'
}

test('accepts a durable, non-empty dispatch', () => {
  assert.deepEqual(validateAgentDispatchPacket(validPacket), { valid: true, errors: [] })
})

test('rejects an empty prompt (the temp-file-cleared bug)', () => {
  const result = validateAgentDispatchPacket({ ...validPacket, prompt: '' })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('must never reach a vendor')))
})

test('rejects a whitespace-only prompt', () => {
  const result = validateAgentDispatchPacket({ ...validPacket, prompt: '   \n  ' })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('too short to dispatch')))
})

test('rejects a prompt persisted to a volatile temp path', () => {
  const result = validateAgentDispatchPacket({ ...validPacket, prompt_path: '/tmp/p_codex2.txt' })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('volatile location')))
})

test('rejects the Windows per-user Temp folder as a prompt path', () => {
  const result = validateAgentDispatchPacket({
    ...validPacket,
    prompt_path: 'C:\\Users\\sirok\\AppData\\Local\\Temp\\packet.txt'
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('volatile location')))
})

test('reports missing mandatory fields', () => {
  const result = validateAgentDispatchPacket({ dispatch_id: 'missing-fields' })
  assert.equal(result.valid, false)
  for (const field of ['lane', 'provider', 'model', 'prompt', 'prompt_path', 'created_at']) {
    assert.ok(result.errors.includes(`${field} is required`))
  }
})
