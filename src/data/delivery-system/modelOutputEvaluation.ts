export type ModelOutputEvaluationPhase = "learning_immediate_loop" | "weekly_batch_tuning";

export type ModelOutputQualityState =
  | "needs_scoring"
  | "accepted"
  | "retry_with_prompt_or_input_tuning"
  | "review_model_or_reasoning_route"
  | "blocked";

export type ModelOutputScoreDimension =
  | "task_fit"
  | "instruction_following"
  | "source_grounding"
  | "format_contract"
  | "verification_readiness"
  | "privacy_safety"
  | "handoff_clarity"
  | "token_efficiency"
  | "workflow_compatibility";

export type ModelProviderFamily = "openai" | "anthropic" | "google" | "qwen" | "deepseek" | "local" | "unknown";

export interface ModelOutputEvaluationPolicy {
  readonly sourceOfTruth: "local_eval_records_and_verified_outputs";
  readonly defaultPhase: ModelOutputEvaluationPhase;
  readonly weeklyCadence: "weekly_after_learning_baseline";
  readonly scoreScale: "0_to_100";
  readonly acceptanceThreshold: number;
  readonly retryThreshold: number;
  readonly repeatedFailureLimit: number;
  readonly dimensions: readonly ModelOutputScoreDimension[];
  readonly evaluationRecordFields: readonly string[];
  readonly requiredChecks: readonly string[];
  readonly stopConditions: readonly string[];
  readonly providerBestPracticeSources: Readonly<Record<ModelProviderFamily, readonly string[]>>;
}

export interface ModelOutputEvaluationRouteInput {
  readonly task: string;
  readonly score?: number | undefined;
  readonly repeatedFailures?: number | undefined;
  readonly provider?: ModelProviderFamily | undefined;
  readonly phase?: ModelOutputEvaluationPhase | undefined;
}

export interface ModelOutputEvaluationRouteResult {
  readonly phase: ModelOutputEvaluationPhase;
  readonly qualityState: ModelOutputQualityState;
  readonly dimensions: readonly ModelOutputScoreDimension[];
  readonly requiredChecks: readonly string[];
  readonly stopConditions: readonly string[];
  readonly nextActions: readonly string[];
  readonly promptTuningActions: readonly string[];
  readonly escalationActions: readonly string[];
  readonly sourceIds: readonly string[];
}

export const modelOutputEvaluationPolicy = {
  sourceOfTruth: "local_eval_records_and_verified_outputs",
  defaultPhase: "learning_immediate_loop",
  weeklyCadence: "weekly_after_learning_baseline",
  scoreScale: "0_to_100",
  acceptanceThreshold: 80,
  retryThreshold: 60,
  repeatedFailureLimit: 3,
  dimensions: [
    "task_fit",
    "instruction_following",
    "source_grounding",
    "format_contract",
    "verification_readiness",
    "privacy_safety",
    "handoff_clarity",
    "token_efficiency",
    "workflow_compatibility"
  ],
  evaluationRecordFields: [
    "record_version",
    "eval_id",
    "created",
    "project",
    "task_type",
    "phase",
    "state",
    "model_or_worker",
    "reasoning_profile",
    "token_efficiency_profile",
    "provider_best_practice_sources",
    "input_packet_summary",
    "output_pointer",
    "score_by_dimension",
    "failure_labels",
    "prompt_or_input_delta",
    "rerun_count",
    "accepted_state",
    "verification_evidence",
    "source_pointers",
    "privacy_review",
    "route_review",
    "weekly_aggregate"
  ],
  requiredChecks: [
    "model_output_scored_before_acceptance",
    "score_dimensions_recorded",
    "caveman_or_token_efficiency_route_selected",
    "provider_best_practice_sources_checked",
    "context7_or_official_docs_verified",
    "prompt_or_input_delta_recorded_before_rerun",
    "retry_loop_until_acceptable_or_blocked",
    "repeated_failure_triggers_model_or_reasoning_review",
    "weekly_tuning_uses_collected_eval_records",
    "workflow_handoff_clarity_checked",
    "plugin_or_skill_compatibility_checked",
    "privacy_redaction_checked",
    "source_pointers_recorded"
  ],
  stopConditions: [
    "output_accepted_without_score",
    "score_dimensions_missing",
    "bad_output_retried_without_prompt_or_input_delta",
    "repeated_bad_output_without_model_or_reasoning_review",
    "provider_best_practice_claim_unverified",
    "context7_or_official_docs_missing_for_provider_claim",
    "weekly_tuning_without_eval_records",
    "raw_model_output_promoted_to_prompt_authority",
    "private_context_in_eval_record",
    "workflow_handoff_unclear_after_retry",
    "automation_runtime_added_without_architecture_decision"
  ],
  providerBestPracticeSources: {
    openai: ["openai-evals", "openai-model-optimization", "openai-prompt-engineering", "openai-structured-outputs"],
    anthropic: ["anthropic-evals", "anthropic-prompting-best-practices", "anthropic-tool-use"],
    google: ["gemini-api-prompting-strategies", "gemini-prompt-design-strategies", "gemini-long-context"],
    qwen: ["qwen-chat-template", "qwen-function-calling"],
    deepseek: ["deepseek-thinking-mode", "deepseek-json-output", "deepseek-function-calling"],
    local: ["local-agents-md", "token-efficiency-operating-model", "prompt-library-policy"],
    unknown: ["prompt-source-catalog", "prompt-library-policy"]
  }
} as const satisfies ModelOutputEvaluationPolicy;

