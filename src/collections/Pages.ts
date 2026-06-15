import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '@/access/isAdmin'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'site', 'slug', 'locale', 'status']
  },
  access: {
    create: isAuthenticated,
    read: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
    { name: 'slug', type: 'text', required: true },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'cs',
      options: [
        { label: 'Czech', value: 'cs' },
        { label: 'English', value: 'en' }
      ],
      required: true
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Review', value: 'review' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' }
      ],
      required: true
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'canonicalUrl', type: 'text' },
        { name: 'noIndex', type: 'checkbox', defaultValue: false }
      ]
    },
    {
      name: 'content',
      type: 'json',
      label: 'Structured content JSON',
      defaultValue: {}
    },
    {
      name: 'notes',
      type: 'textarea'
    }
  ]
}
