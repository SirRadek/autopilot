import assert from 'node:assert/strict'
import test from 'node:test'

import { buildUsageDashboard, type ProviderTarget } from '@/lib/usage-dashboard'
import type { UsageLedgerEntry } from '@/lib/usage-ledger'
import { renderUsageDashboardFromFiles } from '../scripts/usage-dashboard'

function entry(overrides: Partial<UsageLedgerEntry>): UsageLedgerEntry {
  return {
    date: '2026-06-19',
    project: 'demo',
    phase: 'brainstorm-1',
    lane: 'strategic',
    provider: 'anthropic',
    model: 'claude-opus-4-8',
    surface: 'web_ui',
    reasoning: 'high',
    context_level: 'wide',
    task_type: 'strategy',
    estimated_tokens: 1000,
    actual_tokens: null,
    quota_source: 'unknown',
    measurement_confidence: 'low',
    remaining_pct_before: null,
    remaining_pct_after: null,
    quality_score: 0.9,
    used_in_final_plan: true,
    ...overrides
  }
}

const targets: readonly ProviderTarget[] = [
  { provider: 'anthropic', share: 0.5 },
  { provider: 'openai', share: 0.5 }
]

test('computes work-share and deviation against target', () => {
  const dashboard = buildUsageDashboard({
    project: 'demo',
    targets,
    entries: [
      entry({ provider: 'anthropic', estimated_tokens: 8000 }),
      entry({ provider: 'openai', estimated_tokens: 2000, model: 'codex' })
    ]
  })

  const anthropic = dashboard.providers.find((provider) => provider.provider === 'anthropic')
  assert.ok(Math.abs((anthropic?.work_share_pct ?? 0) - 0.8) < 1e-9)
  assert.ok(Math.abs((anthropic?.deviation_pct ?? 0) - 0.3) < 1e-9)
  assert.equal(dashboard.total_estimated_tokens, 10000)
})

test('flags a provider that is over target (rebalance within fit)', () => {
  const dashboard = buildUsageDashboard({
    project: 'demo',
    targets,
    entries: [
      entry({ provider: 'anthropic', estimated_tokens: 9000 }),
      entry({ provider: 'openai', estimated_tokens: 1000, model: 'codex' })
    ]
  })
  assert.match(dashboard.corrections.join(' '), /anthropic.*over target.*within tasks that suit/i)
})

test('classifies a metered provider as red when capacity is low', () => {
  const dashboard = buildUsageDashboard({
    project: 'demo',
    entries: [
      entry({
        provider: 'google_antigravity',
        model: 'gemini-3.1-pro-high',
        surface: 'cli',
        measurement_confidence: 'high',
        remaining_pct_after: 0.1
      })
    ]
  })
  assert.equal(dashboard.providers[0]?.budget_state, 'red')
  assert.match(dashboard.corrections.join(' '), /capacity RED/i)
})

test('renders a Markdown dashboard with the traffic-light table', () => {
  const dashboard = buildUsageDashboard({ project: 'demo', entries: [entry({})] })
  assert.match(dashboard.report_markdown, /# AI Usage Dashboard/)
  assert.match(dashboard.report_markdown, /Work-share vs target & capacity/)
})

test('renders from the committed example ledger without errors', () => {
  const dashboard = renderUsageDashboardFromFiles(process.cwd())
  assert.ok(dashboard.total_runs > 0)
  assert.ok(dashboard.providers.length > 0)
  assert.match(dashboard.report_markdown, /# AI Usage Dashboard/)
})
