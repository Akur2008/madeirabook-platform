import type { CollectionConfig } from 'payload'

export const Properties: CollectionConfig = {
  slug: 'properties',
  admin: {
    useAsTitle: 'title',
    components: {
      beforeListTable: ['@/components/admin/ZeevouPublishPanel'],
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'brand',
      type: 'select',
      options: [
        {
          label: 'Madeirabook',
          value: 'madeirabook',
        },
        {
          label: 'MadeiraOasis',
          value: 'madeiraoasis',
        },
        {
          label: 'Both',
          value: 'both',
        },
      ],
      required: true,
      defaultValue: 'madeirabook',
    },
    {
      name: 'hotelType',
      type: 'select',
      options: [
        { label: 'Hotel', value: 'hotel' },
        { label: 'Resort', value: 'resort' },
        { label: 'Boutique', value: 'boutique' },
        { label: 'Apartment', value: 'apartment' },
        { label: 'Villa', value: 'villa' },
        { label: 'Quinta', value: 'quinta' },
      ],
      admin: {
        description: 'Accommodation type. Used by the Madeira Oasis showcase.',
      },
    },
    {
      name: 'category',
      type: 'text',
      admin: {
        description: 'Showcase category label, e.g. "5★ Luxury Oceanfront Resort".',
      },
    },
    {
      name: 'geoCoordinates',
      type: 'group',
      fields: [
        {
          name: 'lat',
          type: 'number',
        },
        {
          name: 'lng',
          type: 'number',
        },
      ],
      admin: {
        description: 'Precise pin coordinates (per-property). Falls back to location.',
      },
    },
    {
      name: 'address',
      type: 'group',
      fields: [
        {
          name: 'street',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
        },
        {
          name: 'postal',
          type: 'text',
        },
        {
          name: 'country',
          type: 'text',
          defaultValue: 'PT',
        },
      ],
    },
    {
      name: 'pmsPropertyId',
      type: 'text',
    },
    {
      name: 'pms',
      type: 'select',
      options: [
        { label: 'Smoobu (Gold)', value: 'smoobu' },
        { label: 'Zeevou (Silver)', value: 'zeevou' },
      ],
      admin: {
        description:
          'PMS backend for this property. Empty = legacy Smoobu. Set automatically by "Publish to Zeevou".',
      },
    },
    {
      name: 'pmsMeta',
      type: 'json',
      admin: {
        description:
          'PMS-specific ids (Zeevou: unitTypeId, unitId, ratePlanId). Managed automatically.',
      },
    },
    {
      name: 'icalExportUrl',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/IcalUrlField',
        },
      },
    },
    {
      name: 'isPlatform',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Platform-owned property (direct charge). Unchecked = external owner via Stripe Connect Express.',
      },
    },
    {
      name: 'commissionPercent',
      type: 'number',
      defaultValue: 12,
      min: 0,
      max: 100,
      admin: {
        description: 'Platform commission percent, applied when isPlatform is unchecked.',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'External owner for the split payout (stripeAccountId is taken from the user).',
      },
    },
    {
      name: 'pricePerNight',
      type: 'number',
      required: true,
    },
    {
      name: 'cleaningFee',
      type: 'number',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      maxLength: 300,
    },
    {
      name: 'sizeM2',
      type: 'number',
    },
    {
      name: 'bedrooms',
      type: 'number',
    },
    {
      name: 'bathrooms',
      type: 'number',
    },
    {
      name: 'maxGuests',
      type: 'number',
    },
    {
      name: 'checkInTime',
      type: 'text',
      defaultValue: '15:00',
    },
    {
      name: 'checkOutTime',
      type: 'text',
      defaultValue: '11:00',
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
    },
    {
      name: 'amenities',
      type: 'relationship',
      relationTo: 'amenities',
      hasMany: true,
    },
    {
      name: 'houseRules',
      type: 'relationship',
      relationTo: 'house-rules',
      hasMany: true,
    },
    {
      name: 'media',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'relationship',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'audioTracks',
      type: 'array',
      fields: [
        {
          name: 'audio',
          type: 'relationship',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Verified property badge.',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      required: true,
      defaultValue: 'draft',
    },
  ],
}
