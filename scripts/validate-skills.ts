import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { isRecord } from "../src/lib/delivery-system/validation";

export interface SkillContract {
  readonly skill_id: string;
  readonly version: string;
  readonly required_steps: readonly string[];
  readonly forbidden_actions: readonly string[];
  readonly output_schema: string;
}

export interface AdapterManifest {
  readonly skill_id: string;
  readonly core_version: string;
  readonly step_tools: Record<string, string>;
  readonly forbidden_actions: readonly string[];
}

export interface SkillsValidationIssue {
  readonly file: string;
  readonly message: string;
}

export interface SkillsValidationReport {
  readonly ok: boolean;
  readonly checkedFiles: readonly string[];
  readonly errors: readonly SkillsValidationIssue[];
}

/** Governance phrases that belong in core, never in a thin adapter. */
const POLICY_PATTERNS: readonly { readonly label: string; readonly pattern: RegExp }[] = [
  { label: "source of truth", pattern: /\bsource of truth\b/i },
  { label: "stop condition", pattern: /\bstop conditions?\b/i },
  { label: "uppercase MUST", pattern: /\bMUST\b/ },
  { label: "uppercase NEVER", pattern: /\bNEVER\b/ }
];

/**
 * Pure drift check between a core skill contract and one provider adapter.
 * Returns a list of human-readable drift errors (empty = no drift).
 */
export function detectAdapterDrift(
  core: SkillContract,
  manifest: AdapterManifest,
  markdown: string
): string[] {
  const errors: string[] = [];

  if (manifest.skill_id !== core.skill_id) {
    errors.push(`skill_id mismatch: adapter "${manifest.skill_id}" vs core "${core.skill_id}"`);
  }

  if (manifest.core_version !== core.version) {
    errors.push(`core_version "${manifest.core_version}" does not match core version "${core.version}"`);
  }

  for (const step of core.required_steps) {
    const tool = manifest.step_tools?.[step];
    if (typeof tool !== "string" || tool.trim() === "") {
      errors.push(`required step not mapped to a tool: ${step}`);
    }
  }

  for (const action of core.forbidden_actions) {
    if (!manifest.forbidden_actions.includes(action)) {
      errors.push(`forbidden action not preserved: ${action}`);
    }
  }

  for (const { label, pattern } of POLICY_PATTERNS) {
    if (pattern.test(markdown)) {
      errors.push(`adapter restates governance language ("${label}"); policy must live in core only`);
    }
  }

  return errors;
}

export function validateSkills(repoRoot = process.cwd()): SkillsValidationReport {
  const coreRoot = join(repoRoot, ".agent", "skills-core");
  const adaptersRoot = join(repoRoot, ".agent", "adapters");
  const checkedFiles: string[] = [];
  const errors: SkillsValidationIssue[] = [];

  if (!existsSync(coreRoot)) {
    return { ok: true, checkedFiles, errors };
  }

  const contracts = new Map<string, SkillContract>();

  for (const skillDir of directories(coreRoot)) {
    const contractPath = join(skillDir, "contract.json");
    if (!existsSync(contractPath)) {
      errors.push({ file: toRepoPath(repoRoot, skillDir), message: "skill folder is missing contract.json" });
      continue;
    }
    checkedFiles.push(toRepoPath(repoRoot, contractPath));
    const contract = readContract(contractPath, repoRoot, errors);
    if (!contract) {
      continue;
    }

    const schemaPath = join(repoRoot, contract.output_schema);
    if (!existsSync(schemaPath)) {
      errors.push({ file: toRepoPath(repoRoot, contractPath), message: `output_schema not found: ${contract.output_schema}` });
    }

    contracts.set(contract.skill_id, contract);
  }

  const adaptersBySkill = new Map<string, number>();

  if (existsSync(adaptersRoot)) {
    for (const vendorDir of directories(adaptersRoot)) {
      for (const manifestPath of manifestsIn(vendorDir)) {
        checkedFiles.push(toRepoPath(repoRoot, manifestPath));
        const manifest = readManifest(manifestPath, repoRoot, errors);
        if (!manifest) {
          continue;
        }

        const core = contracts.get(manifest.skill_id);
        if (!core) {
          errors.push({ file: toRepoPath(repoRoot, manifestPath), message: `adapter references unknown core skill: ${manifest.skill_id}` });
          continue;
        }

        adaptersBySkill.set(manifest.skill_id, (adaptersBySkill.get(manifest.skill_id) ?? 0) + 1);

        const markdownPath = manifestPath.replace(/\.manifest\.json$/, ".md");
        if (!existsSync(markdownPath)) {
          errors.push({ file: toRepoPath(repoRoot, manifestPath), message: "adapter is missing its .md tool-mapping file" });
        }
        const markdown = existsSync(markdownPath) ? readFileSync(markdownPath, "utf8") : "";

        for (const message of detectAdapterDrift(core, manifest, markdown)) {
          errors.push({ file: toRepoPath(repoRoot, manifestPath), message });
        }
      }
    }
  }

  for (const skillId of contracts.keys()) {
    if (!adaptersBySkill.has(skillId)) {
      errors.push({ file: `.agent/skills-core/${skillId}`, message: "core skill has no provider adapter" });
    }
  }

  return { ok: errors.length === 0, checkedFiles: [...new Set(checkedFiles)].sort(), errors };
}

