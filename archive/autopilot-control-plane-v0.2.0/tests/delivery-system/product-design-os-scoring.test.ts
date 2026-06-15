import { describe, expect, it } from "vitest";

import {
  formatPdosScoreReport,
  scoreProductDesignOs,
  type PdosAssetCandidate,
  type PdosPatternCandidate,
  type PdosRecipeCandidate
} from "../../product-design-os/scripts/score-product-design-os";

const recipes: readonly PdosRecipeCandidate[] = [
  {
    id: "marketing-premium",
    project_types: ["marketing_web", "landing_page"],
    priorities: ["trust", "conversion"],
    logic_priority: 5,
    design_priority: 8,
    motion_level: 4,
    allowed_patterns: ["sharp-positioning-hero"],
    blocked_assets: ["fake-dashboard"],
    tests_required: ["a11y"]
  },
  {
    id: "internal-ops-clean",
    project_types: ["internal_system", "admin_panel"],
    priorities: ["clarity", "auditability"],
    logic_priority: 9,
    design_priority: 3,
    motion_level: 1,
    allowed_patterns: ["table-first"],
    blocked_assets: ["heavy-3d"],
    tests_required: ["logic"]
  }
];

const patterns: readonly PdosPatternCandidate[] = [
  {
    id: "sharp-positioning-hero",
    type: "conversion_pattern",
    use_case: ["marketing_web"],
    good_for: ["clear offer"],
    bad_for: ["internal_system"],
    complexity: 3,
    usability: 8,
    mobile_quality: 8,
    requires: ["headline", "cta"],
    risks: ["weak proof"]
  },
  {
    id: "dense-admin-table",
    type: "data_pattern",
    use_case: ["internal_system"],
    good_for: ["bulk review"],
    bad_for: ["marketing_web"],
    complexity: 7,
    usability: 7,
    mobile_quality: 4,
    requires: ["filters"],
    risks: ["mobile density"]
  }
];

const assets: readonly PdosAssetCandidate[] = [
  {
    id: "editorial-motion-hero",
    type: "hero",
    style: ["editorial", "creative", "motion"],
    use_case: ["marketing_web"],
    target: ["founders"],
    creativity: 9,
    trust: 7,
    motion_level: 7,
    performance_cost: 3,
    mobile_safe: true,
    template_risk: 2
  },
  {
    id: "generic-dark-dashboard",
    type: "hero",
    style: ["generic", "dark-neon"],
    use_case: ["marketing_web"],
    target: ["tech"],
    creativity: 5,
    trust: 4,
    motion_level: 5,
    performance_cost: 7,
    mobile_safe: false,
    template_risk: 8
  }
];

