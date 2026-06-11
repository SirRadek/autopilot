import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { capabilityModules } from "../src/data/delivery-system/capabilities";
import { buildDecisionMeshGraph, loadDecisionMeshFromRoot } from "../src/lib/decision-mesh";
import type { DecisionMesh } from "../src/lib/decision-mesh";

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

function validateCapabilityRoutingMirror(mesh: DecisionMesh): string[] {
  const errors: string[] = [];
  const yamlCapabilityNodes = mesh.nodes.filter((node) =>
    node.type === "capability_module" || node.type === "capability_addon"
  );
  const yamlIds = yamlCapabilityNodes.map((node) => node.id);
  const tsIds = capabilityModules.map((module) => module.id);

  compareSets("capability ids", tsIds, yamlIds, errors);

  for (const module of capabilityModules) {
    const node = yamlCapabilityNodes.find((candidate) => candidate.id === module.id);
    if (!node) {
      continue;
    }

    compareSets(`${module.id}.signals`, module.signals, node.signals, errors);
    compareSets(`${module.id}.requiredAgents`, module.requiredAgents, node.related_agents, errors);
    compareSets(`${module.id}.requiredChecks`, module.requiredChecks, node.required_checks, errors);
  }

  return errors;
}

function compareSets(label: string, actualValues: readonly string[], expectedValues: readonly string[], errors: string[]): void {
  const actual = [...new Set(actualValues)].sort();
  const expected = [...new Set(expectedValues)].sort();

  const missing = expected.filter((value) => !actual.includes(value));
  const extra = actual.filter((value) => !expected.includes(value));

  if (missing.length > 0 || extra.length > 0) {
    errors.push(`${label} drift: missing [${missing.join(", ")}], extra [${extra.join(", ")}]`);
  }
}
