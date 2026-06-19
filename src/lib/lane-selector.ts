import { classifyBudgetState, type BudgetState, type MeasurementConfidence } from './model-spend'

// Pure lane recommender. Routes by the order
//   eligibility -> privacy_fit -> task_fit -> cost_state -> recent_quality -> availability
// with task fit dominant and budget only a late gate (budget decides between near-equal
// fits, never overrides a clearly better one). It recommends; it does not run.

// Lanes within this fit gap of the best are "near-equal" — budget may then break the tie.
export const LANE_FIT_TOLERANCE = 0.15

export interface LaneCandidate {
  readonly lane: string
  readonly provider: string
  readonly eligible: boolean
  readonly privacy_ok: boolean
  readonly available: boolean
  readonly task_fit: number
  readonly remaining_pct: number | null
  readonly measurement_confidence: MeasurementConfidence
  readonly recent_quality: number | null
}

export type LaneSelectionState = 'ready' | 'provider_unavailable' | 'blocked_owner'

export interface RankedLane {
  readonly lane: string
  readonly provider: string
  readonly task_fit: number
  readonly budget_state: BudgetState
}

export interface LaneSelection {
  readonly selected: { readonly lane: string; readonly provider: string; readonly budget_state: BudgetState } | null
  readonly state: LaneSelectionState
  readonly reason: string
  readonly ranked: readonly RankedLane[]
}

const BUDGET_RANK: Record<BudgetState, number> = { green: 0, yellow: 1, red: 2 }

export function selectLane(candidates: readonly LaneCandidate[]): LaneSelection {
  const viable = candidates.filter((candidate) => candidate.eligible && candidate.privacy_ok && candidate.available)

  if (viable.length === 0) {
    const policyBlocked = candidates.some((candidate) => !candidate.eligible || !candidate.privacy_ok)
    return {
      selected: null,
      state: policyBlocked ? 'blocked_owner' : 'provider_unavailable',
      reason: policyBlocked
        ? 'No lane is both eligible and privacy-compatible; needs an owner decision.'
        : 'No eligible, privacy-compatible lane is currently available.',
      ranked: []
    }
  }

  const bestFit = Math.max(...viable.map((candidate) => candidate.task_fit))
  const acceptable = viable.filter((candidate) => candidate.task_fit >= bestFit - LANE_FIT_TOLERANCE)

  const ranked = acceptable
    .map((candidate) => ({
      candidate,
      budget_state: classifyBudgetState(candidate.remaining_pct, candidate.measurement_confidence)
    }))
    .sort((left, right) => {
      if (BUDGET_RANK[left.budget_state] !== BUDGET_RANK[right.budget_state]) {
        return BUDGET_RANK[left.budget_state] - BUDGET_RANK[right.budget_state]
      }
      if (right.candidate.task_fit !== left.candidate.task_fit) {
        return right.candidate.task_fit - left.candidate.task_fit
      }
      const quality = (right.candidate.recent_quality ?? 0) - (left.candidate.recent_quality ?? 0)
      return quality !== 0 ? quality : left.candidate.provider.localeCompare(right.candidate.provider)
    })

  const top = ranked[0]
  if (!top) {
    return { selected: null, state: 'provider_unavailable', reason: 'No acceptable lane after fit gating.', ranked: [] }
  }

  return {
    selected: { lane: top.candidate.lane, provider: top.candidate.provider, budget_state: top.budget_state },
    state: 'ready',
    reason: buildReason(top.candidate, top.budget_state, bestFit),
    ranked: ranked.map((entry) => ({
      lane: entry.candidate.lane,
      provider: entry.candidate.provider,
      task_fit: entry.candidate.task_fit,
      budget_state: entry.budget_state
    }))
  }
}

function buildReason(candidate: LaneCandidate, budgetState: BudgetState, bestFit: number): string {
  const fitNote = candidate.task_fit >= bestFit ? 'best task fit' : 'near-best task fit'
  const budgetNote =
    budgetState === 'red'
      ? 'budget is red — only chosen because no healthier lane has comparable fit'
      : `budget ${budgetState}`
  return `${candidate.lane} (${candidate.provider}): ${fitNote}, ${budgetNote}.`
}
