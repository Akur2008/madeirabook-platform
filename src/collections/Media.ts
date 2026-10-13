import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false,
    },
    {
      name: 'url',
      type: 'text',
      required: true,
    },
    {
      name: 'filename',
      type: 'text',
    },
    {
      name: 'mimeType',
      type: 'text',
    },
    {
      name: 'filesize',
      type: 'number',
    },
    {
      name: 'width',
      type: 'number',
    },
    {
      name: 'height',
      type: 'number',
    },
  ],
}
