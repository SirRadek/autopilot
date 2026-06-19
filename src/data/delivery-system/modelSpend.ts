export interface ModelSpendPolicy {
  readonly providerDependency: "provider_neutral";
  readonly lowCostWorkerUse: readonly string[];
  readonly longContextResearchUse: readonly string[];
  readonly creativeReviewUse: readonly string[];
  readonly freeCloudAdvisoryUse: readonly string[];
  readonly repoExecutorUse: readonly string[];
  readonly frontierOnlyWhen: readonly string[];
  readonly requiredChecks: readonly string[];
  readonly stopConditions: readonly string[];
}

export const modelSpendPolicy = {
  providerDependency: "provider_neutral",
  lowCostWorkerUse: [
    "bulk_summarization",
    "seo_drafts",
    "data_cleanup_plans",
    "document_reconstruction_drafts",
    "task_packet_generation",
    "first_pass_code",
    "classification"
  ],
  longContextResearchUse: [
    "long_context_research",
    "brainstorming_variants",
    "market_research",
    "document_understanding",
    "broad_planning"
  ],
  creativeReviewUse: ["design_review", "ux_critique", "creative_direction", "architecture_critique"],
  freeCloudAdvisoryUse: [
    "brainstorming",
    "architecture_second_opinion",
    "design_critique",
    "security_critique",
    "planning_critique",
    "agent_validation",
    "research_synthesis"
  ],
  repoExecutorUse: ["repo_editing", "tests", "refactors", "debugging", "patch_workflow"],
  frontierOnlyWhen: [
    "high_risk",
    "ambiguous",
    "architecture_level",
    "security_sensitive",
    "repeated_failure",
    "final_review"
  ],
  requiredChecks: [
    "provider_availability_verified",
    "free_tier_or_no_cost_confirmed",
    "redacted_context_only",
    "context7_or_official_docs_verified",
    "gemini_brainstorm_claims_labeled_and_verified",
    "factual_claims_verified",
    "smallest_safe_model_class"
  ],
  stopConditions: [
    "provider_availability_unverified",
    "non_local_worker_dependency",
    "cloud_model_for_routine_worker_loop",
    "frontier_used_for_simple_worker_task",
    "model_choice_affects_risk_without_disclosure",
    "paid_model_or_credit_required",
    "technology_claim_without_context7_or_official_docs",
    "gemini_claim_adopted_without_verification"
  ]
} as const satisfies ModelSpendPolicy;

// ---------------------------------------------------------------------------
// Burn-rate governance (typed mirror of multi-model-orchestration-operating-model.md)
// ---------------------------------------------------------------------------

export type BudgetState = "green" | "yellow" | "red";
export type MeasurementConfidence = "high" | "medium" | "low" | "unknown";

/** Traffic-light thresholds. remaining_pct is a 0..1 fraction (matches the
 *  Antigravity `remainingPercentage` field), NOT a 0..100 percentage. */
export const BUDGET_GREEN_MIN = 0.65;
export const BUDGET_YELLOW_MIN = 0.35;

export interface BurnGovernancePolicy {
  /** Drive routing off remaining capacity, never raw token counts. The original
   *  `burn_pct` framing was semantically inverted; we track remaining_pct. */
  readonly metric: "remaining_pct";
  /** Do NOT equalize provider burn — it Goodharts work onto weaker/less-private
   *  providers. Route by suitability; budget is only a late-stage gate. */
  readonly equalizeBurn: false;
  readonly routingOrder: readonly string[];
  readonly trafficLight: { readonly greenMin: number; readonly yellowMin: number };
  readonly measurementConfidence: readonly MeasurementConfidence[];
  readonly degradationStates: readonly string[];
  readonly stopConditions: readonly string[];
}

export const burnGovernancePolicy = {
  metric: "remaining_pct",
  equalizeBurn: false,
  routingOrder: [
    "eligibility",
    "privacy_fit",
    "task_fit",
    "cost_state",
    "recent_quality",
    "availability"
  ],
  trafficLight: { greenMin: BUDGET_GREEN_MIN, yellowMin: BUDGET_YELLOW_MIN },
  measurementConfidence: ["high", "medium", "low", "unknown"],
  degradationStates: [
    "ready",
    "provider_unavailable",
    "quota_unknown",
    "quota_exhausted",
    "blocked_owner"
  ],
  stopConditions: [
    "equalize_burn_across_providers",
    "fabricated_burn_number",
    "route_by_budget_before_task_fit",
    "hard_flip_on_unsettled_meter"
  ]
} as const satisfies BurnGovernancePolicy;

/**
 * Pure traffic-light classifier. `remainingPct` is a 0..1 fraction.
 *
 * When there is no reliable meter (`remainingPct === null` or
 * `confidence === "unknown"`) the result is `yellow` — behave cautiously: never
 * assume capacity you cannot measure, and never fabricate a burn number (the
 * GPT-lane correction). Hidden consumer-UI surfaces fall here by design.
 */
export function classifyBudgetState(
  remainingPct: number | null,
  confidence: MeasurementConfidence
): BudgetState {
  if (remainingPct === null || confidence === "unknown") {
    return "yellow";
  }
  if (remainingPct >= BUDGET_GREEN_MIN) {
    return "green";
  }
  if (remainingPct >= BUDGET_YELLOW_MIN) {
    return "yellow";
  }
  return "red";
}
