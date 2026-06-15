import { describe, expect, it } from "vitest";

import {
  analyzeProductDesignVisualQa,
  formatVisualQaReport
} from "../../product-design-os/scripts/visual-qa-product-design-os";

describe("Product & Design OS visual QA", () => {
  it("passes a clean multi-viewport structured snapshot", () => {
    const report = analyzeProductDesignVisualQa({
      url: "https://example.test",
      project_type: "client_portal",
      primary_goal: "Help clients review account status",
      headings: ["Account overview", "Documents", "Support"],
      ctas: ["Open documents", "Contact support"],
      template_signals: [],
      viewports: [
        {
          name: "desktop",
          heading_count: 3,
          cta_count: 2,
          visible_text_characters: 1200,
          repeated_card_count: 3,
          motion_level: 1,
          reduced_motion_supported: true
        },
        {
          name: "mobile",
          heading_count: 3,
          cta_count: 2,
          visible_text_characters: 900,
          repeated_card_count: 3,
          motion_level: 1,
          reduced_motion_supported: true
        }
      ]
    });

    expect(report.ok).toBe(true);
    expect(report.template_risk_score).toBe(0);
    expect(report.issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(formatVisualQaReport(report, "markdown")).toContain("# Product & Design OS Visual QA Report");
  });

  it("flags layout, motion, contrast, canvas, and template-risk problems", () => {
    const report = analyzeProductDesignVisualQa({
      project_type: "public_sector",
      headings: [],
      ctas: [],
      template_signals: ["generic-saas-hero", "repeated-equal-card-grid", "fake-dashboard"],
      viewports: [
        {
          name: "mobile",
          heading_count: 0,
          cta_count: 0,
          visible_text_characters: 80,
          repeated_card_count: 12,
          text_overlap: true,
          horizontal_overflow: true,
          low_contrast: true,
          primary_content_in_canvas: true,
          motion_level: 6,
          reduced_motion_supported: false
        }
      ]
    });

    expect(report.ok).toBe(false);
    expect(report.template_risk_score).toBe(10);
    expect(report.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "horizontal_overflow",
        "text_overlap",
        "low_contrast",
        "primary_content_hidden_in_canvas",
        "missing_reduced_motion_fallback",
        "template_fake-dashboard"
      ])
    );
    expect(report.suggested_actions).toEqual(
      expect.arrayContaining([
        "Fix responsive layout before visual polish.",
        "Move primary content into readable DOM text.",
        "Run Design Critic review before implementation continues."
      ])
    );
  });
});
