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
    expect(report.checkedFiles).toContain("prompt-library/source-catalog.schema.json");
    expect(report.checkedFiles).toContain("prompt-library/source-catalog.json");
    expect(report.checkedFiles).toContain("prompt-library/02-gemini/input-packet-template.md");
    expect(report.checkedFiles).toContain("prompt-library/07-deepseek/manual-web-advisory.md");
  });

  it("formats validation reports for CLI output", () => {
    const report = validatePromptLibrary(process.cwd());
    const formatted = formatPromptLibraryValidationReport(report);

    expect(formatted).toContain("Prompt library validation passed.");
    expect(formatted).toContain("Errors: 0");
  });

  it.each(["advisory-packet", "design-brainstorming"])("rejects invalid task_type: %s", (taskType) => {
    const tempRoot = createPromptLibraryFixture({
      task_type: taskType
    });

    const report = validatePromptLibrary(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors).toContainEqual(
      expect.objectContaining({
        file: "prompt-library/05-evaluation/checklist.md",
        message: expect.stringContaining("$.task_type: must be one of:")
      })
    );
  });

  it("rejects unknown source ids", () => {
    const tempRoot = createPromptLibraryFixture({
      sources: ["source-that-is-not-in-the-catalog"]
    });

    const report = validatePromptLibrary(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain(
      "Unknown source id: source-that-is-not-in-the-catalog. Add it to prompt-library/source-catalog.json."
    );
  });

  it("rejects approved prompts until eval results are recorded and reviewed", () => {
    const tempRoot = createPromptLibraryFixture({
      status: "approved"
    });

    const report = validatePromptLibrary(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain(
      "Prompts must stay candidate until real eval results are recorded and reviewed."
    );
  });

  it("rejects self-referencing evals by path", () => {
    const tempRoot = createPromptLibraryFixture({
      evals: ["05-evaluation/checklist.md"]
    });

    const report = validatePromptLibrary(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain(
      "Prompt cannot reference itself as an eval: 05-evaluation/checklist.md."
    );
  });

  it("rejects self-referencing evals by prompt id", () => {
    const tempRoot = createPromptLibraryFixture({
      evals: ["prompt-evaluation-checklist"]
    });

    const report = validatePromptLibrary(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.message)).toContain(
      "Prompt cannot reference itself as an eval: prompt-evaluation-checklist."
    );
  });

  it("validates source catalog json against the source catalog schema", () => {
    const tempRoot = createPromptLibraryFixture();
    const sourceCatalogPath = join(tempRoot, "prompt-library", "source-catalog.json");
    const catalog = JSON.parse(readFileSync(sourceCatalogPath, "utf8")) as {
      sources: Array<Record<string, unknown>>;
    };
    const firstSource = catalog.sources[0];
    if (!firstSource) {
      throw new Error("Expected prompt source catalog fixture to contain at least one source.");
    }
    firstSource.authority = "source-of-truth";
    writeFileSync(sourceCatalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

    const report = validatePromptLibrary(tempRoot);

    expect(report.ok).toBe(false);
    expect(report.errors).toContainEqual(
      expect.objectContaining({
        file: "prompt-library/source-catalog.json",
        message: expect.stringContaining("$.sources[0].authority: must be one of:")
      })
    );
  });
});

function createPromptLibraryFixture(overrides: Record<string, unknown> = {}): string {
  const tempRoot = mkdtempSync(join(tmpdir(), "autopilot-prompt-validation-"));
  const tempPromptRoot = join(tempRoot, "prompt-library");
  mkdirSync(join(tempPromptRoot, "05-evaluation"), { recursive: true });
  copyPromptLibraryFile("prompt.schema.json", tempPromptRoot);
  copyPromptLibraryFile("source-catalog.schema.json", tempPromptRoot);
  copyPromptLibraryFile("source-catalog.json", tempPromptRoot);
  writeFileSync(join(tempPromptRoot, "05-evaluation", "result.md"), "# Eval Result\n", "utf8");

  const frontmatter = {
    id: "prompt-evaluation-checklist",
    title: "Prompt Evaluation Checklist",
    model_family: "provider-neutral",
    task_type: "evaluation",
    version: "v0.1.0",
    status: "candidate",
    last_reviewed: "2026-06-10",
    sources: ["prompt-source-catalog"],
    risk_level: "medium",
    expected_output: "Checklist fixture.",
    evals: ["05-evaluation/result.md"],
    ...overrides
  };

  writeFileSync(
    join(tempPromptRoot, "05-evaluation", "checklist.md"),
    `---\n${toYamlFrontmatter(frontmatter)}---\n\n# Prompt Evaluation Checklist\n`,
    "utf8"
  );

  return tempRoot;
}

function copyPromptLibraryFile(file: string, tempPromptRoot: string): void {
  writeFileSync(
    join(tempPromptRoot, file),
    readFileSync(join(process.cwd(), "prompt-library", file), "utf8"),
    "utf8"
  );
}

function toYamlFrontmatter(value: Record<string, unknown>): string {
  return Object.entries(value)
    .map(([key, item]) => {
      if (Array.isArray(item)) {
        return `${key}:\n${item.map((entry) => `  - ${String(entry)}`).join("\n")}\n`;
      }

      return `${key}: ${String(item)}\n`;
    })
    .join("");
}
