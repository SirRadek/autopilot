export type LayerId =
  | "business"
  | "orchestrator"
  | "architecture"
  | "analysis"
  | "execution"
  | "testing"
  | "review"
  | "copywriting"
  | "governance"
  | "autopilot"
  | "memory";

export type Permission =
  | "plan_workflow"
  | "assign_work"
  | "implement_code"
  | "write_documentation"
  | "test_work"
  | "review_code"
  | "review_security"
  | "review_architecture"
  | "review_ux"
  | "approve_gate"
  | "approve_delivery"
  | "change_business_scope"
  | "monitor_runs"
  | "propose_recovery"
  | "record_memory";

export type ForbiddenAction =
  | "approve_own_work"
  | "bypass_governance"
  | "change_scope_without_evidence"
  | "approve_delivery"
  | "mutate_remote_without_approval"
  | "start_autonomous_execution";

export interface RoleContract {
  id: string;
  layer: LayerId;
  title: string;
  responsibilities: readonly string[];
  permissions: readonly Permission[];
  forbiddenActions: readonly ForbiddenAction[];
}

export const deliveryRoles = [
  {
    id: "business-analyst",
    layer: "business",
    title: "Business Analyst",
    responsibilities: ["translate requests into scoped tasks", "capture acceptance criteria"],
    permissions: ["change_business_scope"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "product-strategist",
    layer: "business",
    title: "Product Strategist",
    responsibilities: ["prioritize roadmap alignment", "validate user value"],
    permissions: ["change_business_scope"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "scope-guardian",
    layer: "business",
    title: "Scope Guardian",
    responsibilities: ["block scope drift", "require explicit scope decisions"],
    permissions: ["change_business_scope", "approve_gate"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "orchestrator",
    layer: "orchestrator",
    title: "Orchestrator",
    responsibilities: ["build dependency graph", "route bounded work", "coordinate rework"],
    permissions: ["plan_workflow", "assign_work"],
    forbiddenActions: [
      "approve_own_work",
      "bypass_governance",
      "change_scope_without_evidence",
      "mutate_remote_without_approval"
    ]
  },
  {
    id: "architect",
    layer: "architecture",
    title: "Architect",
    responsibilities: ["define system boundaries", "record architecture decisions"],
    permissions: ["review_architecture", "approve_gate"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "system-reviewer",
    layer: "architecture",
    title: "System Reviewer",
    responsibilities: ["review architecture compliance", "identify integration risks"],
    permissions: ["review_architecture", "approve_gate"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "integration-planner",
    layer: "architecture",
    title: "Integration Planner",
    responsibilities: ["map dependencies", "plan integration flow"],
    permissions: ["review_architecture"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "analysis-agent",
    layer: "analysis",
    title: "Analysis Agent",
    responsibilities: ["identify risks", "document assumptions and unknowns"],
    permissions: ["plan_workflow"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "backend-agent",
    layer: "execution",
    title: "Backend Agent",
    responsibilities: ["implement APIs", "implement services"],
    permissions: ["implement_code"],
    forbiddenActions: ["approve_own_work", "change_scope_without_evidence", "mutate_remote_without_approval"]
  },
  {
    id: "frontend-agent",
    layer: "execution",
    title: "Frontend/Web Agent",
    responsibilities: ["implement UI", "preserve frontend conventions"],
    permissions: ["implement_code"],
    forbiddenActions: ["approve_own_work", "change_scope_without_evidence", "mutate_remote_without_approval"]
  },
  {
    id: "design-agent",
    layer: "execution",
    title: "Design Agent",
    responsibilities: ["produce UI design artifacts", "support UX consistency"],
    permissions: ["implement_code"],
    forbiddenActions: ["approve_own_work", "change_scope_without_evidence", "mutate_remote_without_approval"]
  },
  {
    id: "infrastructure-agent",
    layer: "execution",
    title: "Infrastructure Agent",
    responsibilities: ["implement infrastructure after approval", "document operational risks"],
    permissions: ["implement_code"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval", "start_autonomous_execution"]
  },
  {
    id: "refactor-agent",
    layer: "execution",
    title: "Refactor Agent",
    responsibilities: ["perform bounded refactors", "preserve behavior"],
    permissions: ["implement_code"],
    forbiddenActions: ["approve_own_work", "change_scope_without_evidence", "mutate_remote_without_approval"]
  },
  {
    id: "documentation-agent",
    layer: "execution",
    title: "Documentation Agent",
    responsibilities: ["write technical documentation", "update handoff evidence"],
    permissions: ["write_documentation"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "tester",
    layer: "testing",
    title: "Tester",
    responsibilities: ["validate acceptance criteria", "report failures"],
    permissions: ["test_work"],
    forbiddenActions: ["approve_own_work", "change_scope_without_evidence", "mutate_remote_without_approval"]
  },
  {
    id: "regression-tester",
    layer: "testing",
    title: "Regression Tester",
    responsibilities: ["check regressions", "summarize failures"],
    permissions: ["test_work"],
    forbiddenActions: ["approve_own_work", "change_scope_without_evidence", "mutate_remote_without_approval"]
  },
  {
    id: "integration-tester",
    layer: "testing",
    title: "Integration Tester",
    responsibilities: ["validate integration flows", "report integration risks"],
    permissions: ["test_work"],
    forbiddenActions: ["approve_own_work", "change_scope_without_evidence", "mutate_remote_without_approval"]
  },
  {
    id: "e2e-tester",
    layer: "testing",
    title: "E2E Tester",
    responsibilities: ["validate end-to-end behavior", "record browser evidence"],
    permissions: ["test_work"],
    forbiddenActions: ["approve_own_work", "change_scope_without_evidence", "mutate_remote_without_approval"]
  },
  {
    id: "code-reviewer",
    layer: "review",
    title: "Code Reviewer",
    responsibilities: ["review implementation quality", "detect maintainability risks"],
    permissions: ["review_code", "approve_gate"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "security-reviewer",
    layer: "review",
    title: "Security Reviewer",
    responsibilities: ["review security impact", "detect secret and boundary risks"],
    permissions: ["review_security", "approve_gate"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "architecture-reviewer",
    layer: "review",
    title: "Architecture Reviewer",
    responsibilities: ["review architecture compliance", "require rework for drift"],
    permissions: ["review_architecture", "approve_gate"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "ux-reviewer",
    layer: "review",
    title: "UX Reviewer",
    responsibilities: ["review UX consistency", "detect content and flow regressions"],
    permissions: ["review_ux", "approve_gate"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "copywriter",
    layer: "copywriting",
    title: "Copywriter",
    responsibilities: ["write UI copy", "improve clarity"],
    permissions: ["write_documentation"],
    forbiddenActions: ["approve_own_work", "change_scope_without_evidence", "mutate_remote_without_approval"]
  },
  {
    id: "technical-writer",
    layer: "copywriting",
    title: "Technical Writer",
    responsibilities: ["write technical docs", "maintain terminology"],
    permissions: ["write_documentation"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "brand-voice-reviewer",
    layer: "copywriting",
    title: "Brand Voice Reviewer",
    responsibilities: ["review tone consistency", "check localization quality"],
    permissions: ["approve_gate"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "localization-reviewer",
    layer: "copywriting",
    title: "Localization Reviewer",
    responsibilities: ["review translations", "check accessibility language"],
    permissions: ["approve_gate"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  },
  {
    id: "governance-officer",
    layer: "governance",
    title: "Governance Officer",
    responsibilities: ["evaluate gates", "approve delivery only after independent evidence"],
    permissions: ["approve_gate", "approve_delivery"],
    forbiddenActions: ["approve_own_work", "bypass_governance", "mutate_remote_without_approval"]
  },
  {
    id: "autopilot-supervisor",
    layer: "autopilot",
    title: "Autopilot Supervisor",
    responsibilities: ["monitor runs", "detect failures", "propose recovery", "record incidents"],
    permissions: ["monitor_runs", "propose_recovery"],
    forbiddenActions: ["approve_delivery", "change_scope_without_evidence", "mutate_remote_without_approval"]
  },
  {
    id: "memory-curator",
    layer: "memory",
    title: "Memory Curator",
    responsibilities: ["summarize lessons", "maintain memory records"],
    permissions: ["record_memory", "write_documentation"],
    forbiddenActions: ["approve_own_work", "mutate_remote_without_approval"]
  }
] as const satisfies readonly RoleContract[];

export type RoleId = (typeof deliveryRoles)[number]["id"];

export function findRole(roleId: string): RoleContract | undefined {
  return deliveryRoles.find((role) => role.id === roleId);
}

export function roleHasPermission(roleId: string, permission: Permission): boolean {
  const role = findRole(roleId);
  return role ? role.permissions.includes(permission) : false;
}
