import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '@/access/isAdmin'

export const Sites: CollectionConfig = {
  slug: 'sites',
  admin: {
    group: 'Content',
    useAsTitle: 'name',
    defaultColumns: ['name', 'domain', 'status', 'client', 'updatedAt']
  },
  access: {
    create: isAuthenticated,
    read: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients'
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects'
    },
    {
      name: 'domain',
      type: 'text'
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Live', value: 'live' },
        { label: 'Maintenance', value: 'maintenance' },
        { label: 'Archived', value: 'archived' }
      ],
      required: true
    },
    {
      name: 'framework',
      type: 'select',
      options: [
        { label: 'Astro', value: 'astro' },
        { label: 'Next.js', value: 'nextjs' },
        { label: 'Static HTML', value: 'static_html' },
        { label: 'Other', value: 'other' }
      ]
    },
    {
      name: 'deploymentProvider',
      type: 'select',
      options: [
        { label: 'Cloudflare Pages', value: 'cloudflare_pages' },
        { label: 'Vercel', value: 'vercel' },
        { label: 'GitHub Pages', value: 'github_pages' },
        { label: 'Other', value: 'other' }
      ]
    },
    {
      name: 'environments',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        {
          name: 'kind',
          type: 'select',
          options: [
            { label: 'Production', value: 'production' },
            { label: 'Preview', value: 'preview' },
            { label: 'Local', value: 'local' }
          ]
        }
      ]
    }
  ]
}
