import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("prompt pack policy alignment", () => {
  it("mentions the current mesh, capability routing, context economy, and model spend rules", () => {
    const promptPack = readFileSync(join(process.cwd(), "docs", "autopilot", "v3-prompt-pack.md"), "utf8");

    expect(promptPack).toContain("Decision Mesh");
    expect(promptPack).toContain("select_capabilities");
    expect(promptPack).toContain("context economy");
    expect(promptPack).toContain("model spend");
    expect(promptPack).toContain("project-specific Decision Mesh");
  });
});
