import { describe, expect, it } from "vitest";

import { contextUsagePolicy, sessionResetProtocol } from "../../src/data/delivery-system/contextEconomy";
import { modelSpendPolicy } from "../../src/data/delivery-system/modelSpend";

describe("context economy and model spend policies", () => {
  it("prefers targeted packets instead of full project context", () => {
    expect(contextUsagePolicy.default.neverDumpFullProject).toBe(true);
    expect(contextUsagePolicy.default.preferRelevantSubgraph).toBe(true);
    expect(contextUsagePolicy.default.preferAgentPacket).toBe(true);
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
  });

  it("keeps model spend provider-neutral and reserves frontier models for reasoning", () => {
    expect(modelSpendPolicy.providerDependency).toBe("provider_neutral");
    expect(modelSpendPolicy.lowCostWorkerUse).toContain("bulk_summarization");
    expect(modelSpendPolicy.repoExecutorUse).toContain("repo_editing");
    expect(modelSpendPolicy.frontierOnlyWhen).toContain("architecture_level");
    expect(modelSpendPolicy.stopConditions).toContain("provider_availability_unverified");
  });
});
