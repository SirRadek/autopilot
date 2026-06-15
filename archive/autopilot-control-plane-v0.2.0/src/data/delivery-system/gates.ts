export type GateSeverity = "blocker" | "major" | "minor" | "cosmetic" | "pass";

export type GateStatus = "pass" | "pass_with_notes" | "rework" | "rejected";

export type GateNextAction =
  | "continue"
  | "return_to_rework"
  | "add_inline_fix_evidence"
  | "inline_fix_with_evidence"
  | "record_note";

export interface GateDecision {
  severity: GateSeverity;
  status: GateStatus;
  next_action: GateNextAction;
}

export interface GateResult {
  status: GateStatus;
  checked_against: readonly string[];
  issues: readonly string[];
  decision_reason: string;
  next_action: string;
}

export const requiredGateResultFields = [
  "status",
  "checked_against",
  "issues",
  "decision_reason",
  "next_action"
] as const;

export const governanceGates = [
  "architecture_compliance",
  "development_plan_alignment",
  "best_practices",
  "acceptance_criteria",
  "testing_status",
  "security_review",
  "scope_validation",
  "project_mesh_current"
] as const;
