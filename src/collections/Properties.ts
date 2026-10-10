import type { CollectionConfig } from 'payload'

export const Properties: CollectionConfig = {
  slug: 'properties',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'brand',
      type: 'select',
      options: [
        {
          label: 'Madeirabook',
          value: 'madeirabook',
        },
        {
          label: 'MadeiraOasis',
          value: 'madeiraoasis',
        },
        {
          label: 'Both',
          value: 'both',
        },
      ],
      required: true,
      defaultValue: 'madeirabook',
    },
    {
      name: 'pmsPropertyId',
      type: 'text',
    },
    {
      name: 'pricePerNight',
      type: 'number',
      required: true,
    },
    {
      name: 'cleaningFee',
      type: 'number',
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
    },
    {
      name: 'amenities',
      type: 'relationship',
      relationTo: 'amenities',
      hasMany: true,
    },
    {
      name: 'media',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'relationship',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'audioTracks',
      type: 'array',
      fields: [
        {
          name: 'audio',
          type: 'relationship',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      required: true,
      defaultValue: 'draft',
    },
  ],
}
