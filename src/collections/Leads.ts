import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { isAdminOrEditor } from '@/access/isAdmin'
import { projectSlug } from '@/lib/mesh-contracts'
import { appendWorkflowEvent } from '@/lib/workflow'

const auditLeadStatusChange: CollectionAfterChangeHook = async ({ doc, operation, previousDoc, req }) => {
  if (operation !== 'update' || shouldSkipManualOverrideAudit(req.context)) {
    return
  }

  const previousStatus = stringValue(previousDoc?.status)
  const nextStatus = stringValue(doc.status)
  if (!previousStatus || previousStatus === nextStatus) {
    return
  }

  try {
    await appendWorkflowEvent(req.payload, {
      lead: doc.id,
      task: relationshipId(doc.workflowTask),
      eventType: 'manual_override_applied',
      correlationId: stringValue(doc.correlationId),
      idempotencyKey: stringValue(doc.idempotencyKey),
      projectSlug: stringValue(doc.projectSlug) || projectSlug,
      actorType: 'human',
      actorId: actorId(req.user),
      payload: {
        reason: 'payload_admin_state_change',
        collection: 'leads',
        document_id: String(doc.id),
        field: 'status',
        previous_value: previousStatus,
        new_value: nextStatus
      }
    })
  } catch (error) {
    console.warn('Failed to append lead manual override audit event', error)
  }
}

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    group: 'ClientOps',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'projectType', 'status', 'createdAt']
  },
  access: {
    create: isAdminOrEditor,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor
  },
  hooks: {
    afterChange: [auditLeadStatusChange]
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'company', type: 'text' },
    { name: 'projectType', type: 'text', required: true },
    { name: 'audience', type: 'text' },
    { name: 'deadline', type: 'text' },
    { name: 'currentUrl', type: 'text' },
    { name: 'budgetRange', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Proposal', value: 'proposal' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
        { label: 'Spam', value: 'spam' },
        { label: 'Queued', value: 'queued' },
        { label: 'Working', value: 'working' },
        { label: 'Blocked', value: 'blocked' },
        { label: 'Closed', value: 'closed' },
        { label: 'Failed', value: 'failed' }
      ],
      required: true
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'normal',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' }
      ],
      required: true
    },
    { name: 'client', type: 'relationship', relationTo: 'clients' },
    { name: 'project', type: 'relationship', relationTo: 'projects' },
    { name: 'site', type: 'relationship', relationTo: 'sites' },
    { name: 'form', type: 'relationship', relationTo: 'forms' },
    { name: 'sourcePath', type: 'text' },
    { name: 'referrer', type: 'text' },
    { name: 'locale', type: 'text' },
    { name: 'correlationId', type: 'text', index: true },
    { name: 'idempotencyKey', type: 'text', index: true },
    { name: 'dedupeKey', type: 'text', unique: true },
    { name: 'source', type: 'text', defaultValue: 'public_lead_api' },
    { name: 'projectSlug', type: 'text', defaultValue: projectSlug },
    { name: 'meshRunId', type: 'text' },
    { name: 'utm', type: 'json', defaultValue: {} },
    { name: 'rawPayload', type: 'json', defaultValue: {} },
    { name: 'workflowTask', type: 'relationship', relationTo: 'tasks' },
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
