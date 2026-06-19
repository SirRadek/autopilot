// Burn-rate governance for advisory model usage. Pure, deterministic, no runtime.
// Migrated from the archived control plane; aligns with the ClientOps rule that
// model output is advisory and automation must justify how it spends model capacity.

export type BudgetState = 'green' | 'yellow' | 'red'
export type MeasurementConfidence = 'high' | 'medium' | 'low' | 'unknown'

// remaining_pct is a 0..1 fraction (matches the Antigravity `remainingPercentage`
// field), NOT a 0..100 percentage.
export const BUDGET_GREEN_MIN = 0.65
export const BUDGET_YELLOW_MIN = 0.35

export interface BurnGovernancePolicy {
  // Route off remaining capacity, never raw token counts. The original `burn_pct`
  // framing was semantically inverted; we track remaining_pct.
  readonly metric: 'remaining_pct'
  // Do NOT equalize provider burn — it Goodharts work onto weaker/less-private
  // providers. Route by suitability; budget is only a late-stage gate.
  readonly equalizeBurn: false
  readonly routingOrder: readonly string[]
  readonly trafficLight: { readonly greenMin: number; readonly yellowMin: number }
  readonly measurementConfidence: readonly MeasurementConfidence[]
  readonly degradationStates: readonly string[]
  readonly stopConditions: readonly string[]
}

export const burnGovernancePolicy = {
  metric: 'remaining_pct',
  equalizeBurn: false,
  routingOrder: ['eligibility', 'privacy_fit', 'task_fit', 'cost_state', 'recent_quality', 'availability'],
  trafficLight: { greenMin: BUDGET_GREEN_MIN, yellowMin: BUDGET_YELLOW_MIN },
  measurementConfidence: ['high', 'medium', 'low', 'unknown'],
  degradationStates: ['ready', 'provider_unavailable', 'quota_unknown', 'quota_exhausted', 'blocked_owner'],
  stopConditions: [
    'equalize_burn_across_providers',
    'fabricated_burn_number',
    'route_by_budget_before_task_fit',
    'hard_flip_on_unsettled_meter'
  ]
} as const satisfies BurnGovernancePolicy

// Pure traffic-light classifier. `remainingPct` is a 0..1 fraction. When there is no
// reliable meter (null remaining or unknown confidence) the result is `yellow` —
// behave cautiously, never assume capacity you cannot measure, and never fabricate a
// burn number.
export function classifyBudgetState(remainingPct: number | null, confidence: MeasurementConfidence): BudgetState {
  if (remainingPct === null || confidence === 'unknown') {
    return 'yellow'
  }
  if (remainingPct >= BUDGET_GREEN_MIN) {
    return 'green'
  }
  if (remainingPct >= BUDGET_YELLOW_MIN) {
    return 'yellow'
  }
  return 'red'
}
