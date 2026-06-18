import { describe, expect, it } from "vitest";

import {
  type ModelPolicyLayer,
  resolveCliVendorForLayer,
  supervisorCliVendorMap
} from "../../src/data/delivery-system/modelPolicy";

describe("supervisor CLI vendor routing", () => {
  it("routes implementation layers to codex_cli", () => {
    const implementationLayers: ModelPolicyLayer[] = ["tester", "micro_worker", "bounded_coding"];
    for (const layer of implementationLayers) {
      expect(resolveCliVendorForLayer(layer)).toBe("codex_cli");
    }
  });

  it("routes analysis layers to agy_cli", () => {
    const analysisLayers: ModelPolicyLayer[] = ["architect", "reviewer", "copywriter"];
    for (const layer of analysisLayers) {
      expect(resolveCliVendorForLayer(layer)).toBe("agy_cli");
    }
  });

  it("returns null for orchestrator and memory_summarizer (handled by Claude directly)", () => {
    expect(resolveCliVendorForLayer("orchestrator")).toBeNull();
    expect(resolveCliVendorForLayer("memory_summarizer")).toBeNull();
  });

  it("covers every ModelPolicyLayer with a non-undefined vendor selection", () => {
    for (const [, vendor] of Object.entries(supervisorCliVendorMap)) {
      expect(vendor === "codex_cli" || vendor === "agy_cli" || vendor === null).toBe(true);
    }
  });

  it("never maps any layer to a Claude agent vendor (no vendor roleplay)", () => {
    for (const [, vendor] of Object.entries(supervisorCliVendorMap)) {
      if (vendor !== null) {
        expect(["codex_cli", "agy_cli"]).toContain(vendor);
        expect(vendor).not.toMatch(/claude/i);
      }
    }
  });
});
