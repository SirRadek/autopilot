import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '@/access/isAdmin'

export const OpportunitySources: CollectionConfig = {
  slug: 'opportunity-sources',
  admin: {
    group: 'Opportunities',
    useAsTitle: 'name',
    defaultColumns: ['name', 'sourceKey', 'enabled', 'termsReviewedAt', 'updatedAt']
  },
  access: {
    create: isAdminOrEditor,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor
  },
  fields: [
    { name: 'sourceKey', type: 'text', required: true, unique: true },
    { name: 'name', type: 'text', required: true },
    {
      name: 'sourceType',
      type: 'select',
      defaultValue: 'web',
      options: [
        { label: 'Fixture', value: 'fixture' },
        { label: 'Web', value: 'web' },
        { label: 'API', value: 'api' }
      ]
    },
    { name: 'enabled', type: 'checkbox', defaultValue: false },
    { name: 'locale', type: 'text', defaultValue: 'cs' },
    {
      name: 'allowedHosts',
      type: 'array',
      fields: [{ name: 'host', type: 'text', required: true }]
    },
    { name: 'termsReviewedAt', type: 'date' },
    { name: 'robotsReviewedAt', type: 'date' },
    { name: 'maxUrlsPerRun', type: 'number', min: 1, max: 50, defaultValue: 10 },
    { name: 'notes', type: 'textarea' }
  ]
}
