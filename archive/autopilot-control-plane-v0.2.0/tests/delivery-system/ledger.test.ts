import { describe, expect, it } from "vitest";

import {
  validateDecisionLedgerEntry,
  validateIssueLedgerEntry
} from "../../src/lib/delivery-system/ledger";

describe("delivery system ledger contracts", () => {
  it("validates decision ledger mandatory fields", () => {
    expect(
      validateDecisionLedgerEntry({
        decision_id: "2026-05-13-runtime-package-typed-contracts",
        type: "architecture",
        context: "Typed contracts are needed before runtime execution.",
        decision: "Add TypeScript contract validators.",
        reasoning: "Pure typed checks reduce governance ambiguity.",
        alternatives: ["Markdown-only", "UI first"],
        impact: "Task 3 and Task 4 can proceed.",
        approved_by: "supervisor",
        related_tasks: ["Task 3", "Task 4"]
      })
    ).toEqual({ valid: true, errors: [] });

    expect(validateDecisionLedgerEntry({ decision_id: "missing-fields" })).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([
        "type is required",
        "context is required",
        "decision is required",
        "reasoning is required",
        "alternatives is required",
        "impact is required",
        "approved_by is required",
        "related_tasks is required"
      ])
    });
  });

  it("validates issue ledger mandatory fields", () => {
    expect(
      validateIssueLedgerEntry({
        issue_id: "2026-05-13-snapshot-dry-run-gap",
        severity: "minor",
        found_by: "supervisor",
        related_agent: "connector-snapshot-procedure",
        description: "Only local and GitHub snapshots were collected.",
        expected: "Every connector snapshot type is eventually dry-run.",
        actual: "Linear, Vercel, Cloudflare, and Docket were not collected.",
        decision: "Accept as local/GitHub dry run only.",
        fix_owner: "supervisor",
        status: "open",
        lesson_learned: "Snapshot scope must name uncollected connectors."
      })
    ).toEqual({ valid: true, errors: [] });

    expect(validateIssueLedgerEntry({ issue_id: "missing-fields" })).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([
        "severity is required",
        "found_by is required",
        "related_agent is required",
        "description is required",
        "expected is required",
        "actual is required",
        "decision is required",
        "fix_owner is required",
        "status is required",
        "lesson_learned is required"
      ])
    });
  });
});
