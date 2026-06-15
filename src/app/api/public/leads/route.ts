import config from '@payload-config'
import { getPayload } from 'payload'

import { createLeadWorkflow, LeadValidationError } from '@/lib/workflow'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const bodySizeLimit = publicLeadBodySizeLimitBytes()
  const guard = validatePublicLeadRequestGuard(request)
  if (!guard.ok) {
    return jsonResponse({ ok: false, error: guard.error }, guard.status, request)
  }

  if (!isJsonRequest(request)) {
    return jsonResponse({ ok: false, error: 'Expected application/json request body.' }, 415, request)
  }

  let body: unknown
  const bodyResult = await readJsonBodyWithLimit(request, bodySizeLimit)
  if (!bodyResult.ok) {
    return jsonResponse({ ok: false, error: bodyResult.error }, bodyResult.status, request)
  }
  body = bodyResult.body

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

export async function readJsonBodyWithLimit(
  request: Request,
  limitBytes: number | undefined
): Promise<{ ok: true; body: unknown } | { ok: false; error: string; status: number }> {
  const body = await readRequestBodyWithLimit(request, limitBytes)
  if (!body.ok) {
    return body
  }

  try {
    return { ok: true, body: JSON.parse(body.text) }
  } catch {
    return { ok: false, error: 'Request body is not valid JSON.', status: 400 }
  }
}

async function readRequestBodyWithLimit(
  request: Request,
  limitBytes: number | undefined
): Promise<{ ok: true; text: string } | { ok: false; error: string; status: number }> {
  if (!request.body) {
    return { ok: true, text: '' }
  }

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  const chunks: string[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    totalBytes += value.byteLength
    if (limitBytes !== undefined && totalBytes > limitBytes) {
      await reader.cancel()
      return { ok: false, error: 'Public lead request body exceeds configured size limit.', status: 413 }
    }

    chunks.push(decoder.decode(value, { stream: true }))
  }

  chunks.push(decoder.decode())
  return { ok: true, text: chunks.join('') }
}

export function validatePublicLeadRequestGuard(
  request: Request,
  env: Record<string, string | undefined> = process.env
): { ok: true } | { ok: false; error: string; status: number } {
  const bodySizeLimit = publicLeadBodySizeLimitBytes(env)
  const contentLength = nonNegativeInteger(request.headers.get('content-length'))

  if (bodySizeLimit !== undefined && contentLength !== undefined && contentLength > bodySizeLimit) {
    return { ok: false, error: 'Public lead request body exceeds configured size limit.', status: 413 }
  }

  if (env.NODE_ENV === 'production' && !isPublicLeadProductionGuardConfigured(env)) {
    return {
      ok: false,
      error: 'Public lead intake is disabled in production until edge rate limiting and body-size limits are configured.',
      status: 503
    }
  }

  return { ok: true }
}

export function isPublicLeadProductionGuardConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return env.PUBLIC_LEAD_EDGE_RATE_LIMIT_ENABLED === 'true' && publicLeadBodySizeLimitBytes(env) !== undefined
}

function publicLeadBodySizeLimitBytes(env: Record<string, string | undefined> = process.env): number | undefined {
  const value = positiveInteger(env.PUBLIC_LEAD_BODY_SIZE_LIMIT_BYTES)
  return value && value > 0 ? value : undefined
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

function positiveInteger(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

function nonNegativeInteger(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined
}
