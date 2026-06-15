import { describe, expect, it } from "vitest";

import {
  classifyChangeRequest,
  classifyProjectIntake,
  formatPdosRouteResult,
  routeProductDesignOs,
  selectRecipe
} from "../../product-design-os/scripts/route-product-design-os";

describe("Product & Design OS router", () => {
  it("routes creative marketing work toward the creative motion recipe", () => {
    const route = classifyProjectIntake({
      text: "Marketing website for more customer leads with motion, cursor interaction, playful sections, case studies, and clear CTA.",
      primary_goal: "Increase qualified leads",
      target_users: ["small business owner"],
      critical_user_action: "submit inquiry"
    });

    expect(route.project_type).toBe("marketing_web");
    expect(route.selected_recipe).toBe("creative-motion");
    expect(route.design_priority).toBeGreaterThan(route.logic_priority);
    expect(route.motion_level).toBeGreaterThanOrEqual(7);
    expect(route.stop_conditions).not.toContain("primary_goal_missing");
  });

  it("routes ecommerce checkout work toward conversion safeguards", () => {
    const route = classifyProjectIntake("Eshop checkout with cart, payment, shipping, product variants, mobile trust, and reviews.");

    expect(route.project_type).toBe("ecommerce");
    expect(route.selected_recipe).toBe("ecommerce-conversion");
    expect(route.risk_level).toBe("high");
    expect(route.required_gates).toContain("QA Lock");
  });

  it("routes internal workflow work toward logic-first operations", () => {
    const route = classifyProjectIntake({
      text: "Internal admin system for operators with roles, permissions, state model, audit log, filters, bulk action, and validation.",
      primary_goal: "Process records safely",
      target_users: ["operator", "manager"],
      critical_user_action: "approve record"
    });

    expect(route.project_type).toBe("internal_system");
    expect(route.selected_recipe).toBe("internal-ops-clean");
    expect(route.logic_priority).toBe(10);
    expect(route.motion_level).toBe(1);
  });

  it("classifies risky visual requests in checkout as conflicts", () => {
    const route = classifyChangeRequest("Add a 3d avatar and particles directly inside checkout payment step.", {
      project_type: "ecommerce",
      critical_user_action: "complete checkout"
    });

    expect(route.classification).toBe("E");
    expect(route.requires_scope_change).toBe(false);
    expect(route.stop_conditions).toContain("do_not_implement_blindly");
  });

  it("classifies new modules as scope expansion", () => {
    const route = classifyChangeRequest("Add a blog and CMS module to the main marketing site.", {
      project_type: "marketing_web"
    });

    expect(route.classification).toBe("B");
    expect(route.requires_scope_change).toBe(true);
  });

  it("keeps recipe selection deterministic for known project types", () => {
    expect(selectRecipe("dashboard", "kpi chart filters export")).toBe("dashboard-data-heavy");
    expect(selectRecipe("client_portal", "account overview secure documents")).toBe("client-portal-trust");
    expect(selectRecipe("public_sector", "citizen service accessible form")).toBe("public-sector-accessible");
    expect(selectRecipe("portfolio", "creative motion cursor")).toBe("creative-motion");
    expect(selectRecipe("marketing_web", "trust cta case study")).toBe("marketing-premium");
  });

  it("generates a Markdown routing report without writing files", () => {
    const result = routeProductDesignOs({
      text: "Marketing website for more qualified leads with motion and case studies.",
      primary_goal: "Increase qualified leads",
      target_users: ["founder"],
      critical_user_action: "submit inquiry"
    });
    const markdown = formatPdosRouteResult(result, "markdown");

    expect(result.kind).toBe("project_intake");
    expect(markdown).toContain("# Product & Design OS Routing Report");
    expect(markdown).toContain("## Needs Report Draft");
    expect(markdown).toContain("## Scope Contract Draft");
    expect(markdown).toContain("## Product Opposition Draft");
    expect(markdown).toContain("## Implementation Lock Checklist");
    expect(markdown).not.toContain("undefined");
  });

  it("generates a Markdown change-request report for conflicts", () => {
    const result = routeProductDesignOs({
      change_request: "Add a 3d avatar to checkout payment step.",
      change_context: {
        project_type: "ecommerce",
        selected_recipe: "ecommerce-conversion",
        critical_user_action: "complete checkout"
      }
    });
    const markdown = formatPdosRouteResult(result, "markdown");

    expect(result.kind).toBe("change_request");
    expect(markdown).toContain("# Product & Design OS Change Request Report");
    expect(markdown).toContain("Classification: E / conflict_with_goal");
    expect(markdown).toContain("owner_decision_required");
    expect(markdown).not.toContain("undefined");
  });
});
