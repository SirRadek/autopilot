import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildUsageDashboard,
  type ProviderTarget,
  type UsageDashboard
} from "../src/data/delivery-system/usageDashboard";
import type { ProviderBudget, UsageLedgerEntry } from "../src/data/delivery-system/usageLedger";
import { validateProviderBudget, validateUsageLedgerEntry } from "../src/lib/delivery-system/usageLedger";

/** Starting-point target work-share (owner §11 split; tune from the ledger over time). */
const DEFAULT_TARGETS: readonly ProviderTarget[] = [
  { provider: "anthropic", share: 0.375 },
  { provider: "openai", share: 0.45 },
  { provider: "google_antigravity", share: 0.175 }
];

export interface UsageDashboardCliOptions {
  readonly ledgerPath?: string;
  readonly budgetPath?: string;
  readonly project?: string;
  readonly phase?: string;
}

export function renderUsageDashboardFromFiles(
  repoRoot: string,
  options: UsageDashboardCliOptions = {}
): UsageDashboard {
  const ledgerPath = options.ledgerPath ?? resolveFirst(repoRoot, [
    ".agent/usage/usage-ledger.jsonl",
    ".agent/usage/usage-ledger.example.jsonl"
  ]);
  const budgetPath = options.budgetPath ?? resolveFirst(repoRoot, [
    ".agent/usage/provider-budget.json",
    ".agent/usage/provider-budget.example.json"
  ]);

  const entries = readLedger(ledgerPath).filter(
    (entry) => (!options.project || entry.project === options.project) && (!options.phase || entry.phase === options.phase)
  );
  const budgets = budgetPath ? readBudgets(budgetPath) : [];

  return buildUsageDashboard({
    project: options.project ?? entries[0]?.project ?? "(unknown)",
    ...(options.phase ? { phase: options.phase } : {}),
    entries,
    budgets,
    targets: DEFAULT_TARGETS
  });
}

function readLedger(path: string | undefined): UsageLedgerEntry[] {
  if (!path || !existsSync(path)) {
    return [];
  }

  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .flatMap((line, index) => {
      const parsed = parseJson(line, `${path}:${index + 1}`);
      const result = validateUsageLedgerEntry(parsed);
      if (!result.valid) {
        process.stderr.write(`Skipping invalid ledger line ${index + 1}: ${result.errors.join("; ")}\n`);
        return [];
      }
      return [parsed as UsageLedgerEntry];
    });
}

function readBudgets(path: string): ProviderBudget[] {
  if (!existsSync(path)) {
    return [];
  }

  const parsed = parseJson(readFileSync(path, "utf8"), path);
  const list = Array.isArray(parsed) ? parsed : [parsed];
  return list.flatMap((candidate) => {
    const result = validateProviderBudget(candidate);
    if (!result.valid) {
      process.stderr.write(`Skipping invalid provider budget: ${result.errors.join("; ")}\n`);
      return [];
    }
    return [candidate as ProviderBudget];
  });
}

function resolveFirst(repoRoot: string, candidates: readonly string[]): string | undefined {
  for (const candidate of candidates) {
    const full = join(repoRoot, candidate);
    if (existsSync(full)) {
      return full;
    }
  }
  return undefined;
}

function parseJson(text: string, where: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid JSON";
    throw new Error(`Failed to parse ${where}: ${message}`);
  }
}

function parseArgs(args: readonly string[]): UsageDashboardCliOptions & { format?: "json" | "markdown" } {
  const result: {
    project?: string;
    phase?: string;
    ledgerPath?: string;
    budgetPath?: string;
    format?: "json" | "markdown";
  } = {};
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index + 1];
    switch (args[index]) {
      case "--project":
        if (value) result.project = value;
        index += 1;
        break;
      case "--phase":
        if (value) result.phase = value;
        index += 1;
        break;
      case "--ledger":
        if (value) result.ledgerPath = value;
        index += 1;
        break;
      case "--budget":
        if (value) result.budgetPath = value;
        index += 1;
        break;
      case "--format":
        if (value === "json" || value === "markdown") result.format = value;
        index += 1;
        break;
      default:
        break;
    }
  }
  return result;
}

function runCli(): void {
  const args = parseArgs(process.argv.slice(2));
  const dashboard = renderUsageDashboardFromFiles(process.cwd(), args);
  if (args.format === "json") {
    const { report_markdown: _markdown, ...rest } = dashboard;
    process.stdout.write(`${JSON.stringify(rest, null, 2)}\n`);
  } else {
    process.stdout.write(`${dashboard.report_markdown.trimEnd()}\n`);
  }
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : "";

if (basename(invokedFile) === basename(currentFile) && invokedFile === currentFile) {
  runCli();
}
