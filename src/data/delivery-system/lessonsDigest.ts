import { type FailureCategory, normalizeFailureTags } from "./failureTaxonomy";
import type { IssueLedgerEntry } from "./ledgers";

/**
 * Lessons digest (mesh-map gaps G6/G7). The architecture names a "Memory + Optimization
 * + Lessons" layer that, in code, only stored and validated. This turns recorded
 * lessons (issue ledger `lesson_learned` + design `rule_updates`) into a compact,
 * routable digest that an agent packet can carry as `must_read` — without an optimizer
 * and without raw content. Optional `failure_tags` add a fixed-taxonomy layer so the
 * digest aggregates on category counts, not anecdotes.
 */

export interface DesignFeedbackEntry {
  readonly date?: string;
  readonly project?: string;
  readonly area?: string;
  readonly problem?: string;
  readonly raw_feedback_summary?: string;
  readonly rule_updates?: readonly string[];
  readonly failure_tags?: readonly string[];
}

export interface LessonsDigestInput {
  readonly project?: string;
  readonly feedback?: readonly DesignFeedbackEntry[];
  readonly issues?: readonly IssueLedgerEntry[];
}

export type LessonSource = "design_feedback" | "issue_ledger";

export interface Lesson {
  readonly source: LessonSource;
  readonly area: string;
  readonly date: string;
  readonly summary: string;
  readonly actions: readonly string[];
  readonly categories: readonly FailureCategory[];
  readonly ref: string;
}

export interface LessonsDigest {
  readonly project: string | null;
  readonly total: number;
  readonly by_source: Record<LessonSource, number>;
  readonly by_category: Record<string, number>;
  readonly uncategorized: number;
  readonly unknown_tags: readonly string[];
  readonly lessons: readonly Lesson[];
  readonly report_markdown: string;
}

export function buildLessonsDigest(input: LessonsDigestInput): LessonsDigest {
  const unknownTags = new Set<string>();
  const fromFeedback = (input.feedback ?? [])
    .filter((entry) => !input.project || entry.project === input.project)
    .map((entry) => toFeedbackLesson(entry, unknownTags));
  const fromIssues = (input.issues ?? []).map((entry) => toIssueLesson(entry, unknownTags));

  const lessons = [...fromFeedback, ...fromIssues].sort(
    (left, right) => right.date.localeCompare(left.date) || left.source.localeCompare(right.source)
  );

  const byCategory: Record<string, number> = {};
  let uncategorized = 0;
  for (const lesson of lessons) {
    if (lesson.categories.length === 0) {
      uncategorized += 1;
    }
    for (const category of lesson.categories) {
      byCategory[category] = (byCategory[category] ?? 0) + 1;
    }
  }

  const digest = {
    project: input.project ?? null,
    total: lessons.length,
    by_source: { design_feedback: fromFeedback.length, issue_ledger: fromIssues.length } as Record<LessonSource, number>,
    by_category: byCategory,
    uncategorized,
    unknown_tags: [...unknownTags].sort(),
    lessons
  };

  return { ...digest, report_markdown: renderMarkdown(digest) };
}

function toFeedbackLesson(entry: DesignFeedbackEntry, unknownTags: Set<string>): Lesson {
  const { tags, unknown } = normalizeFailureTags(entry.failure_tags);
  unknown.forEach((tag) => unknownTags.add(tag));
  return {
    source: "design_feedback",
    area: entry.area ?? entry.problem ?? "design",
    date: entry.date ?? "",
    summary: entry.raw_feedback_summary ?? entry.problem ?? "",
    actions: entry.rule_updates ?? [],
    categories: tags,
    ref: entry.project ?? "design-feedback"
  };
}

function toIssueLesson(entry: IssueLedgerEntry, unknownTags: Set<string>): Lesson {
  const { tags, unknown } = normalizeFailureTags((entry as { failure_tags?: unknown }).failure_tags);
  unknown.forEach((tag) => unknownTags.add(tag));
  return {
    source: "issue_ledger",
    area: entry.related_agent,
    date: dateFromId(entry.issue_id),
    summary: `${entry.description} (severity: ${entry.severity}, status: ${entry.status})`,
    actions: entry.lesson_learned ? [entry.lesson_learned] : [],
    categories: tags,
    ref: entry.issue_id
  };
}

/** Issue ledger entries carry no date field; recover it from a date-prefixed id. */
function dateFromId(issueId: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(issueId);
  return match?.[1] ?? "";
}

function renderMarkdown(digest: Omit<LessonsDigest, "report_markdown">): string {
  const lines = [
    "# Lessons Digest",
    "",
    `- Project: ${digest.project ?? "(all)"}`,
    `- Lessons: ${digest.total} (design_feedback: ${digest.by_source.design_feedback}, issue_ledger: ${digest.by_source.issue_ledger})`,
    "",
    "## By failure category"
  ];

  const categories = Object.entries(digest.by_category).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  if (categories.length === 0) {
    lines.push("", "- None tagged yet.");
  } else {
    for (const [category, count] of categories) {
      lines.push(`- ${category}: ${count}`);
    }
  }
  lines.push(`- uncategorized: ${digest.uncategorized}`);
  if (digest.unknown_tags.length > 0) {
    lines.push(`- ⚠ unknown tags (not in taxonomy): ${digest.unknown_tags.join(", ")}`);
  }

  appendSection(lines, "## Design feedback lessons", digest.lessons.filter((lesson) => lesson.source === "design_feedback"));
  appendSection(lines, "## Issue lessons", digest.lessons.filter((lesson) => lesson.source === "issue_ledger"));

  return lines.join("\n");
}

function appendSection(lines: string[], heading: string, lessons: readonly Lesson[]): void {
  lines.push("", heading);
  if (lessons.length === 0) {
    lines.push("", "- None recorded.");
    return;
  }
  for (const lesson of lessons) {
    const tags = lesson.categories.length > 0 ? ` [${lesson.categories.join(", ")}]` : "";
    lines.push("", `### ${lesson.area}${lesson.date ? ` — ${lesson.date}` : ""} (${lesson.ref})${tags}`, lesson.summary);
    for (const action of lesson.actions) {
      lines.push(`- ${action}`);
    }
  }
}
