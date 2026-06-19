import type { IssueLedgerEntry } from "./ledgers";

/**
 * Lessons digest (mesh-map gaps G6/G7). The architecture names a "Memory + Optimization
 * + Lessons" layer that, in code, only stored and validated. This turns recorded
 * lessons (issue ledger `lesson_learned` + design `rule_updates`) into a compact,
 * routable digest that an agent packet can carry as `must_read` — without an optimizer
 * and without raw content.
 */

export interface DesignFeedbackEntry {
  readonly date?: string;
  readonly project?: string;
  readonly area?: string;
  readonly problem?: string;
  readonly raw_feedback_summary?: string;
  readonly rule_updates?: readonly string[];
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
  readonly ref: string;
}

export interface LessonsDigest {
  readonly project: string | null;
  readonly total: number;
  readonly by_source: Record<LessonSource, number>;
  readonly lessons: readonly Lesson[];
  readonly report_markdown: string;
}

export function buildLessonsDigest(input: LessonsDigestInput): LessonsDigest {
  const fromFeedback = (input.feedback ?? [])
    .filter((entry) => !input.project || entry.project === input.project)
    .map(toFeedbackLesson);
  const fromIssues = (input.issues ?? []).map(toIssueLesson);

  const lessons = [...fromFeedback, ...fromIssues].sort(
    (left, right) => right.date.localeCompare(left.date) || left.source.localeCompare(right.source)
  );

  const digest = {
    project: input.project ?? null,
    total: lessons.length,
    by_source: {
      design_feedback: fromFeedback.length,
      issue_ledger: fromIssues.length
    } as Record<LessonSource, number>,
    lessons
  };

  return { ...digest, report_markdown: renderMarkdown(digest) };
}

function toFeedbackLesson(entry: DesignFeedbackEntry): Lesson {
  return {
    source: "design_feedback",
    area: entry.area ?? entry.problem ?? "design",
    date: entry.date ?? "",
    summary: entry.raw_feedback_summary ?? entry.problem ?? "",
    actions: entry.rule_updates ?? [],
    ref: entry.project ?? "design-feedback"
  };
}

function toIssueLesson(entry: IssueLedgerEntry): Lesson {
  return {
    source: "issue_ledger",
    area: entry.related_agent,
    date: dateFromId(entry.issue_id),
    summary: `${entry.description} (severity: ${entry.severity}, status: ${entry.status})`,
    actions: entry.lesson_learned ? [entry.lesson_learned] : [],
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
    `- Lessons: ${digest.total} (design_feedback: ${digest.by_source.design_feedback}, issue_ledger: ${digest.by_source.issue_ledger})`
  ];

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
    lines.push("", `### ${lesson.area}${lesson.date ? ` — ${lesson.date}` : ""} (${lesson.ref})`, lesson.summary);
    for (const action of lesson.actions) {
      lines.push(`- ${action}`);
    }
  }
}
