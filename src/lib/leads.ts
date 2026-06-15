import { createHash } from 'node:crypto'

import { createCorrelationId, normalizeIdempotencyKey, projectSlug } from '@/lib/mesh-contracts'

export interface LeadSubmission {
  name: string
  email: string
  company: string
  project_type: string
  audience: string
  deadline: string
  current_url: string
  budget_range: string
  message: string
  source_path: string
  referrer: string
  locale: string
  honeypot: string
  correlation_id: string
  idempotency_key: string
}

export type LeadBriefInput = Pick<
  LeadSubmission,
  'name' | 'email' | 'company' | 'project_type' | 'audience' | 'deadline' | 'current_url' | 'budget_range' | 'message'
>

export type LeadValidationResult =
  | { ok: true; data: LeadSubmission }
  | { ok: false; errors: string[] }

export const leadFieldLimits: Record<keyof LeadSubmission, number> = {
  name: 90,
  email: 160,
  company: 120,
  project_type: 120,
  audience: 180,
  deadline: 80,
  current_url: 240,
  budget_range: 80,
  message: 1200,
  source_path: 240,
  referrer: 320,
  locale: 32,
  honeypot: 120,
  correlation_id: 120,
  idempotency_key: 180
}

const requiredFields = ['name', 'email', 'project_type', 'message'] as const satisfies ReadonlyArray<
  keyof LeadSubmission
>

const leadFields = Object.keys(leadFieldLimits) as Array<keyof LeadSubmission>

export function createEmptyLeadSubmission(): LeadSubmission {
  return {
    name: '',
    email: '',
    company: '',
    project_type: '',
    audience: '',
    deadline: '',
    current_url: '',
    budget_range: '',
    message: '',
    source_path: '',
    referrer: '',
    locale: '',
    honeypot: '',
    correlation_id: '',
    idempotency_key: ''
  }
}

export function normalizeLeadSubmission(input: unknown): LeadSubmission {
  const source = isObjectRecord(input) ? input : {}
  const normalized = createEmptyLeadSubmission()

  for (const field of leadFields) {
    normalized[field] = sanitizeField(source[field], leadFieldLimits[field])
  }

  normalized.email = normalized.email.toLowerCase()
  normalized.source_path = minimizePath(normalized.source_path)
  normalized.referrer = minimizeReferrer(normalized.referrer)
  return normalized
}

export function validateLeadSubmission(input: unknown): LeadValidationResult {
  const data = normalizeLeadSubmission(input)
  const errors: string[] = []

  if (data.honeypot) {
    errors.push('Spam filter rejected this submission.')
  }

  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  if (data.email && !isLikelyEmail(data.email)) {
    errors.push('Email does not look valid.')
  }

  if (data.current_url && !isHttpUrl(data.current_url)) {
    errors.push('Current URL must start with http:// or https://.')
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, data }
}

export function getMissingLeadFields(input: Pick<LeadSubmission, (typeof requiredFields)[number]>) {
  return requiredFields.filter((field) => !sanitizeField(input[field], leadFieldLimits[field]))
}

export function extractUtm(sourcePath: string): Record<string, string> {
  if (!sourcePath.includes('?')) return {}

  const query = (sourcePath.split('?')[1] ?? '').split('#')[0] ?? ''
  const params = new URLSearchParams(query)
  const utm: Record<string, string> = {}

  for (const [key, value] of params.entries()) {
    if (key.startsWith('utm_') && value) {
      utm[key] = value.slice(0, 160)
    }
  }

  return utm
}

export function leadToCMSData(lead: LeadSubmission, rawPayload: unknown) {
  const rawSourcePath =
    isObjectRecord(rawPayload) && typeof rawPayload.source_path === 'string'
      ? rawPayload.source_path
      : lead.source_path
  const correlationId = extractString(rawPayload, 'correlation_id') || lead.correlation_id || createCorrelationId()
  const idempotencyKey = createLeadIdempotencyKey(lead, rawPayload)
  const source = 'public_lead_api'

  return {
    name: lead.name,
    email: lead.email,
    company: lead.company,
    projectType: lead.project_type,
    audience: lead.audience,
    deadline: lead.deadline,
    currentUrl: lead.current_url,
    budgetRange: lead.budget_range,
    message: lead.message,
    sourcePath: lead.source_path,
    referrer: lead.referrer,
    locale: lead.locale,
    correlationId,
    idempotencyKey,
    dedupeKey: `${source}:${idempotencyKey}`,
    source,
    projectSlug,
    utm: extractUtm(rawSourcePath),
    rawPayload: isObjectRecord(rawPayload) ? rawPayload : {},
    status: 'new' as const,
    priority: lead.budget_range || lead.deadline ? ('high' as const) : ('normal' as const)
  }
}

export function createLeadIdempotencyKey(lead: LeadSubmission, rawPayload: unknown): string {
  const explicit =
    normalizeIdempotencyKey(extractString(rawPayload, 'idempotency_key')) ||
    normalizeIdempotencyKey(extractString(rawPayload, 'idempotencyKey')) ||
    normalizeIdempotencyKey(lead.idempotency_key)

  if (explicit) {
    return explicit
  }

  const digest = createHash('sha256')
    .update(
      JSON.stringify({
        email: lead.email,
        message: lead.message,
        projectType: lead.project_type.toLowerCase(),
        sourcePath: lead.source_path
      })
    )
    .digest('hex')
    .slice(0, 16)

  return `lead:${lead.email}:${digest}`
}

function sanitizeField(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function minimizePath(value: string): string {
  if (!value) return ''

  try {
    const url = new URL(value, 'https://local.invalid')
    return url.pathname || '/'
  } catch {
    return value.split('?')[0]?.split('#')[0] || ''
  }
}

function minimizeReferrer(value: string): string {
  if (!value) return ''

  try {
    const url = new URL(value)
    return url.origin
  } catch {
    return minimizePath(value)
  }
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractString(source: unknown, key: string): string {
  return isObjectRecord(source) && typeof source[key] === 'string' ? source[key].trim() : ''
}
