import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '@/access/isAdmin'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    group: 'ClientOps',
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'status', 'projectType', 'updatedAt']
  },
  access: {
    create: isAuthenticated,
    read: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients'
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'planned',
      options: [
        { label: 'Planned', value: 'planned' },
        { label: 'Active', value: 'active' },
        { label: 'Waiting Owner', value: 'waiting_owner' },
        { label: 'Paused', value: 'paused' },
        { label: 'Complete', value: 'complete' },
        { label: 'Lost', value: 'lost' }
      ],
      required: true
    },
    {
      name: 'projectType',
      type: 'select',
      options: [
        { label: 'Website', value: 'website' },
        { label: 'Redesign', value: 'redesign' },
        { label: 'Automation', value: 'automation' },
        { label: 'SEO', value: 'seo' },
        { label: 'Client Portal', value: 'client_portal' },
        { label: 'Other', value: 'other' }
      ]
    },
    {
      name: 'primaryStack',
      type: 'text'
    },
    {
      name: 'repositoryUrl',
      type: 'text'
    },
    {
      name: 'productionUrl',
      type: 'text'
    },
    {
      name: 'budgetRange',
      type: 'text'
    },
    {
      name: 'description',
      type: 'textarea'
    },
    {
      name: 'startDate',
      type: 'date'
    },
    {
      name: 'dueDate',
      type: 'date'
    }
  ]
}
