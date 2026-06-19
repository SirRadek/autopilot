import { describe, expect, it } from "vitest";

import { collectApprovalEvidenceErrors } from "../scripts/validate-prompt-library";

const fullEvidence = [
  {
    eval: "05-evaluation/test-inputs.md",
    status: "passed",
    last_run: "2026-06-19",
    accepted_by: "owner",
    regression_passed: true
  }
];

describe("prompt eval-result gate (G3)", () => {
  it("does not constrain candidate prompts", () => {
    expect(collectApprovalEvidenceErrors({ status: "candidate" })).toEqual([]);
  });

  it("rejects approved without any recorded eval results", () => {
    expect(collectApprovalEvidenceErrors({ status: "approved" })).toEqual([
      "Approved prompt has no recorded eval_results (needs executed + passed + human-accepted + regression)."
    ]);
  });

  it("accepts approved with full machine evidence", () => {
    expect(collectApprovalEvidenceErrors({ status: "approved", eval_results: fullEvidence })).toEqual([]);
  });

  it("rejects approved missing regression evidence", () => {
    const results = [{ ...fullEvidence[0], regression_passed: false }];
    expect(collectApprovalEvidenceErrors({ status: "approved", eval_results: results })).toContain(
      "Approved prompt: no regression_passed eval result."
    );
  });

  it("rejects approved missing human acceptance", () => {
    const results = [{ eval: "x", status: "passed", last_run: "2026-06-19", regression_passed: true }];
    expect(collectApprovalEvidenceErrors({ status: "approved", eval_results: results })).toContain(
      "Approved prompt: no human-accepted eval result (accepted_by)."
    );
  });

  it("rejects approved whose only eval result failed", () => {
    const results = [
      { eval: "x", status: "failed", last_run: "2026-06-19", accepted_by: "owner", regression_passed: true }
    ];
    expect(collectApprovalEvidenceErrors({ status: "approved", eval_results: results })).toContain(
      "Approved prompt: no passing eval result recorded."
    );
  });
});
