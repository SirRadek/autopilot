import { describe, expect, it } from "vitest";

import { selectLane, type LaneCandidate } from "../../src/data/delivery-system/laneSelector";

function lane(overrides: Partial<LaneCandidate>): LaneCandidate {
  return {
    lane: "technical",
    provider: "openai",
    eligible: true,
    privacy_ok: true,
    available: true,
    task_fit: 0.7,
    remaining_pct: 0.9,
    measurement_confidence: "high",
    recent_quality: 0.8,
    ...overrides
  };
}

describe("lane selector (G4)", () => {
  it("lets task fit dominate — a clearly better fit wins even with a red budget", () => {
    const result = selectLane([
      lane({ lane: "technical", provider: "openai", task_fit: 0.9, remaining_pct: 0.1 }),
      lane({ lane: "ux", provider: "google_antigravity", task_fit: 0.6, remaining_pct: 0.95 })
    ]);
    expect(result.selected?.provider).toBe("openai");
    expect(result.selected?.budget_state).toBe("red");
  });

  it("uses budget as a late gate to break near-equal fits", () => {
    const result = selectLane([
      lane({ lane: "technical", provider: "openai", task_fit: 0.8, remaining_pct: 0.1 }),
      lane({ lane: "strategic", provider: "anthropic", task_fit: 0.75, remaining_pct: 0.95 })
    ]);
    expect(result.selected?.provider).toBe("anthropic");
    expect(result.selected?.budget_state).toBe("green");
  });

  it("returns blocked_owner when no lane is eligible or privacy-compatible", () => {
    const result = selectLane([lane({ privacy_ok: false }), lane({ eligible: false })]);
    expect(result.selected).toBeNull();
    expect(result.state).toBe("blocked_owner");
  });

  it("returns provider_unavailable when eligible lanes are all unavailable", () => {
    const result = selectLane([lane({ available: false }), lane({ available: false, provider: "anthropic" })]);
    expect(result.selected).toBeNull();
    expect(result.state).toBe("provider_unavailable");
  });

  it("selects a ready lane and ranks the candidates", () => {
    const result = selectLane([lane({})]);
    expect(result.state).toBe("ready");
    expect(result.ranked).toHaveLength(1);
  });
});
