import { validateAgentDispatchPacket, type AgentDispatchPacket } from './agent-dispatch'
import { createCorrelationId, normalizeIdempotencyKey, projectSlug, type WorkflowEventType } from './mesh-contracts'
import { classifyBudgetState, type BudgetState, type MeasurementConfidence } from './model-spend'
import type { UsageLedgerEntry } from './usage-ledger'

// The sanctioned boundary for ClientOps to consult an advisory model. It enforces
// "advisory model isolation": the consult is guarded (never an empty/lost prompt),
// budget-gated, recorded as redacted usage evidence, and surfaced as an append-only
// workflow event — and it NEVER mutates canonical state or returns a decision. The model
// is executed by the caller; this module decides whether the consult is allowed and
// builds the evidence in ClientOps' own vocabulary (correlationId, idempotencyKey,
// projectSlug, workflow event).

export const ADVISORY_EVENT_TYPE: WorkflowEventType = 'advisory_model_consulted'
export const ADVISORY_ACTOR_TYPE = 'mesh' as const

export interface AdvisoryConsultationRequest {
  readonly packet: AgentDispatchPacket
  readonly task_type: string
  readonly remaining_pct: number | null
  readonly measurement_confidence: MeasurementConfidence
  readonly estimated_tokens?: number | null
  readonly correlationId?: string
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
  readonly usage_entry: UsageLedgerEntry
  readonly audit: AdvisoryAuditEvent
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
    eventType: ADVISORY_EVENT_TYPE,
    actorType: ADVISORY_ACTOR_TYPE,
    correlationId,
    idempotencyKey:
      normalizeIdempotencyKey(`advisory:${correlationId}:${request.packet.dispatch_id}`) ||
      `advisory:${request.packet.dispatch_id}`,
    projectSlug,
    // Redacted: the raw prompt is never recorded — only its durable pointer and routing.
    result: { allowed, advisory_only: true, budget_state: budgetState, blocked_reason: blockedReason },
    payload: {
      lane: request.packet.lane,
      provider: request.packet.provider,
      model: request.packet.model,
      task_type: request.task_type,
      prompt_path: request.packet.prompt_path
    }
  }

  return {
    allowed,
    advisory_only: true,
    budget_state: budgetState,
    blocked_reason: blockedReason,
    usage_entry: usageEntry,
    audit
  }
}
