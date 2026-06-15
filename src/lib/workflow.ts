import { createHash, randomUUID } from 'node:crypto'

import type { Payload } from 'payload'

import type { LeadSubmission } from '@/lib/leads'
import { leadToCMSData, validateLeadSubmission } from '@/lib/leads'
import {
  createCorrelationId,
  createDeterministicTaskId,
  meshPolicyVersion,
  normalizeIdempotencyKey,
  projectSlug,
  taskStates,
  type MeshTaskState,
  type WorkflowEventType
} from '@/lib/mesh-contracts'

export interface CreateLeadWorkflowResult {
  leadId: string
  taskId: string
  correlationId: string
  deduplicated: boolean
  collision?: boolean
}

type TaskType = 'lead_review' | 'project_intake' | 'content_update' | 'implementation' | 'qa' | 'manual'
type AssignedRole = 'orchestrator' | 'analyst' | 'frontend' | 'backend' | 'qa' | 'owner'
type LegacyTaskState = 'new' | 'ready' | 'in_progress' | 'dropped'
type TaskState = MeshTaskState | LegacyTaskState
type ActorType = 'system' | 'human' | 'mesh' | 'worker'
const defaultWorkerLockMs = 15 * 60 * 1000
const leadReviewPayloadIdPrefix = 'sha256:'

type LeadCanonicalField =
  | 'name'
  | 'email'
  | 'company'
  | 'projectType'
  | 'audience'
  | 'deadline'
  | 'currentUrl'
  | 'budgetRange'
  | 'message'
  | 'sourcePath'
  | 'referrer'
  | 'locale'

const leadComparisonFields = [
  ['name', 'name'],
  ['email', 'email'],
  ['company', 'company'],
  ['projectType', 'project_type'],
  ['audience', 'audience'],
  ['deadline', 'deadline'],
  ['currentUrl', 'current_url'],
  ['budgetRange', 'budget_range'],
  ['message', 'message'],
  ['sourcePath', 'source_path'],
  ['referrer', 'referrer'],
  ['locale', 'locale']
] as const satisfies ReadonlyArray<readonly [LeadCanonicalField, keyof LeadSubmission]>

interface StableTaskIdInput {
  correlationId: string
  idempotencyKey: string
  subjectId: string
}

export interface CreateTaskInput {
  title: string
  taskType?: TaskType
  assignedRole?: AssignedRole
  priority?: number
  state?: TaskState
  payload?: Record<string, unknown>
  result?: Record<string, unknown>
  error?: Record<string, unknown>
  lead?: string | number
  client?: string | number
  project?: string | number
  correlationId?: string
  idempotencyKey?: string
  sourceTaskId?: string
  projectSlug?: string
  workflowRunId?: string
  subjectId?: string
}

export interface AppendWorkflowEventInput {
  task?: string | number
  lead?: string | number
  opportunitySource?: string | number
  opportunityRun?: string | number
  opportunityItem?: string | number
  eventType: WorkflowEventType
  correlationId?: string
  idempotencyKey?: string
  projectSlug?: string
  workflowRunId?: string
  actorType?: ActorType
  actorId?: string
  role?: string
  workerId?: string
  payload?: Record<string, unknown>
  result?: Record<string, unknown>
  error?: Record<string, unknown>
  attempt?: number
  retryable?: boolean
}

export function createTaskId(prefix: string, seedOrNow: StableTaskIdInput | Date = new Date()): string {
  if (!(seedOrNow instanceof Date)) {
    return createDeterministicTaskId({
      taskType: prefix,
      correlationId: seedOrNow.correlationId,
      idempotencyKey: seedOrNow.idempotencyKey,
      subjectId: seedOrNow.subjectId
    })
  }

  const now = seedOrNow
  const stamp = now.toISOString().replace(/\D/g, '').slice(0, 14)
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${stamp}-${random}`.toUpperCase()
}

export function buildLeadReviewTask(
  lead: LeadSubmission,
  leadId: string | number,
  metadata: Pick<CreateTaskInput, 'correlationId' | 'idempotencyKey' | 'projectSlug'> = {}
): CreateTaskInput {
  const priorityReason = lead.budget_range || lead.deadline ? 'lead_has_budget_or_deadline' : 'standard_lead_triage'

  return {
    title: `Review lead: ${lead.project_type} (#${String(leadId)})`,
    taskType: 'lead_review',
    assignedRole: 'orchestrator',
    priority: lead.budget_range || lead.deadline ? 700 : 500,
    state: 'queued',
    lead: leadId,
    correlationId: metadata.correlationId,
    idempotencyKey: metadata.idempotencyKey,
    projectSlug: metadata.projectSlug,
    subjectId: String(leadId),
    payload: {
      source: 'public_lead_api',
      lead_id: String(leadId),
      correlation_id: metadata.correlationId,
      idempotency_key: createPayloadFingerprint(metadata.idempotencyKey),
      project_type: lead.project_type,
      priority_reason: priorityReason,
      source_path: lead.source_path,
      next_action: 'qualify_lead_and_convert_to_project_intake'
    }
  }
}