export function selectModelOutputEvaluationRoute(
  input: ModelOutputEvaluationRouteInput
): ModelOutputEvaluationRouteResult {
  const normalizedTask = normalize(input.task);
  const phase = selectPhase(normalizedTask, input.phase);
  const repeatedFailures = input.repeatedFailures ?? inferRepeatedFailures(normalizedTask);
  const score = input.score;
  const provider = input.provider ?? inferProvider(normalizedTask);
  const qualityState = selectQualityState(score, repeatedFailures, normalizedTask);

  return {
    phase,
    qualityState,
    dimensions: modelOutputEvaluationPolicy.dimensions,
    requiredChecks: requiredChecksForState(qualityState, phase),
    stopConditions: stopConditionsForState(qualityState, phase),
    nextActions: nextActionsForState(qualityState, phase),
    promptTuningActions: promptTuningActions(provider),
    escalationActions: escalationActionsForState(qualityState),
    sourceIds: modelOutputEvaluationPolicy.providerBestPracticeSources[provider]
  };
}

function selectPhase(normalizedTask: string, explicitPhase?: ModelOutputEvaluationPhase): ModelOutputEvaluationPhase {
  if (explicitPhase) {
    return explicitPhase;
  }

  if (hasAny(normalizedTask, ["weekly", "batch", "trend", "collected data", "eval records"])) {
    return "weekly_batch_tuning";
  }

  return modelOutputEvaluationPolicy.defaultPhase;
}

function selectQualityState(
  score: number | undefined,
  repeatedFailures: number,
  normalizedTask: string
): ModelOutputQualityState {
  if (hasAny(normalizedTask, ["blocked", "missing source", "missing owner", "secret", "private data"])) {
    return "blocked";
  }

  if (repeatedFailures >= modelOutputEvaluationPolicy.repeatedFailureLimit) {
    return "review_model_or_reasoning_route";
  }

  if (typeof score !== "number") {
    return "needs_scoring";
  }

  if (score >= modelOutputEvaluationPolicy.acceptanceThreshold) {
    return "accepted";
  }

  return "retry_with_prompt_or_input_tuning";
}

function requiredChecksForState(
  qualityState: ModelOutputQualityState,
  phase: ModelOutputEvaluationPhase
): string[] {
  const checks: string[] = [...modelOutputEvaluationPolicy.requiredChecks];

  if (qualityState === "review_model_or_reasoning_route") {
    checks.push("select_reasoning_model_route_rerun", "model_or_reasoning_change_reason_recorded");
  }

  if (phase === "weekly_batch_tuning") {
    checks.push("weekly_eval_summary_created", "prompt_changes_grouped_by_failure_pattern");
  }

  return unique(checks);
}

function stopConditionsForState(
  qualityState: ModelOutputQualityState,
  phase: ModelOutputEvaluationPhase
): string[] {
  const stopConditions: string[] = [...modelOutputEvaluationPolicy.stopConditions];

  if (qualityState === "review_model_or_reasoning_route") {
    stopConditions.push("route_review_skipped_after_repeated_bad_outputs");
  }

  if (phase === "weekly_batch_tuning") {
    stopConditions.push("weekly_prompt_change_without_eval_trend");
  }

  return unique(stopConditions);
}

