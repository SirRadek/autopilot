import type { Payload } from 'payload'

import { createCorrelationId, normalizeIdempotencyKey, projectSlug } from '@/lib/mesh-contracts'
import { appendWorkflowEvent } from '@/lib/workflow'

const retentionDays = 14

export interface OpportunityIngestRow {
  sourceItemId: string
  canonicalUrl: string
  canonicalHost: string
  title: string
  description: string
  rawSnippet: string
  rowFingerprint: string
  fitScore: number
  serviceTags: string[]
  requesterName: string
  contactEmail: string
  contactPhone: string
  sourceStatus: 'open' | 'closed' | 'unknown'
  publishedAt: string
  sourceUpdatedAt: string
  deadlineAt: string
  discoveredAt: string
}

export interface OpportunityIngestPayload {
  sourceKey: string
  sourceRunId: string
  idempotencyKey: string
  correlationId: string
  items: OpportunityIngestRow[]
}

export type OpportunityValidationResult =
  | { ok: true; data: OpportunityIngestPayload }
  | { ok: false; errors: string[] }

export interface OpportunityImportResult {
  runId: string
  correlationId: string
  created: number
  duplicates: number
  collisions: number
  replayed: boolean
}

export function validateOpportunityIngestPayload(
  input: unknown,
  options: { allowedHosts: string[] }
): OpportunityValidationResult {
  const source = isObjectRecord(input) ? input : {}
  const allowedHosts = new Set(options.allowedHosts.map((host) => host.trim().toLowerCase()).filter(Boolean))
  const sourceKey = sanitizeString(source.sourceKey, 120)
  const sourceRunId = sanitizeString(source.sourceRunId, 160)
  const idempotencyKey =
    normalizeIdempotencyKey(source.idempotencyKey) || normalizeIdempotencyKey(`${sourceKey}:${sourceRunId}`)
  const correlationId = sanitizeString(source.correlationId, 160) || createCorrelationId()
  const errors: string[] = []

  if (!sourceKey) errors.push('Missing sourceKey.')
  if (!sourceRunId) errors.push('Missing sourceRunId.')
  if (!Array.isArray(source.items) || source.items.length === 0) errors.push('At least one opportunity item is required.')

  const items = Array.isArray(source.items)
    ? source.items.map((item, index) => normalizeOpportunityRow(item, index, allowedHosts, errors))
    : []

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    data: {
      sourceKey,
      sourceRunId,
      idempotencyKey,
      correlationId,
      items
    }
  }
}

