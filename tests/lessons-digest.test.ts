import assert from 'node:assert/strict'
import test from 'node:test'

import { buildLessonsDigest } from '@/lib/lessons-digest'
import type { IssueLedgerEntry } from '@/lib/issue-ledger'
import { buildLessonsDigestFromFiles } from '../scripts/lessons-digest'

const issue: IssueLedgerEntry = {
  issue_id: '2026-06-19-example',
  severity: 'major',
  found_by: 'review',
  related_agent: 'dispatch',
  description: 'empty prompt reached a vendor',
  expected: 'prompt is present',
  actual: 'prompt was empty',
  decision: 'add guard',
  fix_owner: 'owner',
  status: 'resolved',
  lesson_learned: 'never dispatch an empty prompt'
}

test('normalizes issue lessons and design feedback into one digest', () => {
  const digest = buildLessonsDigest({
    feedback: [
      {
        date: '2026-05-31',
        project: 'radeq',
        area: 'homepage_variants',
        raw_feedback_summary: 'variants only changed color',
        rule_updates: ['require structurally distinct directions']
      }
    ],
    issues: [issue]
  })

  assert.equal(digest.total, 2)
  assert.deepEqual(digest.by_source, { design_feedback: 1, issue_ledger: 1 })
  const issueLesson = digest.lessons.find((lesson) => lesson.source === 'issue_ledger')
  assert.ok(issueLesson?.actions.includes('never dispatch an empty prompt'))
  assert.equal(issueLesson?.date, '2026-06-19')
})

test('filters design feedback by project but keeps control-plane issue lessons', () => {
  const digest = buildLessonsDigest({
    project: 'other',
    feedback: [{ project: 'radeq', area: 'x', rule_updates: ['a'] }],
    issues: [issue]
  })
  assert.equal(digest.by_source.design_feedback, 0)
  assert.equal(digest.by_source.issue_ledger, 1)
})

test('aggregates by fixed failure taxonomy and flags unknown tags', () => {
  const tagged = { ...issue, failure_tags: ['missing_context', 'not_a_real_category'] }
  const digest = buildLessonsDigest({ issues: [tagged] })
  assert.equal(digest.by_category.missing_context, 1)
  assert.equal(digest.uncategorized, 0)
  assert.ok(digest.unknown_tags.includes('not_a_real_category'))
})

test('counts an untagged lesson as uncategorized', () => {
  const digest = buildLessonsDigest({ issues: [issue] })
  assert.equal(digest.uncategorized, 1)
  assert.equal(Object.keys(digest.by_category).length, 0)
})

test('renders a compact Markdown digest', () => {
  const digest = buildLessonsDigest({ issues: [issue] })
  assert.match(digest.report_markdown, /# Lessons Digest/)
  assert.match(digest.report_markdown, /never dispatch an empty prompt/)
})

test('reads the committed issues store and validates every line', () => {
  const digest = buildLessonsDigestFromFiles(process.cwd())
  assert.ok(digest.by_source.issue_ledger > 0)
  assert.match(digest.report_markdown, /# Lessons Digest/)
})
