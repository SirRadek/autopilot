import config from '@payload-config'
import { getPayload } from 'payload'

import { getMeshAuthHeader, isAuthorizedMeshRequest } from '@/lib/mesh-auth'
import { OpportunityIngestError, purgeOpportunityPersonalData } from '@/lib/opportunities'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const authHeader = getMeshAuthHeader(request)
  if (!isAuthorizedMeshRequest(authHeader, process.env.OPPORTUNITY_PURGE_TOKEN)) {
    return Response.json({ ok: false, error: 'Unauthorized opportunity purge request.' }, { status: 401 })
  }

  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return Response.json({ ok: false, error: 'Expected application/json request body.' }, { status: 415 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'Request body is not valid JSON.' }, { status: 400 })
  }

  const input = objectValue(body)
  const itemId = stringOrNumber(input.itemId)
  if (itemId === undefined) {
    return Response.json({ ok: false, error: 'Opportunity item id is required.' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const result = await purgeOpportunityPersonalData(payload, {
      itemId,
      actorId: stringValue(input.actorId) || 'opportunity-purge-api',
      reason: stringValue(input.reason) || 'retention_expired'
    })
    return Response.json({ ok: true, ...result }, { status: 200 })
  } catch (error) {
    if (error instanceof OpportunityIngestError) {
      return Response.json({ ok: false, error: error.message, details: error.errors }, { status: 400 })
    }

    console.error('Opportunity purge failed', error)
    return Response.json({ ok: false, error: 'Opportunity personal data could not be purged.' }, { status: 500 })
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function stringOrNumber(value: unknown): string | number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return undefined
}
