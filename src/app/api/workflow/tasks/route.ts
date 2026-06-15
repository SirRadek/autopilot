import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { getMeshAuthHeader, isAuthorizedMeshRequest } from '@/lib/mesh-auth'
import { isCanonicalTaskState } from '@/lib/workflow'
import {
  appendWorkflowEvent,
  buildRetryUpdate,
  buildTaskClaimUpdate,
  canClaimTask,
  createWorkflowTask,
  shouldReleaseWorkerLock,
  validateWorkerLock,
  validateTaskTransition,
  type CreateTaskInput
} from '@/lib/workflow'
import type { MeshTaskState, WorkflowEventType } from '@/lib/mesh-contracts'

export const runtime = 'nodejs'

interface WorkflowTaskPatchInput {
  taskId?: unknown
  state?: unknown
  result?: unknown
  error?: unknown
  actorId?: unknown
  lockMs?: unknown
  manualOverrideReason?: unknown
}

interface WorkflowTaskRouteDoc extends Record<string, unknown> {
  id: string | number
  state: string
  attempt?: number
  maxAttempts?: number
  lockedBy?: string | null
  lockedUntil?: string | null
}

export function resolveWorkflowPatchActor(input: Pick<WorkflowTaskPatchInput, 'actorId' | 'manualOverrideReason'>):
  | { ok: true; actorId: string; actorType: 'human' | 'worker'; workerId?: string; manualOverrideReason: string }
  | { ok: false; error: string; status: number } {
  const actorId = stringValue(input.actorId)
  const manualOverrideReason = stringValue(input.manualOverrideReason)

  if (manualOverrideReason && !actorId) {
    return {
      ok: false,
      error: 'Human actorId is required when manualOverrideReason is supplied.',
      status: 400
    }
  }

  const resolvedActorId = actorId || 'clientops-worker'

  return {
    ok: true,
    actorId: resolvedActorId,
    actorType: manualOverrideReason ? 'human' : 'worker',
    workerId: manualOverrideReason ? undefined : resolvedActorId,
    manualOverrideReason
  }
}

