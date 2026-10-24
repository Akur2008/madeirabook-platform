import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { isOasisHost } from '@/lib/oasis-domain'
import config from '@/payload.config'

const baseUrl = 'https://www.madeirabook.com'
const oasisBaseUrl = 'https://www.madeiraoasis.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host')
  const payload = await getPayload({ config: await config })

  // madeiraoasis.com: only Oasis URLs (clean paths — the middleware rewrites
  // /hotels/* to the /oasis route group on this host).
  if (isOasisHost(host)) {
    const { docs: oasisProperties } = await payload.find({
      collection: 'properties',
      where: {
        and: [
          { status: { equals: 'published' } },
          { brand: { in: ['madeiraoasis', 'both'] } },
        ],
      },
      limit: 1000,
      depth: 0,
    })

    const entries: MetadataRoute.Sitemap = [
      {
        url: `${oasisBaseUrl}/`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1.0,
      },
    ]
    for (const p of oasisProperties) {
      entries.push({
        url: `${oasisBaseUrl}/hotels/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }
    return entries
  }

  const routes = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/explore', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/gateways', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/gateway/dolphins', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/gateway/above-clouds', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/gateway/levada-drone', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/sluice-test', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/amsterdam-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/apartamentos-do-mar', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/barcelona-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/berlin-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/best-time-to-visit-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/book-flights', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/brussels-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/canico-self-catering', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/dublin-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/edinburgh-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/espetada', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/flights-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/frankfurt-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/funchal-short-term-rentals', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/lisbon-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/liverpool-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/london-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/lido-funchal', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-apartment-rentals', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-christmas-swimming', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-events-calendar', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-food-guide', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-guide-replacement', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-guide', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-history', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-holiday-homes', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-hotel-deals', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-ocean-view-apartments', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-safety', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-tours', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-villa-rentals', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madeira-wine-tasting', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/madrid-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/manchester-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/munich-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/paris-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/penthouse-view-ocean-canico', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/poncha', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/porto-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/vienna-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/where-to-eat-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/where-to-stay-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/zurich-to-madeira', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/guides', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/google89a0de19c9eba75c', priority: 0.7, changeFrequency: 'monthly' },
  ] as const

  const staticEntries: MetadataRoute.Sitemap = routes.map(route => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const { docs: guides } = await payload.find({
    collection: 'guides',
    where: { status: { equals: 'published' } },
    limit: 1000,
    depth: 0,
  })

  const guideEntries: MetadataRoute.Sitemap = guides.map(g => ({
    url: `${baseUrl}/guides/${g.slug}`,
    lastModified: g.updatedAt ? new Date(g.updatedAt) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const { docs: cities } = await payload.find({
    collection: 'cities',
    where: { status: { equals: 'published' } },
    limit: 1000,
    depth: 0,
  })

  const escapeEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/escape`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...cities.map(c => ({
      url: `${baseUrl}/escape/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]

  return [...staticEntries, ...guideEntries, ...escapeEntries]
}
