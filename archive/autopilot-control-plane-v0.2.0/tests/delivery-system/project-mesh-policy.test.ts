import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { governanceGates } from "../../src/data/delivery-system/gates";
import { projectMeshPolicy } from "../../src/data/delivery-system/projectMesh";

const projectSlugs = ["autopilot-control-plane", "multi-agent-autonomous-delivery-system", "radeq"] as const;

describe("project mesh lifecycle policy", () => {
  it("distinguishes Autopilot mesh from per-project meshes", () => {
    expect(projectMeshPolicy.autopilotMeshScope).toBe("autopilot_operations_only");
    expect(projectMeshPolicy.projectMeshRequired).toBe(true);
    expect(projectMeshPolicy.projectMeshPathPattern).toBe("docs/projects/<project-slug>/decision-mesh/");
  });

  it("requires project mesh creation during architecture onboarding", () => {
    expect(projectMeshPolicy.creationTriggers).toContain("project_architecture_started");
    expect(projectMeshPolicy.creationTriggers).toContain("project_onboarded_without_mesh");
    expect(projectMeshPolicy.stopConditions).toContain("missing_project_mesh");
  });

  it("requires project mesh updates after completed work", () => {
    expect(projectMeshPolicy.updateTriggers).toContain("meaningful_work_slice_completed");
    expect(projectMeshPolicy.updateTriggers).toContain("architecture_impact_recorded");
    expect(projectMeshPolicy.updateTriggers).toContain("new_dependency_or_risk_found");
    expect(governanceGates).toContain("project_mesh_current");
  });

  it("has seeded project-specific decision mesh directories for onboarded projects", () => {
    for (const slug of projectSlugs) {
      const meshRoot = join(process.cwd(), "docs", "projects", slug, "decision-mesh");

      expect(existsSync(meshRoot), `${slug} project mesh root`).toBe(true);
      expect(existsSync(join(meshRoot, "nodes")), `${slug} project mesh nodes`).toBe(true);
      expect(existsSync(join(meshRoot, "edges.yaml")), `${slug} project mesh edges`).toBe(true);
      expect(existsSync(join(meshRoot, "rules.yaml")), `${slug} project mesh rules`).toBe(true);
    }
  });
});
