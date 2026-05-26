import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const corePaths = ["AGENTS.md", "GEMINI.md", "mesh", "mcp", "scripts", "src"] as const;
const disallowedCorePatterns = [
  /[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/,
  /\bneduveryhodny\b/i,
  /\buzivatele\b/i
] as const;

function listFiles(path: string): string[] {
  const stats = statSync(path);

  if (stats.isFile()) {
    return [path];
  }

  return readdirSync(path).flatMap((entry) => listFiles(join(path, entry)));
}

describe("core language boundary", () => {
  it("keeps core instructions, mesh, MCP, scripts, and source files in English", () => {
    const files = corePaths.flatMap((path) => listFiles(join(process.cwd(), path)));
    const violations = files.flatMap((file) => {
      const content = readFileSync(file, "utf8");
      return disallowedCorePatterns
        .filter((pattern) => pattern.test(content))
        .map((pattern) => `${file}: ${String(pattern)}`);
    });

    expect(violations).toEqual([]);
  });
});