export async function createOpportunityImport(payload: Payload, input: unknown): Promise<OpportunityImportResult> {
  const sourceKey = isObjectRecord(input) ? sanitizeString(input.sourceKey, 120) : ''
  const source = await findOpportunitySource(payload, sourceKey)

  if (!source) {
    throw new OpportunityIngestError([`Opportunity source is not configured: ${sourceKey || 'missing'}`])
  }

  if (source.enabled === false) {
    throw new OpportunityIngestError([`Opportunity source is disabled: ${sourceKey}`])
  }

  if (!stringValue(source.termsReviewedAt)) {
    throw new OpportunityIngestError([`Opportunity source terms have not been reviewed: ${sourceKey}`])
  }

  const allowedHosts = allowedHostsFromSource(source)
  const validation = validateOpportunityIngestPayload(input, { allowedHosts })

  if (!validation.ok) {
    throw new OpportunityIngestError(validation.errors)
  }

  const data = validation.data
  const runDedupeKey = `${data.sourceKey}:${data.idempotencyKey}`
  const existingRun = await findOpportunityRun(payload, runDedupeKey)
  if (existingRun) {
    return {
      runId: String(existingRun.id),
      correlationId: stringValue(existingRun.correlationId) || data.correlationId,
      created: numberValue(existingRun.createdCount),
      duplicates: numberValue(existingRun.duplicateCount),
      collisions: numberValue(existingRun.collisionCount),
      replayed: true
    }
  }

  const run = await payload.create({
    collection: 'opportunity-runs',
    data: {
      source: relationshipId(source.id),
      sourceKey: data.sourceKey,
      sourceRunId: data.sourceRunId,
      idempotencyKey: data.idempotencyKey,
      dedupeKey: runDedupeKey,
      correlationId: data.correlationId,
      state: 'running',
      startedAt: new Date().toISOString(),
      totalCount: data.items.length,
      createdCount: 0,
      duplicateCount: 0,
      collisionCount: 0
    },
    overrideAccess: true
  })

  await appendWorkflowEvent(payload, {
    eventType: 'opportunity_import_run_started',
    correlationId: data.correlationId,
    idempotencyKey: data.idempotencyKey,
    projectSlug,
    actorType: 'system',
    actorId: 'opportunity-ingest',
    opportunityRun: run.id,
    opportunitySource: source.id,
    payload: {
      source_key: data.sourceKey,
      source_run_id: data.sourceRunId,
      total_count: data.items.length
    }
  })

  let created = 0
  let duplicates = 0
  let collisions = 0

  for (const item of data.items) {
    const dedupeKey = opportunityDedupeKey(data.sourceKey, item.rowFingerprint)
    const sourceItemKey = opportunitySourceItemKey(data.sourceKey, item.sourceItemId)
    const duplicate = await findOpportunityItem(payload, 'dedupeKey', dedupeKey)

    if (duplicate) {
      duplicates += 1
      await appendOpportunityAuditEvent(payload, {
        eventType: 'opportunity_duplicate_skipped',
        source,
        run,
        item: duplicate,
        data,
        row: item,
        payload: { dedupe_key: dedupeKey, source_item_id: item.sourceItemId }
      })
      continue
    }

    const collision = await findOpportunityItem(payload, 'sourceItemKey', sourceItemKey)
    if (collision) {
      collisions += 1
      await payload.update({
        collection: 'opportunity-items',
        id: collision.id,
        data: {
          status: 'blocked',
          collisionReason: `Source item ${item.sourceItemId} changed fingerprint.`
        },
        overrideAccess: true
      })
      await appendOpportunityAuditEvent(payload, {
        eventType: 'opportunity_collision_blocked',
        source,
        run,
        item: collision,
        data,
        row: item,
        payload: {
          source_item_id: item.sourceItemId,
          existing_dedupe_key: stringValue(collision.dedupeKey),
          incoming_dedupe_key: dedupeKey
        }
      })
      continue
    }

    const createdItem = await payload.create({
      collection: 'opportunity-items',
      data: {
        source: relationshipId(source.id),
        run: relationshipId(run.id),
        sourceKey: data.sourceKey,
        sourceItemId: item.sourceItemId,
        sourceItemKey,
        correlationId: data.correlationId,
        canonicalUrl: item.canonicalUrl,
        canonicalHost: item.canonicalHost,
        title: item.title,
        description: item.description,
        rawSnippet: item.rawSnippet,
        rowFingerprint: item.rowFingerprint,
        dedupeKey,
        status: 'new',
        fitScore: item.fitScore,
        serviceTags: item.serviceTags.map((tag) => ({ tag })),
        requesterName: item.requesterName,
        contactEmail: item.contactEmail,
        contactPhone: item.contactPhone,
        sourceStatus: item.sourceStatus,
        publishedAt: item.publishedAt || undefined,
        sourceUpdatedAt: item.sourceUpdatedAt || undefined,
        deadlineAt: item.deadlineAt || undefined,
        discoveredAt: item.discoveredAt,
        personalDataExpiresAt: retentionDeadline(item.discoveredAt),
        normalizedPayload: {
          sourceItemId: item.sourceItemId,
          canonicalUrl: item.canonicalUrl,
          rowFingerprint: item.rowFingerprint,
          sourceStatus: item.sourceStatus,
          publishedAt: item.publishedAt,
          sourceUpdatedAt: item.sourceUpdatedAt,
          deadlineAt: item.deadlineAt
        }
      },
      overrideAccess: true
    })

    created += 1
    await appendOpportunityAuditEvent(payload, {
      eventType: 'opportunity_imported',
      source,
      run,
      item: createdItem,
      data,
      row: item,
      payload: {
        dedupe_key: dedupeKey,
        source_item_id: item.sourceItemId,
        canonical_url: item.canonicalUrl,
        fit_score: item.fitScore,
        service_tags: item.serviceTags,
        source_status: item.sourceStatus,
        published_at: item.publishedAt,
        source_updated_at: item.sourceUpdatedAt,
        deadline_at: item.deadlineAt
      }
    })
  }

  await payload.update({
    collection: 'opportunity-runs',
    id: run.id,
    data: {
      state: collisions > 0 ? 'completed_with_blocks' : 'completed',
      finishedAt: new Date().toISOString(),
      createdCount: created,
      duplicateCount: duplicates,
      collisionCount: collisions
    },
    overrideAccess: true
  })

  return {
    runId: String(run.id),
    correlationId: data.correlationId,
    created,
    duplicates,
    collisions,
    replayed: false
  }
}

