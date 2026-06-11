export type TokenEfficiencyProfileId = "caveman" | "standard_compact" | "review_compact" | "research_compact";

export type TokenBudgetClass = "tiny" | "small" | "medium" | "large";

export interface TokenEfficiencyProfile {
  readonly id: TokenEfficiencyProfileId;
  readonly title: string;
  readonly budgetClass: TokenBudgetClass;
  readonly useFor: readonly string[];
  readonly contextRules: readonly string[];
  readonly firstMoves: readonly string[];
  readonly preferredWorkerOrder: readonly string[];
  readonly outputRules: readonly string[];
  readonly escalationRules: readonly string[];
  readonly stopConditions: readonly string[];
}

export interface TokenEfficiencyRouteInput {
  readonly task: string;
}

export interface TokenEfficiencyRouteResult {
  readonly profile: TokenEfficiencyProfileId;
  readonly budgetClass: TokenBudgetClass;
  readonly contextRules: readonly string[];
  readonly firstMoves: readonly string[];
  readonly preferredWorkerOrder: readonly string[];
  readonly outputRules: readonly string[];
  readonly escalationRules: readonly string[];
  readonly stopConditions: readonly string[];
}

export const tokenEfficiencyProfiles = [
  {
    id: "caveman",
    title: "Caveman Mode",
    budgetClass: "tiny",
    useFor: ["known_file_fix", "small_patch", "test_failure_triage", "simple_explanation", "routine_local_work"],
    contextRules: [
      "one_task_only",
      "read_must_read_files_only",
      "use_rg_before_opening_files",
      "prefer_diff_and_error_output_over_full_files",
      "avoid_full_repo_dump"
    ],
    firstMoves: [
      "classify_task",
      "select_capabilities_if_applicable",
      "select_local_worker_route",
      "run_deterministic_search_or_targeted_check",
      "draft_small_patch_or_answer"
    ],
    preferredWorkerOrder: [
      "deterministic_tools",
      "qwen2_5_coder_7b_fast",
      "qwen2_5_coder_14b_max_when_installed",
      "free_cloud_advisory_only_if_blocked"
    ],
    outputRules: [
      "answer_with_decision_and_next_action",
      "avoid_long_background_explanations",
      "cite_files_or_commands_used",
      "record_uncertainty_instead_of_guessing"
    ],
    escalationRules: [
      "escalate_when_architecture_or_security_decision_needed",
      "escalate_when_context_exceeds_local_worker_scope",
      "escalate_after_repeated_local_failure"
    ],
    stopConditions: [
      "full_repo_dump_requested_without_reason",
      "context_too_large_for_caveman_mode",
      "task_requires_architecture_decision",
      "paid_model_or_credit_required",
      "output_used_without_review"
    ]
  },
  {
    id: "standard_compact",
    title: "Standard Compact Mode",
    budgetClass: "small",
    useFor: ["bounded_feature", "small_refactor", "docs_update", "policy_update"],
    contextRules: [
      "relevant_subgraph_first",
      "agent_packet_first",
      "read_direct_dependencies_only",
      "summarize_before_adding_context"
    ],
    firstMoves: [
      "classify_task",
      "select_capabilities",
      "get_relevant_subgraph",
      "build_agent_packet",
      "select_local_worker_route"
    ],
    preferredWorkerOrder: [
      "deterministic_tools",
      "local_search_index",
      "qwen2_5_coder_7b_fast",
      "qwen2_5_coder_14b_max_when_installed"
    ],
    outputRules: [
      "show_changed_surface",
      "state_verification",
      "keep_summary_short"
    ],
    escalationRules: ["escalate_for_ambiguous_requirements", "escalate_for_cross_module_contracts"],
    stopConditions: ["missing_acceptance_criteria", "context_source_unclear", "output_used_without_review"]
  },
  {
    id: "review_compact",
    title: "Review Compact Mode",
    budgetClass: "medium",
    useFor: ["architecture_review", "security_review", "code_review", "governance_review"],
    contextRules: [
      "read_decision_records_first",
      "read_diff_before_full_files",
      "load_only_risk_relevant_files",
      "separate_facts_from_judgment"
    ],
    firstMoves: [
      "select_capabilities",
      "get_relevant_subgraph",
      "build_agent_packet",
      "select_reasoning_model_route",
      "verify_claims_locally"
    ],
    preferredWorkerOrder: [
      "deterministic_tools",
      "local_search_index",
      "human_or_frontier_review",
      "external_advisory_review",
      "free_cloud_advisory_review"
    ],
    outputRules: [
      "findings_first",
      "file_line_refs_when_available",
      "no_long_summary_before_findings"
    ],
    escalationRules: ["escalate_when_public_api_auth_payment_or_security_changes", "escalate_when_evidence_conflicts"],
    stopConditions: [
      "missing_risk_context",
      "private_data_not_redacted",
      "model_output_used_as_source_of_truth",
      "paid_model_or_credit_required"
    ]
  },
  {
    id: "research_compact",
    title: "Research Compact Mode",
    budgetClass: "medium",
    useFor: ["current_docs_check", "library_selection", "github_project_discovery", "technology_comparison"],
    contextRules: [
      "primary_sources_first",
      "current_date_check",
      "store_only_candidate_summary",
      "do_not_paste_large_docs"
    ],
    firstMoves: [
      "select_capabilities",
      "search_primary_sources",
      "check_license_and_activity",
      "update_local_architecture_library"
    ],
    preferredWorkerOrder: [
      "official_docs",
      "github_repository_search",
      "local_architecture_library",
      "external_advisory_review",
      "free_cloud_advisory_review"
    ],
    outputRules: [
      "candidate_table_only",
      "license_and_cost_status_required",
      "separate_recommendation_from_adoption"
    ],
    escalationRules: ["escalate_when_license_or_cost_unknown", "escalate_when_runtime_scope_changes"],
    stopConditions: [
      "unverified_technology_claim",
      "license_unknown_for_adoption",
      "cloud_dependency_without_free_tier_confirmation",
      "paid_dependency_without_owner_exception"
    ]
  }
] as const satisfies readonly TokenEfficiencyProfile[];

