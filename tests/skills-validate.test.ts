import { describe, expect, it } from "vitest";

import {
  detectAdapterDrift,
  validateSkills,
  type AdapterManifest,
  type SkillContract
} from "../scripts/validate-skills";

const core: SkillContract = {
  skill_id: "safe-refactor",
  version: "1.0.0",
  required_steps: ["read_scoped_files", "run_tests"],
  forbidden_actions: ["rewrite_unrelated_files"],
  output_schema: ".agent/skills-core/safe-refactor/output.schema.json"
};

const validManifest: AdapterManifest = {
  skill_id: "safe-refactor",
  core_version: "1.0.0",
  step_tools: { read_scoped_files: "rg + read", run_tests: "test runner" },
  forbidden_actions: ["rewrite_unrelated_files"]
};

const cleanMarkdown = "Tool mapping only. read_scoped_files uses rg.";

describe("skills drift detector", () => {
  it("passes a thin, faithful adapter", () => {
    expect(detectAdapterDrift(core, validManifest, cleanMarkdown)).toEqual([]);
  });

  it("catches an unmapped required step", () => {
    const manifest = { ...validManifest, step_tools: { read_scoped_files: "rg + read" } };
    expect(detectAdapterDrift(core, manifest, cleanMarkdown)).toContain("required step not mapped to a tool: run_tests");
  });

  it("catches a core_version mismatch", () => {
    const manifest = { ...validManifest, core_version: "0.9.0" };
    expect(detectAdapterDrift(core, manifest, cleanMarkdown).join(" ")).toMatch(/does not match core version/);
  });

  it("catches a dropped forbidden action", () => {
    const manifest = { ...validManifest, forbidden_actions: [] };
    expect(detectAdapterDrift(core, manifest, cleanMarkdown)).toContain(
      "forbidden action not preserved: rewrite_unrelated_files"
    );
  });

  it("catches governance language smuggled into the adapter", () => {
    const markdown = "This adapter is the source of truth for refactors.";
    expect(detectAdapterDrift(core, validManifest, markdown).join(" ")).toMatch(/governance language/);
  });
});

describe("committed skills pass validation", () => {
  it("validates the real .agent/skills-core + adapters", () => {
    const report = validateSkills(process.cwd());
    expect(report.errors).toEqual([]);
    expect(report.ok).toBe(true);
  });
});
