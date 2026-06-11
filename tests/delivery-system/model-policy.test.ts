import { describe, expect, it } from "vitest";

import {
  credentialedAdvisoryProviderPolicies,
  reasoningProviderPolicies,
  reasoningTaskLanePolicies,
  reasoningEscalationPolicy,
  selectReasoningModelRoute
} from "../../src/data/delivery-system/modelPolicy";

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
    expect(reasoningEscalationPolicy.requiredChecks).toContain("subscription_entitlement_confirmed_for_subscription_tools");
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
    expect(reasoningEscalationPolicy.stopConditions).toContain("subscription_entitlement_unverified");
    expect(reasoningEscalationPolicy.stopConditions).toContain("api_credit_path_requested_without_owner_decision");
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
    expect(route.taskLanes).toContain("architecture_security_review");
    expect(route.providerPolicies).toEqual(
      expect.arrayContaining(["openai_gpt", "anthropic_claude_subscription", "gemini_cli", "deepseek_api_or_self_hosted"])
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

  it("surfaces structured-output providers with official-docs gates", () => {
    const route = selectReasoningModelRoute({
      task: "Review OpenAI structured output and DeepSeek JSON function calling strategy"
    });

    expect(route.route).toBe("free_cloud_advisory_review");
    expect(route.taskLanes).toContain("structured_tool_reasoning");
    expect(route.providerPolicies).toEqual(expect.arrayContaining(["openai_gpt", "deepseek_api_or_self_hosted"]));
    expect(route.advisoryProviders).toEqual(expect.arrayContaining(["openai_gpt", "deepseek_api_or_self_hosted"]));
    expect(route.requiredChecks).toEqual(
      expect.arrayContaining(["official_provider_docs_verified", "schema_validation_required", "local_verification_required"])
    );
    expect(route.stopConditions).toContain("unsupported_tool_mode_assumed");
  });

  it("keeps sensitive private-context routes local by default", () => {
    const route = selectReasoningModelRoute({
      task: "Review sensitive private repo credential handling and secret redaction"
    });

    expect(route.taskLanes).toContain("sensitive_private_context");
    expect(route.providerPolicies).toEqual(expect.arrayContaining(["deterministic_tools", "qwen_local"]));
    expect(route.requiredChecks).toContain("local_only_by_default");
    expect(route.stopConditions).toContain("cloud_model_for_sensitive_context_without_owner_exception");
  });

  it("keeps routine worker loops on the local route", () => {
    const route = selectReasoningModelRoute({
      task: "Run a boilerplate DTO automation loop"
    });

    expect(route.route).toBe("local_worker_default");
    expect(route.taskLanes).toEqual(["local_routine_worker"]);
    expect(route.providerPolicies).toEqual(["deterministic_tools", "qwen_local"]);
    expect(route.advisoryProviders).toContain("local_worker");
    expect(route.docsVerificationProviders).toContain("context7_when_available");
    expect(route.allowedUse).toContain("boilerplate coding");
    expect(route.forbiddenUse).toContain("architecture decisions");
    expect(route.forbiddenUse).not.toContain("boilerplate coding");
    expect(route.stopConditions).toContain("cloud_model_for_routine_worker_loop");
  });

  it("registers provider policies for model-specific reasoning lanes", () => {
    expect(reasoningTaskLanePolicies.map((lane) => lane.id)).toEqual(
      expect.arrayContaining([
        "structured_tool_reasoning",
        "long_context_synthesis",
        "architecture_security_review",
        "sensitive_private_context"
      ])
    );

    expect(reasoningProviderPolicies.map((provider) => provider.id)).toEqual(
      expect.arrayContaining([
        "deterministic_tools",
        "qwen_local",
        "openai_gpt",
        "anthropic_claude_subscription",
        "gemini_cli",
        "deepseek_api_or_self_hosted"
      ])
    );

    const claude = reasoningProviderPolicies.find((provider) => provider.id === "anthropic_claude_subscription");
    expect(claude).toMatchObject({
      provider: "anthropic",
      accessMode: "subscription_interactive"
    });
    expect(claude?.requiredChecks).toContain("subscription_entitlement_confirmed");
    expect(claude?.requiredChecks).not.toContain("owner_cost_decision_for_credentialed_provider");
    expect(claude?.stopConditions).toContain("api_credit_path_requested_without_owner_decision");
  });

  it("registers Claude Code as an optional subscription advisory provider", () => {
    const claude = credentialedAdvisoryProviderPolicies.find((provider) => provider.id === "claude_code");

    expect(claude).toMatchObject({
      provider: "anthropic",
      tool: "claude",
      accessMode: "subscription_interactive",
      costGuard: "uses_owner_subscription_entitlement_not_api_credit",
      registration: "optional"
    });
    expect(claude?.allowedUse).toContain("architecture second opinion");
    expect(claude?.forbiddenUse).toContain("default routine worker");
    expect(claude?.forbiddenUse).toContain("local automation loops");
    expect(claude?.requiredChecks).toEqual(
      expect.arrayContaining([
        "provider_availability_verified",
        "authentication_state_verified_without_token_disclosure",
        "subscription_entitlement_confirmed",
        "no_api_budget_or_credit_claim",
        "redacted_context_only",
        "official_provider_docs_verified"
      ])
    );
    expect(claude?.requiredChecks).not.toContain("owner_cost_decision_for_credentialed_provider");
    expect(claude?.stopConditions).toContain("subscription_entitlement_unverified");
    expect(claude?.stopConditions).toContain("api_credit_path_requested_without_owner_decision");
    expect(claude?.stopConditions).not.toContain("paid_model_or_credit_required_without_owner_decision");
    expect(claude?.stopConditions).toContain("model_output_used_as_source_of_truth");
  });
});
