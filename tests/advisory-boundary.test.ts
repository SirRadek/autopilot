import assert from 'node:assert/strict'
import test from 'node:test'

import { prepareAdvisoryConsultation, type AdvisoryConsultationRequest } from '@/lib/advisory-boundary'
import { projectSlug, workflowEventTypes } from '@/lib/mesh-contracts'
import { validateUsageLedgerEntry } from '@/lib/usage-ledger'

function request(overrides: Partial<AdvisoryConsultationRequest> = {}): AdvisoryConsultationRequest {
  return {
    packet: {
      dispatch_id: 'adv-1',
      lane: 'technical',
      provider: 'openai',
      model: 'codex',
      prompt: 'Advise on the opportunity import retry policy edge cases.',
      prompt_path: '.agent/dispatch/adv-1.md',
      created_at: '2026-06-19T08:00:00.000Z'
    },
    task_type: 'opportunity_review_advisory',
    remaining_pct: 0.9,
    measurement_confidence: 'high',
    estimated_tokens: 1500,
    correlationId: 'corr-1',
    ...overrides
  }
}

test('allows a guarded, in-budget consult and stays advisory-only', () => {
  const result = prepareAdvisoryConsultation(request())
  assert.equal(result.allowed, true)
  assert.equal(result.advisory_only, true)
  assert.equal(result.budget_state, 'green')
  assert.equal(result.blocked_reason, null)
})

test('produces evidence in ClientOps vocabulary that slots into the audit trail', () => {
  const result = prepareAdvisoryConsultation(request())
  assert.ok(workflowEventTypes.includes(result.audit.eventType))
  assert.equal(result.audit.actorType, 'mesh')
  assert.equal(result.audit.correlationId, 'corr-1')
  assert.equal(result.audit.projectSlug, projectSlug)
  assert.equal(result.usage_entry.project, projectSlug)
  // The redacted usage record must itself satisfy the ledger contract.
  assert.deepEqual(validateUsageLedgerEntry(result.usage_entry), { valid: true, errors: [] })
})

test('never records the raw prompt (only its durable pointer)', () => {
  const result = prepareAdvisoryConsultation(request())
  const serialized = JSON.stringify({ audit: result.audit, usage: result.usage_entry })
  assert.ok(!serialized.includes('Advise on the opportunity'))
  assert.ok(serialized.includes('.agent/dispatch/adv-1.md'))
})

test('blocks an empty prompt at the boundary', () => {
  const result = prepareAdvisoryConsultation(request({ packet: { ...request().packet, prompt: '' } }))
  assert.equal(result.allowed, false)
  assert.match(result.blocked_reason ?? '', /dispatch guard/)
})

test('blocks a red-budget consult unless explicitly overridden', () => {
  const blocked = prepareAdvisoryConsultation(request({ remaining_pct: 0.1 }))
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.budget_state, 'red')
  assert.match(blocked.blocked_reason ?? '', /budget red/)

  const overridden = prepareAdvisoryConsultation(request({ remaining_pct: 0.1, allow_red_budget: true }))
  assert.equal(overridden.allowed, true)
  assert.equal(overridden.budget_state, 'red')
})

test('treats an unmetered consult as cautious (yellow), still allowed', () => {
  const result = prepareAdvisoryConsultation(request({ remaining_pct: null, measurement_confidence: 'unknown' }))
  assert.equal(result.budget_state, 'yellow')
  assert.equal(result.allowed, true)
  assert.equal(result.usage_entry.quota_source, 'unknown')
})