export async function GET(request: Request) {
  const authHeader = getMeshAuthHeader(request)
  if (!isAuthorizedMeshRequest(authHeader, process.env.MESH_SERVICE_TOKEN)) {
    return Response.json({ ok: false, error: 'Unauthorized workflow request.' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const [tasks, events] = await Promise.all([
    payload.find({
      collection: 'tasks',
      depth: 1,
      limit: 50,
      overrideAccess: true,
      sort: '-updatedAt'
    }),
    payload.find({
      collection: 'workflow-events',
      depth: 1,
      limit: 50,
      overrideAccess: true,
      sort: '-createdAt'
    })
  ])

  return Response.json(
    {
      ok: true,
      tasks: tasks.docs,
      events: events.docs
    },
    { headers: { 'cache-control': 'no-store' } }
  )
}

export async function POST(request: Request) {
  const authHeader = getMeshAuthHeader(request)
  if (!isAuthorizedMeshRequest(authHeader, process.env.WORKFLOW_MUTATION_TOKEN)) {
    return Response.json({ ok: false, error: 'Unauthorized workflow mutation request.' }, { status: 401 })
  }

  let body: CreateTaskInput

  try {
    body = (await request.json()) as CreateTaskInput
  } catch {
    return Response.json({ ok: false, error: 'Request body is not valid JSON.' }, { status: 400 })
  }

  if (!body.title) {
    return Response.json({ ok: false, error: 'Task title is required.' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const task = await createWorkflowTask(payload, body)
  return Response.json({ ok: true, task }, { status: 201 })
}

export async function PATCH(request: Request) {
  const authHeader = getMeshAuthHeader(request)
  if (!isAuthorizedMeshRequest(authHeader, process.env.WORKFLOW_MUTATION_TOKEN)) {
    return Response.json({ ok: false, error: 'Unauthorized workflow mutation request.' }, { status: 401 })
  }

  let body: WorkflowTaskPatchInput

  try {
    body = (await request.json()) as WorkflowTaskPatchInput
  } catch {
    return Response.json({ ok: false, error: 'Request body is not valid JSON.' }, { status: 400 })
  }

  const taskId = stringValue(body.taskId)
  if (!taskId) {
    return Response.json({ ok: false, error: 'Task id is required.' }, { status: 400 })
  }

  const nextState = body.state
  if (!isCanonicalTaskState(nextState)) {
    return Response.json({ ok: false, error: 'Task state is unknown or not canonical.' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const taskResult = await payload.find({
    collection: 'tasks',
    where: {
      taskId: {
        equals: taskId
      }
    },
    limit: 1,
    overrideAccess: true
  })
  const task = taskResult.docs[0]

  if (!task) {
    return Response.json({ ok: false, error: 'Task was not found.' }, { status: 404 })
  }

  const actor = resolveWorkflowPatchActor(body)
  if (!actor.ok) {
    return Response.json({ ok: false, error: actor.error }, { status: actor.status })
  }

  const transition = validateTaskTransition({
    currentState: task.state,
    nextState,
    manualOverrideReason: actor.manualOverrideReason
  })

  if (!transition.ok) {
    return Response.json({ ok: false, error: transition.error }, { status: transition.status })
  }

  const errorPayload = objectValue(body.error)
  const resultPayload = objectValue(body.result)
  const now = new Date()
  const lockUpdate = buildLockPatchData({
    nextState,
    actorId: actor.actorId,
    lockMs: numberValue(body.lockMs),
    lockedBy: task.lockedBy,
    lockedUntil: task.lockedUntil,
    nextRetryAt: task.nextRetryAt,
    manualOverrideReason: actor.manualOverrideReason,
    now
  })

  if (!lockUpdate.ok) {
    return Response.json({ ok: false, error: lockUpdate.error }, { status: lockUpdate.status })
  }

  const taskPatch = buildTaskPatchData({
    state: nextState,
    resultPayload,
    errorPayload,
    attempt: numberValue(task.attempt) ?? 0,
    maxAttempts: Math.max(1, numberValue(task.maxAttempts) ?? 1)
  })
  const updateData = {
    ...taskPatch.data,
    ...lockUpdate.data,
    updatedAt: now.toISOString()
  }
  const updatedTask: WorkflowTaskRouteDoc | undefined =
    nextState === 'claimed' && !actor.manualOverrideReason
      ? await updateTaskClaimAtomically(payload, {
          actorId: actor.actorId,
          currentState: task.state,
          errorPayload,
          lockedUntil: stringValue(lockUpdate.data.lockedUntil),
          resultPayload,
          taskId: task.id,
          now
        })
      : await payload.update({
          collection: 'tasks',
          id: task.id,
          data: updateData,
          context: {
            skipManualOverrideAudit: true
          },
          overrideAccess: true
        }) as unknown as WorkflowTaskRouteDoc

  if (!updatedTask) {
    return Response.json({ ok: false, error: 'Task claim was not acquired because the task changed.' }, { status: 423 })
  }

  await appendWorkflowEvent(payload, {
    task: task.id,
    lead: relationshipId(task.lead),
    eventType: taskEventType({
      requestedState: nextState,
      actualState: taskPatch.state,
      transitionEventType: transition.eventType,
      attempt: numberValue(updatedTask.attempt) ?? 0,
      maxAttempts: Math.max(1, numberValue(updatedTask.maxAttempts) ?? 1)
    }),
    correlationId: task.correlationId ?? undefined,
    idempotencyKey: task.idempotencyKey ?? undefined,
    projectSlug: task.projectSlug ?? undefined,
    workflowRunId: task.workflowRunId ?? undefined,
    actorType: actor.actorType,
    actorId: actor.actorId,
    role: task.assignedRole,
    workerId: actor.workerId,
    payload: {
      taskId,
      previous_state: task.state,
      requested_state: nextState,
      next_state: taskPatch.state,
      locked_by: updatedTask.lockedBy ?? undefined,
      locked_until: updatedTask.lockedUntil ?? undefined,
      manual_override_reason: actor.manualOverrideReason || undefined
    },
    result: resultPayload,
    error: errorPayload,
    attempt: updatedTask.attempt,
    retryable: taskPatch.state === 'retrying'
  })

  return Response.json({ ok: true, task: updatedTask }, { status: 200 })
}

export function buildAtomicTaskClaimSql(input: {
  tableName?: string
  taskId: string | number
  currentState: string
  actorId: string
  lockedUntil: string
  resultPayload: Record<string, unknown>
  errorPayload: Record<string, unknown>
  now: Date
}): { text: string; values: unknown[] } {
  const now = input.now.toISOString()
  const tableName = quotePgIdentifierPath(input.tableName || 'tasks')

  return {
    text: [
      `UPDATE ${tableName}`,
      'SET "state" = $1,',
      '"locked_by" = $2,',
      '"locked_until" = $3,',
      '"result" = $4::jsonb,',
      '"error" = $5::jsonb,',
      '"updated_at" = $6',
      'WHERE "id" = $7',
      'AND "state" = $8',
      'AND ("locked_by" IS NULL OR "locked_by" = \'\' OR "locked_by" = $2 OR "locked_until" IS NULL OR "locked_until" <= $6)',
      'AND ("next_retry_at" IS NULL OR "next_retry_at" <= $6)',
      'RETURNING "id"'
    ].join(' '),
    values: [
      'claimed',
      input.actorId,
      input.lockedUntil,
      JSON.stringify(input.resultPayload),
      JSON.stringify(input.errorPayload),
      now,
      input.taskId,
      input.currentState
    ]
  }
}

async function updateTaskClaimAtomically(
  payload: Payload,
  input: {
    actorId: string
    currentState: string
    errorPayload: Record<string, unknown>
    lockedUntil: string
    resultPayload: Record<string, unknown>
    taskId: string | number
    now: Date
  }
): Promise<WorkflowTaskRouteDoc | undefined> {
  const query = buildAtomicTaskClaimSql({
    ...input,
    tableName: payload.db.tableNameMap.get('tasks') || 'tasks'
  })
  const updated = await payload.db.pool.query<{ id: string | number }>(query.text, query.values)
  const updatedId = updated.rows[0]?.id

  if (!updatedId) {
    return undefined
  }

  const task = await payload.findByID({
    collection: 'tasks',
    id: updatedId,
    overrideAccess: true
  })

  return task as unknown as WorkflowTaskRouteDoc
}

function quotePgIdentifierPath(value: string): string {
  return value
    .split('.')
    .filter(Boolean)
    .map((part) => `"${part.replace(/"/g, '""')}"`)
    .join('.')
}

function buildLockPatchData(input: {
  nextState: MeshTaskState
  actorId: string
  lockMs?: number
  lockedBy?: string | null
  lockedUntil?: string | null
  nextRetryAt?: string | null
  manualOverrideReason?: string
  now: Date
}): { ok: true; data: { lockedBy?: string | null; lockedUntil?: string | null } } | { ok: false; error: string; status: number } {
  if (input.nextState === 'claimed') {
    if (!input.actorId) {
      return { ok: false, error: 'Worker actorId is required to claim a task.', status: 400 }
    }

    const claimAllowed =
      Boolean(input.manualOverrideReason) ||
      canClaimTask({
        workerId: input.actorId,
        lockedBy: input.lockedBy,
        lockedUntil: input.lockedUntil,
        nextRetryAt: input.nextRetryAt,
        now: input.now
      })

    if (!claimAllowed) {
      return { ok: false, error: 'Task is already locked by another worker.', status: 423 }
    }

    const claim = buildTaskClaimUpdate({
      workerId: input.actorId,
      lockMs: input.lockMs,
      now: input.now
    })

    return { ok: true, data: { lockedBy: claim.lockedBy, lockedUntil: claim.lockedUntil } }
  }

  if (!input.manualOverrideReason) {
    const lock = validateWorkerLock({
      workerId: input.actorId,
      lockedBy: input.lockedBy,
      lockedUntil: input.lockedUntil,
      now: input.now
    })

    if (!lock.ok) {
      return lock
    }
  }

  if (shouldReleaseWorkerLock(input.nextState)) {
    return { ok: true, data: { lockedBy: null, lockedUntil: null } }
  }

  if (input.lockMs && input.actorId) {
    const renewal = buildTaskClaimUpdate({
      workerId: input.actorId,
      lockMs: input.lockMs,
      now: input.now
    })

    return { ok: true, data: { lockedBy: renewal.lockedBy, lockedUntil: renewal.lockedUntil } }
  }

  return { ok: true, data: {} }
}

function buildTaskPatchData(input: {
  state: MeshTaskState
  resultPayload: Record<string, unknown>
  errorPayload: Record<string, unknown>
  attempt: number
  maxAttempts: number
}): { state: MeshTaskState; data: Record<string, unknown> } {
  const errorCode = stringValue(input.errorPayload.code)
  const errorMessage = stringValue(input.errorPayload.message)

  if (input.state === 'retrying') {
    const retryUpdate = buildRetryUpdate({
      attempt: input.attempt,
      maxAttempts: input.maxAttempts,
      errorCode: errorCode || 'RETRYABLE_TASK_FAILURE',
      errorMessage: errorMessage || 'Retryable task failure.'
    })

    return {
      state: retryUpdate.state,
      data: {
        ...retryUpdate,
        result: input.resultPayload,
        error: input.errorPayload
      }
    }
  }

  return {
    state: input.state,
    data: {
      state: input.state,
      result: input.resultPayload,
      error: input.errorPayload,
      lastErrorCode: errorCode || undefined,
      lastErrorMessage: errorMessage || undefined,
      lastErrorAt: errorCode || errorMessage ? new Date().toISOString() : undefined
    }
  }
}

function taskEventType(input: {
  requestedState: MeshTaskState
  actualState: MeshTaskState
  transitionEventType: WorkflowEventType
  attempt: number
  maxAttempts: number
}): WorkflowEventType {
  if (input.transitionEventType === 'manual_override_applied') {
    return input.transitionEventType
  }

  if (input.requestedState === 'retrying' && input.actualState === 'failed' && input.attempt >= input.maxAttempts) {
    return 'task_dead_lettered'
  }

  return input.transitionEventType
}

function objectValue(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
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

function relationshipId(value: unknown): string | number | undefined {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' || typeof id === 'string' ? id : undefined
  }

  return undefined
}
