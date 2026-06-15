import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { isAdminOrEditor } from '@/access/isAdmin'
import { projectSlug, taskStates } from '@/lib/mesh-contracts'
import { appendWorkflowEvent } from '@/lib/workflow'

const legacyTaskStates = ['new', 'ready', 'in_progress', 'dropped'] as const
const taskStateOptions = [...taskStates, ...legacyTaskStates].map((state) => ({
  label: state
    .split('_')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' '),
  value: state
}))

const auditTaskStateChange: CollectionAfterChangeHook = async ({ doc, operation, previousDoc, req }) => {
  if (operation !== 'update' || shouldSkipManualOverrideAudit(req.context)) {
    return
  }

  const previousState = stringValue(previousDoc?.state)
  const nextState = stringValue(doc.state)
  if (!previousState || previousState === nextState) {
    return
  }

  try {
    await appendWorkflowEvent(req.payload, {
      task: doc.id,
      lead: relationshipId(doc.lead),
      eventType: 'manual_override_applied',
      correlationId: stringValue(doc.correlationId),
      idempotencyKey: stringValue(doc.idempotencyKey),
      projectSlug: stringValue(doc.projectSlug) || projectSlug,
      workflowRunId: stringValue(doc.workflowRunId),
      actorType: 'human',
      actorId: actorId(req.user),
      payload: {
        reason: 'payload_admin_state_change',
        collection: 'tasks',
        document_id: String(doc.id),
        task_id: stringValue(doc.taskId),
        field: 'state',
        previous_value: previousState,
        new_value: nextState
      }
    })
  } catch (error) {
    console.warn('Failed to append task manual override audit event', error)
  }
}

export const Tasks: CollectionConfig = {
  slug: 'tasks',
  admin: {
    group: 'Workflow',
    useAsTitle: 'title',
    defaultColumns: ['title', 'state', 'assignedRole', 'priority', 'updatedAt']
  },
  access: {
    create: isAdminOrEditor,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor
  },
  hooks: {
    afterChange: [auditTaskStateChange]
  },
  fields: [
    { name: 'taskId', type: 'text', required: true, unique: true },
    { name: 'correlationId', type: 'text', index: true },
    { name: 'idempotencyKey', type: 'text', index: true },
    { name: 'sourceTaskId', type: 'text' },
    { name: 'projectSlug', type: 'text', defaultValue: projectSlug },
    { name: 'workflowRunId', type: 'text' },
    { name: 'title', type: 'text', required: true },
    {
      name: 'taskType',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Lead Review', value: 'lead_review' },
        { label: 'Project Intake', value: 'project_intake' },
        { label: 'Content Update', value: 'content_update' },
        { label: 'Implementation', value: 'implementation' },
        { label: 'QA', value: 'qa' },
        { label: 'Manual', value: 'manual' }
      ],
      required: true
    },
    {
      name: 'state',
      type: 'select',
      defaultValue: 'queued',
      options: taskStateOptions,
      required: true
    },
    {
      name: 'assignedRole',
      type: 'select',
      defaultValue: 'orchestrator',
      options: [
        { label: 'Orchestrator', value: 'orchestrator' },
        { label: 'Analyst', value: 'analyst' },
        { label: 'Frontend', value: 'frontend' },
        { label: 'Backend', value: 'backend' },
        { label: 'QA', value: 'qa' },
        { label: 'Owner', value: 'owner' }
      ],
      required: true
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 100,
      required: true
    },
    { name: 'attempt', type: 'number', defaultValue: 0, required: true },
    { name: 'maxAttempts', type: 'number', defaultValue: 3, required: true },
    { name: 'nextRetryAt', type: 'date' },
    { name: 'lastRetryAt', type: 'date' },
    { name: 'retryDelayMs', type: 'number', defaultValue: 0 },
    { name: 'lockedBy', type: 'text' },
    { name: 'lockedUntil', type: 'date' },
    { name: 'lastErrorCode', type: 'text' },
    { name: 'lastErrorMessage', type: 'textarea' },
    { name: 'lastErrorAt', type: 'date' },
    { name: 'client', type: 'relationship', relationTo: 'clients' },
    { name: 'project', type: 'relationship', relationTo: 'projects' },
    { name: 'lead', type: 'relationship', relationTo: 'leads' },
    {
      name: 'dependsOn',
      type: 'relationship',
      relationTo: 'tasks',
      hasMany: true
    },
    { name: 'payload', type: 'json', defaultValue: {} },
    { name: 'result', type: 'json', defaultValue: {} },
    { name: 'error', type: 'json', defaultValue: {} },
    { name: 'dueAt', type: 'date' },
    { name: 'notes', type: 'textarea' }
  ]
}

function shouldSkipManualOverrideAudit(context: unknown): boolean {
  return typeof context === 'object' && context !== null && Boolean((context as Record<string, unknown>).skipManualOverrideAudit)
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

function actorId(user: unknown): string {
  if (typeof user === 'object' && user !== null) {
    const record = user as Record<string, unknown>
    if (typeof record.email === 'string') {
      return record.email
    }
    if (typeof record.id === 'number' || typeof record.id === 'string') {
      return String(record.id)
    }
  }

  return 'payload-admin'
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
