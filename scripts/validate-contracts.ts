import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { isRecord, validateJsonSchema } from "../src/lib/delivery-system/validation";

export interface ContractsValidationIssue {
  readonly file: string;
  readonly message: string;
}

export interface ContractsValidationReport {
  readonly ok: boolean;
  readonly checkedFiles: readonly string[];
  readonly errors: readonly ContractsValidationIssue[];
}

export const REQUIRED_CONTRACT_SCHEMA_FILES = [
  "task-capsule.schema.json",
  "evidence-pack.schema.json",
  "agent-output.schema.json",
  "review-report.schema.json",
  "completion-evidence.schema.json"
] as const;

type ContractSchemaFile = (typeof REQUIRED_CONTRACT_SCHEMA_FILES)[number];

const EXPECTED_REQUIRED_FIELDS: Record<ContractSchemaFile, readonly string[]> = {
  "task-capsule.schema.json": [
    "contract_version",
    "task_id",
    "project",
    "scope",
    "source_pointers",
    "checks",
    "risks",
    "impacts",
    "verification",
    "status"
  ],
  "evidence-pack.schema.json": [
    "contract_version",
    "evidence_pack_id",
    "task_id",
    "project",
    "scope",
    "source_pointers",
    "checks",
    "artifacts",
    "risks",
    "impacts",
    "verification",
    "status"
  ],
  "agent-output.schema.json": [
    "contract_version",
    "agent_output_id",
    "task_id",
    "project",
    "agent",
    "scope",
    "source_pointers",
    "findings",
    "checks",
    "risks",
    "impacts",
    "verification",
    "final_status"
  ],
  "review-report.schema.json": [
    "contract_version",
    "review_report_id",
    "task_id",
    "project",
    "reviewer",
    "scope",
    "source_pointers",
    "findings",
    "required_changes",
    "checks",
    "risks",
    "impacts",
    "verification",
    "final_status"
  ],
  "completion-evidence.schema.json": [
    "contract_version",
    "completion_evidence_id",
    "task_id",
    "project",
    "scope",
    "source_pointers",
    "checks",
    "risks",
    "impacts",
    "verification",
    "final_status"
  ]
};

