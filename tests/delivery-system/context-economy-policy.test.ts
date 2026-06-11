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
    expect(modelSpendPolicy.subscriptionInteractiveUse).toContain("claude_code_architecture_second_opinion");
    expect(modelSpendPolicy.apiOrSelfHostedUse).toContain("openai_structured_outputs");
    expect(modelSpendPolicy.apiOrSelfHostedUse).toContain("deepseek_self_hosted_candidate");
    expect(modelSpendPolicy.requiredChecks).toContain("free_tier_or_no_cost_confirmed");
    expect(modelSpendPolicy.requiredChecks).toContain("subscription_entitlement_confirmed_for_subscription_tools");
    expect(modelSpendPolicy.requiredChecks).toContain("api_credit_or_self_hosting_cost_confirmed");
    expect(modelSpendPolicy.requiredChecks).toContain("owner_cost_decision_for_credentialed_provider");
    expect(modelSpendPolicy.requiredChecks).toContain("disclose_model_choice_when_risk_affects_delivery");
    expect(modelSpendPolicy.repoExecutorUse).toContain("repo_editing");
    expect(modelSpendPolicy.frontierOnlyWhen).toContain("architecture_level");
    expect(modelSpendPolicy.stopConditions).toContain("provider_availability_unverified");
    expect(modelSpendPolicy.stopConditions).toContain("paid_model_or_credit_required");
    expect(modelSpendPolicy.stopConditions).toContain("paid_model_or_credit_required_without_owner_decision");
    expect(modelSpendPolicy.stopConditions).toContain("subscription_entitlement_unverified");
    expect(modelSpendPolicy.stopConditions).toContain("api_credit_path_requested_without_owner_decision");
    expect(modelSpendPolicy.stopConditions).toContain("authentication_missing");
  });
});
