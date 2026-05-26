import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { buildDecisionMeshGraph, loadDecisionMeshFromRoot } from "../src/lib/decision-mesh";

const root = process.cwd();
const outputPath = join(root, "mesh/generated/decision-mesh.json");
const graph = buildDecisionMeshGraph(loadDecisionMeshFromRoot(root));
const output = `${JSON.stringify(graph, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const existing = existsSync(outputPath) ? readFileSync(outputPath, "utf8") : "";

  if (existing !== output) {
    console.error("mesh/generated/decision-mesh.json is out of sync. Run npm run mesh:generate.");
    process.exitCode = 1;
  }
} else {
  writeFileSync(outputPath, output, "utf8");
  console.error(`Generated ${outputPath.replace(`${dirname(root)}\\`, "")}`);
}
