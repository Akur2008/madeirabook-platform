import type { CollectionConfig } from 'payload'

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'stripeSessionId',
    defaultColumns: [
      'stripeSessionId',
      'propertySlug',
      'guestEmail',
      'status',
      'amountTotal',
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
      name: 'stripeSessionId',
      type: 'text',
      unique: true,
      admin: {
        description: 'Stripe Checkout Session ID (cs_...).',
      },
    },
    {
      name: 'stripePaymentIntent',
      type: 'text',
      admin: {
        description: 'Stripe PaymentIntent ID (pi_...). Used to match charge.refunded events.',
      },
    },
    {
      name: 'property',
      type: 'relationship',
      relationTo: 'properties',
    },
    {
      name: 'propertySlug',
      type: 'text',
    },
    {
      name: 'arrival',
      type: 'date',
    },
    {
      name: 'departure',
      type: 'date',
    },
    {
      name: 'guestEmail',
      type: 'email',
    },
    {
      name: 'guestName',
      type: 'text',
    },
    {
      name: 'guestTelegramId',
      type: 'number',
    },
    {
      name: 'amountTotal',
      type: 'number',
      admin: {
        description: 'Total amount in cents.',
      },
    },
    {
      name: 'platformFeeCents',
      type: 'number',
      admin: {
        description: 'Platform commission in cents (0 for platform-owned properties).',
      },
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'eur',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Paid (no PMS)', value: 'paid_no_pms' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'direct',
      options: [
        { label: 'Booking channel', value: 'booking_channel' },
        { label: 'Direct', value: 'direct' },
        { label: 'Owner manual', value: 'owner_manual' },
      ],
    },
    {
      name: 'smoobuBookingId',
      type: 'text',
    },
  ],
}
