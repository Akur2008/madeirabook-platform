import type { CollectionConfig } from 'payload'

export const HomepageVideos: CollectionConfig = {
  slug: 'homepage-videos',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'slot', 'isActive', 'order'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Mountains', value: 'mountains' },
        { label: 'Forest', value: 'forest' },
        { label: 'Ocean', value: 'ocean' },
      ],
    },
    {
      name: 'slot',
      type: 'select',
      required: true,
      options: [
        { label: 'Hero', value: 'hero' },
        { label: 'Trio 1 (top — mountains)', value: 'trio-1' },
        { label: 'Trio 2 (middle — forest)', value: 'trio-2' },
        { label: 'Trio 3 (bottom — ocean)', value: 'trio-3' },
      ],
    },
    {
      name: 'videoUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'R2 URL of the compressed mp4.',
      },
    },
    {
      name: 'posterUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'R2 URL of the poster frame (jpg).',
      },
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
  ],
}
