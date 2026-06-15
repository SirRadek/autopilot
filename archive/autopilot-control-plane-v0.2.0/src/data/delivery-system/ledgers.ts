export const requiredDecisionLedgerFields = [
  "decision_id",
  "type",
  "context",
  "decision",
  "reasoning",
  "alternatives",
  "impact",
  "approved_by",
  "related_tasks"
] as const;

export const requiredIssueLedgerFields = [
  "issue_id",
  "severity",
  "found_by",
  "related_agent",
  "description",
  "expected",
  "actual",
  "decision",
  "fix_owner",
  "status",
  "lesson_learned"
] as const;

export interface DecisionLedgerEntry {
  decision_id: string;
  type: string;
  context: string;
  decision: string;
  reasoning: string;
  alternatives: readonly string[];
  impact: string;
  approved_by: string;
  related_tasks: readonly string[];
}

export interface IssueLedgerEntry {
  issue_id: string;
  severity: string;
  found_by: string;
  related_agent: string;
  description: string;
  expected: string;
  actual: string;
  decision: string;
  fix_owner: string;
  status: string;
  lesson_learned: string;
}
