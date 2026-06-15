import { buildHealthPayload } from '@/lib/runtime-health'

export const runtime = 'nodejs'

export function GET() {
  return Response.json(buildHealthPayload(), {
    headers: {
      'cache-control': 'no-store'
    }
  })
}
