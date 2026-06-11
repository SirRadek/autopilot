import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";

import { isRecord, validateJsonSchema } from "../src/lib/delivery-system/validation";

export interface PromptLibraryValidationIssue {
  readonly file: string;
  readonly message: string;
}

export interface PromptLibraryValidationReport {
  readonly ok: boolean;
  readonly checkedFiles: readonly string[];
  readonly errors: readonly PromptLibraryValidationIssue[];
}

interface SourceCatalog {
  readonly version: number;
  readonly sources: readonly SourceCatalogEntry[];
}

interface SourceCatalogEntry {
  readonly id: string;
}

export function validatePromptLibrary(repoRoot = process.cwd()): PromptLibraryValidationReport {
  const promptRoot = join(repoRoot, "prompt-library");
  const schemaPath = join(promptRoot, "prompt.schema.json");
  const sourceCatalogPath = join(promptRoot, "source-catalog.json");
  const checkedFiles: string[] = [];
  const errors: PromptLibraryValidationIssue[] = [];

  checkedFiles.push(toRepoPath(repoRoot, schemaPath), toRepoPath(repoRoot, sourceCatalogPath));

  if (!existsSync(promptRoot)) {
    return {
      ok: false,
      checkedFiles,
      errors: [{ file: "prompt-library", message: "Prompt library root does not exist." }]
    };
  }

  const schema = readJson(schemaPath, repoRoot, errors);
  const sourceCatalog = readSourceCatalog(sourceCatalogPath, repoRoot, errors);
  const sourceIds = new Set(sourceCatalog?.sources.map((source) => source.id) ?? []);

  if (sourceCatalog) {
    validateSourceCatalog(sourceCatalog, sourceCatalogPath, repoRoot, errors);
  }

  const promptFiles = listFiles(promptRoot)
    .filter((file) => file.endsWith(".md"))
    .filter((file) => hasFrontmatter(file));

  for (const file of promptFiles) {
    checkedFiles.push(toRepoPath(repoRoot, file));
    const relativePromptPath = relative(promptRoot, file).replace(/\\/g, "/");
    const frontmatter = readPromptFrontmatter(file, repoRoot, errors);

    if (!frontmatter || !schema) {
      continue;
    }

    for (const issue of validateJsonSchema(frontmatter, schema)) {
      errors.push({
        file: toRepoPath(repoRoot, file),
        message: `${issue.path}: ${issue.message}`
      });
    }

    validateSources(frontmatter, sourceIds, file, repoRoot, errors);
    validateEvals(frontmatter, promptRoot, relativePromptPath, file, repoRoot, errors);
    validateCandidateStatus(frontmatter, file, repoRoot, errors);
  }

  return {
    ok: errors.length === 0,
    checkedFiles: [...new Set(checkedFiles)].sort(),
    errors
  };
}

export function formatPromptLibraryValidationReport(report: PromptLibraryValidationReport): string {
  const lines = [
    report.ok ? "Prompt library validation passed." : "Prompt library validation failed.",
    `Checked files: ${report.checkedFiles.length}`,
    `Errors: ${report.errors.length}`
  ];

  if (report.errors.length > 0) {
    lines.push("", "Errors:");
    lines.push(...report.errors.map((issue) => `- ${issue.file}: ${issue.message}`));
  }

  return lines.join("\n");
}

function validateSourceCatalog(
  catalog: SourceCatalog,
  file: string,
  repoRoot: string,
  errors: PromptLibraryValidationIssue[]
): void {
  if (catalog.version !== 1) {
    errors.push({ file: toRepoPath(repoRoot, file), message: "Source catalog version must be 1." });
  }

  if (!Array.isArray(catalog.sources) || catalog.sources.length === 0) {
    errors.push({ file: toRepoPath(repoRoot, file), message: "Source catalog must contain sources." });
    return;
  }

  const ids = new Set<string>();
  for (const source of catalog.sources) {
    if (!isRecord(source) || typeof source.id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(source.id)) {
      errors.push({ file: toRepoPath(repoRoot, file), message: "Each source must have a machine-readable id." });
      continue;
    }

    if (ids.has(source.id)) {
      errors.push({ file: toRepoPath(repoRoot, file), message: `Duplicate source id: ${source.id}.` });
    }
    ids.add(source.id);
  }
}

