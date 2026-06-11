import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("Product & Design OS MCP exposure", () => {
  it("registers the router as a read-only MCP tool", () => {
    const serverSource = readFileSync(join(process.cwd(), "mcp/server.ts"), "utf8");

    expect(serverSource).toContain('"route_product_design_os"');
    expect(serverSource).toContain("version: packageVersion");
    expect(serverSource).toContain("instructions:");
    expect(serverSource).toContain("outputSchema");
    expect(serverSource).toContain("structuredContent");
    expect(serverSource).toContain("readOnlyHint: true");
    expect(serverSource).toContain("routeProductDesignOs(toPdosRouteRequest(input))");
    expect(serverSource).toContain("input.format === \"markdown\"");
    expect(serverSource).toContain('"score_product_design_os"');
    expect(serverSource).toContain("scoreProductDesignOs(toPdosScoreInput(input), projectRoot)");
    expect(serverSource).toContain('"select_protective_supervision_route"');
    expect(serverSource).toContain("selectProtectiveSupervisionRoute(input)");
    expect(serverSource).not.toContain("writeFile");
    expect(serverSource).not.toContain("appendFile");
  });
});