export async function purgeOpportunityPersonalData(
  payload: Payload,
  input: { itemId: string | number; actorId: string; reason: string; now?: Date }
): Promise<{ itemId: string; purged: boolean }> {
  const item = await findOpportunityItemById(payload, input.itemId)
  if (!item) {
    throw new OpportunityIngestError([`Opportunity item was not found: ${String(input.itemId)}`])
  }

  if (stringValue(item.personalDataPurgedAt)) {
    return { itemId: String(item.id), purged: false }
  }

  const purgedAt = (input.now ?? new Date()).toISOString()
  const description = stringValue(item.description)
  const redactedDescription = redactDescriptionContactData(description)
  const descriptionChanged = redactedDescription !== description
  const purgedFields = ['requesterName', 'contactEmail', 'contactPhone', 'rawSnippet', 'normalizedPayload']
  const updateData: Record<string, unknown> = {
    requesterName: '',
    contactEmail: '',
    contactPhone: '',
    rawSnippet: '',
    normalizedPayload: {},
    personalDataPurgedAt: purgedAt
  }

  if (descriptionChanged) {
    updateData.description = redactedDescription
    purgedFields.push('description')
  }

  await payload.update({
    collection: 'opportunity-items',
    id: item.id,
    data: updateData,
    overrideAccess: true
  })

  await appendWorkflowEvent(payload, {
    eventType: 'opportunity_personal_data_purged',
    correlationId: stringValue(item.correlationId) || createCorrelationId(),
    idempotencyKey: stringValue(item.dedupeKey),
    projectSlug,
    actorType: 'human',
    actorId: input.actorId,
    opportunityItem: item.id,
    opportunityRun: relationshipId(item.run),
    opportunitySource: relationshipId(item.source),
    payload: {
      item_id: String(item.id),
      reason: sanitizeString(input.reason, 120),
      purged_at: purgedAt,
      fields: purgedFields
    }
  })

  return { itemId: String(item.id), purged: true }
}

function normalizeOpportunityRow(
  value: unknown,
  index: number,
  allowedHosts: Set<string>,
  errors: string[]
): OpportunityIngestRow {
  const row = isObjectRecord(value) ? value : {}
  const canonicalUrl = sanitizeString(row.canonicalUrl, 500)
  const canonicalHost = hostFromUrl(canonicalUrl)
  const sourceItemId = sanitizeString(row.sourceItemId, 180)
  const rowFingerprint = sanitizeString(row.rowFingerprint, 180)
  const title = sanitizeString(row.title, 240)
  const discoveredAt = normalizeDateString(row.discoveredAt) || new Date().toISOString()

  if (!sourceItemId) errors.push(`Item ${index} is missing sourceItemId.`)
  if (!canonicalUrl) errors.push(`Item ${index} is missing canonicalUrl.`)
  if (!canonicalHost) errors.push(`Item ${index} canonicalUrl is not a valid URL.`)
  if (canonicalHost && !allowedHosts.has(canonicalHost)) {
    errors.push(`Item ${index} canonicalUrl host is not allowed: ${canonicalHost}`)
  }
  if (!title) errors.push(`Item ${index} is missing title.`)
  if (!rowFingerprint) errors.push(`Item ${index} is missing rowFingerprint.`)

  return {
    sourceItemId,
    canonicalUrl,
    canonicalHost,
    title,
    description: sanitizeString(row.description, 1200),
    rawSnippet: sanitizeString(row.rawSnippet, 1200),
    rowFingerprint,
    fitScore: normalizeScore(row.fitScore),
    serviceTags: normalizeTags(row.serviceTags),
    requesterName: sanitizeString(row.requesterName, 160),
    contactEmail: sanitizeString(row.contactEmail, 180).toLowerCase(),
    contactPhone: sanitizeString(row.contactPhone, 80),
    sourceStatus: normalizeSourceStatus(row.sourceStatus),
    publishedAt: normalizeDateString(row.publishedAt),
    sourceUpdatedAt: normalizeDateString(row.sourceUpdatedAt),
    deadlineAt: normalizeDateString(row.deadlineAt),
    discoveredAt
  }
}

