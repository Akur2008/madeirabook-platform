import type { CollectionConfig } from 'payload'

export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'airportCode', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'airportCode',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 3,
    },
    { name: 'country', type: 'text', required: true },
    { name: 'flightDurationMinutes', type: 'number' },
    { name: 'basePrice', type: 'number' },
    { name: 'currency', type: 'text', defaultValue: 'EUR' },
    { name: 'hero', type: 'textarea' },
    { name: 'description', type: 'textarea' },
    {
      name: 'faqs',
      type: 'array',
      fields: [
        { name: 'question', type: 'text' },
        { name: 'answer', type: 'textarea' },
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
