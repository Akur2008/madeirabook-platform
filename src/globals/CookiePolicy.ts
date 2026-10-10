import type { GlobalConfig } from 'payload'

export const CookiePolicy: GlobalConfig = {
  slug: 'cookie-policy',
  admin: {
    group: 'Legal',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Cookie Policy',
    },
    {
      name: 'content',
      type: 'text',
      required: true,
    },
    {
      name: 'lastUpdated',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      defaultValue: () => new Date(),
    },
  ],
}
