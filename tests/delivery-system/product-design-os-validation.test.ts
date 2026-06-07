import { describe, expect, it } from "vitest";

import {
  formatPdosValidationReport,
  validateProductDesignOs
} from "../../product-design-os/scripts/validate-product-design-os";

describe("Product & Design OS validation", () => {
  it("validates the current Product & Design OS foundation", () => {
    const report = validateProductDesignOs(process.cwd());

    expect(report.ok).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.checkedFiles).toContain("product-design-os/briefs/project-brief.schema.json");
    expect(report.checkedFiles).toContain("product-design-os/recipes/creative-motion.json");
    expect(report.checkedFiles).toContain("product-design-os/assets/asset-manifest.json");
    expect(report.checkedFiles).toContain("product-design-os/patterns/pattern-manifest.json");
  });

  it("formats validation reports for CLI output", () => {
    const report = validateProductDesignOs(process.cwd());
    const formatted = formatPdosValidationReport(report);

    expect(formatted).toContain("PDOS validation passed.");
    expect(formatted).toContain("Errors: 0");
  });
});
