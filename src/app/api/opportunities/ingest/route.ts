import config from '@payload-config'
import { getPayload } from 'payload'

import { getMeshAuthHeader, isAuthorizedMeshRequest } from '@/lib/mesh-auth'
import { createOpportunityImport, OpportunityIngestError } from '@/lib/opportunities'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const authHeader = getMeshAuthHeader(request)
  if (!isAuthorizedMeshRequest(authHeader, process.env.OPPORTUNITY_INGEST_TOKEN)) {
    return Response.json({ ok: false, error: 'Unauthorized opportunity ingest request.' }, { status: 401 })
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

  try {
    const payload = await getPayload({ config })
    const result = await createOpportunityImport(payload, body)
    return Response.json({ ok: true, ...result }, { status: result.replayed ? 200 : 201 })
  } catch (error) {
    if (error instanceof OpportunityIngestError) {
      return Response.json({ ok: false, error: error.message, details: error.errors }, { status: 400 })
    }

    console.error('Opportunity ingest failed', error)
    return Response.json({ ok: false, error: 'Opportunity import could not be stored.' }, { status: 500 })
  }
}
