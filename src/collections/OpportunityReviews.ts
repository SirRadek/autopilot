import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '@/access/isAdmin'

export const OpportunityReviews: CollectionConfig = {
  slug: 'opportunity-reviews',
  admin: {
    group: 'Opportunities',
    useAsTitle: 'decision',
    defaultColumns: ['decision', 'actorId', 'createdAt']
  },
  access: {
    create: isAuthenticated,
    read: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  fields: [
    { name: 'opportunity', type: 'relationship', relationTo: 'opportunity-items', required: true },
    {
      name: 'decision',
      type: 'select',
      options: [
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Respond', value: 'respond' },
        { label: 'Ignore', value: 'ignore' },
        { label: 'Block', value: 'block' },
        { label: 'Convert', value: 'convert' }
      ],
      required: true
    },
    { name: 'actorId', type: 'text', required: true },
    { name: 'reason', type: 'textarea' },
    { name: 'responseSummary', type: 'textarea' },
    { name: 'notes', type: 'textarea' }
  ]
}