export async function createLeadWorkflow(payload: Payload, input: unknown): Promise<CreateLeadWorkflowResult> {
  const validation = validateLeadSubmission(input)
  if (!validation.ok) {
    throw new LeadValidationError(validation.errors)
  }

  const lead = validation.data
  const leadData = leadToCMSData(lead, input)
  const existingLead = await findLeadByDedupeKey(payload, leadData.dedupeKey)

  if (existingLead) {
    if (!leadMatchesExisting(existingLead, lead)) {
      const collisionTask = await createLeadCollisionTask(payload, existingLead, lead, leadData)
      return {
        leadId: String(existingLead.id),
        taskId: collisionTask.taskId,
        correlationId: leadData.correlationId,
        deduplicated: false,
        collision: true
      }
    }

    const existingTask = await findTaskForLead(payload, existingLead)
    if (existingTask) {
      return {
        leadId: String(existingLead.id),
        taskId: String(existingTask.taskId),
        correlationId: existingString(existingLead, 'correlationId') || leadData.correlationId,
        deduplicated: true
      }
    }

    const task = await createWorkflowTask(
      payload,
      buildLeadReviewTask(lead, existingLead.id, {
        correlationId: existingString(existingLead, 'correlationId') || leadData.correlationId,
        idempotencyKey: existingString(existingLead, 'idempotencyKey') || leadData.idempotencyKey,
        projectSlug: existingString(existingLead, 'projectSlug') || leadData.projectSlug
      }),
      'lead_received'
    )

    await payload.update({
      collection: 'leads',
      id: existingLead.id,
      data: {
        workflowTask: task.id,
        status: 'reviewing'
      },
      context: {
        skipManualOverrideAudit: true
      },
      overrideAccess: true
    })

    return {
      leadId: String(existingLead.id),
      taskId: task.taskId,
      correlationId: existingString(existingLead, 'correlationId') || leadData.correlationId,
      deduplicated: true
    }
  }

  const createdLead = await payload.create({
    collection: 'leads',
    data: leadData,
    draft: false,
    overrideAccess: true
  })

  const leadId = String(createdLead.id)
  const taskInput = buildLeadReviewTask(lead, createdLead.id, {
    correlationId: leadData.correlationId,
    idempotencyKey: leadData.idempotencyKey,
    projectSlug: leadData.projectSlug
  })
  const task = await createWorkflowTask(payload, taskInput, 'lead_received')

  await payload.update({
    collection: 'leads',
    id: createdLead.id,
    data: {
      workflowTask: task.id,
      status: 'reviewing'
    },
    context: {
      skipManualOverrideAudit: true
    },
    overrideAccess: true
  })

  return {
    leadId,
    taskId: task.taskId,
    correlationId: leadData.correlationId,
    deduplicated: false
  }
}

export async function createWorkflowTask(
  payload: Payload,
  input: CreateTaskInput,
  eventType: WorkflowEventType = 'task_created'
) {
  const taskType = input.taskType ?? 'manual'
  const correlationId = input.correlationId || createCorrelationId()
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey)
  const subjectId = input.subjectId ?? String(input.lead ?? input.client ?? input.project ?? input.title)
  const taskId =
    input.sourceTaskId ||
    (idempotencyKey
      ? createTaskId(taskType, {
          correlationId,
          idempotencyKey,
          subjectId
        })
      : createTaskId(taskType))
  const existingTask = await findTaskByTaskId(payload, taskId)
  if (existingTask) {
    return existingTask
  }

  const task = await payload.create({
    collection: 'tasks',
    data: {
      taskId,
      correlationId,
      idempotencyKey,
      sourceTaskId: input.sourceTaskId,
      projectSlug: input.projectSlug ?? projectSlug,
      workflowRunId: input.workflowRunId,
      title: input.title,
      taskType,
      assignedRole: input.assignedRole ?? 'orchestrator',
      priority: input.priority ?? 100,
      state: input.state ?? 'queued',
      attempt: 0,
      maxAttempts: 3,
      payload: input.payload ?? {},
      result: input.result ?? {},
      lead: toRelationshipId(input.lead),
      client: toRelationshipId(input.client),
      project: toRelationshipId(input.project)
    },
    draft: false,
    overrideAccess: true
  })

  await appendWorkflowEvent(payload, {
    task: task.id,
    lead: input.lead,
    eventType,
    correlationId,
    idempotencyKey,
    projectSlug: input.projectSlug,
    workflowRunId: input.workflowRunId,
    actorType: 'system',
    actorId: 'clientops-cms',
    role: input.assignedRole ?? 'orchestrator',
    workerId: 'clientops-cms',
    payload: {
      ...(input.payload ?? {}),
      taskId,
      taskType,
      title: input.title
    },
    result: input.result ?? {},
    error: input.error ?? {},
    attempt: 0,
    retryable: false
  })

  return task
}

