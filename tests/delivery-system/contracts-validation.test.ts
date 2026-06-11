import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  formatContractsValidationReport,
  REQUIRED_CONTRACT_SCHEMA_FILES,
  validateContracts
} from "../../scripts/validate-contracts";

describe("contracts validation", () => {
  it("validates the current phase-0 contract schemas", () => {
    const report = validateContracts(process.cwd());

    expect(report.ok).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.checkedFiles).toContain("docs/contracts/task-capsule.schema.json");
    expect(report.checkedFiles).toContain("docs/contracts/evidence-pack.schema.json");
    expect(report.checkedFiles).toContain("docs/contracts/agent-output.schema.json");
    expect(report.checkedFiles).toContain("docs/contracts/review-report.schema.json");
    expect(report.checkedFiles).toContain("docs/contracts/completion-evidence.schema.json");
  });

  it("formats validation reports for CLI output", () => {
    const report = validateContracts(process.cwd());
    const formatted = formatContractsValidationReport(report);

    expect(formatted).toContain("Contracts validation passed.");
    expect(formatted).toContain("Errors: 0");
  });

  it("rejects temp fixtures that drop expected required fields", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "autopilot-contracts-validation-"));
    const tempContractsRoot = join(tempRoot, "docs", "contracts");
    mkdirSync(tempContractsRoot, { recursive: true });

    for (const schemaFile of REQUIRED_CONTRACT_SCHEMA_FILES) {
      const sourcePath = join(process.cwd(), "docs", "contracts", schemaFile);
      const targetPath = join(tempContractsRoot, schemaFile);
      const content = readFileSync(sourcePath, "utf8");

      if (schemaFile !== "task-capsule.schema.json") {
        writeFileSync(targetPath, content, "utf8");
        continue;
      }

      const schema = JSON.parse(content) as { required?: unknown[] };
      schema.required = (schema.required ?? []).filter((field) => field !== "task_id");
      writeFileSync(targetPath, `${JSON.stringify(schema, null, 2)}\n`, "utf8");
    }

    const report = validateContracts(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain("Schema must require task_id.");
  });
});
