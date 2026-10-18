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
      name: 'invitationToken',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Token from the invitation email. Used once to claim the guide page.',
      },
    },
    {
      name: 'invitationExpiresAt',
      type: 'date',
      admin: {
        description: 'Invitation link expiry.',
      },
    },
    {
      name: 'invitationUsedAt',
      type: 'date',
      admin: {
        description: 'When the invitation was accepted.',
      },
    },
    {
      name: 'avatarUrl',
      type: 'text',
      admin: {
        description: 'Creator avatar image URL.',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Short creator bio shown on their guide page.',
      },
    },
    {
      name: 'accentColor',
      type: 'text',
      defaultValue: '#d4af37',
      admin: {
        description: 'Accent color for the creator map page.',
      },
    },
    {
      name: 'selectedBeaches',
      type: 'relationship',
      relationTo: 'beaches',
      hasMany: true,
      admin: {
        description: 'Beaches featured on the creator map.',
      },
    },
    {
      name: 'selectedRestaurants',
      type: 'relationship',
      relationTo: 'restaurants',
      hasMany: true,
      admin: {
        description: 'Restaurants featured on the creator map.',
      },
    },
    {
      name: 'displayName',
      type: 'text',
      admin: {
        description: 'Public title of the creator guide, e.g. "Sergio\'s Madeira Guide".',
      },
    },
    {
      name: 'sourceApplication',
      type: 'relationship',
      relationTo: 'applications',
      admin: {
        description: 'Ambassador application this referral was created from.',
      },
    },
    {
      name: 'stripeAccountId',
      type: 'text',
      admin: {
        description: 'Stripe Express account id (acct_...) for ambassador payouts.',
      },
    },
    {
      name: 'payoutSchedule',
      type: 'select',
      defaultValue: 'monthly',
      options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Daily', value: 'daily' },
        { label: 'Manual', value: 'manual' },
      ],
      admin: {
        description: 'Stripe payout schedule for the connected account.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
