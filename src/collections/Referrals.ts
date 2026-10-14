import type { CollectionConfig } from 'payload'

const CODE_RE = /^[a-z0-9_-]{2,50}$/

export const Referrals: CollectionConfig = {
  slug: 'referrals',
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'creatorName', 'commissionRate', 'status'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      unique: true,
      required: true,
      index: true,
      validate: (value: string | null | undefined) =>
        (typeof value === 'string' && CODE_RE.test(value)) ||
        'Lowercase letters, digits, "_" and "-" only (2-50 chars).',
      admin: {
        description: 'Canonical referral code used in ?ref= links.',
      },
    },
    {
      name: 'aliases',
      type: 'text',
      hasMany: true,
      admin: {
        description:
          'Extra codes resolving to the same creator (e.g. sxtraveler + sergio). Commission is accrued once, under the canonical code.',
      },
    },
    {
      name: 'creatorName',
      type: 'text',
      required: true,
      admin: {
        description: 'Creator name or Instagram handle.',
      },
    },
    {
      name: 'creatorEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'commissionRate',
      type: 'number',
      required: true,
      defaultValue: 2,
      min: 0,
      max: 10,
      admin: {
        description:
          'Creator commission in % of the booking total. Paid out of the platform fee, not on top.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
