import { describe, expect, it } from "vitest";

import { reasoningEscalationPolicy } from "../../src/data/delivery-system/modelPolicy";

describe("delivery system model policy", () => {
  it("keeps routine worker workloads local by default", () => {
    expect(reasoningEscalationPolicy.defaultWorkerLayer).toBe("local_swarm");
    expect(reasoningEscalationPolicy.localDefaultUse).toContain("boilerplate coding");
    expect(reasoningEscalationPolicy.localDefaultUse).toContain("embeddings");
    expect(reasoningEscalationPolicy.localDefaultUse).toContain("automation loops");
  });

  it("limits frontier reasoning to strategic escalation work", () => {
    expect(reasoningEscalationPolicy.frontierEscalationUse).toContain("deep research");
    expect(reasoningEscalationPolicy.frontierEscalationUse).toContain("architecture review");
    expect(reasoningEscalationPolicy.frontierEscalationUse).toContain("security audit");
    expect(reasoningEscalationPolicy.frontierForbiddenUse).toContain("autocomplete");
    expect(reasoningEscalationPolicy.frontierForbiddenUse).toContain("routine summarization");
  });

  it("blocks non-local worker dependency without owner decision", () => {
    expect(reasoningEscalationPolicy.stopConditions).toContain("non_local_worker_dependency");
    expect(reasoningEscalationPolicy.stopConditions).toContain("frontier_used_for_simple_worker_task");
  });
});
