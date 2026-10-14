import type { CollectionConfig } from 'payload'

export const WebhookEvents: CollectionConfig = {
  slug: 'webhook-events',
  admin: {
    useAsTitle: 'eventId',
    defaultColumns: ['eventId', 'eventType', 'status', 'processedAt'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'eventId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Stripe event ID (evt_...). Used for webhook idempotency.',
      },
    },
    {
      name: 'eventType',
      type: 'text',
      required: true,
    },
    {
      name: 'payload',
      type: 'json',
      admin: {
        description: 'Full Stripe event object (debug).',
      },
    },
    {
      name: 'processedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'processed',
      options: [
        { label: 'Processed', value: 'processed' },
        { label: 'Failed', value: 'failed' },
      ],
    },
  ],
}