function appendOpportunityAuditEvent(
  payload: Payload,
  input: {
    eventType:
      | 'opportunity_imported'
      | 'opportunity_duplicate_skipped'
      | 'opportunity_collision_blocked'
    source: RelationshipDoc
    run: RelationshipDoc
    item: RelationshipDoc
    data: OpportunityIngestPayload
    row: OpportunityIngestRow
    payload: Record<string, unknown>
  }
) {
  return appendWorkflowEvent(payload, {
    eventType: input.eventType,
    correlationId: input.data.correlationId,
    idempotencyKey: input.data.idempotencyKey,
    projectSlug,
    actorType: 'system',
    actorId: 'opportunity-ingest',
    opportunityItem: input.item.id,
    opportunityRun: input.run.id,
    opportunitySource: input.source.id,
    payload: {
      source_key: input.data.sourceKey,
      source_run_id: input.data.sourceRunId,
      ...input.payload
    }
  })
}

type RelationshipDoc = {
  id: string | number
}

function opportunityDedupeKey(sourceKey: string, rowFingerprint: string): string {
  return `${sourceKey}:${rowFingerprint}`
}

function opportunitySourceItemKey(sourceKey: string, sourceItemId: string): string {
  return `${sourceKey}:${sourceItemId}`
}

function retentionDeadline(discoveredAt: string): string {
  const discovered = new Date(discoveredAt)
  const base = Number.isNaN(discovered.getTime()) ? new Date() : discovered
  return new Date(base.getTime() + retentionDays * 24 * 60 * 60 * 1000).toISOString()
}

async function findOpportunitySource(payload: Payload, sourceKey: string) {
  const result = await payload.find({
    collection: 'opportunity-sources',
    where: { sourceKey: { equals: sourceKey } },
    limit: 1,
    overrideAccess: true
  })

  return result.docs[0]
}

async function findOpportunityRun(payload: Payload, dedupeKey: string) {
  const result = await payload.find({
    collection: 'opportunity-runs',
    where: { dedupeKey: { equals: dedupeKey } },
    limit: 1,
    overrideAccess: true
  })

  return result.docs[0]
}

async function findOpportunityItem(payload: Payload, field: 'dedupeKey' | 'sourceItemKey', value: string) {
  const result = await payload.find({
    collection: 'opportunity-items',
    where: { [field]: { equals: value } },
    limit: 1,
    overrideAccess: true
  })

  return result.docs[0]
}

async function findOpportunityItemById(payload: Payload, itemId: string | number) {
  const result = await payload.find({
    collection: 'opportunity-items',
    where: { id: { equals: itemId } },
    limit: 1,
    overrideAccess: true
  })

  return result.docs[0]
}

function allowedHostsFromSource(source: unknown): string[] {
  if (!isObjectRecord(source) || !Array.isArray(source.allowedHosts)) {
    return []
  }

  return source.allowedHosts
    .map((item) => (isObjectRecord(item) ? sanitizeString(item.host, 180).toLowerCase() : ''))
    .filter(Boolean)
}

function hostFromUrl(value: string): string {
  try {
    const url = new URL(value)
    return url.hostname.toLowerCase()
  } catch {
    return ''
  }
}

function sanitizeString(value: unknown, maxLength: number): string {
  return typeof value === 'string'
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength)
    : ''
}

function normalizeDateString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function normalizeScore(value: unknown): number {
  const score = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 0
  return Math.min(Math.max(score, 0), 100)
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.map((item) => sanitizeString(item, 60).toLowerCase()).filter(Boolean))].slice(0, 12)
}

function redactDescriptionContactData(value: string): string {
  const redactedEmail = value.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted contact]')

  return redactedEmail.replace(/(^|[^\w+])(\+?\d[\d\s().-]{6,}\d)(?=$|[^\w])/g, (match, prefix, phone) => {
    const digits = String(phone).replace(/\D/g, '')
    return digits.length >= 9 ? `${prefix}[redacted contact]` : match
  })
}

function normalizeSourceStatus(value: unknown): 'open' | 'closed' | 'unknown' {
  return value === 'open' || value === 'closed' ? value : 'unknown'
}

function relationshipId(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value)
  }

  if (isObjectRecord(value) && (typeof value.id === 'number' || typeof value.id === 'string')) {
    return relationshipId(value.id)
  }

  return undefined
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export class OpportunityIngestError extends Error {
  constructor(readonly errors: string[]) {
    super('Opportunity ingest failed.')
  }
}
