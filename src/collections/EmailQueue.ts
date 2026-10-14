import type { CollectionConfig } from 'payload'

export const EmailQueue: CollectionConfig = {
  slug: 'email-queue',
  admin: {
    useAsTitle: 'template',
    defaultColumns: ['template', 'subscriber', 'sendAt', 'sentAt', 'error'],
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'subscriber',
      type: 'relationship',
      relationTo: 'subscribers',
      required: true,
    },
    {
      name: 'template',
      type: 'text',
      required: true,
      admin: {
        description: 'Template name from src/lib/emails/templates.ts.',
      },
    },
    {
      name: 'sendAt',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Earliest time the email may be sent.',
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      index: true,
      admin: {
        description: 'Set when the job was picked up by the cron. NULL = pending.',
      },
    },
    {
      name: 'error',
      type: 'text',
      admin: {
        description: 'Last send error, or "unsubscribed" when skipped.',
      },
    },
  ],
}
