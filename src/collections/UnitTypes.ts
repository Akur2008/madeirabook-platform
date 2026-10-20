import type { CollectionConfig } from 'payload'

// Zeevou "Complex" structure: Property -> UnitType -> Unit -> RatePlan.
// A UnitType groups identical rooms ("Standard Double", "Ocean View Suite").
export const UnitTypes: CollectionConfig = {
  slug: 'unit-types',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'property', 'capacity', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'property',
      type: 'relationship',
      relationTo: 'properties',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'E.g. "Standard Double", "Ocean View Suite".',
      },
    },
    {
      name: 'capacity',
      type: 'number',
      defaultValue: 2,
    },
    {
      name: 'bedrooms',
      type: 'number',
      defaultValue: 1,
    },
    {
      name: 'bathrooms',
      type: 'number',
      defaultValue: 1,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'photos',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'uploads',
        },
      ],
    },
    {
      name: 'externalId',
      type: 'text',
      admin: {
        description: 'Zeevou unit_type_id.',
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
