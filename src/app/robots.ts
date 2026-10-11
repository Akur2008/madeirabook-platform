import type { MetadataRoute } from 'next'

const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
  'anthropic-ai',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...AI_CRAWLERS.map(agent => ({ userAgent: agent, allow: '/' })),
    ],
    sitemap: 'https://madeirabook-platform.vercel.app/sitemap.xml',
  }
}
