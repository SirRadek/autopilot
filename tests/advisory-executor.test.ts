import assert from 'node:assert/strict'
import test from 'node:test'

import { runAdvisoryConsultation, type AdvisoryModelPort } from '@/server/advisory/executor'
import { assertNotAdvisory, isAdvisoryResult, requireCanonicalDecision } from '@/lib/advisory-result'
import type { AdvisoryConsultationRequest } from '@/lib/advisory-boundary'

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

function countingPort(): AdvisoryModelPort & { calls: number } {
  return {
    calls: 0,
    async run() {
      this.calls += 1
      return { content: 'use a capped exponential backoff with a dead-letter after N attempts', actual_tokens: 1720, latency_ms: 1234, provider_txn_id: 'tx-9' }
    }
  }
}

test('executes the model through the choke point and returns an opaque advisory result', async () => {
  const port = countingPort()
  const run = await runAdvisoryConsultation(port, request())
  assert.equal(run.status, 'completed')
  assert.equal(port.calls, 1)
  assert.ok(run.result && isAdvisoryResult(run.result))
  assert.equal(run.completed_event?.eventType, 'advisory_consult_completed')
  assert.equal(run.usage_entry.actual_tokens, 1720)
})

test('blocks at the gate WITHOUT calling the model (empty prompt)', async () => {
  const port = countingPort()
  const run = await runAdvisoryConsultation(port, request({ packet: { ...request().packet, prompt: '' } }))
  assert.equal(run.status, 'blocked')
  assert.equal(port.calls, 0)
  assert.equal(run.result, null)
  assert.equal(run.completed_event, null)
})

test('records a failed completion when the model call throws', async () => {
  const port: AdvisoryModelPort = {
    async run() {
      throw new Error('provider 503')
    }
  }
  const run = await runAdvisoryConsultation(port, request())
  assert.equal(run.status, 'failed')
  assert.equal(run.result, null)
  assert.equal(run.completed_event?.eventType, 'advisory_consult_completed')
  assert.equal(run.completed_event?.result.outcome, 'failed')
})

test('canonical writes refuse advisory output but accept an explicit decision', async () => {
  const run = await runAdvisoryConsultation(countingPort(), request())
  assert.throws(() => assertNotAdvisory(run.result), /without an explicit CanonicalDecision/)

  const decision = requireCanonicalDecision({
    decision_event_id: 'evt-1',
    decided_by: 'admin:jane',
    source_advisory_id: run.result?.advisory_id,
    canonical_patch: { status: 'reviewed' }
  })
  assert.equal(decision.decided_by, 'admin:jane')
  assert.throws(() => requireCanonicalDecision({ canonical_patch: { x: 1 } }), /requires a CanonicalDecision/)
})