function nextActionsForState(
  qualityState: ModelOutputQualityState,
  phase: ModelOutputEvaluationPhase
): string[] {
  if (qualityState === "accepted") {
    return ["record_accepted_eval", "link_verification_evidence", "keep_prompt_version_or_input_packet"];
  }

  if (qualityState === "review_model_or_reasoning_route") {
    return [
      "summarize_failure_pattern",
      "rerun_token_efficiency_route",
      "rerun_reasoning_model_route",
      "choose_different_reasoning_or_model_only_after_source_verified"
    ];
  }

  if (qualityState === "blocked") {
    return ["record_blocker_owner_or_source_needed", "do_not_rerun_until_missing_context_or_privacy_issue_is_resolved"];
  }

  if (phase === "weekly_batch_tuning") {
    return ["aggregate_eval_records", "identify_repeated_failure_patterns", "propose_prompt_or_input_changes"];
  }

  return ["score_output_by_dimension", "adjust_prompt_or_input_packet", "rerun_same_route_once", "record_delta_and_result"];
}

function promptTuningActions(provider: ModelProviderFamily): string[] {
  const common = [
    "keep_task_small_with_caveman_context_when_possible",
    "separate_verified_facts_from_assumptions",
    "make_expected_output_and_format_contract_explicit",
    "tighten_allowed_files_tools_and_forbidden_actions",
    "preserve_source_pointers_for_next_handoff"
  ];

  const providerSpecific: Record<ModelProviderFamily, string[]> = {
    openai: ["use_structured_outputs_when_contract_matters", "prefer_evals_or_deterministic_graders_for_regression"],
    anthropic: ["define_success_criteria_first", "use_clear_rubrics_and_examples_for_judgment_tasks"],
    google: ["use_clear_direct_instructions", "place_specific_question_after_large_context"],
    qwen: ["use_model_chat_template_or_tool_template", "keep_local_worker_scope_bounded"],
    deepseek: ["use_json_mode_for_strict_json", "review_reasoning_mode_before_escalating_effort"],
    local: ["prefer_rg_and_deterministic_checks", "use_local_worker_output_as_draft_only"],
    unknown: ["identify_provider_before_provider_specific_tuning", "use_local_prompt_library_defaults"]
  };

  return [...common, ...providerSpecific[provider]];
}

function escalationActionsForState(qualityState: ModelOutputQualityState): string[] {
  if (qualityState !== "review_model_or_reasoning_route") {
    return ["do_not_change_model_without_failure_pattern"];
  }

  return [
    "compare_failure_pattern_to_provider_best_practices",
    "increase_reasoning_only_if_task_complexity_requires_it",
    "switch_model_or_provider_only_after_entitlement_privacy_and_cost_checks",
    "keep_new_output_advisory_until_scored_and_verified"
  ];
}

function inferRepeatedFailures(normalizedTask: string): number {
  if (hasAny(normalizedTask, ["third failure", "repeated bad", "keeps failing", "several bad outputs"])) {
    return modelOutputEvaluationPolicy.repeatedFailureLimit;
  }

  if (hasAny(normalizedTask, ["second failure", "failed twice"])) {
    return 2;
  }

  if (hasAny(normalizedTask, ["bad output", "poor output", "wrong output", "failed output"])) {
    return 1;
  }

  return 0;
}

function inferProvider(normalizedTask: string): ModelProviderFamily {
  if (hasAny(normalizedTask, ["openai", "gpt", "codex"])) return "openai";
  if (hasAny(normalizedTask, ["anthropic", "claude"])) return "anthropic";
  if (hasAny(normalizedTask, ["google", "gemini"])) return "google";
  if (hasAny(normalizedTask, ["qwen"])) return "qwen";
  if (hasAny(normalizedTask, ["deepseek"])) return "deepseek";
  if (hasAny(normalizedTask, ["local", "deterministic", "caveman"])) return "local";
  return "unknown";
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]/g, " ");
}

function hasAny(normalizedTask: string, terms: readonly string[]): boolean {
  return terms.some((term) => normalizedTask.includes(normalize(term)));
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
