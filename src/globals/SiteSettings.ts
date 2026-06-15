import type { GlobalConfig } from 'payload'

import { isAuthenticated } from '@/access/isAdmin'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings'
  },
  access: {
    read: isAuthenticated,
    update: isAuthenticated
  },
  fields: [
    { name: 'brandName', type: 'text', defaultValue: 'Radeq.cz' },
    {
      name: 'defaultLocale',
      type: 'select',
      defaultValue: 'cs',
      options: [
        { label: 'Czech', value: 'cs' },
        { label: 'English', value: 'en' }
      ]
    },
    {
      name: 'navigation',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true }
      ]
    },
    {
      name: 'leadRouting',
      type: 'group',
      fields: [
        { name: 'defaultAssignedRole', type: 'text', defaultValue: 'orchestrator' },
        { name: 'defaultPriority', type: 'number', defaultValue: 500 }
      ]
    }
  ]
}
