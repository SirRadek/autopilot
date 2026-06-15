import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '@/access/isAdmin'

export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'site', 'slug', 'status']
  },
  access: {
    create: isAdminOrEditor,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'site', type: 'relationship', relationTo: 'sites' },
    { name: 'slug', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' }
      ],
      required: true
    },
    {
      name: 'fields',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          defaultValue: 'text',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Textarea', value: 'textarea' },
            { label: 'Select', value: 'select' },
            { label: 'URL', value: 'url' },
            { label: 'Hidden', value: 'hidden' }
          ],
          required: true
        },
        { name: 'required', type: 'checkbox', defaultValue: false },
        { name: 'placeholder', type: 'text' },
        {
          name: 'options',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'value', type: 'text', required: true }
          ]
        }
      ]
    },
    {
      name: 'successMessage',
      type: 'textarea',
      defaultValue: 'Diky, poptavka byla ulozena.'
    }
  ]
}
