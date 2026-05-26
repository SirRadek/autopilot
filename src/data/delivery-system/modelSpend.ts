export interface ModelSpendPolicy {
  readonly providerDependency: "provider_neutral";
  readonly lowCostWorkerUse: readonly string[];
  readonly longContextResearchUse: readonly string[];
  readonly creativeReviewUse: readonly string[];
  readonly repoExecutorUse: readonly string[];
  readonly frontierOnlyWhen: readonly string[];
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
  repoExecutorUse: ["repo_editing", "tests", "refactors", "debugging", "patch_workflow"],
  frontierOnlyWhen: [
    "high_risk",
    "ambiguous",
    "architecture_level",
    "security_sensitive",
    "repeated_failure",
    "final_review"
  ],
  stopConditions: [
    "provider_availability_unverified",
    "non_local_worker_dependency",
    "frontier_used_for_simple_worker_task",
    "model_choice_affects_risk_without_disclosure"
  ]
} as const satisfies ModelSpendPolicy;
