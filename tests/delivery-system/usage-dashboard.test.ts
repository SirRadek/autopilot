import { describe, expect, it } from "vitest";

import { buildUsageDashboard, type ProviderTarget } from "../../src/data/delivery-system/usageDashboard";
import { renderUsageDashboardFromFiles } from "../../scripts/usage-dashboard";
import type { UsageLedgerEntry } from "../../src/data/delivery-system/usageLedger";

function entry(overrides: Partial<UsageLedgerEntry>): UsageLedgerEntry {
  return {
    date: "2026-06-19",
    project: "demo",
    phase: "brainstorm-1",
    lane: "strategic",
    provider: "anthropic",
    model: "claude-opus-4-8",
    surface: "web_ui",
    reasoning: "high",
    context_level: "wide",
    task_type: "strategy",
    estimated_tokens: 1000,
    actual_tokens: null,
    quota_source: "unknown",
    measurement_confidence: "low",
    remaining_pct_before: null,
    remaining_pct_after: null,
    quality_score: 0.9,
    used_in_final_plan: true,
    ...overrides
  };
}

const targets: readonly ProviderTarget[] = [
  { provider: "anthropic", share: 0.5 },
  { provider: "openai", share: 0.5 }
];

describe("usage dashboard rollup", () => {
  it("computes work-share and deviation against target", () => {
    const dashboard = buildUsageDashboard({
      project: "demo",
      targets,
      entries: [
        entry({ provider: "anthropic", estimated_tokens: 8000 }),
        entry({ provider: "openai", estimated_tokens: 2000, model: "codex" })
      ]
    });

    const anthropic = dashboard.providers.find((p) => p.provider === "anthropic");
    expect(anthropic?.work_share_pct).toBeCloseTo(0.8, 5);
    expect(anthropic?.deviation_pct).toBeCloseTo(0.3, 5);
    expect(dashboard.total_estimated_tokens).toBe(10000);
  });

  it("flags a provider that is over target (rebalance within fit)", () => {
    const dashboard = buildUsageDashboard({
      project: "demo",
      targets,
      entries: [
        entry({ provider: "anthropic", estimated_tokens: 9000 }),
        entry({ provider: "openai", estimated_tokens: 1000, model: "codex" })
      ]
    });
    expect(dashboard.corrections.join(" ")).toMatch(/anthropic.*over target.*within tasks that suit/i);
  });

  it("classifies a metered provider as red when capacity is low", () => {
    const dashboard = buildUsageDashboard({
      project: "demo",
      entries: [
        entry({
          provider: "google_antigravity",
          model: "gemini-3.1-pro-high",
          surface: "cli",
          measurement_confidence: "high",
          remaining_pct_after: 0.1
        })
      ]
    });
    const provider = dashboard.providers[0];
    expect(provider?.budget_state).toBe("red");
    expect(dashboard.corrections.join(" ")).toMatch(/capacity RED/i);
  });

  it("renders a Markdown dashboard with the traffic-light table", () => {
    const dashboard = buildUsageDashboard({ project: "demo", entries: [entry({})] });
    expect(dashboard.report_markdown).toContain("# AI Usage Dashboard");
    expect(dashboard.report_markdown).toContain("Work-share vs target & capacity");
  });
});

describe("usage dashboard CLI over committed templates", () => {
  it("renders from the example ledger without errors", () => {
    const dashboard = renderUsageDashboardFromFiles(process.cwd());
    expect(dashboard.total_runs).toBeGreaterThan(0);
    expect(dashboard.providers.length).toBeGreaterThan(0);
    expect(dashboard.report_markdown).toContain("# AI Usage Dashboard");
  });
});
