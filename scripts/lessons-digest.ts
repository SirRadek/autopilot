import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { IssueLedgerEntry } from "../src/data/delivery-system/ledgers";
import {
  buildLessonsDigest,
  type DesignFeedbackEntry,
  type LessonsDigest
} from "../src/data/delivery-system/lessonsDigest";
import { validateIssueLedgerEntry } from "../src/lib/delivery-system/ledger";
import { isRecord } from "../src/lib/delivery-system/validation";

export interface LessonsDigestCliOptions {
  readonly project?: string;
  readonly feedbackPath?: string;
  readonly issuesPath?: string;
}

export function buildLessonsDigestFromFiles(repoRoot: string, options: LessonsDigestCliOptions = {}): LessonsDigest {
  const feedbackPath = options.feedbackPath ?? join(repoRoot, "product-design-os", "taste", "feedback-log.json");
  const issuesPath = options.issuesPath ?? join(repoRoot, ".agent", "lessons", "issues.jsonl");

  return buildLessonsDigest({
    ...(options.project ? { project: options.project } : {}),
    feedback: readFeedback(feedbackPath),
    issues: readIssues(issuesPath)
  });
}

function readFeedback(path: string): readonly DesignFeedbackEntry[] {
  if (!existsSync(path)) {
    return [];
  }
  const parsed = parseJson(readFileSync(path, "utf8"), path);
  if (!isRecord(parsed) || !Array.isArray(parsed.entries)) {
    return [];
  }
  return parsed.entries.filter(isRecord) as DesignFeedbackEntry[];
}

function readIssues(path: string): readonly IssueLedgerEntry[] {
  if (!existsSync(path)) {
    return [];
  }
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .flatMap((line, index) => {
      const parsed = parseJson(line, `${path}:${index + 1}`);
      const result = validateIssueLedgerEntry(parsed);
      if (!result.valid) {
        process.stderr.write(`Skipping invalid issue line ${index + 1}: ${result.errors.join("; ")}\n`);
        return [];
      }
      return [parsed as IssueLedgerEntry];
    });
}

function parseJson(text: string, where: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`Failed to parse ${where}: ${error instanceof Error ? error.message : "invalid JSON"}`);
  }
}

function parseArgs(args: readonly string[]): LessonsDigestCliOptions & { format?: "json" | "markdown" } {
  const result: { project?: string; feedbackPath?: string; issuesPath?: string; format?: "json" | "markdown" } = {};
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index + 1];
    switch (args[index]) {
      case "--project":
        if (value) result.project = value;
        index += 1;
        break;
      case "--feedback":
        if (value) result.feedbackPath = value;
        index += 1;
        break;
      case "--issues":
        if (value) result.issuesPath = value;
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
  const digest = buildLessonsDigestFromFiles(process.cwd(), args);
  if (args.format === "json") {
    const { report_markdown: _markdown, ...rest } = digest;
    process.stdout.write(`${JSON.stringify(rest, null, 2)}\n`);
  } else {
    process.stdout.write(`${digest.report_markdown.trimEnd()}\n`);
  }
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : "";

if (basename(invokedFile) === basename(currentFile) && invokedFile === currentFile) {
  runCli();
}
