import type { CollectionConfig } from 'payload'

export const AffiliatePayouts: CollectionConfig = {
  slug: 'affiliate-payouts',
  admin: {
    defaultColumns: [
      'referral',
      'booking',
      'amountCents',
      'currency',
      'status',
      'createdAt',
    ],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
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
    },
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      required: true,
      index: true,
    },
    {
      name: 'amountCents',
      type: 'number',
      required: true,
      admin: {
        description: 'Creator payout in cents.',
      },
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'EUR',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'paidAt',
      type: 'date',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