export async function appendWorkflowEvent(payload: Payload, input: AppendWorkflowEventInput) {
  const eventId = randomUUID()
  const correlationId = input.correlationId || createCorrelationId()

  return payload.create({
    collection: 'workflow-events',
    data: {
      eventId,
      task: toRelationshipId(input.task),
      lead: toRelationshipId(input.lead),
      opportunitySource: toRelationshipId(input.opportunitySource),
      opportunityRun: toRelationshipId(input.opportunityRun),
      opportunityItem: toRelationshipId(input.opportunityItem),
      eventType: input.eventType,
      occurredAt: new Date().toISOString(),
      correlationId,
      idempotencyKey: normalizeIdempotencyKey(input.idempotencyKey) || `event:${eventId}`,
      projectSlug: input.projectSlug?.trim() || projectSlug,
      workflowRunId: input.workflowRunId,
      actorType: input.actorType ?? 'system',
      actorId: input.actorId || 'clientops-cms',
      policyVersion: meshPolicyVersion,
      source: 'clientops-cms',
      role: input.role,
      workerId: input.workerId,
      payload: input.payload ?? {},
      result: input.result ?? {},
      error: input.error ?? {},
      attempt: input.attempt ?? 0,
      retryable: input.retryable ?? false
    },
    draft: false,
    overrideAccess: true
  })
}

export function buildRetryUpdate(input: {
  attempt: number
  maxAttempts: number
  errorCode: string
  errorMessage: string
}) {
  const nextAttempt = input.attempt + 1
  const exhausted = nextAttempt >= input.maxAttempts
  const retryDelayMs = exhausted ? 0 : Math.min(60000, 1000 * 2 ** nextAttempt)

  return {
    state: exhausted ? ('failed' as const) : ('retrying' as const),
    attempt: nextAttempt,
    nextRetryAt: exhausted ? undefined : new Date(Date.now() + retryDelayMs).toISOString(),
    lastRetryAt: new Date().toISOString(),
    lastErrorCode: input.errorCode,
    lastErrorMessage: input.errorMessage,
    lastErrorAt: new Date().toISOString(),
    retryDelayMs
  }
}

export function buildDeadLetterUpdate(input: { attempt: number; errorCode: string; errorMessage: string }) {
  return {
    state: 'failed' as const,
    attempt: input.attempt,
    lastErrorCode: input.errorCode,
    lastErrorMessage: input.errorMessage,
    lastErrorAt: new Date().toISOString(),
    retryDelayMs: 0
  }
}

export function buildTaskClaimUpdate(input: { workerId: string; now?: Date; lockMs?: number }) {
  const now = input.now ?? new Date()
  const lockMs = normalizeLockMs(input.lockMs)

  return {
    state: 'claimed' as const,
    lockedBy: input.workerId,
    lockedUntil: new Date(now.getTime() + lockMs).toISOString()
  }
}

export function canClaimTask(input: {
  lockedBy?: string | null
  lockedUntil?: string | null
  nextRetryAt?: string | null
  workerId: string
  now?: Date
}): boolean {
  if (!input.workerId.trim()) {
    return false
  }

  if (!isRetryWindowOpen(input.nextRetryAt, input.now)) {
    return false
  }

  if (!input.lockedBy) {
    return true
  }

  if (input.lockedBy === input.workerId) {
    return true
  }

  return isTaskLockExpired(input.lockedUntil, input.now)
}

