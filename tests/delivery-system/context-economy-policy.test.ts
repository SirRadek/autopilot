import { describe, expect, it } from "vitest";

import { contextUsagePolicy, sessionResetProtocol } from "../../src/data/delivery-system/contextEconomy";
import { modelSpendPolicy } from "../../src/data/delivery-system/modelSpend";

describe("context economy and model spend policies", () => {
  it("prefers targeted packets instead of full project context", () => {
    expect(contextUsagePolicy.default.neverDumpFullProject).toBe(true);
    expect(contextUsagePolicy.default.preferRelevantSubgraph).toBe(true);
    expect(contextUsagePolicy.default.preferAgentPacket).toBe(true);
    expect(contextUsagePolicy.cavemanMode.enabled).toBe(true);
    expect(contextUsagePolicy.cavemanMode.rules).toContain("prefer_deterministic_tools_first");
    expect(contextUsagePolicy.beforeCallingModel.requiredSteps).toEqual([
      "classify_task",
      "select_capabilities",
      "select_context",
      "select_model",
      "build_agent_packet"
    ]);
    expect(contextUsagePolicy.avoid).toContain("full_repo_dump");
  });

  it("defines a portable session reset protocol", () => {
    expect(sessionResetProtocol.summaryIncludes).toEqual([
      "current_goal",
      "decisions_made",
      "open_questions",
      "files_changed",
      "risks",
      "next_actions"
    ]);
    expect(sessionResetProtocol.restartPromptTemplate).toContain("Do not rely on previous conversation.");
    expect(sessionResetProtocol.restartPromptTemplate).toContain("compact handoff");
    expect(sessionResetProtocol.restartPromptTemplate).toContain("local files, tests, architecture records");
    expect(sessionResetProtocol.restartPromptTemplate).not.toContain("summary as the source of truth");
  });

  it("keeps model spend provider-neutral and reserves frontier models for reasoning", () => {
    expect(modelSpendPolicy.providerDependency).toBe("provider_neutral");
    expect(modelSpendPolicy.lowCostWorkerUse).toContain("bulk_summarization");
    expect(modelSpendPolicy.freeCloudAdvisoryUse).toContain("brainstorming");
    expect(modelSpendPolicy.subscriptionInteractiveUse).toContain("gemini_cli_google_ai_subscription_advisory");
    expect(modelSpendPolicy.subscriptionInteractiveUse).toContain("claude_code_architecture_second_opinion");
    expect(modelSpendPolicy.manualWebAdvisoryUse).toContain("deepseek_web_chat_manual_second_opinion");
    expect(modelSpendPolicy.manualWebAdvisoryUse).toContain("deepseek_expert_mode_reasoning_advice");
    expect(modelSpendPolicy.apiOrSelfHostedUse).toContain("openai_structured_outputs");
    expect(modelSpendPolicy.apiOrSelfHostedUse).toContain("deepseek_self_hosted_candidate");
    expect(modelSpendPolicy.advisoryHierarchy).toEqual(
      expect.arrayContaining([
        "deterministic_local_evidence_over_model_output",
        "claude_code_subscription_high_trust_broad_repo_read_after_owner_scope",
        "gemini_cli_standard_advisory_redacted_context_after_subscription_check",
        "qwen_local_bounded_draft_requires_review",
        "deepseek_web_chat_manual_advisory_after_login_and_mode_check",
        "deepseek_comparison_only_after_cost_or_self_hosting_check"
      ])
    );
    expect(modelSpendPolicy.requiredChecks).toContain("free_tier_or_no_cost_confirmed");
    expect(modelSpendPolicy.requiredChecks).toContain("provider_run_status_recorded");
    expect(modelSpendPolicy.requiredChecks).toContain("model_output_presence_verified");
    expect(modelSpendPolicy.requiredChecks).toContain("subscription_entitlement_confirmed_for_subscription_tools");
    expect(modelSpendPolicy.requiredChecks).toContain("google_ai_subscription_entitlement_confirmed_for_gemini_cli");
    expect(modelSpendPolicy.requiredChecks).toContain("api_credit_or_self_hosting_cost_confirmed");
    expect(modelSpendPolicy.requiredChecks).toContain("authentication_state_verified_without_token_disclosure");
    expect(modelSpendPolicy.requiredChecks).toContain("controlled_browser_evidence_required");
    expect(modelSpendPolicy.requiredChecks).toContain("fresh_chat_started_for_each_mode_test");
    expect(modelSpendPolicy.requiredChecks).toContain("prompt_packet_bounded");
    expect(modelSpendPolicy.requiredChecks).toContain("advisory_trust_hierarchy_applied");
    expect(modelSpendPolicy.requiredChecks).toContain("claude_broad_read_scope_owner_scoped");
    expect(modelSpendPolicy.requiredChecks).toContain("model_output_evaluation_before_model_change");
    expect(modelSpendPolicy.requiredChecks).toContain("repeated_failure_evidence_before_model_switch");
    expect(modelSpendPolicy.requiredChecks).toContain("owner_cost_decision_for_credentialed_provider");
    expect(modelSpendPolicy.requiredChecks).toContain("disclose_model_choice_when_risk_affects_delivery");
    expect(modelSpendPolicy.repoExecutorUse).toContain("repo_editing");
    expect(modelSpendPolicy.frontierOnlyWhen).toContain("architecture_level");
    expect(modelSpendPolicy.stopConditions).toContain("provider_availability_unverified");
    expect(modelSpendPolicy.stopConditions).toContain("provider_run_failed_without_blocked_state");
    expect(modelSpendPolicy.stopConditions).toContain("model_output_missing_from_artifact");
    expect(modelSpendPolicy.stopConditions).toContain("advisory_workflow_continued_after_provider_error");
    expect(modelSpendPolicy.stopConditions).toContain("paid_model_or_credit_required");
    expect(modelSpendPolicy.stopConditions).toContain("paid_model_or_credit_required_without_owner_decision");
    expect(modelSpendPolicy.stopConditions).toContain("subscription_entitlement_unverified");
    expect(modelSpendPolicy.stopConditions).toContain("google_ai_subscription_entitlement_unverified");
    expect(modelSpendPolicy.stopConditions).toContain("api_credit_path_requested_without_owner_decision");
    expect(modelSpendPolicy.stopConditions).toContain("lower_trust_model_overrides_claude_without_verified_evidence");
    expect(modelSpendPolicy.stopConditions).toContain("model_changed_without_eval_evidence");
    expect(modelSpendPolicy.stopConditions).toContain("reasoning_effort_increased_without_failure_pattern");
    expect(modelSpendPolicy.stopConditions).toContain(
      "gemini_api_key_or_paid_api_path_requested_without_owner_decision"
    );
    expect(modelSpendPolicy.stopConditions).toContain("authentication_missing");
    expect(modelSpendPolicy.stopConditions).toContain("browser_session_unavailable");
    expect(modelSpendPolicy.stopConditions).toContain("mode_switch_unverified");
  });
});
