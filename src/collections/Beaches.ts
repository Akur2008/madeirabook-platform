import type { CollectionConfig } from 'payload'

export const Beaches: CollectionConfig = {
  slug: 'beaches',
  admin: {
    useAsTitle: 'name',
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
      name: 'bestTimeToVisit',
      type: 'text',
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
