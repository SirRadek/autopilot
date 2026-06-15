import { describe, expect, it } from "vitest";

import {
  graphicAgentPolicy,
  graphicToolPolicies,
  selectGraphicRoute
} from "../../src/data/delivery-system/graphicAgent";
import { findRole } from "../../src/data/delivery-system/roles";

describe("graphic production agent policy", () => {
  it("registers the graphic production agent as an execution role without approval authority", () => {
    const role = findRole("graphic-production-agent");

    expect(role?.title).toBe("Graphic Production Agent");
    expect(role?.permissions).toEqual(expect.arrayContaining(["implement_code", "write_documentation"]));
    expect(role?.forbiddenActions).toEqual(
      expect.arrayContaining(["approve_own_work", "start_autonomous_execution"])
    );
  });

  it("keeps local free tools as the default graphics lane", () => {
    expect(graphicAgentPolicy.defaultPrinciple).toBe("dom_content_first_motion_second");
    expect(graphicAgentPolicy.defaultTools).toEqual(
      expect.arrayContaining(["html_css_svg", "canvas_2d", "three_js", "playwright_capture"])
    );
    expect(graphicAgentPolicy.freeCloudToolsAllowed).toEqual(expect.arrayContaining(["figma", "canva", "hyperframes"]));
    expect(graphicAgentPolicy.paidToolsRequireOwnerDecision).toEqual(expect.arrayContaining(["kling_ai"]));

    const figma = graphicToolPolicies.find((tool) => tool.id === "figma");
    expect(figma?.tier).toBe("optional_cloud_free");
    expect(figma?.requiresOwnerDecision).toBe(false);
    expect(figma?.requiresCostCheck).toBe(true);

    const kling = graphicToolPolicies.find((tool) => tool.id === "kling_ai");
    expect(kling?.tier).toBe("optional_paid_cloud");
    expect(kling?.requiresOwnerDecision).toBe(true);
    expect(kling?.requiresCostCheck).toBe(true);
  });

  it("routes motion backgrounds to CSS/SVG or Canvas before WebGL", () => {
    const route = selectGraphicRoute({
      task: "Create simple moving motion graphics background particles for a website"
    });

    expect(route.activateAgent).toBe("graphic-production-agent");
    expect(route.matchedRules).toContain("motion_background");
    expect(route.preferredTools).toEqual(expect.arrayContaining(["html_css_svg", "canvas_2d"]));
    expect(route.fallbackTools).toContain("three_js");
    expect(route.requiredChecks).toEqual(
      expect.arrayContaining(["reduced_motion_support", "mobile_fallback", "performance_budget"])
    );
  });

  it("routes true physics work to Rapier only when physics signals are present", () => {
    const route = selectGraphicRoute({
      task: "Build a physics visual with gravity, collision, and spring motion"
    });

    expect(route.matchedRules).toContain("simple_physics_visual");
    expect(route.preferredTools).toEqual(expect.arrayContaining(["canvas_2d", "rapier_physics"]));
    expect(route.requiredChecks).toContain("deterministic_seed");
  });

  it("allows free cloud video lanes only after no-cost confirmation and blocks paid tools", () => {
    const route = selectGraphicRoute({
      task: "Use Kling style cinematic video storyboard for a promo reel"
    });

    expect(route.matchedRules).toContain("video_or_cinematic_storyboard");
    expect(route.preferredTools).toContain("hyperframes");
    expect(route.requiredChecks).toContain("free_tier_or_no_cost_confirmed");
    expect(route.requiredChecks).toContain("owner_cost_decision_for_paid_tools");
    expect(route.stopConditions).toContain("cloud_tool_without_free_tier_confirmation");
    expect(route.stopConditions).toContain("paid_tool_without_owner_exception");
  });
});
