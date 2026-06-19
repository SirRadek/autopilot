import { createHash } from 'node:crypto'

import { validateAgentDispatchPacket, type AgentDispatchPacket } from './agent-dispatch'
import { createCorrelationId, projectSlug, type WorkflowEventType } from './mesh-contracts'
import { classifyBudgetState, type BudgetState, type MeasurementConfidence } from './model-spend'
import type { UsageLedgerEntry } from './usage-ledger'

// The sanctioned POLICY PRIMITIVE for ClientOps advisory-model usage. It is NOT a
// runtime isolation boundary by itself — a pure function cannot stop a caller from
// executing a model or writing canonical state (3-vendor review, 2026-06-19). True
// isolation also requires the model client + credentials to live only behind the
// sanctioned executor. What this module guarantees is: a guarded + budget-gated
// decision, redacted evidence, and a HONEST two-phase audit (prepared, then completed)
// expressed in ClientOps' own vocabulary. The model is executed by the caller, which
// must record the outcome via `recordAdvisoryOutcome` and never feed advisory output
// into a canonical write without an explicit decision.

export const ADVISORY_PREPARED_EVENT: WorkflowEventType = 'advisory_consult_prepared'
export const ADVISORY_COMPLETED_EVENT: WorkflowEventType = 'advisory_consult_completed'
export const ADVISORY_ACTOR_TYPE = 'mesh' as const

export type AdvisoryOutcome = 'completed' | 'failed' | 'timed_out'

export interface AdvisoryConsultationRequest {
  readonly packet: AgentDispatchPacket
  readonly task_type: string
  readonly remaining_pct: number | null
  readonly measurement_confidence: MeasurementConfidence
  readonly estimated_tokens?: number | null
  readonly correlationId?: string
  // Who actually triggered the consult (human/worker/job), so 'mesh' as executor does
  // not launder accountability.
  readonly initiated_by?: string
  // Red-budget consults need an explicit owner override (budget is a late gate, not a veto).
  readonly allow_red_budget?: boolean
}

// Structural subset of AppendWorkflowEventInput — pass straight to appendWorkflowEvent.
export interface AdvisoryAuditEvent {
  readonly eventType: WorkflowEventType
  readonly actorType: typeof ADVISORY_ACTOR_TYPE
  readonly correlationId: string
  readonly idempotencyKey: string
  readonly projectSlug: string
  readonly result: Record<string, unknown>
  readonly payload: Record<string, unknown>
}

export interface AdvisoryConsultation {
  readonly allowed: boolean
  readonly advisory_only: true
  readonly budget_state: BudgetState
  readonly blocked_reason: string | null
  // Stable id linking the prepared event to its later completion event.
  readonly consultation_key: string
  readonly usage_entry: UsageLedgerEntry
  readonly audit: AdvisoryAuditEvent
}

export interface AdvisoryOutcomeInput {
  readonly consultation_key: string
  readonly correlationId: string
  readonly outcome: AdvisoryOutcome
  readonly actual_tokens?: number | null
  readonly latency_ms?: number | null
  readonly provider_txn_id?: string | null
  readonly remaining_pct_after?: number | null
  // Did the advisory output actually feed a downstream plan/decision?
  readonly used_in_final_plan?: boolean
}

export interface AdvisoryOutcomeRecord {
  readonly audit: AdvisoryAuditEvent
  // Reconciliation patch for the originally-recorded usage entry.
  readonly usage_patch: {
    readonly actual_tokens: number | null
    readonly remaining_pct_after: number | null
    readonly used_in_final_plan: boolean
  }
}

// Deterministic key over the DURABLE inputs of a consult, so retries with the same
// inputs dedupe but a changed packet (provider/model/lane/task/path) does not.
function consultationKey(input: {
  correlationId: string
  dispatch_id: string
  lane: string
  provider: string
  model: string
  task_type: string
  prompt_path: string
}): string {
  const seed = [
    input.correlationId,
    input.dispatch_id,
    input.lane,
    input.provider,
    input.model,
    input.task_type,
    input.prompt_path
  ].join('|')
  return createHash('sha256').update(seed).digest('hex').slice(0, 32)
}

