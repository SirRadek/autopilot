import assert from 'node:assert/strict'
import test from 'node:test'

import { selectLane, type LaneCandidate } from '@/lib/lane-selector'

function lane(overrides: Partial<LaneCandidate>): LaneCandidate {
  return {
    lane: 'technical',
    provider: 'openai',
    eligible: true,
    privacy_ok: true,
    available: true,
    task_fit: 0.7,
    remaining_pct: 0.9,
    measurement_confidence: 'high',
    recent_quality: 0.8,
    ...overrides
  }
}

test('lets task fit dominate — a clearly better fit wins even with a red budget', () => {
  const result = selectLane([
    lane({ lane: 'technical', provider: 'openai', task_fit: 0.9, remaining_pct: 0.1 }),
    lane({ lane: 'ux', provider: 'google_antigravity', task_fit: 0.6, remaining_pct: 0.95 })
  ])
  assert.equal(result.selected?.provider, 'openai')
  assert.equal(result.selected?.budget_state, 'red')
})

test('uses budget as a late gate to break near-equal fits', () => {
  const result = selectLane([
    lane({ lane: 'technical', provider: 'openai', task_fit: 0.8, remaining_pct: 0.1 }),
    lane({ lane: 'strategic', provider: 'anthropic', task_fit: 0.75, remaining_pct: 0.95 })
  ])
  assert.equal(result.selected?.provider, 'anthropic')
  assert.equal(result.selected?.budget_state, 'green')
})

test('returns blocked_owner when no lane is eligible or privacy-compatible', () => {
  const result = selectLane([lane({ privacy_ok: false }), lane({ eligible: false })])
  assert.equal(result.selected, null)
  assert.equal(result.state, 'blocked_owner')
})

test('returns provider_unavailable when eligible lanes are all unavailable', () => {
  const result = selectLane([lane({ available: false }), lane({ available: false, provider: 'anthropic' })])
  assert.equal(result.selected, null)
  assert.equal(result.state, 'provider_unavailable')
})

test('selects a ready lane and ranks the candidates', () => {
  const result = selectLane([lane({})])
  assert.equal(result.state, 'ready')
  assert.equal(result.ranked.length, 1)
})
