import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { validateJsonSchema } from "../../src/lib/delivery-system/validation";
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

  it("rejects project index entries with free-form status values", () => {
    const schema = JSON.parse(
      readFileSync(join(process.cwd(), "product-design-os", "library", "project-entry.schema.json"), "utf8")
    ) as unknown;
    const errors = validateJsonSchema(
      {
        slug: "demo",
        name: "Demo",
        status: "active",
        status_label: "active",
        architecture_path: "docs/projects/demo/architecture.md",
        work_log_path: "docs/projects/demo/work-log.md",
        project_mesh_path: "docs/projects/demo/decision-mesh",
        mesh_status: "present",
        library_links: {
          source_ids: [],
          reference_ids: [],
          asset_ids: [],
          pattern_ids: []
        }
      },
      schema
    );

    expect(errors.map((error) => error.message).join("\n")).toContain(
      "must be one of: not_started, ready, in_progress"
    );
  });
});
