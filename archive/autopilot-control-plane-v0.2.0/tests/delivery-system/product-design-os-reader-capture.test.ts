import { describe, expect, it } from "vitest";

import {
  buildVisualQaInputFromCapture,
  type PdosCapturedViewport
} from "../../product-design-os/scripts/capture-design-reader";
import { analyzeProductDesignVisualQa } from "../../product-design-os/scripts/visual-qa-product-design-os";

describe("Product & Design OS Design Reader capture", () => {
  it("converts captured DOM/CSS evidence into Visual QA input", () => {
    const capturedViewports: readonly PdosCapturedViewport[] = [
      {
        name: "desktop",
        width: 1440,
        height: 900,
        screenshot_path: "output/playwright/product-design-os/desktop.png",
        dom_css: {
          title: "Service finder",
          headings: ["Service finder", "Permits"],
          ctas: ["Find service"],
          visible_text_characters: 650,
          repeated_card_count: 3,
          horizontal_overflow: false,
          text_overlap: false,
          low_contrast: false,
          primary_content_in_canvas: false,
          motion_level: 0,
          reduced_motion_supported: true,
          template_signals: []
        }
      },
      {
        name: "mobile",
        width: 390,
        height: 844,
        screenshot_path: "output/playwright/product-design-os/mobile.png",
        dom_css: {
          title: "Service finder",
          headings: ["Service finder"],
          ctas: ["Find service", "Contact office"],
          visible_text_characters: 500,
          repeated_card_count: 3,
          horizontal_overflow: false,
          text_overlap: false,
          low_contrast: false,
          primary_content_in_canvas: false,
          motion_level: 0,
          reduced_motion_supported: true,
          template_signals: []
        }
      }
    ];

    const visualQaInput = buildVisualQaInputFromCapture(
      {
        project_type: "public_sector",
        primary_goal: "Help citizens find services"
      },
      "file:///sample.html",
      capturedViewports
    );
    const report = analyzeProductDesignVisualQa(visualQaInput);

    expect(visualQaInput.viewports).toHaveLength(2);
    expect(visualQaInput.headings).toEqual(expect.arrayContaining(["Service finder", "Permits"]));
    expect(visualQaInput.ctas).toEqual(expect.arrayContaining(["Find service", "Contact office"]));
    expect(report.ok).toBe(true);
    expect(report.template_risk_score).toBe(0);
  });
});
