import type { CollectionConfig } from 'payload'

// A physical room of a UnitType ("Standard-1", "Standard-2").
export const Units: CollectionConfig = {
  slug: 'units',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'unitType', 'status'],
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
        description: 'E.g. "Standard-1", "Standard-2".',
      },
    },
    {
      name: 'externalId',
      type: 'text',
      admin: {
        description: 'Zeevou unit_id.',
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
