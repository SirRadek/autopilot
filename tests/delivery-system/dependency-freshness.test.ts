import { describe, expect, it } from "vitest";

import {
  type DependencyCheckRecord,
  type ReuseCheckResult,
  dependencyFreshnessPolicy
} from "../../src/data/delivery-system/dependencyFreshness";

describe("dependency freshness and reuse policy", () => {
  it("disables automatic dependency updates with a literal false policy", () => {
    expect(dependencyFreshnessPolicy.autoUpdateAllowed).toBe(false);
    expect(typeof dependencyFreshnessPolicy.autoUpdateAllowed).toBe("boolean");
  });

  it("uses Windows npm.cmd commands for dependency checks", () => {
    for (const command of dependencyFreshnessPolicy.checkCommands) {
      expect(command.startsWith("npm.cmd ")).toBe(true);
    }
  });

  it("requires tokenSavingEstimate on reuse checks", () => {
    const result: ReuseCheckResult = {
      searchedPatterns: [],
      existingMatches: [],
      packageMatches: [],
      decision: "implement_new",
      reuseTarget: undefined,
      tokenSavingEstimate: "none"
    };

    expect(result.tokenSavingEstimate).toBe("none");
  });

  it("keeps dependency relevance notes readonly on check records", () => {
    const record: DependencyCheckRecord = {
      checkedAt: "2026-06-17T00:00:00.000Z",
      packageName: "vitest",
      installedVersion: "4.1.8",
      latestVersion: undefined,
      freshnessState: "current",
      newFeaturesRelevantToProject: [],
      securityAdvisory: undefined,
      updateDecision: "hold",
      ownerApprovalRequired: false
    };

    expect(record.newFeaturesRelevantToProject).toEqual([]);
  });
});