const SAMPLE_BY_SCHEMA: Record<ContractSchemaFile, Record<string, unknown>> = {
  "task-capsule.schema.json": {
    contract_version: "v0.1",
    task_id: "phase-0-contracts",
    project: {
      slug: "autopilot-control-plane",
      name: "Autopilot Control Plane",
      control_plane: true
    },
    scope: {
      summary: "Add deterministic evidence and completion contract validation.",
      allowed_paths: ["docs/contracts/*.schema.json", "scripts/validate-contracts.ts"],
      forbidden_paths: ["mesh/**", "docs/projects/**"],
      non_goals: ["runtime queue", "remote mutation path"]
    },
    source_pointers: ["AGENTS.md", "src/lib/delivery-system/validation.ts"],
    checks: ["npm.cmd run contracts:validate"],
    risks: ["Schema drift"],
    impacts: ["Delivery validation"],
    verification: {
      required_commands: ["npm.cmd run contracts:validate"],
      acceptance_criteria: ["Required schemas validate positive and negative fixtures."]
    },
    status: "ready"
  },
  "evidence-pack.schema.json": {
    contract_version: "v0.1",
    evidence_pack_id: "phase-0-contracts-evidence",
    task_id: "phase-0-contracts",
    project: {
      slug: "autopilot-control-plane",
      name: "Autopilot Control Plane"
    },
    scope: {
      summary: "Evidence for deterministic contract validation."
    },
    source_pointers: ["docs/contracts/task-capsule.schema.json"],
    checks: [
      {
        name: "contracts validation",
        status: "passed",
        evidence: "npm.cmd run contracts:validate"
      }
    ],
    artifacts: ["docs/contracts/evidence-pack.schema.json"],
    risks: ["Fixture coverage is intentionally phase-0 scoped."],
    impacts: ["Delivery evidence"],
    verification: {
      summary: "Schema validates a representative evidence pack.",
      commands: ["npm.cmd run contracts:validate"]
    },
    status: "ready"
  },
  "agent-output.schema.json": {
    contract_version: "v0.1",
    agent_output_id: "phase-0-contracts-agent-output",
    task_id: "phase-0-contracts",
    project: {
      slug: "autopilot-control-plane",
      name: "Autopilot Control Plane"
    },
    agent: {
      role: "codex-worker",
      model_route: "deterministic_tools"
    },
    scope: {
      summary: "Owned contract validation files only.",
      allowed_paths: ["docs/contracts/*.schema.json", "scripts/validate-contracts.ts"],
      forbidden_paths: ["mesh/**"],
      non_goals: ["runtime enforcement"]
    },
    source_pointers: ["scripts/validate-contracts.ts"],
    findings: ["Schemas parse and validate representative fixtures."],
    checks: ["npm.cmd test -- contracts-validation"],
    risks: ["No runtime enforcement is added in phase 0."],
    impacts: ["Completion evidence can be validated deterministically."],
    verification: {
      summary: "Agent output shape validates.",
      evidence: ["positive fixture", "missing required field rejection"]
    },
    final_status: "needs_review"
  },
  "review-report.schema.json": {
    contract_version: "v0.1",
    review_report_id: "phase-0-contracts-review",
    task_id: "phase-0-contracts",
    project: {
      slug: "autopilot-control-plane",
      name: "Autopilot Control Plane"
    },
    reviewer: {
      role: "qa",
      review_type: "qa"
    },
    scope: {
      summary: "Review deterministic schema validation."
    },
    source_pointers: ["tests/delivery-system/contracts-validation.test.ts"],
    findings: ["Required fields are covered."],
    required_changes: [],
    checks: ["npm.cmd run contracts:validate"],
    risks: ["Deep schema dialect validation is out of scope."],
    impacts: ["Delivery validation"],
    verification: {
      summary: "Review report shape validates.",
      evidence: ["positive fixture", "negative fixture"]
    },
    final_status: "approved"
  },
  "completion-evidence.schema.json": {
    contract_version: "v0.1",
    completion_evidence_id: "phase-0-contracts-completion",
    task_id: "phase-0-contracts",
    project: {
      slug: "autopilot-control-plane",
      name: "Autopilot Control Plane"
    },
    scope: {
      summary: "Phase 0 evidence and completion contracts."
    },
    source_pointers: ["docs/contracts/completion-evidence.schema.json"],
    checks: [
      {
        name: "contracts validation",
        status: "passed",
        evidence: "npm.cmd run contracts:validate"
      }
    ],
    risks: ["Phase-0 schemas are intentionally pragmatic."],
    impacts: ["Completion reporting"],
    verification: {
      summary: "Completion evidence shape validates.",
      commands: ["npm.cmd run contracts:validate"],
      residual_risks: ["Does not validate live delivery state."]
    },
    final_status: "complete"
  }
};

export function validateContracts(repoRoot = process.cwd()): ContractsValidationReport {
  const contractsRoot = join(repoRoot, "docs", "contracts");
  const checkedFiles: string[] = [];
  const errors: ContractsValidationIssue[] = [];

  if (!existsSync(contractsRoot)) {
    return {
      ok: false,
      checkedFiles,
      errors: [{ file: "docs/contracts", message: "Contracts root does not exist." }]
    };
  }

  for (const schemaFile of REQUIRED_CONTRACT_SCHEMA_FILES) {
    const absolutePath = join(contractsRoot, schemaFile);
    checkedFiles.push(toRepoPath(repoRoot, absolutePath));

    if (!existsSync(absolutePath)) {
      errors.push({ file: toRepoPath(repoRoot, absolutePath), message: "Required schema file is missing." });
      continue;
    }

    const schema = readJsonFile(absolutePath, repoRoot, errors);
    if (!isRecord(schema)) {
      continue;
    }

    validateSchemaShape(schemaFile, schema, absolutePath, repoRoot, errors);
    validatePositiveSample(schemaFile, schema, absolutePath, repoRoot, errors);
    validateMissingRequiredFields(schemaFile, schema, absolutePath, repoRoot, errors);
  }

  return {
    ok: errors.length === 0,
    checkedFiles: [...new Set(checkedFiles)].sort(),
    errors
  };
}

