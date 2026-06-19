import { createHash, randomUUID } from 'node:crypto'

export const projectSlug = 'clientops-cms'
export const meshPolicyVersion = 'clientops-cms-mesh-v1'

export const workflowEventTypes = [
  'lead_received',
  'lead_rejected',
  'task_created',
  'task_claimed',
  'task_started',
  'task_progress',
  'task_retry_scheduled',
  'task_succeeded',
  'task_failed',
  'task_dead_lettered',
  'task_cancelled',
  'task_blocked',
  'manual_override_applied',
  'mesh_policy_checked',
  'advisory_consult_prepared',
  'advisory_consult_completed',
  'opportunity_import_run_started',
  'opportunity_imported',
  'opportunity_duplicate_skipped',
  'opportunity_collision_blocked',
  'opportunity_review_decision',
  'opportunity_response_recorded',
  'opportunity_converted',
  'opportunity_personal_data_purged',
  'opportunity_source_blocked'
] as const

export type WorkflowEventType = (typeof workflowEventTypes)[number]

export const taskStates = [
  'queued',
  'claimed',
  'running',
  'waiting_owner',
  'retrying',
  'blocked',
  'done',
  'failed',
  'cancelled'
] as const

export type MeshTaskState = (typeof taskStates)[number]

export function createCorrelationId(): string {
  return randomUUID()
}

export function normalizeIdempotencyKey(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase().slice(0, 180) : ''
}

export function createDeterministicTaskId(input: {
  taskType: string
  correlationId: string
  idempotencyKey: string
  subjectId: string
}): string {
  const seed = [input.taskType, input.correlationId, input.idempotencyKey, input.subjectId].join('|')
  const digest = createHash('sha256').update(seed).digest('hex').slice(0, 12).toUpperCase()
  const prefix = input.taskType.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toUpperCase()
  return `${prefix}-${digest}`
}