export function formatSkillsValidationReport(report: SkillsValidationReport): string {
  const lines = [
    report.ok ? "Skills validation passed." : "Skills validation failed.",
    `Checked files: ${report.checkedFiles.length}`,
    `Errors: ${report.errors.length}`
  ];
  if (report.errors.length > 0) {
    lines.push("", "Errors:", ...report.errors.map((issue) => `- ${issue.file}: ${issue.message}`));
  }
  return lines.join("\n");
}

function readContract(file: string, repoRoot: string, errors: SkillsValidationIssue[]): SkillContract | undefined {
  const value = readJson(file, repoRoot, errors);
  if (!isRecord(value)) {
    return undefined;
  }
  const ok =
    typeof value.skill_id === "string" &&
    typeof value.version === "string" &&
    isStringArray(value.required_steps) &&
    isStringArray(value.forbidden_actions) &&
    typeof value.output_schema === "string";
  if (!ok) {
    errors.push({ file: toRepoPath(repoRoot, file), message: "contract.json is missing required fields" });
    return undefined;
  }
  return value as unknown as SkillContract;
}

function readManifest(file: string, repoRoot: string, errors: SkillsValidationIssue[]): AdapterManifest | undefined {
  const value = readJson(file, repoRoot, errors);
  if (!isRecord(value)) {
    return undefined;
  }
  const ok =
    typeof value.skill_id === "string" &&
    typeof value.core_version === "string" &&
    isRecord(value.step_tools) &&
    isStringArray(value.forbidden_actions);
  if (!ok) {
    errors.push({ file: toRepoPath(repoRoot, file), message: "manifest is missing required fields" });
    return undefined;
  }
  return value as unknown as AdapterManifest;
}

function readJson(file: string, repoRoot: string, errors: SkillsValidationIssue[]): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch (error) {
    errors.push({ file: toRepoPath(repoRoot, file), message: error instanceof Error ? error.message : "invalid JSON" });
    return undefined;
  }
}

function directories(root: string): string[] {
  return readdirSync(root)
    .map((entry) => join(root, entry))
    .filter((path) => statSync(path).isDirectory());
}

function manifestsIn(dir: string): string[] {
  return readdirSync(dir)
    .filter((entry) => entry.endsWith(".manifest.json"))
    .map((entry) => join(dir, entry));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function toRepoPath(repoRoot: string, file: string): string {
  return relative(repoRoot, file).replace(/\\/g, "/");
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : "";

if (basename(invokedFile) === basename(currentFile) && invokedFile === currentFile) {
  const report = validateSkills();
  console.log(formatSkillsValidationReport(report));
  if (!report.ok) {
    process.exit(1);
  }
}
