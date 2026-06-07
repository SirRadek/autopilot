import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface PdosValidationIssue {
  readonly file: string;
  readonly message: string;
}

export interface PdosValidationReport {
  readonly ok: boolean;
  readonly checkedFiles: readonly string[];
  readonly errors: readonly PdosValidationIssue[];
  readonly warnings: readonly PdosValidationIssue[];
}

const REQUIRED_FILES = [
  "README.md",
  "briefs/project-brief.schema.json",
  "briefs/brief-template.md",
  "scope/PROJECT_SCOPE.md",
  "scope/CHANGE_REQUESTS.md",
  "scope/DECISIONS.md",
  "scope/OUT_OF_SCOPE.md",
  "rules/strict-process.md",
  "rules/logic-first.md",
  "rules/multi-agent-routing.md",
  "rules/change-request-rules.md",
  "rules/anti-ai-slop.md",
  "rules/design-seo-tradeoff.md",
  "rules/source-and-license-gates.md",
  "rules/clean-room-reference-workflow.md",
  "rules/accessibility.md",
  "rules/performance.md",
  "library/README.md",
  "library/source.schema.json",
  "library/reference.schema.json",
  "library/project-entry.schema.json",
  "library/source-catalog.json",
  "library/reference-catalog.json",
  "library/project-index.json",
  "assets/asset.schema.json",
  "assets/asset-manifest.json",
  "patterns/pattern.schema.json",
  "patterns/pattern-manifest.json",
  "agents/agent-task-template.md",
  "agents/design-critic.md",
  "agents/strict-opponent.md",
  "agents/gemini-reviewer.md",
  "agents/qwen-worker.md",
  "taste/global-liked.json",
  "taste/global-disliked.json",
  "taste/project-preferences.json",
  "taste/feedback-log.json",
  "taste/pattern-scores.json",
  "reader/README.md",
  "reader/capture-sample.html",
  "reader/document-reader-adapter.ts",
  "reader/pdf-supervisor-adapter.md",
  "reader/visual-qa-sample.json",
  "scripts/capture-design-reader.ts",
  "scripts/validate-product-design-os.ts",
  "scripts/route-product-design-os.ts",
  "scripts/score-product-design-os.ts",
  "scripts/visual-qa-product-design-os.ts",
  "scripts/update-project-library.ts"
] as const;

const REQUIRED_RECIPES = [
  "client-portal-trust",
  "creative-motion",
  "dashboard-data-heavy",
  "ecommerce-conversion",
  "internal-ops-clean",
  "marketing-premium",
  "public-sector-accessible"
] as const;

const REQUIRED_SCOPE_HEADINGS = [
  "## Typ projektu",
  "## Primarni cil",
  `## Cilovi ${"uzivatel"}e`,
  "## Kriticke workflow",
  "## Definition Of Done"
] as const;

const REQUIRED_STRICT_PROCESS_TERMS = [
  "select_capabilities",
  "get_relevant_subgraph",
  "build_agent_packet",
  "build_project_mesh_packet",
  "Project Type Lock",
  "QA Lock"
] as const;

export function validateProductDesignOs(repoRoot = process.cwd()): PdosValidationReport {
  const pdosRoot = join(repoRoot, "product-design-os");
  const errors: PdosValidationIssue[] = [];
  const warnings: PdosValidationIssue[] = [];
  const checkedFiles: string[] = [];

  if (!existsSync(pdosRoot)) {
    return {
      ok: false,
      checkedFiles,
      errors: [{ file: "product-design-os", message: "Product & Design OS root does not exist." }],
      warnings
    };
  }

  for (const file of REQUIRED_FILES) {
    const absolutePath = join(pdosRoot, file);
    checkedFiles.push(toRepoPath(repoRoot, absolutePath));

    if (!existsSync(absolutePath)) {
      errors.push({ file: toRepoPath(repoRoot, absolutePath), message: "Required file is missing." });
    }
  }

  const jsonFiles = listFiles(pdosRoot).filter((file) => file.endsWith(".json"));
  for (const file of jsonFiles) {
    checkedFiles.push(toRepoPath(repoRoot, file));
    readJsonFile(file, repoRoot, errors);
  }

  validateBriefSchema(join(pdosRoot, "briefs/project-brief.schema.json"), repoRoot, errors);
  validateManifests(pdosRoot, repoRoot, errors);
  validateTasteMemory(pdosRoot, repoRoot, errors);
  validateRecipes(join(pdosRoot, "recipes"), repoRoot, errors);
  validateMarkdown(pdosRoot, repoRoot, errors, warnings);

  return {
    ok: errors.length === 0,
    checkedFiles: [...new Set(checkedFiles)].sort(),
    errors,
    warnings
  };
}

