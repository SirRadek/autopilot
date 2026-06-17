import { describe, expect, it } from "vitest";

import { contextUsagePolicy } from "../../src/data/delivery-system/contextEconomy";
import {
  type TokenBudgetClass,
  contextWidthSpecs,
  selectContextWidth,
  selectTokenEfficiencyRoute,
  tokenEfficiencyProfiles
} from "../../src/data/delivery-system/tokenEfficiency";

describe("token efficiency routing policy", () => {
  it("enables Caveman mode inside context economy", () => {
    expect(contextUsagePolicy.cavemanMode.enabled).toBe(true);
    expect(contextUsagePolicy.cavemanMode.rules).toEqual(
      expect.arrayContaining(["use_rg_before_opening_files", "prefer_local_worker_before_cloud"])
    );
    expect(contextUsagePolicy.avoid).toContain("large_context_for_simple_fix");
  });

  it("defines Caveman mode as deterministic-first and local-worker-first", () => {
    const caveman = tokenEfficiencyProfiles.find((profile) => profile.id === "caveman");

    expect(caveman?.budgetClass).toBe("tiny");
    expect(caveman?.contextRules).toContain("avoid_full_repo_dump");
    expect(caveman?.preferredWorkerOrder).toEqual(
      expect.arrayContaining(["deterministic_tools", "qwen2_5_coder_7b_fast"])
    );
    expect(caveman?.stopConditions).toContain("context_too_large_for_caveman_mode");
  });

  it("routes explicit token-saving tasks to Caveman mode", () => {
    const route = selectTokenEfficiencyRoute({
      task: "Use caveman mode for a cheap small patch with minimal token usage"
    });

    expect(route.profile).toBe("caveman");
    expect(route.budgetClass).toBe("tiny");
    expect(route.firstMoves).toContain("select_local_worker_route");
    expect(route.outputRules).toContain("avoid_long_background_explanations");
  });

  it("routes architecture/security review to compact review instead of Caveman", () => {
    const route = selectTokenEfficiencyRoute({
      task: "Architecture security review for auth and public API"
    });

    expect(route.profile).toBe("review_compact");
    expect(route.firstMoves).toContain("select_reasoning_model_route");
    expect(route.preferredWorkerOrder).toContain("external_advisory_review");
    expect(route.stopConditions).toContain("model_output_used_as_source_of_truth");
  });

  it("keeps research escalation on the external advisory route", () => {
    const route = selectTokenEfficiencyRoute({
      task: "Research latest provider quota docs and library options"
    });

    expect(route.profile).toBe("research_compact");
    expect(route.preferredWorkerOrder).toContain("external_advisory_review");
    expect(route.outputRules).toContain("separate_recommendation_from_adoption");
  });

  it("keeps TokenBudgetClass at the four known width classes", () => {
    const classes: TokenBudgetClass[] = ["tiny", "small", "medium", "large"];

    expect(classes).toHaveLength(4);
  });

  it("maps context widths to bounded file counts and preferred providers", () => {
    expect(contextWidthSpecs.tiny.maxFilesInPacket).toBe(3);
    expect(contextWidthSpecs.large.preferredProviderForWidth).toBe("gemini_cli");
  });

  it("selects large context only for explicit large-context signals", () => {
    expect(selectContextWidth("standard_compact", ["bounded coding"]).budgetClass).toBe("small");
    expect(selectContextWidth("research_compact", ["long context synthesis"]).budgetClass).toBe("large");
  });
});