export function prepareAdvisoryConsultation(request: AdvisoryConsultationRequest): AdvisoryConsultation {
  const correlationId = request.correlationId ?? createCorrelationId()
  const budgetState = classifyBudgetState(request.remaining_pct, request.measurement_confidence)
  const guard = validateAgentDispatchPacket(request.packet)

  let blockedReason: string | null = null
  if (!guard.valid) {
    blockedReason = `dispatch guard: ${guard.errors[0] ?? 'invalid packet'}`
  } else if (budgetState === 'red' && !request.allow_red_budget) {
    blockedReason = 'budget red: advisory consult needs an explicit owner override'
  }
  const allowed = blockedReason === null

  const key = consultationKey({
    correlationId,
    dispatch_id: request.packet.dispatch_id,
    lane: request.packet.lane,
    provider: request.packet.provider,
    model: request.packet.model,
    task_type: request.task_type,
    prompt_path: request.packet.prompt_path
  })

  const usageEntry: UsageLedgerEntry = {
    date: new Date().toISOString().slice(0, 10),
    project: projectSlug,
    phase: 'advisory',
    lane: request.packet.lane,
    provider: request.packet.provider,
    model: request.packet.model,
    surface: 'api',
    reasoning: 'advisory',
    context_level: 'narrow',
    task_type: request.task_type,
    estimated_tokens: request.estimated_tokens ?? null,
    actual_tokens: null,
    quota_source: request.remaining_pct === null ? 'unknown' : 'dashboard_manual',
    measurement_confidence: request.measurement_confidence,
    remaining_pct_before: request.remaining_pct,
    remaining_pct_after: null,
    quality_score: null,
    used_in_final_plan: false
  }

  const audit: AdvisoryAuditEvent = {
    eventType: ADVISORY_PREPARED_EVENT,
    actorType: ADVISORY_ACTOR_TYPE,
    correlationId,
    idempotencyKey: `advisory:prepared:${key}`,
    projectSlug,
    // Redacted: the raw prompt is never recorded — only its durable pointer and routing.
    result: { allowed, advisory_only: true, budget_state: budgetState, blocked_reason: blockedReason },
    payload: {
      lane: request.packet.lane,
      provider: request.packet.provider,
      model: request.packet.model,
      task_type: request.task_type,
      prompt_path: request.packet.prompt_path,
      initiated_by: request.initiated_by ?? null
    }
  }

  return {
    allowed,
    advisory_only: true,
    budget_state: budgetState,
    blocked_reason: blockedReason,
    consultation_key: key,
    usage_entry: usageEntry,
    audit
  }
}

// Paired post-call event: records the ACTUAL outcome after the caller executed (or
// failed to execute) the model. Reconciles the pre-flight estimate with reality
// (actual tokens, latency, provider txn id) so the ledger is not silently wrong.
export function recordAdvisoryOutcome(input: AdvisoryOutcomeInput): AdvisoryOutcomeRecord {
  const usagePatch = {
    actual_tokens: input.actual_tokens ?? null,
    remaining_pct_after: input.remaining_pct_after ?? null,
    used_in_final_plan: input.used_in_final_plan ?? false
  }

  const audit: AdvisoryAuditEvent = {
    eventType: ADVISORY_COMPLETED_EVENT,
    actorType: ADVISORY_ACTOR_TYPE,
    correlationId: input.correlationId,
    idempotencyKey: `advisory:completed:${input.consultation_key}`,
    projectSlug,
    result: {
      advisory_only: true,
      outcome: input.outcome,
      ...usagePatch
    },
    payload: {
      consultation_key: input.consultation_key,
      latency_ms: input.latency_ms ?? null,
      provider_txn_id: input.provider_txn_id ?? null
    }
  }

  return { audit, usage_patch: usagePatch }
}
