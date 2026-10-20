import type { CollectionConfig } from 'payload'

// Pricing plan attached to a UnitType ("Standard with breakfast").
export const RatePlans: CollectionConfig = {
  slug: 'rate-plans',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'unitType', 'basePrice', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'unitType',
      type: 'relationship',
      relationTo: 'unit-types',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'E.g. "Standard with breakfast".',
      },
    },
    {
      name: 'basePrice',
      type: 'number',
      required: true,
    },
    {
      name: 'minNights',
      type: 'number',
      defaultValue: 1,
    },
    {
      name: 'includesBreakfast',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'externalId',
      type: 'text',
      admin: {
        description: 'Zeevou rate_plan_id.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
      ],
    },
  ],
}