export function validateWorkerLock(input: {
  lockedBy?: string | null
  lockedUntil?: string | null
  workerId: string
  now?: Date
  manualOverrideReason?: string
}): { ok: true } | { ok: false; error: string; status: number } {
  if (input.manualOverrideReason?.trim()) {
    return { ok: true }
  }

  if (!input.workerId.trim()) {
    return { ok: false, error: 'Worker actorId is required for task state changes.', status: 400 }
  }

  if (input.lockedBy !== input.workerId) {
    return { ok: false, error: 'Task is not locked by this worker.', status: 423 }
  }

  if (isTaskLockExpired(input.lockedUntil, input.now)) {
    return { ok: false, error: 'Task lock has expired.', status: 423 }
  }

  return { ok: true }
}

export function shouldReleaseWorkerLock(state: MeshTaskState): boolean {
  return ['queued', 'waiting_owner', 'retrying', 'blocked', 'done', 'failed', 'cancelled'].includes(state)
}

export function isCanonicalTaskState(value: unknown): value is MeshTaskState {
  return typeof value === 'string' && taskStates.includes(value as MeshTaskState)
}

export function normalizeTaskStateForTransition(value: string): MeshTaskState | undefined {
  if (isCanonicalTaskState(value)) {
    return value
  }

  const legacyMap: Record<LegacyTaskState, MeshTaskState> = {
    new: 'queued',
    ready: 'queued',
    in_progress: 'running',
    dropped: 'cancelled'
  }

  return legacyMap[value as LegacyTaskState]
}

export function validateTaskTransition(input: {
  currentState: string
  nextState: MeshTaskState
  manualOverrideReason?: string
}): { ok: true; eventType: WorkflowEventType } | { ok: false; error: string; status: number } {
  const currentState = normalizeTaskStateForTransition(input.currentState)
  if (!currentState) {
    return { ok: false, error: `Current task state is unknown: ${input.currentState}`, status: 409 }
  }

  if (currentState === input.nextState) {
    return { ok: true, eventType: taskEventTypeForState(input.nextState) }
  }

  const terminalStates = new Set<MeshTaskState>(['done', 'failed', 'cancelled'])
  const hasManualOverride = Boolean(input.manualOverrideReason?.trim())

  if (terminalStates.has(currentState) && !hasManualOverride) {
    return {
      ok: false,
      error: `Manual override reason is required to move a ${currentState} task.`,
      status: 409
    }
  }

  if (hasManualOverride) {
    return { ok: true, eventType: 'manual_override_applied' }
  }

  const allowedTransitions: Record<MeshTaskState, MeshTaskState[]> = {
    queued: ['claimed', 'running', 'waiting_owner', 'blocked', 'done', 'failed', 'cancelled'],
    claimed: ['running', 'waiting_owner', 'retrying', 'blocked', 'done', 'failed', 'cancelled'],
    running: ['waiting_owner', 'retrying', 'blocked', 'done', 'failed', 'cancelled'],
    waiting_owner: ['queued', 'claimed', 'running', 'blocked', 'failed', 'cancelled'],
    retrying: ['queued', 'claimed', 'running', 'failed', 'cancelled'],
    blocked: ['queued', 'claimed', 'running', 'failed', 'cancelled'],
    done: [],
    failed: [],
    cancelled: []
  }

  if (!allowedTransitions[currentState].includes(input.nextState)) {
    return {
      ok: false,
      error: `Invalid task state transition: ${currentState} -> ${input.nextState}`,
      status: 409
    }
  }

  return { ok: true, eventType: taskEventTypeForState(input.nextState) }
}

function taskEventTypeForState(state: MeshTaskState): WorkflowEventType {
  const eventTypes: Record<MeshTaskState, WorkflowEventType> = {
    queued: 'task_progress',
    claimed: 'task_claimed',
    running: 'task_started',
    waiting_owner: 'task_progress',
    retrying: 'task_retry_scheduled',
    blocked: 'task_blocked',
    done: 'task_succeeded',
    failed: 'task_failed',
    cancelled: 'task_cancelled'
  }

  return eventTypes[state]
}

function isTaskLockExpired(lockedUntil: string | null | undefined, now = new Date()): boolean {
  if (!lockedUntil) {
    return true
  }

  const expiry = new Date(lockedUntil)
  if (Number.isNaN(expiry.getTime())) {
    return true
  }

  return expiry.getTime() <= now.getTime()
}

function isRetryWindowOpen(nextRetryAt: string | null | undefined, now = new Date()): boolean {
  if (!nextRetryAt) {
    return true
  }

  const retryAt = new Date(nextRetryAt)
  if (Number.isNaN(retryAt.getTime())) {
    return false
  }

  return retryAt.getTime() <= now.getTime()
}

function normalizeLockMs(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return defaultWorkerLockMs
  }

  return Math.min(Math.max(Math.trunc(value), 30_000), 60 * 60 * 1000)
}

