import { describe, expect, it } from "vitest";

import {
  canApproveDelivery,
  canApproveWork,
  canChangeBusinessScope,
  evaluateGateSeverity,
  validateGateResult
} from "../../src/lib/delivery-system/governance";

describe("delivery system governance contracts", () => {
  it("prevents implementers from approving their own work", () => {
    expect(
      canApproveWork({
        reviewerRoleId: "backend-agent",
        authorRoleId: "backend-agent"
      })
    ).toBe(false);

    expect(
      canApproveWork({
        reviewerRoleId: "code-reviewer",
        authorRoleId: "backend-agent"
      })
    ).toBe(true);
  });

  it("prevents testers from changing business scope", () => {
    expect(canChangeBusinessScope("tester")).toBe(false);
    expect(canChangeBusinessScope("scope-guardian")).toBe(true);
  });

  it("prevents Autopilot from approving delivery", () => {
    expect(canApproveDelivery("autopilot-supervisor")).toBe(false);
    expect(canApproveDelivery("governance-officer")).toBe(true);
  });

  it("maps gate severity to the required next action", () => {
    expect(evaluateGateSeverity("blocker")).toMatchObject({
      status: "rework",
      next_action: "return_to_rework"
    });
    expect(evaluateGateSeverity("major")).toMatchObject({
      status: "rework",
      next_action: "return_to_rework"
    });
    expect(evaluateGateSeverity("minor")).toMatchObject({
      status: "rework",
      next_action: "add_inline_fix_evidence"
    });
    expect(evaluateGateSeverity("minor", { inlineFixEvidence: true })).toMatchObject({
      status: "pass_with_notes",
      next_action: "inline_fix_with_evidence"
    });
    expect(evaluateGateSeverity("cosmetic")).toMatchObject({
      status: "pass_with_notes",
      next_action: "record_note"
    });
    expect(evaluateGateSeverity("pass")).toMatchObject({
      status: "pass",
      next_action: "continue"
    });
  });

  it("validates mandatory gate result fields", () => {
    expect(
      validateGateResult({
        status: "pass",
        checked_against: ["architecture"],
        issues: [],
        decision_reason: "All required gates passed.",
        next_action: "continue"
      })
    ).toEqual({ valid: true, errors: [] });

    expect(validateGateResult({ status: "pass" })).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([
        "checked_against is required",
        "issues is required",
        "decision_reason is required",
        "next_action is required"
      ])
    });
  });
});
