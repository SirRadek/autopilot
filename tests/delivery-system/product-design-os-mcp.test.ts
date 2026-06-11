import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("Product & Design OS MCP exposure", () => {
  it("registers the router as a read-only MCP server with structured tool output contracts", () => {
    const serverSource = readFileSync(join(process.cwd(), "mcp/server.ts"), "utf8");
    const toolRegistrationBlocks = serverSource.split("server.registerTool(").slice(1);
    const toolRegistrations = serverSource.match(/server\.registerTool\(/g) ?? [];
    const readOnlyToolRegistrations = serverSource.match(/\.\.\.readOnlyTool\(/g) ?? [];

    expect(serverSource).toContain('"route_product_design_os"');
    expect(serverSource).toContain("version: packageVersion");
    expect(serverSource).toContain("instructions:");
    expect(serverSource).toContain("Read-only Autopilot Decision Mesh context router");
    expect(serverSource).toContain("It must not mutate repositories, connectors, deployments, project runtimes, or external services.");
    expect(serverSource).toContain("outputSchema");
    expect(serverSource).toContain("structuredContent");
    expect(serverSource).toContain("readOnlyHint: true");
    expect(serverSource).toContain("destructiveHint: false");
    expect(serverSource).toContain("routeProductDesignOs(toPdosRouteRequest(input))");
    expect(serverSource).toContain("input.format === \"markdown\"");
    expect(serverSource).toContain('"score_product_design_os"');
    expect(serverSource).toContain("scoreProductDesignOs(toPdosScoreInput(input), projectRoot)");
    expect(serverSource).toContain('"select_protective_supervision_route"');
    expect(serverSource).toContain("selectProtectiveSupervisionRoute(input)");
    expect(toolRegistrations.length).toBeGreaterThan(0);
    expect(readOnlyToolRegistrations).toHaveLength(toolRegistrations.length);
    expect(toolRegistrationBlocks.every((block) => block.includes("...readOnlyTool("))).toBe(true);
    expect(serverSource).not.toMatch(/outputSchema:\s*z\.object\(\s*\{\s*\}\s*\)\.catchall\(z\.unknown\(\)\)/);
    expect(serverSource).not.toContain("readOnlyToolMetadata");
    expect(serverSource).not.toContain("writeFile");
    expect(serverSource).not.toContain("appendFile");
  });
});
