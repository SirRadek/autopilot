import { describe, expect, it } from "vitest";

import { buildLessonsDigest } from "../../src/data/delivery-system/lessonsDigest";
import { buildLessonsDigestFromFiles } from "../../scripts/lessons-digest";
import type { IssueLedgerEntry } from "../../src/data/delivery-system/ledgers";

const issue: IssueLedgerEntry = {
  issue_id: "2026-06-19-example",
  severity: "major",
  found_by: "review",
  related_agent: "dispatch",
  description: "empty prompt reached a vendor",
  expected: "prompt is present",
  actual: "prompt was empty",
  decision: "add guard",
  fix_owner: "owner",
  status: "resolved",
  lesson_learned: "never dispatch an empty prompt"
};

describe("lessons digest", () => {
  it("normalizes issue lessons and design feedback into one digest", () => {
    const digest = buildLessonsDigest({
      feedback: [
        {
          date: "2026-05-31",
          project: "radeq",
          area: "homepage_variants",
          raw_feedback_summary: "variants only changed color",
          rule_updates: ["require structurally distinct directions"]
        }
      ],
      issues: [issue]
    });

    expect(digest.total).toBe(2);
    expect(digest.by_source).toEqual({ design_feedback: 1, issue_ledger: 1 });
    const issueLesson = digest.lessons.find((lesson) => lesson.source === "issue_ledger");
    expect(issueLesson?.actions).toContain("never dispatch an empty prompt");
    expect(issueLesson?.date).toBe("2026-06-19");
  });

  it("filters design feedback by project but keeps control-plane issue lessons", () => {
    const digest = buildLessonsDigest({
      project: "other",
      feedback: [{ project: "radeq", area: "x", rule_updates: ["a"] }],
      issues: [issue]
    });
    expect(digest.by_source.design_feedback).toBe(0);
    expect(digest.by_source.issue_ledger).toBe(1);
  });

  it("renders a compact Markdown digest", () => {
    const digest = buildLessonsDigest({ issues: [issue] });
    expect(digest.report_markdown).toContain("# Lessons Digest");
    expect(digest.report_markdown).toContain("never dispatch an empty prompt");
  });
});

describe("lessons digest CLI over committed sources", () => {
  it("reads the real feedback log + issues store without errors", () => {
    const digest = buildLessonsDigestFromFiles(process.cwd());
    expect(digest.total).toBeGreaterThan(0);
    expect(digest.by_source.issue_ledger).toBeGreaterThan(0);
    expect(digest.report_markdown).toContain("# Lessons Digest");
  });
});
