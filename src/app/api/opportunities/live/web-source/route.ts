import config from '@payload-config'
import { getPayload } from 'payload'

import { LiveOpportunitySourceError, runLiveWebSourceImport } from '@/lib/live-opportunities'
import { getMeshAuthHeader, isAuthorizedMeshRequest } from '@/lib/mesh-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const authHeader = getMeshAuthHeader(request)
  if (!isAuthorizedMeshRequest(authHeader, process.env.MESH_SERVICE_TOKEN)) {
    return Response.json({ ok: false, error: 'Unauthorized live opportunity request.' }, { status: 401 })
  }

  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return Response.json({ ok: false, error: 'Expected application/json request body.' }, { status: 415 })
  }

  let body: Record<string, unknown>
  try {
    body = objectValue(await request.json())
  } catch {
    return Response.json({ ok: false, error: 'Request body is not valid JSON.' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const result = await runLiveWebSourceImport({
      payload,
      sourceKey: stringValue(body.sourceKey),
      urls: body.urls,
      items: body.items,
      sourceRunId: stringValue(body.sourceRunId),
      idempotencyKey: stringValue(body.idempotencyKey),
      correlationId: stringValue(body.correlationId),
      maxUrls: numberValue(body.maxUrls),
      userAgent: process.env.OPPORTUNITY_WEB_FETCH_USER_AGENT
    })
    return Response.json({ ok: true, ...result }, { status: result.import.replayed ? 200 : 201 })
  } catch (error) {
    if (error instanceof LiveOpportunitySourceError) {
      return Response.json({ ok: false, error: error.message }, { status: error.status })
    }

    console.error('Live web opportunity source failed', error)
    return Response.json({ ok: false, error: 'Live web opportunity source failed.' }, { status: 500 })
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}
