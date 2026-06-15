import config from '@payload-config'
import { getPayload } from 'payload'

import { getMeshAuthHeader, isAuthorizedMeshRequest } from '@/lib/mesh-auth'
import { LiveOpportunitySourceError, runHlidacStatuLiveSearch } from '@/lib/live-opportunities'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const authHeader = getMeshAuthHeader(request)
  if (!isAuthorizedMeshRequest(authHeader, process.env.MESH_SERVICE_TOKEN)) {
    return Response.json({ ok: false, error: 'Unauthorized live opportunity request.' }, { status: 401 })
  }

  let body: Record<string, unknown> = {}
  if (request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    try {
      body = objectValue(await request.json())
    } catch {
      return Response.json({ ok: false, error: 'Request body is not valid JSON.' }, { status: 400 })
    }
  }

  try {
    const payload = await getPayload({ config })
    const result = await runHlidacStatuLiveSearch({
      payload,
      apiToken: process.env.HLIDAC_STATU_API_TOKEN,
      commercialApproved: process.env.HLIDAC_STATU_COMMERCIAL_APPROVED === 'true',
      page: numberValue(body.page),
      publishedFrom: stringValue(body.publishedFrom),
      query: stringValue(body.query) || undefined
    })
    return Response.json({ ok: true, ...result }, { status: 201 })
  } catch (error) {
    if (error instanceof LiveOpportunitySourceError) {
      return Response.json({ ok: false, error: error.message }, { status: 412 })
    }

    console.error('Live opportunity source failed', error)
    return Response.json({ ok: false, error: 'Live opportunity source failed.' }, { status: 500 })
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
