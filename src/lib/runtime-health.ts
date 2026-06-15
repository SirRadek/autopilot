type DatabaseReadiness = 'up' | 'blocked' | 'down'

interface ReadinessInput {
  database: DatabaseReadiness
  reason?: string
}

export function buildHealthPayload() {
  return {
    ok: true,
    service: 'clientops-cms',
    checkedAt: new Date().toISOString()
  }
}

export function buildReadyPayload(input: ReadinessInput) {
  const dbOk = input.database === 'up'
  const reason = input.reason ? sanitizeReadinessReason(input.reason) : undefined

  return {
    ok: dbOk,
    service: 'clientops-cms',
    checkedAt: new Date().toISOString(),
    runtime: {
      postgres_db: {
        status: input.database,
        reason
      },
      payload_runtime: {
        status: dbOk ? 'ok' : 'blocked',
        reason: dbOk ? undefined : reason
      }
    }
  }
}

export function sanitizeReadinessReason(reason: string): string {
  return reason.replace(/postgres:\/\/([^:@/]+):([^@/]+)@/gi, 'postgres://[redacted]@')
}
