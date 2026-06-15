import type { CollectionConfig } from 'payload'

import { denyAccess, isAdminOrEditor } from '@/access/isAdmin'
import { meshPolicyVersion, projectSlug, workflowEventTypes } from '@/lib/mesh-contracts'

const workflowEventTypeOptions = workflowEventTypes.map((eventType) => ({
  label: eventType
    .split('_')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' '),
  value: eventType
}))

export const WorkflowEvents: CollectionConfig = {
  slug: 'workflow-events',
  admin: {
    group: 'Workflow',
    useAsTitle: 'eventType',
    defaultColumns: ['eventType', 'correlationId', 'task', 'opportunityItem', 'occurredAt']
  },
  access: {
    create: denyAccess,
    read: isAdminOrEditor,
    update: denyAccess,
    delete: denyAccess
  },
  fields: [
    { name: 'task', type: 'relationship', relationTo: 'tasks' },
    { name: 'lead', type: 'relationship', relationTo: 'leads' },
    { name: 'opportunitySource', type: 'relationship', relationTo: 'opportunity-sources' },
    { name: 'opportunityRun', type: 'relationship', relationTo: 'opportunity-runs' },
    { name: 'opportunityItem', type: 'relationship', relationTo: 'opportunity-items' },
    { name: 'eventId', type: 'text', unique: true, required: true },
    {
      name: 'eventType',
      type: 'select',
      options: workflowEventTypeOptions,
      required: true
    },
    { name: 'occurredAt', type: 'date', required: true },
    { name: 'correlationId', type: 'text', index: true, required: true },
    { name: 'idempotencyKey', type: 'text', index: true, required: true },
    { name: 'projectSlug', type: 'text', defaultValue: projectSlug, required: true },
    { name: 'workflowRunId', type: 'text' },
    {
      name: 'actorType',
      type: 'select',
      options: [
        { label: 'System', value: 'system' },
        { label: 'Human', value: 'human' },
        { label: 'Mesh', value: 'mesh' },
        { label: 'Worker', value: 'worker' }
      ],
      defaultValue: 'system',
      required: true
    },
    { name: 'actorId', type: 'text', required: true },
    { name: 'policyVersion', type: 'text', defaultValue: meshPolicyVersion, required: true },
    { name: 'source', type: 'text', defaultValue: 'clientops-cms', required: true },
    { name: 'role', type: 'text' },
    { name: 'workerId', type: 'text' },
    { name: 'payload', type: 'json', defaultValue: {}, required: true },
    { name: 'result', type: 'json', defaultValue: {}, required: true },
    { name: 'error', type: 'json', defaultValue: {}, required: true },
    { name: 'attempt', type: 'number', defaultValue: 0 },
    { name: 'retryable', type: 'checkbox', defaultValue: false }
  ]
}