export function formatPdosValidationReport(report: PdosValidationReport): string {
  const lines = [
    report.ok ? "PDOS validation passed." : "PDOS validation failed.",
    `Checked files: ${report.checkedFiles.length}`,
    `Errors: ${report.errors.length}`,
    `Warnings: ${report.warnings.length}`
  ];

  if (report.errors.length > 0) {
    lines.push("", "Errors:");
    lines.push(...report.errors.map((issue) => `- ${issue.file}: ${issue.message}`));
  }

  if (report.warnings.length > 0) {
    lines.push("", "Warnings:");
    lines.push(...report.warnings.map((issue) => `- ${issue.file}: ${issue.message}`));
  }

  return lines.join("\n");
}

function validateBriefSchema(file: string, repoRoot: string, errors: PdosValidationIssue[]): void {
  const value = readJsonFile(file, repoRoot, errors);
  if (!isRecord(value)) {
    return;
  }

  const required = value.required;
  for (const field of ["project_type", "primary_goal", "target_users", "critical_user_action"]) {
    if (!Array.isArray(required) || !required.includes(field)) {
      errors.push({
        file: toRepoPath(repoRoot, file),
        message: `Brief schema must require ${field}.`
      });
    }
  }

  const projectType = value.properties;
  const enumValues = isRecord(projectType)
    ? getNestedArray(projectType, ["project_type", "enum"])
    : [];

  for (const projectTypeValue of ["marketing_web", "ecommerce", "internal_system", "dashboard"]) {
    if (!enumValues.includes(projectTypeValue)) {
      errors.push({
        file: toRepoPath(repoRoot, file),
        message: `Brief schema project_type enum must include ${projectTypeValue}.`
      });
    }
  }
}

function validateManifests(pdosRoot: string, repoRoot: string, errors: PdosValidationIssue[]): void {
  const manifests = [
    { file: join(pdosRoot, "assets/asset-manifest.json"), key: "assets" },
    { file: join(pdosRoot, "patterns/pattern-manifest.json"), key: "patterns" }
  ];

  for (const manifest of manifests) {
    const value = readJsonFile(manifest.file, repoRoot, errors);
    if (!isRecord(value)) {
      continue;
    }

    if (value.version !== 1) {
      errors.push({ file: toRepoPath(repoRoot, manifest.file), message: "Manifest version must be 1." });
    }

    if (!Array.isArray(value[manifest.key])) {
      errors.push({
        file: toRepoPath(repoRoot, manifest.file),
        message: `Manifest must contain an array field named ${manifest.key}.`
      });
    }
  }
}

function validateTasteMemory(pdosRoot: string, repoRoot: string, errors: PdosValidationIssue[]): void {
  const itemFiles = ["global-liked.json", "global-disliked.json"];

  for (const fileName of itemFiles) {
    const file = join(pdosRoot, "taste", fileName);
    const value = readJsonFile(file, repoRoot, errors);
    if (!isRecord(value)) {
      continue;
    }

    if (value.version !== 1 || !Array.isArray(value.items) || value.items.length === 0) {
      errors.push({
        file: toRepoPath(repoRoot, file),
        message: "Taste memory must have version 1 and at least one item."
      });
    }
  }

  const feedbackLog = join(pdosRoot, "taste/feedback-log.json");
  const feedbackValue = readJsonFile(feedbackLog, repoRoot, errors);
  if (isRecord(feedbackValue) && (!Array.isArray(feedbackValue.entries) || feedbackValue.entries.length === 0)) {
    errors.push({
      file: toRepoPath(repoRoot, feedbackLog),
      message: "Feedback log must contain at least one structured entry."
    });
  }
}