export function formatContractsValidationReport(report: ContractsValidationReport): string {
  const lines = [
    report.ok ? "Contracts validation passed." : "Contracts validation failed.",
    `Checked files: ${report.checkedFiles.length}`,
    `Errors: ${report.errors.length}`
  ];

  if (report.errors.length > 0) {
    lines.push("", "Errors:");
    lines.push(...report.errors.map((issue) => `- ${issue.file}: ${issue.message}`));
  }

  return lines.join("\n");
}

function validateSchemaShape(
  schemaFile: ContractSchemaFile,
  schema: Record<string, unknown>,
  file: string,
  repoRoot: string,
  errors: ContractsValidationIssue[]
): void {
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    errors.push({ file: toRepoPath(repoRoot, file), message: "Schema must declare draft 2020-12." });
  }

  if (typeof schema.$id !== "string" || !schema.$id.endsWith(`/contracts/${schemaFile}`)) {
    errors.push({ file: toRepoPath(repoRoot, file), message: "Schema $id must match its contract filename." });
  }

  if (typeof schema.title !== "string" || schema.title.length === 0) {
    errors.push({ file: toRepoPath(repoRoot, file), message: "Schema must contain a title." });
  }

  if (schema.type !== "object") {
    errors.push({ file: toRepoPath(repoRoot, file), message: "Schema root type must be object." });
  }

  if (schema.additionalProperties !== false) {
    errors.push({ file: toRepoPath(repoRoot, file), message: "Schema root must disallow additional properties." });
  }

  if (!isRecord(schema.properties)) {
    errors.push({ file: toRepoPath(repoRoot, file), message: "Schema must define properties." });
  }

  const required = getStringArray(schema.required);
  for (const field of EXPECTED_REQUIRED_FIELDS[schemaFile]) {
    if (!required.includes(field)) {
      errors.push({ file: toRepoPath(repoRoot, file), message: `Schema must require ${field}.` });
    }
  }
}

function validatePositiveSample(
  schemaFile: ContractSchemaFile,
  schema: Record<string, unknown>,
  file: string,
  repoRoot: string,
  errors: ContractsValidationIssue[]
): void {
  const sample = SAMPLE_BY_SCHEMA[schemaFile];
  for (const issue of validateJsonSchema(sample, schema)) {
    errors.push({
      file: toRepoPath(repoRoot, file),
      message: `Positive sample ${issue.path}: ${issue.message}`
    });
  }
}

function validateMissingRequiredFields(
  schemaFile: ContractSchemaFile,
  schema: Record<string, unknown>,
  file: string,
  repoRoot: string,
  errors: ContractsValidationIssue[]
): void {
  const sample = SAMPLE_BY_SCHEMA[schemaFile];

  for (const field of EXPECTED_REQUIRED_FIELDS[schemaFile]) {
    const negativeSample = { ...sample };
    delete negativeSample[field];
    const issues = validateJsonSchema(negativeSample, schema);
    const rejected = issues.some((issue) => issue.path === `$.${field}` && issue.message === "is required");

    if (!rejected) {
      errors.push({
        file: toRepoPath(repoRoot, file),
        message: `Schema did not reject missing required field: ${field}.`
      });
    }
  }
}

function readJsonFile(file: string, repoRoot: string, errors: ContractsValidationIssue[]): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JSON parse failure.";
    errors.push({ file: toRepoPath(repoRoot, file), message });
    return undefined;
  }
}

function getStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => typeof item === "string");
}

function toRepoPath(repoRoot: string, file: string): string {
  return relative(repoRoot, file).replace(/\\/g, "/");
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : "";

if (invokedFile === currentFile) {
  const report = validateContracts();
  console.log(formatContractsValidationReport(report));

  if (!report.ok) {
    process.exit(1);
  }
}
