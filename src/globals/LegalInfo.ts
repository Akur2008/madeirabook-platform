import type { GlobalConfig } from 'payload'

export const LegalInfo: GlobalConfig = {
  slug: 'legal-info',
  admin: {
    group: 'Legal',
  },
  fields: [
    {
      name: 'livroDeReclamacoes',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          defaultValue: 'Livro de Reclamações',
        },
        {
          name: 'description',
          type: 'text',
          required: true,
        },
        {
          name: 'link',
          type: 'text',
          required: true,
          admin: {
            description: 'Link to official Livro de Reclamações portal',
          },
        },
      ],
    },
    {
      name: 'cacramRal',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          defaultValue: 'CACRAM / RAL - Madeira Regional Arbitration',
        },
        {
          name: 'description',
          type: 'text',
          required: true,
        },
        {
          name: 'link',
          type: 'text',
          required: true,
          admin: {
            description: 'Link to CACRAM/RAL official website',
          },
        },
        {
          name: 'contactEmail',
          type: 'email',
        },
        {
          name: 'contactPhone',
          type: 'text',
        },
      ],
    },
    {
      name: 'companyInfo',
      type: 'group',
      fields: [
        {
          name: 'companyName',
          type: 'text',
          required: true,
        },
        {
          name: 'nif',
          type: 'text',
          required: true,
          admin: {
            description: 'Portuguese Tax ID (NIF)',
          },
        },
        {
          name: 'address',
          type: 'text',
          required: true,
        },
        {
          name: 'email',
          type: 'email',
          required: true,
        },
      ],
    },
  ],
}
