import { describe, expect, it } from "vitest";

import {
  capabilityModules,
  capabilitySourceOfTruth,
  parallelSystemPolicy,
  selectCapabilityModules
} from "../../src/data/delivery-system/capabilities";

describe("capability routing policy", () => {
  it("keeps the main service modules explicit and treats 3D as a premium add-on", () => {
    expect(capabilityModules.map((module) => module.id)).toEqual([
      "web_build_mesh",
      "optimization_mesh",
      "data_mesh",
      "seo_mesh",
      "automation_mesh",
      "recovery_mesh",
      "observability_mesh",
      "document_mesh",
      "bot_rag_mesh",
      "three_d_experience_addon"
    ]);

    const threeD = capabilityModules.find((module) => module.id === "three_d_experience_addon");

    expect(threeD?.positioning).toBe("premium_addon");
    expect(threeD?.avoidWhen).toContain("performance_is_primary_problem");
    expect(threeD?.requiredChecks).toContain("seo_content_outside_canvas");
  });

  it("routes slow website work to optimization and SEO without default 3D", () => {
    const selection = selectCapabilityModules({
      task: "Optimize a slow website with SEO issues, broken links, and poor Core Web Vitals"
    });

    expect(selection.activate).toEqual(expect.arrayContaining(["optimization_mesh", "seo_mesh"]));
    expect(selection.avoid).toContain("three_d_experience_addon");
    expect(selection.requiredAgents).toEqual(expect.arrayContaining(["seo_performance", "frontend"]));
    expect(selection.reason).toContain("Measure first, then optimize against a target metric.");
  });

  it("routes diagnostics through observability while preserving Autopilot/project separation", () => {
    const selection = selectCapabilityModules({
      task: "Inspect runtime logs, tracing, and bottlenecks while separating Autopilot problems from project problems"
    });

    expect(selection.activate).toContain("observability_mesh");
    expect(selection.optional).toEqual(
      expect.arrayContaining(["optimization_mesh", "recovery_mesh", "automation_mesh", "data_mesh"])
    );
    expect(selection.requiredChecks).toEqual(
      expect.arrayContaining([
        "problem_scope_classified",
        "autopilot_vs_project_boundary",
        "redacted_log_summary",
        "baseline_metric",
        "suspect_layer_identified"
      ])
    );
    expect(selection.reason).toContain(
      "Classify Autopilot-vs-project ownership first, then inspect redacted evidence for the narrowest failing layer."
    );
  });

  it("returns neutral routing when no capability signals match", () => {
    const selection = selectCapabilityModules({
      task: "Polish archival naming"
    });

    expect(selection.activate).toEqual([]);
    expect(selection.optional).toEqual([]);
    expect(selection.avoid).toEqual([]);
    expect(selection.requiredAgents).toEqual([]);
    expect(selection.requiredChecks).toEqual([]);
    expect(selection.reason[0]).toContain("No capability signals matched");
  });

  it("routes data cleanup and migration work to data capability first", () => {
    const selection = selectCapabilityModules({
      task: "Clean duplicate CSV and XLSX exports, infer schema, migrate data, and keep a transformation log"
    });

    expect(selection.activate).toContain("data_mesh");
    expect(selection.requiredAgents).toEqual(expect.arrayContaining(["data_processing", "backend_database", "qa"]));
    expect(selection.requiredChecks).toContain("preserve_original");
  });

  it("keeps a future parallel system possible without making it the current path", () => {
    expect(parallelSystemPolicy.currentPath).toBe("extend_existing_autopilot_mesh");
    expect(parallelSystemPolicy.futureOption).toBe("parallel_ai_production_studio");
    expect(parallelSystemPolicy.allowedWhen).toContain("explicit_architecture_decision");
    expect(parallelSystemPolicy.forbiddenNow).toContain("create_unscoped_parallel_runtime");
  });

  it("declares mesh YAML as canonical capability content", () => {
    expect(capabilitySourceOfTruth.canonical).toBe("mesh_yaml");
    expect(capabilitySourceOfTruth.executableMirror).toBe("typescript_routing_index");
    expect(capabilitySourceOfTruth.driftCheck).toBe("capability_ids_signals_agents_checks_match_mesh_yaml");
  });
});
