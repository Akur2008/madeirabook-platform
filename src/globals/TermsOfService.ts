import type { GlobalConfig } from 'payload'

export const TermsOfService: GlobalConfig = {
  slug: 'terms-of-service',
  admin: {
    group: 'Legal',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Terms of Service',
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