function validateRecipes(recipesRoot: string, repoRoot: string, errors: PdosValidationIssue[]): void {
  if (!existsSync(recipesRoot)) {
    errors.push({ file: toRepoPath(repoRoot, recipesRoot), message: "Recipes directory is missing." });
    return;
  }

  const recipes = readdirSync(recipesRoot)
    .filter((file) => file.endsWith(".json"))
    .map((file) => join(recipesRoot, file));
  const recipeIds = new Set<string>();

  for (const recipe of recipes) {
    const value = readJsonFile(recipe, repoRoot, errors);
    if (!isRecord(value)) {
      continue;
    }

    const id = value.id;
    if (typeof id !== "string" || id.length === 0) {
      errors.push({ file: toRepoPath(repoRoot, recipe), message: "Recipe must contain a non-empty id." });
    } else {
      recipeIds.add(id);
      if (`${id}.json` !== basename(recipe)) {
        errors.push({ file: toRepoPath(repoRoot, recipe), message: "Recipe filename must match its id." });
      }
    }

    validateRequiredArray(value, "project_types", recipe, repoRoot, errors);
    validateRequiredArray(value, "priorities", recipe, repoRoot, errors);
    validateRequiredArray(value, "allowed_patterns", recipe, repoRoot, errors);
    validateRequiredArray(value, "blocked_assets", recipe, repoRoot, errors);
    validateRequiredArray(value, "tests_required", recipe, repoRoot, errors);
    validateNumberRange(value, "logic_priority", 1, 10, recipe, repoRoot, errors);
    validateNumberRange(value, "design_priority", 1, 10, recipe, repoRoot, errors);
    validateNumberRange(value, "motion_level", 0, 10, recipe, repoRoot, errors);
  }

  for (const recipeId of REQUIRED_RECIPES) {
    if (!recipeIds.has(recipeId)) {
      errors.push({ file: toRepoPath(repoRoot, recipesRoot), message: `Missing required recipe ${recipeId}.` });
    }
  }
}

function validateMarkdown(
  pdosRoot: string,
  repoRoot: string,
  errors: PdosValidationIssue[],
  warnings: PdosValidationIssue[]
): void {
  const markdownFiles = listFiles(pdosRoot).filter((file) => file.endsWith(".md"));
  for (const file of markdownFiles) {
    const content = readFileSync(file, "utf8");
    if (!content.trimStart().startsWith("# ")) {
      warnings.push({ file: toRepoPath(repoRoot, file), message: "Markdown file should start with an H1." });
    }
  }

  const scopeTemplate = join(pdosRoot, "scope/PROJECT_SCOPE.md");
  const scopeContent = readFileSync(scopeTemplate, "utf8");
  for (const heading of REQUIRED_SCOPE_HEADINGS) {
    if (!scopeContent.includes(heading)) {
      errors.push({ file: toRepoPath(repoRoot, scopeTemplate), message: `Scope template missing ${heading}.` });
    }
  }

  const strictProcess = join(pdosRoot, "rules/strict-process.md");
  const strictProcessContent = readFileSync(strictProcess, "utf8");
  for (const term of REQUIRED_STRICT_PROCESS_TERMS) {
    if (!strictProcessContent.includes(term)) {
      errors.push({ file: toRepoPath(repoRoot, strictProcess), message: `Strict process missing ${term}.` });
    }
  }
}

function validateRequiredArray(
  value: Record<string, unknown>,
  key: string,
  file: string,
  repoRoot: string,
  errors: PdosValidationIssue[]
): void {
  if (!Array.isArray(value[key]) || value[key].length === 0) {
    errors.push({ file: toRepoPath(repoRoot, file), message: `Recipe must contain non-empty ${key} array.` });
  }
}

function validateNumberRange(
  value: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
  file: string,
  repoRoot: string,
  errors: PdosValidationIssue[]
): void {
  const candidate = value[key];
  if (typeof candidate !== "number" || !Number.isInteger(candidate) || candidate < min || candidate > max) {
    errors.push({ file: toRepoPath(repoRoot, file), message: `${key} must be an integer from ${min} to ${max}.` });
  }
}

function readJsonFile(file: string, repoRoot: string, errors: PdosValidationIssue[]): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JSON parse failure.";
    errors.push({ file: toRepoPath(repoRoot, file), message });
    return undefined;
  }
}

function toRepoPath(repoRoot: string, file: string): string {
  return relative(repoRoot, file).replace(/\\/g, "/");
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedArray(value: Record<string, unknown>, path: readonly string[]): readonly unknown[] {
  let current: unknown = value;

  for (const key of path) {
    if (!isRecord(current)) {
      return [];
    }
    current = current[key];
  }

  return Array.isArray(current) ? current : [];
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : "";

if (invokedFile === currentFile) {
  const report = validateProductDesignOs();
  console.log(formatPdosValidationReport(report));

  if (!report.ok) {
    process.exit(1);
  }
}
