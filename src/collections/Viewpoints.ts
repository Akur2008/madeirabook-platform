import type { CollectionConfig } from 'payload'

export const Viewpoints: CollectionConfig = {
  slug: 'viewpoints',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'elevationM', 'access', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
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
      name: 'shortDescription',
      type: 'textarea',
      maxLength: 300,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
    },
    {
      name: 'geoCoordinates',
      type: 'group',
      fields: [
        {
          name: 'lat',
          type: 'number',
          required: true,
        },
        {
          name: 'lng',
          type: 'number',
          required: true,
        },
      ],
    },
    {
      name: 'elevationM',
      type: 'number',
      admin: {
        description: 'Elevation above sea level in metres.',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Cliff', value: 'cliff' },
        { label: 'Peak', value: 'peak' },
        { label: 'Miradouro', value: 'miradouro' },
        { label: 'Tower', value: 'tower' },
        { label: 'Coastal', value: 'coastal' },
        { label: 'Valley', value: 'valley' },
      ],
    },
    {
      name: 'viewType',
      type: 'text',
      hasMany: true,
      admin: {
        description: 'What is visible: ocean, city, mountains, valley, sunset.',
      },
    },
    {
      name: 'access',
      type: 'select',
      options: [
        { label: 'By car', value: 'car' },
        { label: 'Short walk', value: 'walk_short' },
        { label: 'Long walk', value: 'walk_long' },
      ],
    },
    {
      name: 'bestTime',
      type: 'text',
      admin: {
        description: 'e.g. "Sunrise", "Sunset", "All day".',
      },
    },
    {
      name: 'glassPlatform',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Skywalk glass floor, e.g. Cabo Girão.',
      },
    },
    {
      name: 'heroImage',
      type: 'text',
      admin: {
        description: 'Image URL from Wikimedia Commons (CC-licensed only).',
      },
    },
    {
      name: 'imageAttribution',
      type: 'text',
      admin: {
        description: 'Author and license, e.g. "Photo by John Doe, CC-BY-SA 4.0, via Wikimedia Commons".',
      },
    },
    {
      name: 'highlights',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'media',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'relationship',
          relationTo: 'uploads',
        },
      ],
    },
    {
      name: 'videoFile',
      type: 'relationship',
      relationTo: 'uploads',
    },
    {
      name: 'posterUrl',
      type: 'text',
      admin: {
        description: 'Fallback превью если videoFile не задан',
      },
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
      ],
      required: true,
      defaultValue: 'draft',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
