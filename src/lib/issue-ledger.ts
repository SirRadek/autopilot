import { validateRequiredFields, type ValidationResult } from './governance-validation'

// Redacted issue-ledger entry: what went wrong, the decision, and the lesson learned.
// Optional `failure_tags` classify the failure against the fixed taxonomy.

export const requiredIssueLedgerFields = [
  'issue_id',
  'severity',
  'found_by',
  'related_agent',
  'description',
  'expected',
  'actual',
  'decision',
  'fix_owner',
  'status',
  'lesson_learned'
] as const

export interface IssueLedgerEntry {
  issue_id: string
  severity: string
  found_by: string
  related_agent: string
  description: string
  expected: string
  actual: string
  decision: string
  fix_owner: string
  status: string
  lesson_learned: string
  failure_tags?: readonly string[]
}

export function validateIssueLedgerEntry(value: unknown): ValidationResult {
  return validateRequiredFields(value, requiredIssueLedgerFields)
}