function validateSources(
  frontmatter: Record<string, unknown>,
  sourceIds: ReadonlySet<string>,
  file: string,
  repoRoot: string,
  errors: PromptLibraryValidationIssue[]
): void {
  const sources = frontmatter.sources;
  if (!Array.isArray(sources)) {
    return;
  }

  for (const source of sources) {
    if (typeof source === "string" && !sourceIds.has(source)) {
      errors.push({
        file: toRepoPath(repoRoot, file),
        message: `Unknown source id: ${source}. Add it to prompt-library/source-catalog.json.`
      });
    }
  }
}

function validateEvals(
  frontmatter: Record<string, unknown>,
  promptRoot: string,
  relativePromptPath: string,
  file: string,
  repoRoot: string,
  errors: PromptLibraryValidationIssue[]
): void {
  const evals = frontmatter.evals;
  const id = typeof frontmatter.id === "string" ? frontmatter.id : "";
  if (!Array.isArray(evals)) {
    return;
  }

  for (const evalRef of evals) {
    if (typeof evalRef !== "string") {
      continue;
    }

    if (evalRef === relativePromptPath || evalRef === id) {
      errors.push({ file: toRepoPath(repoRoot, file), message: `Prompt cannot reference itself as an eval: ${evalRef}.` });
    }

    const evalPath = join(promptRoot, evalRef);
    if (!existsSync(evalPath)) {
      errors.push({ file: toRepoPath(repoRoot, file), message: `Eval file does not exist: ${evalRef}.` });
    }
  }
}

function validateCandidateStatus(
  frontmatter: Record<string, unknown>,
  file: string,
  repoRoot: string,
  errors: PromptLibraryValidationIssue[]
): void {
  if (frontmatter.status === "approved") {
    errors.push({
      file: toRepoPath(repoRoot, file),
      message: "Prompts must stay candidate until real eval results are recorded and reviewed."
    });
  }
}

function readPromptFrontmatter(
  file: string,
  repoRoot: string,
  errors: PromptLibraryValidationIssue[]
): Record<string, unknown> | undefined {
  const content = readFileSync(file, "utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(content);

  if (!match?.[1]) {
    errors.push({ file: toRepoPath(repoRoot, file), message: "Prompt file is missing YAML frontmatter." });
    return undefined;
  }

  const parsed = parse(match[1]) as unknown;
  if (!isRecord(parsed)) {
    errors.push({ file: toRepoPath(repoRoot, file), message: "YAML frontmatter must be an object." });
    return undefined;
  }

  return parsed;
}

function readSourceCatalog(
  file: string,
  repoRoot: string,
  errors: PromptLibraryValidationIssue[]
): SourceCatalog | undefined {
  const value = readJson(file, repoRoot, errors);
  if (!isRecord(value)) {
    return undefined;
  }

  const sources = value.sources;
  return {
    version: typeof value.version === "number" ? value.version : 0,
    sources: Array.isArray(sources) ? sources.filter(isRecord).map((source) => ({ id: String(source.id) })) : []
  };
}

function readJson(file: string, repoRoot: string, errors: PromptLibraryValidationIssue[]): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JSON parse failure.";
    errors.push({ file: toRepoPath(repoRoot, file), message });
    return undefined;
  }
}

function hasFrontmatter(file: string): boolean {
  return readFileSync(file, "utf8").trimStart().startsWith("---");
}

function listFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    return stats.isDirectory() ? listFiles(path) : [path];
  });
}

function toRepoPath(repoRoot: string, file: string): string {
  return relative(repoRoot, file).replace(/\\/g, "/");
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : "";

if (invokedFile === currentFile) {
  const report = validatePromptLibrary();
  console.log(formatPromptLibraryValidationReport(report));

  if (!report.ok) {
    process.exit(1);
  }
}
