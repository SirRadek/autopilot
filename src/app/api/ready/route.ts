import config from '@payload-config'
import { getPayload } from 'payload'

import { buildReadyPayload } from '@/lib/runtime-health'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true
    })

    return Response.json(buildReadyPayload({ database: 'up' }), {
      headers: { 'cache-control': 'no-store' }
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown readiness failure'

    return Response.json(buildReadyPayload({ database: 'blocked', reason }), {
      headers: { 'cache-control': 'no-store' },
      status: 503
    })
  }
}
