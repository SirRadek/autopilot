import { describe, expect, it } from "vitest";

import { reasoningEscalationPolicy, selectReasoningModelRoute } from "../../src/data/delivery-system/modelPolicy";

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
    expect(reasoningEscalationPolicy.freeCloudAdvisoryUse).toContain("brainstorming");
    expect(reasoningEscalationPolicy.requiredChecks).toContain("free_tier_or_no_cost_confirmed");
    expect(reasoningEscalationPolicy.requiredChecks).toContain("redacted_context_only");
    expect(reasoningEscalationPolicy.requiredChecks).toContain("context7_or_official_docs_verified");
    expect(reasoningEscalationPolicy.requiredChecks).toContain("gemini_brainstorm_claims_labeled_and_verified");
    expect(reasoningEscalationPolicy.frontierForbiddenUse).toContain("autocomplete");
    expect(reasoningEscalationPolicy.frontierForbiddenUse).toContain("routine summarization");
  });

  it("blocks non-local worker dependency without owner decision", () => {
    expect(reasoningEscalationPolicy.stopConditions).toContain("non_local_worker_dependency");
    expect(reasoningEscalationPolicy.stopConditions).toContain("cloud_model_for_routine_worker_loop");
    expect(reasoningEscalationPolicy.stopConditions).toContain("frontier_used_for_simple_worker_task");
    expect(reasoningEscalationPolicy.stopConditions).toContain("paid_model_or_credit_required");
    expect(reasoningEscalationPolicy.stopConditions).toContain("technology_claim_without_context7_or_official_docs");
    expect(reasoningEscalationPolicy.stopConditions).toContain("gemini_claim_adopted_without_verification");
  });

  it("routes strategic brainstorming through free cloud advisory models when useful", () => {
    const route = selectReasoningModelRoute({
      task: "Use Gemini for architecture brainstorming, critique, and edge case reasoning"
    });

    expect(route.route).toBe("free_cloud_advisory_review");
    expect(route.advisoryProviders).toEqual(
      expect.arrayContaining(["gemini_cli", "provider_neutral_free_cloud_model"])
    );
    expect(route.requiredChecks).toEqual(
      expect.arrayContaining([
        "free_tier_or_no_cost_confirmed",
        "redacted_context_only",
        "context7_or_official_docs_verified",
        "factual_claims_verified"
      ])
    );
    expect(route.docsVerificationProviders).toEqual(
      expect.arrayContaining(["context7_when_available", "official_docs_fallback"])
    );
    expect(route.stopConditions).toContain("model_output_used_as_source_of_truth");
    expect(route.stopConditions).toContain("gemini_claim_adopted_without_verification");
  });

  it("keeps routine worker loops on the local route", () => {
    const route = selectReasoningModelRoute({
      task: "Run a boilerplate DTO automation loop"
    });

    expect(route.route).toBe("local_worker_default");
    expect(route.advisoryProviders).toContain("local_worker");
    expect(route.docsVerificationProviders).toContain("context7_when_available");
    expect(route.allowedUse).toContain("boilerplate coding");
    expect(route.forbiddenUse).toContain("architecture decisions");
    expect(route.forbiddenUse).not.toContain("boilerplate coding");
    expect(route.stopConditions).toContain("cloud_model_for_routine_worker_loop");
  });
});
