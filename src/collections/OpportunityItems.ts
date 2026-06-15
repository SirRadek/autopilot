import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '@/access/isAdmin'

const opportunityStatuses = ['new', 'reviewing', 'blocked', 'responded', 'converted', 'ignored', 'purged'] as const
const sourceStatuses = ['open', 'closed', 'unknown'] as const

export const OpportunityItems: CollectionConfig = {
  slug: 'opportunity-items',
  admin: {
    group: 'Opportunities',
    useAsTitle: 'title',
    defaultColumns: ['title', 'sourceKey', 'sourceStatus', 'publishedAt', 'deadlineAt', 'fitScore']
  },
  access: {
    create: isAdminOrEditor,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor
  },
  fields: [
    { name: 'source', type: 'relationship', relationTo: 'opportunity-sources' },
    { name: 'run', type: 'relationship', relationTo: 'opportunity-runs' },
    { name: 'sourceKey', type: 'text', required: true, index: true },
    { name: 'sourceItemId', type: 'text', required: true },
    { name: 'sourceItemKey', type: 'text', required: true, unique: true },
    { name: 'correlationId', type: 'text', index: true },
    { name: 'canonicalUrl', type: 'text', required: true },
    { name: 'canonicalHost', type: 'text', required: true, index: true },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'rawSnippet', type: 'textarea' },
    { name: 'rowFingerprint', type: 'text', required: true },
    { name: 'dedupeKey', type: 'text', required: true, unique: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: opportunityStatuses.map((status) => ({ label: status, value: status })),
      required: true
    },
    { name: 'fitScore', type: 'number', defaultValue: 0 },
    {
      name: 'serviceTags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text', required: true }]
    },
    { name: 'requesterName', type: 'text' },
    { name: 'contactEmail', type: 'email' },
    { name: 'contactPhone', type: 'text' },
    {
      name: 'sourceStatus',
      type: 'select',
      defaultValue: 'unknown',
      options: sourceStatuses.map((status) => ({ label: status, value: status })),
      required: true
    },
    { name: 'publishedAt', type: 'date' },
    { name: 'sourceUpdatedAt', type: 'date' },
    { name: 'deadlineAt', type: 'date', index: true },
    { name: 'discoveredAt', type: 'date' },
    { name: 'personalDataExpiresAt', type: 'date', index: true },
    { name: 'personalDataPurgedAt', type: 'date' },
    { name: 'collisionReason', type: 'textarea' },
    { name: 'normalizedPayload', type: 'json', defaultValue: {} },
    { name: 'notes', type: 'textarea' }
  ]
}
