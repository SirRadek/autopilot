import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { buildDecisionMeshGraph, loadDecisionMeshFromRoot, validateCapabilityRoutingMirror } from "../src/lib/decision-mesh";

const root = process.cwd();
const outputPath = join(root, "mesh/generated/decision-mesh.json");
const mesh = loadDecisionMeshFromRoot(root);
const graph = buildDecisionMeshGraph(mesh);
const output = `${JSON.stringify(graph, null, 2)}\n`;
const driftErrors = validateCapabilityRoutingMirror(mesh);

if (process.argv.includes("--check")) {
  const existing = existsSync(outputPath) ? readFileSync(outputPath, "utf8") : "";

  if (existing !== output) {
    console.error("mesh/generated/decision-mesh.json is out of sync. Run npm run mesh:generate.");
    process.exitCode = 1;
  }

  if (driftErrors.length > 0) {
    console.error("Capability routing mirror drift detected:");
    for (const error of driftErrors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
  }
} else {
  if (driftErrors.length > 0) {
    console.error("Capability routing mirror drift detected. Refusing to generate stale graph:");
    for (const error of driftErrors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  writeFileSync(outputPath, output, "utf8");
  console.error(`Generated ${outputPath.replace(`${dirname(root)}\\`, "")}`);
}