export function selectTokenEfficiencyRoute(input: TokenEfficiencyRouteInput): TokenEfficiencyRouteResult {
  const normalizedTask = normalize(input.task);
  const profile = selectProfile(normalizedTask);

  return {
    profile: profile.id,
    budgetClass: profile.budgetClass,
    contextRules: profile.contextRules,
    firstMoves: profile.firstMoves,
    preferredWorkerOrder: profile.preferredWorkerOrder,
    outputRules: profile.outputRules,
    escalationRules: profile.escalationRules,
    stopConditions: profile.stopConditions
  };
}

function selectProfile(normalizedTask: string): TokenEfficiencyProfile {
  if (hasAny(normalizedTask, ["caveman", "token", "cheap", "minimal", "small patch", "simple", "quick"])) {
    return requireProfile("caveman");
  }

  if (hasAny(normalizedTask, ["review", "security", "architecture", "audit", "governance", "payment", "auth"])) {
    return requireProfile("review_compact");
  }

  if (hasAny(normalizedTask, ["research", "latest", "github", "library", "docs", "technology", "context7"])) {
    return requireProfile("research_compact");
  }

  return requireProfile("standard_compact");
}

function requireProfile(id: TokenEfficiencyProfileId): TokenEfficiencyProfile {
  const profile = tokenEfficiencyProfiles.find((candidate) => candidate.id === id);

  if (!profile) {
    throw new Error(`Token efficiency profile not found: ${id}`);
  }

  return profile;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]/g, " ");
}

function hasAny(normalizedTask: string, terms: readonly string[]): boolean {
  return terms.some((term) => normalizedTask.includes(normalize(term)));
}