async function findLeadByDedupeKey(payload: Payload, dedupeKey: string) {
  const result = await payload.find({
    collection: 'leads',
    where: {
      dedupeKey: {
        equals: dedupeKey
      }
    },
    limit: 1,
    overrideAccess: true
  })

  return result.docs[0]
}

async function findTaskByTaskId(payload: Payload, taskId: string) {
  const result = await payload.find({
    collection: 'tasks',
    where: {
      taskId: {
        equals: taskId
      }
    },
    limit: 1,
    overrideAccess: true
  })

  return result.docs[0]
}

async function findTaskForLead(payload: Payload, lead: { id: string | number; workflowTask?: unknown }) {
  const taskId = taskIdFromRelationship(lead.workflowTask)
  if (taskId) {
    return taskId
  }

  const workflowTaskId = relationshipId(lead.workflowTask)
  if (workflowTaskId !== undefined) {
    const result = await payload.find({
      collection: 'tasks',
      where: {
        id: {
          equals: workflowTaskId
        }
      },
      limit: 1,
      overrideAccess: true
    })
    if (result.docs[0]) {
      return result.docs[0]
    }
  }

  const result = await payload.find({
    collection: 'tasks',
    where: {
      lead: {
        equals: lead.id
      }
    },
    limit: 1,
    overrideAccess: true,
    sort: '-createdAt'
  })

  return result.docs[0]
}

async function createLeadCollisionTask(
  payload: Payload,
  existingLead: { id: string | number },
  submittedLead: LeadSubmission,
  leadData: ReturnType<typeof leadToCMSData>
) {
  const mismatchedFields = leadMismatchFields(existingLead, submittedLead)

  return createWorkflowTask(
    payload,
    {
      title: `Review lead idempotency collision (#${String(existingLead.id)})`,
      taskType: 'lead_review',
      assignedRole: 'owner',
      priority: 900,
      state: 'blocked',
      lead: existingLead.id,
      sourceTaskId: createTaskId('lead_review', {
        correlationId: 'dedupe-collision',
        idempotencyKey: leadData.idempotencyKey,
        subjectId: `collision:${leadData.dedupeKey}`
      }),
      correlationId: leadData.correlationId,
      idempotencyKey: leadData.idempotencyKey,
      projectSlug: leadData.projectSlug,
      subjectId: `collision:${leadData.dedupeKey}`,
      payload: {
        source: 'public_lead_api',
        collision: true,
        existing_lead_id: String(existingLead.id),
        correlation_id: leadData.correlationId,
        idempotency_key: createPayloadFingerprint(leadData.idempotencyKey),
        mismatched_fields: mismatchedFields,
        next_action: 'manual_review_idempotency_collision'
      }
    },
    'task_blocked'
  )
}

function leadMatchesExisting(existingLead: unknown, lead: LeadSubmission): boolean {
  return leadMismatchFields(existingLead, lead).length === 0
}

function leadMismatchFields(existingLead: unknown, lead: LeadSubmission): LeadCanonicalField[] {
  return leadComparisonFields
    .filter(([existingField, submittedField]) => {
      const current = normalizeLeadComparableValue(existingField, existingString(existingLead, existingField))
      const submitted = normalizeLeadComparableValue(existingField, lead[submittedField])
      return current !== submitted
    })
    .map(([field]) => field)
}

function normalizeLeadComparableValue(field: LeadCanonicalField, value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return field === 'email' ? normalized.toLowerCase() : normalized
}

function createPayloadFingerprint(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  return `${leadReviewPayloadIdPrefix}${createHash('sha256').update(value).digest('hex').slice(0, 16)}`
}

function taskIdFromRelationship(value: unknown) {
  if (typeof value === 'object' && value !== null && 'taskId' in value) {
    const taskId = (value as { taskId?: unknown }).taskId
    if (typeof taskId === 'string') {
      return value as { id: string | number; taskId: string }
    }
  }

  return undefined
}

function relationshipId(value: unknown): string | number | undefined {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' || typeof id === 'number' ? id : undefined
  }

  return undefined
}

function existingString(source: unknown, key: string): string {
  if (typeof source === 'object' && source !== null && key in source) {
    const value = (source as Record<string, unknown>)[key]
    return typeof value === 'string' ? value : ''
  }

  return ''
}

function toRelationshipId(value: string | number | undefined): number | undefined {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    return /^\d+$/.test(value) ? Number(value) : undefined
  }

  return undefined
}

export class LeadValidationError extends Error {
  constructor(readonly errors: string[]) {
    super('Lead validation failed.')
  }
}
