import {
  type GateDecision,
  type GateSeverity,
  type GateStatus,
  requiredGateResultFields
} from "../../data/delivery-system/gates";
import { type Permission, roleHasPermission } from "../../data/delivery-system/roles";
import { validateRequiredFields, type ValidationResult } from "./validation";

export interface ApprovalCheck {
  reviewerRoleId: string;
  authorRoleId: string;
  reviewerActorId?: string;
  authorActorId?: string;
  reviewKind?: ReviewKind;
}

export interface GateSeverityOptions {
  inlineFixEvidence?: boolean;
}

export type ReviewKind = "architecture" | "code" | "security" | "ux" | "scope" | "copy";

const reviewPermissions: Record<ReviewKind, readonly Permission[]> = {
  architecture: ["review_architecture"],
  code: ["review_code"],
  security: ["review_security"],
  ux: ["review_ux"],
  scope: ["change_business_scope"],
  copy: ["write_documentation"]
};

export function canApproveWork({
  reviewerRoleId,
  authorRoleId,
  reviewerActorId,
  authorActorId,
  reviewKind = "code"
}: ApprovalCheck): boolean {
  if (reviewerRoleId === authorRoleId) {
    return false;
  }

  if (!reviewerActorId || !authorActorId || reviewerActorId === authorActorId) {
    return false;
  }

  return reviewPermissions[reviewKind].some((permission) => roleHasPermission(reviewerRoleId, permission));
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
