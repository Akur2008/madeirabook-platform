import type { CollectionConfig } from 'payload'

export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    useAsTitle: 'instagramHandle',
    defaultColumns: ['instagramHandle', 'email', 'audienceSize', 'status', 'createdAt'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'instagramHandle',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'audienceSize',
      type: 'select',
      required: true,
      options: [
        { label: '5k-10k', value: '5k-10k' },
        { label: '10k-30k', value: '10k-30k' },
        { label: '30k-100k', value: '30k-100k' },
        { label: '100k+', value: '100k+' },
      ],
    },
    {
      name: 'niche',
      type: 'select',
      required: true,
      options: [
        { label: 'Travel', value: 'travel' },
        { label: 'Lifestyle', value: 'lifestyle' },
        { label: 'Portugal & Madeira', value: 'portugal-madeira' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'mainCity',
      type: 'text',
      admin: {
        description: 'Main audience city, for targeting.',
      },
    },
    {
      name: 'sampleReelUrl',
      type: 'text',
      admin: {
        description: 'Link to one Reel the creator is proud of.',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      admin: {
        description: 'Comment from the creator.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'reviewNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes — never shown to the applicant.',
      },
    },
  ],
}
