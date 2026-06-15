import { describe, expect, it } from "vitest";

import {
  architectureLibraryCandidates,
  designCritiqueRubric,
  researchProviderPolicies,
  searchArchitectureLibrary,
  selectDesignReviewRoute
} from "../../src/data/delivery-system/designIntelligence";
import { findRole } from "../../src/data/delivery-system/roles";

describe("design intelligence policy", () => {
  it("registers Visual Analyst and Design Critic as separate non-producing review roles", () => {
    const analyst = findRole("visual-analyst");
    const critic = findRole("design-critic");

    expect(analyst?.layer).toBe("analysis");
    expect(analyst?.permissions).toContain("plan_workflow");
    expect(critic?.layer).toBe("review");
    expect(critic?.permissions).toContain("review_ux");
    expect(critic?.permissions).not.toContain("approve_delivery");
    expect(critic?.forbiddenActions).toContain("approve_own_work");
  });

  it("keeps Context7 as preferred research provider with primary-source fallbacks", () => {
    expect(researchProviderPolicies.map((provider) => provider.id)[0]).toBe("context7");
    expect(researchProviderPolicies.find((provider) => provider.id === "context7")).toMatchObject({
      availableInCurrentSession: false
    });
    expect(researchProviderPolicies.find((provider) => provider.id === "context7")?.useFor).toEqual(
      expect.arrayContaining(["best_practice_verification", "gemini_claim_verification"])
    );
    expect(researchProviderPolicies.find((provider) => provider.id === "context7")?.requiredChecks).toContain(
      "record_context7_query_or_fallback"
    );
    expect(researchProviderPolicies.map((provider) => provider.id)).toEqual(
      expect.arrayContaining(["official_docs", "github_repository_search", "hugging_face_docs"])
    );
  });

  it("uses a critique rubric that covers hierarchy, motion, accessibility, performance, and maintainability", () => {
    expect(designCritiqueRubric.map((criterion) => criterion.id)).toEqual(
      expect.arrayContaining(["hierarchy", "motion_value", "accessibility", "performance", "maintainability"])
    );
    expect(designCritiqueRubric.find((criterion) => criterion.id === "motion_value")?.blockerSignals).toContain(
      "motion_only_decoration"
    );
  });

  it("routes design critique work through both analyst and critic", () => {
    const route = selectDesignReviewRoute({
      task: "Review and critique a motion graphics design with latest technology research"
    });

    expect(route.agents).toEqual(["visual-analyst", "design-critic"]);
    expect(route.modes).toEqual(
      expect.arrayContaining(["pre_production_analysis", "post_production_critique", "technology_research"])
    );
    expect(route.stopConditions).toContain("critic_is_same_actor_as_producer");
    expect(route.stopConditions).toContain("gemini_claim_adopted_without_context7_or_official_docs");
  });

  it("routes Gemini brainstorms that mention best practices through technology research", () => {
    const route = selectDesignReviewRoute({
      task: "Use Gemini to brainstorm current frontend best practices for a motion graphics website"
    });

    expect(route.modes).toEqual(
      expect.arrayContaining(["technology_research", "architecture_library_review"])
    );
  });

  it("starts an architecture library with free/open GitHub candidates and adoption status", () => {
    expect(architectureLibraryCandidates.map((candidate) => candidate.id)).toEqual(
      expect.arrayContaining(["langgraph", "mastra", "vercel_ai_sdk", "promptfoo", "openinference"])
    );
    expect(architectureLibraryCandidates.find((candidate) => candidate.id === "promptfoo")).toMatchObject({
      license: "MIT",
      adoptionStatus: "candidate"
    });
    expect(architectureLibraryCandidates.find((candidate) => candidate.id === "mastra")?.risks).toContain(
      "runtime_scope_not_approved"
    );
  });

  it("searches the local architecture library without making adoption decisions", () => {
    const result = searchArchitectureLibrary({
      task: "Find agent evals and OpenTelemetry tracing candidates for LLM observability"
    });

    expect(result.providers).toEqual(
      expect.arrayContaining(["official_docs", "github_repository_search", "hugging_face_docs"])
    );
    expect(result.candidates).toEqual(expect.arrayContaining(["promptfoo", "openinference"]));
    expect(result.requiredChecks).toContain("free_tier_or_no_cost_confirmed");
    expect(result.stopConditions).toContain("license_unknown_for_adoption");
    expect(result.stopConditions).toContain("runtime_scope_not_approved");
    expect(result.stopConditions).toContain("cloud_dependency_without_free_tier_confirmation");
    expect(result.stopConditions).toContain("paid_dependency_without_owner_exception");
  });
});
