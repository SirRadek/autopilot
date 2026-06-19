import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BUDGET_GREEN_MIN,
  BUDGET_YELLOW_MIN,
  burnGovernancePolicy,
  classifyBudgetState
} from "../../src/data/delivery-system/modelSpend";
import {
  validateProviderBudget,
  validateUsageLedgerEntry
} from "../../src/lib/delivery-system/usageLedger";

const validEntry = {
  date: "2026-06-19",
  project: "radeq-homepage",
  phase: "brainstorm-1",
  lane: "strategic",
  provider: "anthropic",
  model: "claude-opus-4-8",
  surface: "web_ui",
  reasoning: "high",
  context_level: "wide",
  task_type: "strategy_brainstorm",
  estimated_tokens: 42000,
  actual_tokens: null,
  quota_source: "unknown",
  measurement_confidence: "low",
  remaining_pct_before: null,
  remaining_pct_after: null,
  quality_score: 0.9,
  used_in_final_plan: true,
  notes: "Best product framing."
};

const validBudget = {
  provider: "google_antigravity",
  surface: "cli",
  period: "per_5h",
  capacity_kind: "messages",
  capacity_total: null,
  consumed: null,
  remaining: null,
  remaining_pct: 0.96,
  source: "dashboard_manual",
  confidence: "high",
  updated_at: "2026-06-19T08:00:00.000Z"
};

describe("usage ledger entry contract", () => {
  it("accepts a valid entry (with nullable meters)", () => {
    expect(validateUsageLedgerEntry(validEntry)).toEqual({ valid: true, errors: [] });
  });

  it("rejects an unknown surface", () => {
    expect(validateUsageLedgerEntry({ ...validEntry, surface: "telepathy" })).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("surface must be one of")])
    });
  });

  it("rejects an out-of-range quality_score fraction", () => {
    expect(validateUsageLedgerEntry({ ...validEntry, quality_score: 9 })).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("quality_score must be a 0..1 fraction")])
    });
  });

  it("rejects a non-boolean used_in_final_plan", () => {
    expect(validateUsageLedgerEntry({ ...validEntry, used_in_final_plan: "yes" })).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("used_in_final_plan must be a boolean")])
    });
  });

  it("reports missing mandatory keys", () => {
    expect(validateUsageLedgerEntry({ date: "2026-06-19" })).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["provider is required", "lane is required", "used_in_final_plan is required"])
    });
  });
});

describe("provider budget snapshot contract", () => {
  it("accepts a valid snapshot with unknown meters", () => {
    expect(validateProviderBudget(validBudget)).toEqual({ valid: true, errors: [] });
  });

  it("rejects remaining_pct outside 0..1", () => {
    expect(validateProviderBudget({ ...validBudget, remaining_pct: 96 })).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("remaining_pct must be a 0..1 fraction")])
    });
  });

  it("rejects an unknown capacity_kind", () => {
    expect(validateProviderBudget({ ...validBudget, capacity_kind: "vibes" })).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("capacity_kind must be one of")])
    });
  });
});

describe("burn-rate traffic light", () => {
  it("never equalizes burn (routes by suitability)", () => {
    expect(burnGovernancePolicy.equalizeBurn).toBe(false);
    expect(burnGovernancePolicy.routingOrder[0]).toBe("eligibility");
  });

  it("classifies green/yellow/red by remaining fraction", () => {
    expect(classifyBudgetState(0.9, "high")).toBe("green");
    expect(classifyBudgetState(BUDGET_GREEN_MIN, "high")).toBe("green");
    expect(classifyBudgetState(0.5, "high")).toBe("yellow");
    expect(classifyBudgetState(BUDGET_YELLOW_MIN, "high")).toBe("yellow");
    expect(classifyBudgetState(0.1, "high")).toBe("red");
  });

  it("falls back to caution (yellow) when the meter is unknown — never fabricates", () => {
    expect(classifyBudgetState(null, "high")).toBe("yellow");
    expect(classifyBudgetState(0.95, "unknown")).toBe("yellow");
  });
});

describe("committed .agent/usage templates stay valid", () => {
  const usageRoot = join(process.cwd(), ".agent", "usage");

  it("every usage-ledger.example.jsonl line validates", () => {
    const lines = readFileSync(join(usageRoot, "usage-ledger.example.jsonl"), "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(validateUsageLedgerEntry(JSON.parse(line))).toEqual({ valid: true, errors: [] });
    }
  });

  it("every provider-budget.example.json snapshot validates", () => {
    const budgets = JSON.parse(readFileSync(join(usageRoot, "provider-budget.example.json"), "utf8"));
    expect(Array.isArray(budgets)).toBe(true);
    for (const budget of budgets) {
      expect(validateProviderBudget(budget)).toEqual({ valid: true, errors: [] });
    }
  });
});
