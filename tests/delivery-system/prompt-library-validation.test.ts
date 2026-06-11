import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import {
  formatPromptLibraryValidationReport,
  validatePromptLibrary
} from "../../scripts/validate-prompt-library";

describe("prompt library validation", () => {
  it("validates prompt frontmatter against schema and source catalog", () => {
    const report = validatePromptLibrary(process.cwd());

    expect(report.ok).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.checkedFiles).toContain("prompt-library/prompt.schema.json");
    expect(report.checkedFiles).toContain("prompt-library/source-catalog.json");
    expect(report.checkedFiles).toContain("prompt-library/02-gemini/input-packet-template.md");
  });

  it("formats validation reports for CLI output", () => {
    const report = validatePromptLibrary(process.cwd());
    const formatted = formatPromptLibraryValidationReport(report);

    expect(formatted).toContain("Prompt library validation passed.");
    expect(formatted).toContain("Errors: 0");
  });

  it("rejects self-referencing evals", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "autopilot-prompt-validation-"));
    const tempPromptRoot = join(tempRoot, "prompt-library");
    mkdirSync(join(tempPromptRoot, "05-evaluation"), { recursive: true });
    writeFileSync(
      join(tempPromptRoot, "prompt.schema.json"),
      readFileSync(join(process.cwd(), "prompt-library", "prompt.schema.json"), "utf8"),
      "utf8"
    );
    writeFileSync(
      join(tempPromptRoot, "source-catalog.json"),
      readFileSync(join(process.cwd(), "prompt-library", "source-catalog.json"), "utf8"),
      "utf8"
    );
    const promptPath = join(tempRoot, "prompt-library", "05-evaluation", "checklist.md");
    writeFileSync(
      promptPath,
      `---
id: prompt-evaluation-checklist
title: Prompt Evaluation Checklist
model_family: provider-neutral
task_type: evaluation
version: v0.1.0
status: candidate
last_reviewed: 2026-06-10
sources:
  - prompt-source-catalog
risk_level: medium
expected_output: Checklist fixture.
evals:
  - 05-evaluation/checklist.md
---

# Prompt Evaluation Checklist
`,
      "utf8"
    );

    const report = validatePromptLibrary(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain(
      "Prompt cannot reference itself as an eval: 05-evaluation/checklist.md."
    );
  });
});
