import type { CollectionConfig } from 'payload'

export const SluicePages: CollectionConfig = {
  slug: 'sluice-pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'stateGroup', 'brand', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'brand',
      type: 'select',
      required: true,
      options: [
        { label: 'Madeirabook', value: 'mb' },
        { label: 'Madeira Oasis', value: 'mo' },
      ],
    },
    {
      name: 'stateGroup',
      type: 'select',
      required: true,
      options: [
        { label: 'MB-01', value: 'MB-01' },
        { label: 'MB-02', value: 'MB-02' },
        { label: 'MB-03', value: 'MB-03' },
        { label: 'MB-04', value: 'MB-04' },
        { label: 'MB-05', value: 'MB-05' },
        { label: 'MO-01', value: 'MO-01' },
        { label: 'MO-02', value: 'MO-02' },
        { label: 'MO-03', value: 'MO-03' },
      ],
    },
    {
      name: 'element',
      type: 'select',
      options: [
        { label: 'Ocean', value: 'ocean' },
        { label: 'Terra', value: 'terra' },
        { label: 'Forest', value: 'forest' },
        { label: 'Sun', value: 'sun' },
        { label: 'Wild', value: 'wild' },
      ],
    },
    {
      name: 'phase',
      type: 'select',
      options: [
        { label: 'Direct', value: 'direct' },
        { label: 'Adjacent', value: 'adjacent' },
        { label: 'Wildcard', value: 'wildcard' },
        { label: 'Any', value: 'any' },
      ],
    },
    { name: 'videoUrl', type: 'text' },
    { name: 'posterUrl', type: 'text' },
    { name: 'ambientAudioUrl', type: 'text' },
    { name: 'videoDurationSeconds', type: 'number' },
    { name: 'shortDescription', type: 'textarea', maxLength: 300 },
    { name: 'fullDescription', type: 'textarea' },
    { name: 'transcript', type: 'textarea' },
    { name: 'schemaJson', type: 'textarea' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
  ],
}
