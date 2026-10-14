import type { CollectionConfig } from 'payload'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'source', 'status', 'createdAt'],
  },
  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: () => false,
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'source', type: 'text' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
    {
      name: 'unsubscribeToken',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Token for /api/unsubscribe/:token links in emails.',
      },
    },
    {
      name: 'unsubscribedAt',
      type: 'date',
      index: true,
      admin: {
        description: 'Set when the subscriber opted out. Pending queue emails are skipped.',
      },
    },
    // Deprecated: Telegram отменён 14.10.2026, поле оставлено для совместимости
    { name: 'telegramId', type: 'number' },
  ],
}
