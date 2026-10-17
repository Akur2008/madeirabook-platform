import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'guest',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Owner', value: 'owner' },
        { label: 'Guest', value: 'guest' },
      ],
      admin: {
        description: 'Access level: admin (Payload panel), owner (owner cabinet), guest (default).',
      },
    },
    {
      name: 'magicToken',
      type: 'text',
      hidden: true,
    },
    {
      name: 'magicTokenExpiresAt',
      type: 'date',
      hidden: true,
    },
    {
      name: 'stripeAccountId',
      type: 'text',
      admin: {
        description: 'Stripe Connect Express account id (acct_...) for split payouts.',
      },
    },
    {
      name: 'chargesEnabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the connected Stripe account can receive charges.',
      },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      admin: {
        description: 'Stripe Customer id (cus_...) used for the PMS subscription.',
      },
    },
    {
      name: 'hasActiveSubscription',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the owner has an active Madeirabook PMS subscription.',
      },
    },
  ],
}
