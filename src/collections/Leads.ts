import type { CollectionConfig } from 'payload'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'contactIdentifier',
    defaultColumns: ['type', 'source', 'contactIdentifier', 'refCode', 'page', 'status', 'createdAt'],
  },
  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      index: true,
      options: [
        { label: 'Ambassador', value: 'ambassador' },
        { label: 'Owner', value: 'owner' },
      ],
      admin: {
        description: 'B2B lead type from the /ambassador and /owners landing pages.',
      },
    },
    {
      name: 'whatsapp',
      type: 'text',
      admin: {
        description: 'WhatsApp number (B2B lead forms).',
      },
    },
    {
      name: 'instagramOrProperty',
      type: 'text',
      label: 'Instagram URL / Property link',
      admin: {
        description: 'Instagram URL (ambassador) or property name/link (owner).',
      },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'Direct web', value: 'direct_web' },
        { label: 'Oasis inquiry', value: 'oasis_inquiry' },
      ],
    },
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Guest name (Oasis inquiry form).',
      },
    },
    {
      name: 'dates',
      type: 'text',
      admin: {
        description: 'Requested stay dates (Oasis inquiry form).',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      admin: {
        description: 'Free-text inquiry message (Oasis inquiry form).',
      },
    },
    {
      name: 'contactIdentifier',
      type: 'text',
      admin: {
        description: 'Phone number or username when known.',
      },
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'refCode',
      type: 'text',
      index: true,
      admin: {
        description: 'Ambassador referral code from the madeirabook_ref cookie.',
      },
    },
    {
      name: 'page',
      type: 'text',
      required: true,
      admin: {
        description: 'Page the lead clicked from, e.g. /beaches/seixal-beach.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Converted', value: 'converted' },
      ],
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'commentId',
      type: 'text',
      index: true,
      admin: {
        description: 'Instagram comment ID, used to deduplicate webhook deliveries.',
      },
    },
  ],
}
