import {
  type GateDecision,
  type GateSeverity,
  type GateStatus,
  requiredGateResultFields
} from "../../data/delivery-system/gates";
import { roleHasPermission } from "../../data/delivery-system/roles";
import { validateRequiredFields, type ValidationResult } from "./validation";

export interface ApprovalCheck {
  reviewerRoleId: string;
  authorRoleId: string;
}

export interface GateSeverityOptions {
  inlineFixEvidence?: boolean;
}

export function canApproveWork({ reviewerRoleId, authorRoleId }: ApprovalCheck): boolean {
  if (reviewerRoleId === authorRoleId) {
    return false;
  }

  return (
    roleHasPermission(reviewerRoleId, "approve_gate") ||
    roleHasPermission(reviewerRoleId, "review_code") ||
    roleHasPermission(reviewerRoleId, "review_security") ||
    roleHasPermission(reviewerRoleId, "review_architecture") ||
    roleHasPermission(reviewerRoleId, "review_ux")
  );
}

export function canChangeBusinessScope(roleId: string): boolean {
  return roleHasPermission(roleId, "change_business_scope");
}

export function canApproveDelivery(roleId: string): boolean {
  if (roleId === "autopilot-supervisor") {
    return false;
  }

  return roleHasPermission(roleId, "approve_delivery");
}

export function evaluateGateSeverity(
  severity: GateSeverity,
  options: GateSeverityOptions = {}
): GateDecision {
  if (severity === "minor" && options.inlineFixEvidence) {
    return {
      severity,
      status: "pass_with_notes",
      next_action: "inline_fix_with_evidence"
    };
  }

  const decisions: Record<GateSeverity, GateDecision> = {
    blocker: {
      severity,
      status: "rework",
      next_action: "return_to_rework"
    },
    major: {
      severity,
      status: "rework",
      next_action: "return_to_rework"
    },
    minor: {
      severity,
      status: "rework",
      next_action: "add_inline_fix_evidence"
    },
    cosmetic: {
      severity,
      status: "pass_with_notes",
      next_action: "record_note"
    },
    pass: {
      severity,
      status: "pass",
      next_action: "continue"
    }
  };

  return decisions[severity];
}

export function validateGateResult(value: unknown): ValidationResult {
  const result = validateRequiredFields(value, requiredGateResultFields, ["checked_against", "issues"]);

  if (!result.valid) {
    return result;
  }

  const status = (value as { status: unknown }).status;
  const allowedStatuses: readonly GateStatus[] = ["pass", "pass_with_notes", "rework", "rejected"];

  if (!allowedStatuses.includes(status as GateStatus)) {
    return {
      valid: false,
      errors: [`status must be one of ${allowedStatuses.join(", ")}`]
    };
  }

  return result;
}
