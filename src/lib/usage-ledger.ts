import type { MeasurementConfidence } from './model-spend'
import { isRecord, type ValidationResult } from './governance-validation'

// Shared evidence spine: an append-only redacted store of per-run model usage plus a
// per-provider budget snapshot. No raw prompts, secrets, or transcripts.

export type ModelSurface = 'api' | 'cli' | 'web_ui' | 'local'
export type QuotaSource = 'api_usage' | 'response_usage' | 'dashboard_manual' | 'local_estimate' | 'unknown'
export type CapacityKind = 'messages' | 'tokens' | 'credits' | 'requests' | 'unknown'

export const requiredUsageLedgerKeys = [
  'date',
  'project',
  'phase',
  'lane',
  'provider',
  'model',
  'surface',
  'reasoning',
  'context_level',
  'task_type',
  'quota_source',
  'measurement_confidence',
  'used_in_final_plan'
] as const

export const usageLedgerNullableNumberKeys = [
  'estimated_tokens',
  'actual_tokens',
  'remaining_pct_before',
  'remaining_pct_after',
  'quality_score'
] as const

export interface UsageLedgerEntry {
  date: string
  project: string
  phase: string
  lane: string
  provider: string
  model: string
  surface: ModelSurface
  reasoning: string
  context_level: string
  task_type: string
  estimated_tokens: number | null
  actual_tokens: number | null
  quota_source: QuotaSource
  measurement_confidence: MeasurementConfidence
  remaining_pct_before: number | null
  remaining_pct_after: number | null
  quality_score: number | null
  used_in_final_plan: boolean
  notes?: string
}

export const requiredProviderBudgetKeys = [
  'provider',
  'surface',
  'period',
  'capacity_kind',
  'source',
  'confidence',
  'updated_at'
] as const

export interface ProviderBudget {
  provider: string
  surface: ModelSurface
  period: string
  capacity_kind: CapacityKind
  capacity_total: number | null
  consumed: number | null
  remaining: number | null
  remaining_pct: number | null
  source: QuotaSource
  confidence: MeasurementConfidence
  updated_at: string
}

const SURFACES = ['api', 'cli', 'web_ui', 'local']
const QUOTA_SOURCES = ['api_usage', 'response_usage', 'dashboard_manual', 'local_estimate', 'unknown']
const CONFIDENCE = ['high', 'medium', 'low', 'unknown']
const CAPACITY_KINDS = ['messages', 'tokens', 'credits', 'requests', 'unknown']

export function validateUsageLedgerEntry(value: unknown): ValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ['value must be an object'] }
  }

  const errors: string[] = [
    ...requirePresentKeys(value, requiredUsageLedgerKeys),
    ...requireEnum(value, 'surface', SURFACES),
    ...requireEnum(value, 'quota_source', QUOTA_SOURCES),
    ...requireEnum(value, 'measurement_confidence', CONFIDENCE)
  ]

  if ('used_in_final_plan' in value && typeof value.used_in_final_plan !== 'boolean') {
    errors.push('used_in_final_plan must be a boolean')
  }

  for (const key of usageLedgerNullableNumberKeys) {
    errors.push(...validateNullableNumber(value, key, /^remaining_pct_|^quality_score$/.test(key)))
  }

  return { valid: errors.length === 0, errors }
}

export function validateProviderBudget(value: unknown): ValidationResult {
  if (!isRecord(value)) {
    return { valid: false, errors: ['value must be an object'] }
  }

  const errors: string[] = [
    ...requirePresentKeys(value, requiredProviderBudgetKeys),
    ...requireEnum(value, 'surface', SURFACES),
    ...requireEnum(value, 'capacity_kind', CAPACITY_KINDS),
    ...requireEnum(value, 'source', QUOTA_SOURCES),
    ...requireEnum(value, 'confidence', CONFIDENCE),
    ...validateNullableNumber(value, 'capacity_total', false),
    ...validateNullableNumber(value, 'consumed', false),
    ...validateNullableNumber(value, 'remaining', false),
    ...validateNullableNumber(value, 'remaining_pct', true)
  ]

  return { valid: errors.length === 0, errors }
}

function requirePresentKeys(value: Record<string, unknown>, keys: readonly string[]): string[] {
  return keys.flatMap((key) => {
    if (!(key in value) || value[key] === undefined) {
      return [`${key} is required`]
    }
    if (typeof value[key] === 'string' && (value[key] as string).trim() === '') {
      return [`${key} must not be empty`]
    }
    return []
  })
}

function requireEnum(value: Record<string, unknown>, key: string, allowed: readonly string[]): string[] {
  if (!(key in value) || value[key] === undefined) {
    return []
  }
  return allowed.includes(value[key] as string) ? [] : [`${key} must be one of: ${allowed.join(', ')}`]
}

function validateNullableNumber(value: Record<string, unknown>, key: string, isFraction: boolean): string[] {
  if (!(key in value) || value[key] === null) {
    return []
  }
  const candidate = value[key]
  if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
    return [`${key} must be a number or null`]
  }
  if (isFraction && (candidate < 0 || candidate > 1)) {
    return [`${key} must be a 0..1 fraction`]
  }
  return []
}