describe("Product & Design OS scoring", () => {
  it("scores matching recipes, patterns, and assets above mismatches", () => {
    const report = scoreProductDesignOs({
      text: "Marketing website for qualified leads with clear CTA, trust proof, editorial motion, and case studies.",
      primary_goal: "Increase leads",
      target_users: ["founder"],
      critical_user_action: "submit inquiry",
      recipes,
      patterns,
      assets,
      limit: 1
    });

    expect(report.selected.recipes[0]?.id).toBe("marketing-premium");
    expect(report.selected.patterns[0]?.id).toBe("sharp-positioning-hero");
    expect(report.selected.assets[0]?.id).toBe("editorial-motion-hero");
    expect(report.rejected.assets.map((asset) => asset.id)).toContain("generic-dark-dashboard");
  });

  it("keeps empty manifests explicit through warnings", () => {
    const report = scoreProductDesignOs({
      text: "Dashboard for metrics and export",
      patterns: [],
      assets: []
    });

    expect(report.warnings).toContain("pattern_manifest_empty");
    expect(report.warnings).toContain("asset_manifest_empty");
    expect(report.selected.recipes.length).toBeGreaterThan(0);
  });

  it("formats a Markdown score report", () => {
    const report = scoreProductDesignOs({
      text: "Marketing website for leads with trust and proof",
      recipes,
      patterns,
      assets
    });
    const markdown = formatPdosScoreReport(report, "markdown");

    expect(markdown).toContain("# Product & Design OS Score Report");
    expect(markdown).toContain("## Selected Recipes");
    expect(markdown).toContain("## Selected Assets");
    expect(markdown).not.toContain("undefined");
  });

  it("scores registered marketing/creative manifest candidates", () => {
    const report = scoreProductDesignOs({
      text: "Marketing website for non-technical customers with motion, proof, service demo links, and a clear inquiry CTA.",
      primary_goal: "Increase qualified inquiries",
      target_users: ["small business owner"],
      critical_user_action: "submit inquiry"
    });

    expect(report.warnings).not.toContain("pattern_manifest_empty");
    expect(report.warnings).not.toContain("asset_manifest_empty");
    expect(report.selected.patterns.map((pattern) => pattern.id)).toEqual(
      expect.arrayContaining(["sharp-positioning-hero", "proof-led-section"])
    );
    expect(report.selected.assets.map((asset) => asset.id)).toContain("editorial-motion-hero");
    expect(formatPdosScoreReport(report, "markdown")).toContain("proof-strip-case-study");
  });

  it("scores registered ecommerce candidates for checkout-safe conversion", () => {
    const report = scoreProductDesignOs({
      text: "Ecommerce product grid with cart checkout payment shipping reviews trust mobile checkout and clear price.",
      primary_goal: "Sell products safely",
      target_users: ["mobile shopper"],
      critical_user_action: "complete checkout"
    });

    expect(report.route.project_type).toBe("ecommerce");
    expect(report.selected.recipes[0]?.id).toBe("ecommerce-conversion");
    expect(report.warnings).not.toContain("pattern_manifest_empty");
    expect(report.warnings).not.toContain("asset_manifest_empty");
    expect(report.selected.patterns.map((pattern) => pattern.id)).toEqual(
      expect.arrayContaining(["trust-summary", "product-detail", "checkout-steps"])
    );
    expect(report.selected.assets.map((asset) => asset.id)).toEqual(
      expect.arrayContaining(["checkout-progress-steps", "sticky-product-purchase-panel", "commerce-trust-summary-strip"])
    );
    const markdown = formatPdosScoreReport(report, "markdown");
    expect(markdown).toContain("ecommerce-product-grid");
    expect(markdown).not.toContain("checkout-3d-avatar");
  });

  it("scores registered dashboard candidates for data-heavy decision support", () => {
    const report = scoreProductDesignOs({
      text: "Dashboard analytics KPI metric chart filters export report data freshness drilldown table alert decision support.",
      primary_goal: "Support operational decisions",
      target_users: ["manager", "analyst"],
      critical_user_action: "inspect metric and export evidence"
    });

    expect(report.route.project_type).toBe("dashboard");
    expect(report.selected.recipes[0]?.id).toBe("dashboard-data-heavy");
    expect(report.warnings).not.toContain("pattern_manifest_empty");
    expect(report.warnings).not.toContain("asset_manifest_empty");
    expect(report.selected.patterns.map((pattern) => pattern.id)).toEqual(
      expect.arrayContaining(["kpi-overview", "chart-with-source", "alert-feed"])
    );
    expect(report.selected.assets.map((asset) => asset.id)).toEqual(
      expect.arrayContaining(["dashboard-kpi-strip", "accessible-chart-panel", "drilldown-data-table"])
    );
    const markdown = formatPdosScoreReport(report, "markdown");
    expect(markdown).toContain("dashboard-filter-toolbar");
    expect(markdown).not.toContain("decorative-3d");
  });

  it("scores registered internal-system candidates for operator workflow clarity", () => {
    const report = scoreProductDesignOs({
      text: "Internal system for operators with roles permissions workflow state audit log table filters detail drawer status badges bulk action saved filters and data entry.",
      primary_goal: "Process records accurately",
      target_users: ["operator", "manager", "admin"],
      critical_user_action: "review and update a record"
    });

    expect(report.route.project_type).toBe("internal_system");
    expect(report.selected.recipes[0]?.id).toBe("internal-ops-clean");
    expect(report.warnings).not.toContain("pattern_manifest_empty");
    expect(report.warnings).not.toContain("asset_manifest_empty");
    expect(report.selected.patterns.map((pattern) => pattern.id)).toEqual(
      expect.arrayContaining(["status-badges", "permission-aware-actions", "table-first"])
    );
    expect(report.selected.assets.map((asset) => asset.id)).toEqual(
      expect.arrayContaining(["ops-table-workbench", "permission-aware-action-row", "bulk-action-command-bar"])
    );
    const markdown = formatPdosScoreReport(report, "markdown");
    expect(markdown).toContain("saved-filter-views");
    expect(markdown).not.toContain("heavy-3d");
  });

  it("scores registered public-sector candidates for accessible service navigation", () => {
    const report = scoreProductDesignOs({
      text: "Public sector municipality citizen service finder accessible forms office contact notice plain language keyboard mobile.",
      primary_goal: "Help citizens complete a public service task",
      target_users: ["citizen", "office worker"],
      critical_user_action: "find service instructions and contact the office"
    });

    expect(report.route.project_type).toBe("public_sector");
    expect(report.selected.recipes[0]?.id).toBe("public-sector-accessible");
    expect(report.selected.patterns.map((pattern) => pattern.id)).toEqual(
      expect.arrayContaining(["plain-language-content", "contact-office-block", "service-finder"])
    );
    expect(report.selected.assets.map((asset) => asset.id)).toEqual(
      expect.arrayContaining(["plain-language-info-page", "public-service-finder", "office-contact-block"])
    );
    const markdown = formatPdosScoreReport(report, "markdown");
    expect(markdown).toContain("accessible-request-form");
    expect(markdown).not.toContain("canvas-primary-content");
  });

  it("scores registered client-portal candidates for trusted account work", () => {
    const report = scoreProductDesignOs({
      text: "Client portal account overview secure documents support thread tasks timeline permissions client actions mobile trust.",
      primary_goal: "Help clients manage account tasks safely",
      target_users: ["client", "account owner"],
      critical_user_action: "review documents and complete next task"
    });

    expect(report.route.project_type).toBe("client_portal");
    expect(report.selected.recipes[0]?.id).toBe("client-portal-trust");
    expect(report.selected.patterns.map((pattern) => pattern.id)).toEqual(
      expect.arrayContaining(["plain-language-content", "notice-banner", "account-overview"])
    );
    expect(report.selected.assets.map((asset) => asset.id)).toEqual(
      expect.arrayContaining(["plain-language-info-page", "permission-aware-action-row", "secure-document-list-panel"])
    );
    const markdown = formatPdosScoreReport(report, "markdown");
    expect(markdown).toContain("support-thread-panel");
    expect(markdown).not.toContain("hidden-security-state");
  });
});
