import config from '@payload-config'
import { getPayload } from 'payload'

import { createLeadWorkflow, LeadValidationError } from '@/lib/workflow'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isJsonRequest(request)) {
    return jsonResponse({ ok: false, error: 'Expected application/json request body.' }, 415, request)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'Request body is not valid JSON.' }, 400, request)
  }

  try {
    const payload = await getPayload({ config })
    const result = await createLeadWorkflow(payload, withRequestMetadata(body, request))
    const status = result.collision ? 202 : result.deduplicated ? 200 : 201
    return jsonResponse({ ok: true, ...result }, status, request, {
      correlationId: result.correlationId
    })
  } catch (error) {
    if (error instanceof LeadValidationError) {
      return jsonResponse({ ok: false, error: error.message, details: error.errors }, 400, request)
    }

    console.error('Lead intake failed', error)
    return jsonResponse({ ok: false, error: 'Lead could not be stored.' }, 500, request)
  }
}

export function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: responseHeaders(request)
  })
}

function isJsonRequest(request: Request): boolean {
  return request.headers.get('content-type')?.toLowerCase().includes('application/json') ?? false
}

function jsonResponse(
  body: unknown,
  status = 200,
  request?: Request,
  metadata: { correlationId?: string } = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(request, metadata)
  })
}

function responseHeaders(request?: Request, metadata: { correlationId?: string } = {}): HeadersInit {
  const headers: Record<string, string> = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-correlation-id, x-idempotency-key, idempotency-key',
    vary: 'origin'
  }

  if (metadata.correlationId) {
    headers['x-correlation-id'] = metadata.correlationId
  }

  const allowedOrigin = getAllowedOrigin(request)
  if (allowedOrigin) {
    headers['access-control-allow-origin'] = allowedOrigin
  }

  return headers
}

function getAllowedOrigin(request?: Request): string | undefined {
  const origin = request?.headers.get('origin')
  const allowedOrigins = new Set(
    [
      process.env.NEXT_PUBLIC_APP_URL,
      ...(process.env.PUBLIC_LEAD_ALLOWED_ORIGINS ?? '').split(',')
    ]
      .map((value) => value?.trim())
      .filter(Boolean) as string[]
  )

  if (allowedOrigins.has('*')) {
    return '*'
  }

  if (origin && allowedOrigins.has(origin)) {
    return origin
  }

  if (!origin) {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  return undefined
}

function withRequestMetadata(body: unknown, request: Request): unknown {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return body
  }

  return {
    ...body,
    correlation_id:
      stringValue((body as Record<string, unknown>).correlation_id) ||
      request.headers.get('x-correlation-id') ||
      undefined,
    idempotency_key:
      stringValue((body as Record<string, unknown>).idempotency_key) ||
      request.headers.get('x-idempotency-key') ||
      request.headers.get('idempotency-key') ||
      undefined
  }
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
