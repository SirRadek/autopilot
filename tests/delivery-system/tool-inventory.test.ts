import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  type SkillReplacementCandidate,
  selectToolInventoryForTask,
  toolInventorySnapshot
} from "../../src/data/delivery-system/toolInventory";

describe("tool inventory routing policy", () => {
  it("distinguishes session-callable plugins from cached-only bundles", () => {
    const browser = toolInventorySnapshot.items.find((item) => item.id === "browser_plugin");
    const clickup = toolInventorySnapshot.items.find((item) => item.id === "cached_clickup_bundle");

    expect(toolInventorySnapshot.observedAt).toBe("2026-06-11");
    expect(browser).toMatchObject({
      category: "plugin",
      status: "session_callable"
    });
    expect(clickup).toMatchObject({
      category: "plugin",
      status: "cached_not_session_callable"
    });
    expect(clickup?.stopConditions).toContain("cached_plugin_treated_as_callable");
  });

  it("routes local web QA to the browser and web-app tool lanes", () => {
    const route = selectToolInventoryForTask({
      task: "Use Browser for localhost web app testing and screenshot QA"
    });

    expect(route.matchingItems).toEqual(expect.arrayContaining(["browser_plugin", "build_web_apps_plugin"]));
    expect(route.requiredChecks).toEqual(expect.arrayContaining(["known_local_target", "responsive_check"]));
    expect(route.notes).toContain("Cached-only plugin bundles are evidence of local cache state, not callable capability.");
  });

  it("keeps cached plugin requests behind tool-search confirmation", () => {
    const route = selectToolInventoryForTask({
      task: "Use ClickUp project management integration"
    });

    expect(route.matchingItems).toContain("cached_clickup_bundle");
    expect(route.requiredChecks).toContain("tool_search_confirms_callable");
    expect(route.stopConditions).toContain("cached_plugin_treated_as_callable");
  });

  it("routes DeepSeek as a provider policy without claiming an active runtime", () => {
    const route = selectToolInventoryForTask({
      task: "Check DeepSeek JSON reasoning comparison provider availability"
    });

    const deepseek = toolInventorySnapshot.items.find((item) => item.id === "deepseek_provider_policy");

    expect(deepseek).toMatchObject({
      category: "model_provider",
      status: "provider_policy_only"
    });
    expect(route.matchingItems).toContain("deepseek_provider_policy");
    expect(route.requiredChecks).toEqual(
      expect.arrayContaining([
        "provider_availability_verified",
        "api_credit_or_self_hosting_cost_confirmed",
        "official_provider_docs_verified"
      ])
    );
    expect(route.stopConditions).toContain("provider_availability_unverified");
    expect(route.notes).toContain(
      "Provider-policy-only items are mesh routing records, not active credentials or runtime connectors."
    );
  });

  it("routes DeepSeek web chat as manual browser-login advisory only", () => {
    const route = selectToolInventoryForTask({
      task: "Use DeepSeek web chat Expert mode for a free manual advisory second opinion"
    });

    const deepseekWeb = toolInventorySnapshot.items.find((item) => item.id === "deepseek_web_chat_manual");

    expect(deepseekWeb).toMatchObject({
      category: "model_provider",
      status: "provider_policy_only"
    });
    expect(route.matchingItems).toContain("deepseek_web_chat_manual");
    expect(route.requiredChecks).toEqual(
      expect.arrayContaining([
        "free_tier_or_no_cost_confirmed",
        "authentication_state_verified_without_token_disclosure",
        "fresh_chat_started_for_each_mode_test",
        "prompt_packet_bounded"
      ])
    );
    expect(route.stopConditions).toContain("browser_session_unavailable");
    expect(route.notes).toContain(
      "DeepSeek web chat is a manual browser-login advisory path, not a CLI, API runtime, or stable headless automation contract."
    );
  });

  it("keeps the committed skill registry in v1 shape", () => {
    const registry = JSON.parse(readFileSync("docs/autopilot/skill-registry.json", "utf8")) as {
      lastUpdatedAt: string;
      schemaVersion: string;
      skills: unknown[];
      usageRecords: unknown[];
      replacementCandidates: unknown[];
    };

    expect(registry.schemaVersion).toBe("v1");
    expect(typeof registry.lastUpdatedAt).toBe("string");
    expect(Array.isArray(registry.skills)).toBe(true);
    expect(Array.isArray(registry.usageRecords)).toBe(true);
    expect(Array.isArray(registry.replacementCandidates)).toBe(true);
  });

  it("models skill replacement candidates as a one-way adoption workflow", () => {
    const candidate: SkillReplacementCandidate = {
      existingSkillId: "platform-skill",
      candidateId: "custom-local-skill",
      candidateSource: "custom_local_skill",
      candidatePromptPath: "prompt-library/example.md",
      expectedBenefits: ["lower token use"],
      evaluationCriteria: ["passes local eval"],
      status: "evaluating",
      statusReason: undefined
    };

    expect(candidate.status).toBe("evaluating");
  });
});
