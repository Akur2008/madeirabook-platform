import type { CollectionConfig } from 'payload'

// Personal spots submitted by ambassadors for their /m/[code] map.
// Moderated via `status`; `promotedToGlobal` surfaces an approved pin on /explore.
export const AmbassadorPins: CollectionConfig = {
  slug: 'ambassador-pins',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'referral', 'category', 'status', 'promotedToGlobal', 'createdAt'],
  },
  access: {
    // Ambassadors submit through /api/ambassador/pins, which validates the
    // invitation token and writes with overrideAccess.
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => (req.user ? true : { status: { equals: 'approved' } }),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'referral',
      type: 'relationship',
      relationTo: 'referrals',
      required: true,
      index: true,
      admin: {
        description: 'Ambassador who submitted this spot.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 60,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Beach', value: 'beach' },
        { label: 'Restaurant', value: 'restaurant' },
        { label: 'Viewpoint', value: 'viewpoint' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'coordinates',
      type: 'group',
      required: true,
      fields: [
        {
          name: 'lat',
          type: 'number',
          required: true,
          min: -90,
          max: 90,
        },
        {
          name: 'lng',
          type: 'number',
          required: true,
          min: -180,
          max: 180,
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 500,
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'uploads',
      admin: {
        description: 'Photo, max 5 MB.',
      },
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'uploads',
      filterOptions: {
        mimeType: { in: ['video/mp4', 'video/quicktime'] },
      },
      admin: {
        description: 'Short video, max 30 MB, mp4/mov.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: {
        components: {
          Cell: '@/components/admin/PinStatusCell',
        },
      },
    },
    {
      name: 'promotedToGlobal',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show this approved pin on the public /explore map as a Community Pick.',
      },
    },
    {
      name: 'moderationNote',
      type: 'textarea',
      access: {
        create: ({ req }) => Boolean(req.user),
        read: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
      },
      admin: {
        description: 'Internal note, not shown to the ambassador.',
      },
    },
  ],
}
