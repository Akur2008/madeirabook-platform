import type { CollectionConfig } from 'payload'

export const Gateways: CollectionConfig = {
  slug: 'gateways',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'subtitle', type: 'text' },
    {
      name: 'element',
      type: 'select',
      options: [
        { label: 'Ocean', value: 'ocean' },
        { label: 'Terra', value: 'terra' },
        { label: 'Forest', value: 'forest' },
        { label: 'Sun', value: 'sun' },
        { label: 'Wild', value: 'wild' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
  ],
}
