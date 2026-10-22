import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import { isOasisHost } from '@/lib/oasis-domain'

const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
  'anthropic-ai',
]

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host')
  const sitemapBase = isOasisHost(host)
    ? 'https://www.madeiraoasis.com'
    : 'https://www.madeirabook.com'
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...AI_CRAWLERS.map(agent => ({ userAgent: agent, allow: '/' })),
    ],
    sitemap: `${sitemapBase}/sitemap.xml`,
  }
}
