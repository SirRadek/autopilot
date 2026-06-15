import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '@/access/isAdmin'
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
    create: isAuthenticated,
    read: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  fields: [
    { name: 'task', type: 'relationship', relationTo: 'tasks' },
    { name: 'lead', type: 'relationship', relationTo: 'leads' },
    { name: 'opportunitySource', type: 'relationship', relationTo: 'opportunity-sources' },
    { name: 'opportunityRun', type: 'relationship', relationTo: 'opportunity-runs' },
    { name: 'opportunityItem', type: 'relationship', relationTo: 'opportunity-items' },
    { name: 'eventId', type: 'text', unique: true },
    {
      name: 'eventType',
      type: 'select',
      options: workflowEventTypeOptions,
      required: true
    },
    { name: 'occurredAt', type: 'date' },
    { name: 'correlationId', type: 'text', index: true },
    { name: 'idempotencyKey', type: 'text', index: true },
    { name: 'projectSlug', type: 'text', defaultValue: projectSlug },
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
      defaultValue: 'system'
    },
    { name: 'actorId', type: 'text' },
    { name: 'policyVersion', type: 'text', defaultValue: meshPolicyVersion },
    { name: 'source', type: 'text', defaultValue: 'clientops-cms' },
    { name: 'role', type: 'text' },
    { name: 'workerId', type: 'text' },
    { name: 'payload', type: 'json', defaultValue: {} },
    { name: 'result', type: 'json', defaultValue: {} },
    { name: 'error', type: 'json', defaultValue: {} },
    { name: 'attempt', type: 'number', defaultValue: 0 },
    { name: 'retryable', type: 'checkbox', defaultValue: false }
  ]
}
