import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

const forbiddenPackageScriptFragments = [
  "git push",
  "gh pr merge",
  "gh workflow run",
  "vercel deploy",
  "wrangler deploy",
  "linear",
  "curl",
  "Invoke-WebRequest",
  "Start-Process"
];

const forbiddenSourceFragments = [
  "child_process",
  "worker_threads",
  "node:net",
  "node:http",
  "node:https",
  "fetch(",
  "@octokit",
  "@cloudflare",
  "@vercel",
  "@linear",
  "from \"cloudflare",
  "from \"vercel",
  "from \"linear",
  "from 'cloudflare",
  "from 'vercel",
  "from 'linear"
];

const forbiddenRuntimePaths = [
  "functions",
  "migrations",
  "public",
  "wrangler.toml",
  "wrangler.example.toml"
];

function listFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return listFiles(path);
    }

    return path;
  });
}

describe("delivery system boundary guards", () => {
  it("keeps package scripts non-mutating and non-deploying", () => {
    const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };

    const scriptText = Object.values(packageJson.scripts ?? {}).join("\n");

    for (const fragment of forbiddenPackageScriptFragments) {
      expect(scriptText).not.toContain(fragment);
    }
  });

  it("keeps governance, mesh, and MCP source files free of connector and execution APIs", () => {
    const sourceText = ["src", "mcp", "scripts"]
      .flatMap((directory) => listFiles(join(root, directory)))
      .filter((file) => file.endsWith(".ts") || file.endsWith(".astro"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    for (const fragment of forbiddenSourceFragments) {
      expect(sourceText).not.toContain(fragment);
    }
  });

  it("does not introduce product runtime or deployment paths", () => {
    for (const path of forbiddenRuntimePaths) {
      expect(existsSync(join(root, path))).toBe(false);
    }
  });
});
