import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'

import { BUDGET_GREEN_MIN, BUDGET_YELLOW_MIN, burnGovernancePolicy, classifyBudgetState } from '@/lib/model-spend'
import { validateProviderBudget, validateUsageLedgerEntry } from '@/lib/usage-ledger'

const validEntry = {
  date: '2026-06-19',
  project: 'clientops-cms',
  phase: 'brainstorm-1',
  lane: 'strategic',
  provider: 'anthropic',
  model: 'claude-opus-4-8',
  surface: 'web_ui',
  reasoning: 'high',
  context_level: 'wide',
  task_type: 'strategy_brainstorm',
  estimated_tokens: 42000,
  actual_tokens: null,
  quota_source: 'unknown',
  measurement_confidence: 'low',
  remaining_pct_before: null,
  remaining_pct_after: null,
  quality_score: 0.9,
  used_in_final_plan: true,
  notes: 'Best product framing.'
}

const validBudget = {
  provider: 'google_antigravity',
  surface: 'cli',
  period: 'per_5h',
  capacity_kind: 'messages',
  capacity_total: null,
  consumed: null,
  remaining: null,
  remaining_pct: 0.96,
  source: 'dashboard_manual',
  confidence: 'high',
  updated_at: '2026-06-19T08:00:00.000Z'
}

test('accepts a valid usage entry with nullable meters', () => {
  assert.deepEqual(validateUsageLedgerEntry(validEntry), { valid: true, errors: [] })
})

test('rejects an unknown surface', () => {
  const result = validateUsageLedgerEntry({ ...validEntry, surface: 'telepathy' })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('surface must be one of')))
})

test('rejects an out-of-range quality_score fraction', () => {
  const result = validateUsageLedgerEntry({ ...validEntry, quality_score: 9 })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('quality_score must be a 0..1 fraction')))
})

test('rejects a non-boolean used_in_final_plan', () => {
  const result = validateUsageLedgerEntry({ ...validEntry, used_in_final_plan: 'yes' })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('used_in_final_plan must be a boolean')))
})

test('accepts a valid provider budget snapshot', () => {
  assert.deepEqual(validateProviderBudget(validBudget), { valid: true, errors: [] })
})

test('rejects remaining_pct outside 0..1', () => {
  const result = validateProviderBudget({ ...validBudget, remaining_pct: 96 })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('remaining_pct must be a 0..1 fraction')))
})

test('burn-rate policy never equalizes (routes by suitability)', () => {
  assert.equal(burnGovernancePolicy.equalizeBurn, false)
  assert.equal(burnGovernancePolicy.routingOrder[0], 'eligibility')
})

test('classifies green/yellow/red by remaining fraction', () => {
  assert.equal(classifyBudgetState(0.9, 'high'), 'green')
  assert.equal(classifyBudgetState(BUDGET_GREEN_MIN, 'high'), 'green')
  assert.equal(classifyBudgetState(0.5, 'high'), 'yellow')
  assert.equal(classifyBudgetState(BUDGET_YELLOW_MIN, 'high'), 'yellow')
  assert.equal(classifyBudgetState(0.1, 'high'), 'red')
})

test('falls back to caution (yellow) when the meter is unknown', () => {
  assert.equal(classifyBudgetState(null, 'high'), 'yellow')
  assert.equal(classifyBudgetState(0.95, 'unknown'), 'yellow')
})

test('committed usage-ledger templates validate', () => {
  const root = join(process.cwd(), '.agent', 'usage')
  const lines = readFileSync(join(root, 'usage-ledger.example.jsonl'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
  assert.ok(lines.length > 0)
  for (const line of lines) {
    assert.deepEqual(validateUsageLedgerEntry(JSON.parse(line)), { valid: true, errors: [] })
  }

  const budgets = JSON.parse(readFileSync(join(root, 'provider-budget.example.json'), 'utf8'))
  for (const budget of budgets) {
    assert.deepEqual(validateProviderBudget(budget), { valid: true, errors: [] })
  }
})
