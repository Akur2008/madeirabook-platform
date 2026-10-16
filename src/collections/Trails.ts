import type { CollectionConfig } from 'payload'

export const Trails: CollectionConfig = {
  slug: 'trails',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'prCode', 'difficulty', 'distanceKm', 'status'],
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
      name: 'prCode',
      type: 'text',
      admin: {
        description: 'Official route code, e.g. "PR6", "PR1.2".',
      },
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
      name: 'endCoordinates',
      type: 'group',
      fields: [
        {
          name: 'lat',
          type: 'number',
        },
        {
          name: 'lng',
          type: 'number',
        },
      ],
    },
    {
      name: 'distanceKm',
      type: 'number',
    },
    {
      name: 'durationMinutes',
      type: 'number',
    },
    {
      name: 'elevationGain',
      type: 'number',
      admin: {
        description: 'Elevation gain in metres.',
      },
    },
    {
      name: 'difficulty',
      type: 'select',
      options: [
        { label: 'Easy', value: 'easy' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Hard', value: 'hard' },
      ],
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Levada', value: 'levada' },
        { label: 'Vereda', value: 'vereda' },
        { label: 'Caldeirão', value: 'caldeirao' },
        { label: 'Coastal', value: 'coastal' },
        { label: 'Peak', value: 'peak' },
      ],
    },
    {
      name: 'isLinear',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'True if the route does not return to the start point.',
      },
    },
    {
      name: 'season',
      type: 'text',
    },
    {
      name: 'startPoint',
      type: 'text',
      admin: {
        description: 'Trailhead name, e.g. "Rabaçal Parking".',
      },
    },
    {
      name: 'trailheadUrl',
      type: 'text',
      admin: {
        description: 'External reference link (Wikiloc / official route page).',
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
