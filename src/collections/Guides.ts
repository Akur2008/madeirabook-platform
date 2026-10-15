import type { CollectionConfig } from 'payload'

export const Guides: CollectionConfig = {
  slug: 'guides',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
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
      index: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'uploads',
      admin: {
        description: 'Hero image uploaded to R2.',
      },
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'excerpt',
      type: 'textarea',
      maxLength: 300,
      admin: {
        description: 'Short preview used on cards and as SEO description fallback.',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Gastronomy', value: 'gastronomy' },
        { label: 'Lifestyle', value: 'lifestyle' },
        { label: 'Logistics', value: 'logistics' },
        { label: 'Spots', value: 'spots' },
        { label: 'History', value: 'history' },
      ],
    },
    {
      name: 'featuredRestaurants',
      type: 'relationship',
      relationTo: 'restaurants',
      hasMany: true,
    },
    {
      name: 'featuredBeaches',
      type: 'relationship',
      relationTo: 'beaches',
      hasMany: true,
    },
    {
      name: 'featuredProperties',
      type: 'relationship',
      relationTo: 'properties',
      hasMany: true,
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'uploads' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
  ],
}
