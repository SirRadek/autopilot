import { describe, expect, it } from "vitest";

import {
  DEFAULT_TASTE_MEMORY,
  scoreProductDesignOs,
  type PdosAssetCandidate,
  type PdosTasteMemory
} from "../../product-design-os/scripts/score-product-design-os";

function asset(id: string, style: readonly string[]): PdosAssetCandidate {
  return {
    id,
    type: "layout",
    style,
    use_case: ["marketing_site"],
    target: ["smb"],
    creativity: 7,
    trust: 7,
    motion_level: 3,
    performance_cost: 3,
    mobile_safe: true,
    template_risk: 2
  };
}

const editorial = asset("editorial-hero", ["editorial"]);
const darkNeon = asset("dark-neon-hero", ["dark-neon"]);

function topAssetId(tasteMemory: PdosTasteMemory): string | undefined {
  const report = scoreProductDesignOs({
    text: "marketing site for a small studio",
    recipes: [],
    patterns: [],
    assets: [editorial, darkNeon],
    tasteMemory
  });
  return report.selected.assets[0]?.id;
}

describe("product-design-os taste loop (G1)", () => {
  it("ranks the liked style above the disliked one", () => {
    expect(
      topAssetId({ likedStyles: new Set(["editorial"]), dislikedStyles: new Set(["dark-neon"]) })
    ).toBe("editorial-hero");
  });

  it("flips the ranking when the taste memory flips — the scorer reads memory, not a hard-coded list", () => {
    expect(
      topAssetId({ likedStyles: new Set(["dark-neon"]), dislikedStyles: new Set(["editorial"]) })
    ).toBe("dark-neon-hero");
  });

  it("keeps the documented default preferences as a no-regression fallback", () => {
    expect(DEFAULT_TASTE_MEMORY.dislikedStyles.has("dark-neon")).toBe(true);
    expect(DEFAULT_TASTE_MEMORY.likedStyles.has("editorial")).toBe(true);
    expect(topAssetId(DEFAULT_TASTE_MEMORY)).toBe("editorial-hero");
  });
});
