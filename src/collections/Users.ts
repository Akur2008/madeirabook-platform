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
  ],
}
