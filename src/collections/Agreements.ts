import type { CollectionConfig } from 'payload'

// Clickwrap signature log: one row per signed legal document. Written by the
// /api/agreements/sign route (server-side, captures IP); read by admins only.
export const Agreements: CollectionConfig = {
  slug: 'agreements',
  admin: {
    useAsTitle: 'signedName',
    defaultColumns: ['signedName', 'role', 'documentType', 'documentVersion', 'signedAt'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Owner account that signed. Empty for ambassador agreements — see referral.',
      },
    },
    {
      name: 'referral',
      type: 'relationship',
      relationTo: 'referrals',
      admin: {
        description: 'Ambassador referral that signed (ambassador agreements only).',
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Owner', value: 'owner' },
        { label: 'Ambassador', value: 'ambassador' },
      ],
    },
    {
      name: 'documentType',
      type: 'select',
      required: true,
      options: [
        { label: 'Owner Terms', value: 'owner_terms' },
        { label: 'Ambassador Terms', value: 'ambassador_terms' },
      ],
    },
    {
      name: 'documentVersion',
      type: 'text',
      admin: {
        description: 'Version of the signed document, e.g. "v1.0".',
      },
    },
    {
      name: 'signedName',
      type: 'text',
      admin: {
        description: 'Full name typed by the signer.',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
    },
    {
      name: 'signedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}
