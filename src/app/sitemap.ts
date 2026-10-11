import type { MetadataRoute } from 'next'

const baseUrl = 'https://madeirabook-platform.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/booking', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/gateways', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/gateway/dolphins', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/gateway/above-clouds', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/gateway/levada-drone', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/sluice-test', priority: 0.6, changeFrequency: 'monthly' },
  ] as const

  return routes.map(route => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
