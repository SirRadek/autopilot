import assert from 'node:assert/strict'
import test from 'node:test'

import { extractUtm, leadToCMSData, validateLeadSubmission } from '@/lib/leads'

const completeLead = {
  name: 'Jan Siroky',
  email: 'JAN@EXAMPLE.COM',
  company: 'Example',
  project_type: 'Website',
  audience: 'Founders',
  deadline: 'Q3',
  current_url: 'https://example.com',
  budget_range: '50k-100k CZK',
  message: 'Need a website.',
  source_path: '/kontakt?utm_source=google&utm_campaign=lead#section',
  referrer: 'https://ads.example/private/path?click_id=secret#hash',
  locale: 'cs',
  honeypot: ''
}

test('validates and normalizes a public lead payload', () => {
  const result = validateLeadSubmission(completeLead)

  assert.equal(result.ok, true)
  if (!result.ok) return

  assert.equal(result.data.email, 'jan@example.com')
  assert.equal(result.data.source_path, '/kontakt')
  assert.equal(result.data.referrer, 'https://ads.example')
})

test('rejects missing required fields and honeypot submissions', () => {
  const result = validateLeadSubmission({
    ...completeLead,
    name: '',
    honeypot: 'bot'
  })

  assert.equal(result.ok, false)
  if (result.ok) return

  assert.ok(result.errors.includes('Missing required field: name'))
  assert.ok(result.errors.includes('Spam filter rejected this submission.'))
})

test('maps normalized leads to CMS field names', () => {
  const result = validateLeadSubmission(completeLead)
  assert.equal(result.ok, true)
  if (!result.ok) return

  const data = leadToCMSData(result.data, completeLead)

  assert.equal(data.projectType, 'Website')
  assert.equal(data.currentUrl, 'https://example.com')
  assert.equal(data.priority, 'high')
  assert.deepEqual(data.utm, {
    utm_campaign: 'lead',
    utm_source: 'google'
  })
})

test('maps correlation and idempotency metadata to CMS fields', () => {
  const rawLead = {
    ...completeLead,
    correlation_id: '11111111-1111-4111-8111-111111111111',
    idempotency_key: 'Lead:Jan@example.com'
  }
  const result = validateLeadSubmission(rawLead)
  assert.equal(result.ok, true)
  if (!result.ok) return

  const data = leadToCMSData(result.data, rawLead)

  assert.equal(data.correlationId, '11111111-1111-4111-8111-111111111111')
  assert.equal(data.idempotencyKey, 'lead:jan@example.com')
  assert.equal(data.dedupeKey, 'public_lead_api:lead:jan@example.com')
  assert.equal(data.projectSlug, 'clientops-cms')
})

test('creates a fallback idempotency key for public form double submits', () => {
  const result = validateLeadSubmission(completeLead)
  assert.equal(result.ok, true)
  if (!result.ok) return

  const first = leadToCMSData(result.data, completeLead)
  const second = leadToCMSData(result.data, completeLead)

  assert.equal(first.idempotencyKey, second.idempotencyKey)
  assert.equal(first.dedupeKey, second.dedupeKey)
})

test('extracts UTM values from source paths when present', () => {
  assert.deepEqual(extractUtm('/kontakt?utm_source=google&utm_medium=cpc&x=ignored'), {
    utm_medium: 'cpc',
    utm_source: 'google'
  })
})
