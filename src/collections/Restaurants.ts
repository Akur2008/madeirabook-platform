import type { CollectionConfig } from 'payload'

export const Restaurants: CollectionConfig = {
  slug: 'restaurants',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'tier', 'cuisine', 'averagePrice', 'googleRating', 'status'],
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
      name: 'address',
      type: 'text',
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
      name: 'cuisine',
      type: 'text',
    },
    {
      name: 'averagePrice',
      type: 'number',
      admin: {
        description: 'Average price per person in EUR.',
      },
    },
    {
      name: 'googleRating',
      type: 'number',
      min: 0,
      max: 5,
      admin: {
        description: 'Rating on a 0–5 scale (TheFork score / 2).',
      },
    },
    {
      name: 'michelinStars',
      type: 'number',
      min: 0,
      max: 3,
      defaultValue: 0,
    },
    {
      name: 'michelinGreenStar',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'michelinRecommended',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'chef',
      type: 'text',
    },
    {
      name: 'tier',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Michelin Fine Dining',
          value: 'michelin',
        },
        {
          label: 'Luxury',
          value: 'luxury',
        },
        {
          label: 'Modern',
          value: 'modern',
        },
        {
          label: 'Heritage',
          value: 'heritage',
        },
      ],
    },
    {
      name: 'bookingUrl',
      type: 'text',
      admin: {
        description: 'External booking link (TheFork affiliate etc).',
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
