export interface ModelSpendPolicy {
  readonly providerDependency: "provider_neutral";
  readonly lowCostWorkerUse: readonly string[];
  readonly longContextResearchUse: readonly string[];
  readonly creativeReviewUse: readonly string[];
  readonly freeCloudAdvisoryUse: readonly string[];
  readonly subscriptionInteractiveUse: readonly string[];
  readonly apiOrSelfHostedUse: readonly string[];
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
  subscriptionInteractiveUse: [
    "claude_code_architecture_second_opinion",
    "claude_code_security_critique",
    "claude_code_planning_critique",
    "claude_code_agent_validation",
    "bounded_interactive_repo_session_after_owner_scope"
  ],
  apiOrSelfHostedUse: [
    "openai_structured_outputs",
    "openai_tool_orchestration",
    "deepseek_json_or_reasoning_comparison",
    "deepseek_self_hosted_candidate",
    "hosted_provider_review_after_cost_decision"
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
    "subscription_entitlement_confirmed_for_subscription_tools",
    "api_credit_or_self_hosting_cost_confirmed",
    "redacted_context_only",
    "context7_or_official_docs_verified",
    "gemini_brainstorm_claims_labeled_and_verified",
    "owner_cost_decision_for_credentialed_provider",
    "factual_claims_verified",
    "smallest_safe_model_class",
    "disclose_model_choice_when_risk_affects_delivery"
  ],
  stopConditions: [
    "provider_availability_unverified",
    "non_local_worker_dependency",
    "cloud_model_for_routine_worker_loop",
    "frontier_used_for_simple_worker_task",
    "model_choice_affects_risk_without_disclosure",
    "paid_model_or_credit_required",
    "paid_model_or_credit_required_without_owner_decision",
    "subscription_entitlement_unverified",
    "api_credit_path_requested_without_owner_decision",
    "authentication_missing",
    "technology_claim_without_context7_or_official_docs",
    "gemini_claim_adopted_without_verification"
  ]
} as const satisfies ModelSpendPolicy;
