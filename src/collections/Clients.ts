import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '@/access/isAdmin'

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    group: 'ClientOps',
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'primaryEmail', 'updatedAt']
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
      name: 'status',
      type: 'select',
      defaultValue: 'prospect',
      options: [
        { label: 'Prospect', value: 'prospect' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Archived', value: 'archived' }
      ],
      required: true
    },
    {
      name: 'companyId',
      type: 'text',
      label: 'Company ID'
    },
    {
      name: 'primaryContact',
      type: 'text'
    },
    {
      name: 'primaryEmail',
      type: 'email'
    },
    {
      name: 'phone',
      type: 'text'
    },
    {
      name: 'notes',
      type: 'textarea'
    }
  ]
}
