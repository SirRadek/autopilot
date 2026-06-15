import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '@/access/isAdmin'

export const OpportunityRuns: CollectionConfig = {
  slug: 'opportunity-runs',
  admin: {
    group: 'Opportunities',
    useAsTitle: 'sourceRunId',
    defaultColumns: ['sourceKey', 'sourceRunId', 'state', 'createdCount', 'duplicateCount', 'collisionCount']
  },
  access: {
    create: isAuthenticated,
    read: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  fields: [
    { name: 'source', type: 'relationship', relationTo: 'opportunity-sources' },
    { name: 'sourceKey', type: 'text', required: true, index: true },
    { name: 'sourceRunId', type: 'text', required: true },
    { name: 'idempotencyKey', type: 'text', required: true, index: true },
    { name: 'dedupeKey', type: 'text', required: true, unique: true },
    { name: 'correlationId', type: 'text', index: true },
    {
      name: 'state',
      type: 'select',
      defaultValue: 'running',
      options: [
        { label: 'Running', value: 'running' },
        { label: 'Completed', value: 'completed' },
        { label: 'Completed With Blocks', value: 'completed_with_blocks' },
        { label: 'Failed', value: 'failed' }
      ],
      required: true
    },
    { name: 'startedAt', type: 'date' },
    { name: 'finishedAt', type: 'date' },
    { name: 'totalCount', type: 'number', defaultValue: 0 },
    { name: 'createdCount', type: 'number', defaultValue: 0 },
    { name: 'duplicateCount', type: 'number', defaultValue: 0 },
    { name: 'collisionCount', type: 'number', defaultValue: 0 },
    { name: 'error', type: 'json', defaultValue: {} }
  ]
}
