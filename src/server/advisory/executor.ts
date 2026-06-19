import {
  prepareAdvisoryConsultation,
  recordAdvisoryOutcome,
  type AdvisoryAuditEvent,
  type AdvisoryConsultationRequest
} from '@/lib/advisory-boundary'
import { createAdvisoryResult, type AdvisoryResult } from '@/lib/advisory-result'
import type { UsageLedgerEntry } from '@/lib/usage-ledger'

// The sanctioned, server-only choke point. Model credentials and the model client must
// live ONLY in this package (`src/server/advisory/**`); `tests/advisory-isolation-guard`
// fails the build if a model SDK import or a `*_API_KEY` env access appears anywhere
// else. (For a Next-native guard, `import 'server-only'` can be added at the top.)
//
// This is the enforced version of the advisory boundary: non-sanctioned code cannot turn
// policy approval into model bytes, and the result it returns is an opaque AdvisoryResult
// that canonical mutators refuse without an explicit CanonicalDecision.
function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error('advisory executor is server-only and must not run in the browser')
  }
}

export interface ModelCallResult {
  readonly content: string
  readonly actual_tokens: number | null
  readonly latency_ms?: number | null
  readonly provider_txn_id?: string | null
}

// The ONLY place a model is actually invoked. A real implementation (owning credentials)
// lives in this package once a provider is integrated; until then a stub is injected.
export interface AdvisoryModelPort {
  run(prompt: string): Promise<ModelCallResult>
}

export interface AdvisoryExecution {
  readonly status: 'completed' | 'blocked' | 'failed'
  readonly prepared_event: AdvisoryAuditEvent
  readonly completed_event: AdvisoryAuditEvent | null
  readonly result: AdvisoryResult | null
  readonly blocked_reason: string | null
  readonly usage_entry: UsageLedgerEntry
}

export async function runAdvisoryConsultation(
  port: AdvisoryModelPort,
  request: AdvisoryConsultationRequest
): Promise<AdvisoryExecution> {
  assertServerOnly()

  const consult = prepareAdvisoryConsultation(request)
  if (!consult.allowed) {
    // Gate failed (guard or budget): the model is never called.
    return {
      status: 'blocked',
      prepared_event: consult.audit,
      completed_event: null,
      result: null,
      blocked_reason: consult.blocked_reason,
      usage_entry: consult.usage_entry
    }
  }

  const startedAt = Date.now()
  try {
    const call = await port.run(request.packet.prompt)
    const latencyMs = call.latency_ms ?? Date.now() - startedAt
    const outcome = recordAdvisoryOutcome({
      consultation_key: consult.consultation_key,
      correlationId: consult.audit.correlationId,
      outcome: 'completed',
      actual_tokens: call.actual_tokens,
      latency_ms: latencyMs,
      provider_txn_id: call.provider_txn_id ?? null,
      remaining_pct_after: null,
      used_in_final_plan: false
    })

    return {
      status: 'completed',
      prepared_event: consult.audit,
      completed_event: outcome.audit,
      result: createAdvisoryResult({
        advisory_id: consult.consultation_key,
        content: call.content,
        usage: { actual_tokens: call.actual_tokens, latency_ms: latencyMs, provider_txn_id: call.provider_txn_id ?? null }
      }),
      blocked_reason: null,
      usage_entry: { ...consult.usage_entry, ...outcome.usage_patch }
    }
  } catch (error) {
    const outcome = recordAdvisoryOutcome({
      consultation_key: consult.consultation_key,
      correlationId: consult.audit.correlationId,
      outcome: 'failed',
      latency_ms: Date.now() - startedAt
    })
    return {
      status: 'failed',
      prepared_event: consult.audit,
      completed_event: outcome.audit,
      result: null,
      blocked_reason: error instanceof Error ? error.message : 'model call failed',
      usage_entry: consult.usage_entry
    }
  }
}
