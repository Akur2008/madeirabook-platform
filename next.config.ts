import { withPayload } from '@payloadcms/next/withPayload'
import { withSentryConfig } from '@sentry/nextjs/config'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gzu76sbajt7s2dfg.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'www.madeirabook.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
  async rewrites() {
    return [
      { source: '/amsterdam-to-madeira', destination: '/amsterdam-to-madeira.html' },
      { source: '/apartamentos-do-mar', destination: '/apartamentos-do-mar.html' },
      { source: '/barcelona-to-madeira', destination: '/barcelona-to-madeira.html' },
      { source: '/berlin-to-madeira', destination: '/berlin-to-madeira.html' },
      { source: '/best-time-to-visit-madeira', destination: '/best-time-to-visit-madeira.html' },
      { source: '/book-flights', destination: '/book-flights.html' },
      { source: '/brussels-to-madeira', destination: '/brussels-to-madeira.html' },
      { source: '/canico-self-catering', destination: '/canico-self-catering.html' },
      { source: '/dublin-to-madeira', destination: '/dublin-to-madeira.html' },
      { source: '/edinburgh-to-madeira', destination: '/edinburgh-to-madeira.html' },
      { source: '/espetada', destination: '/espetada.html' },
      { source: '/flights-to-madeira', destination: '/flights-to-madeira.html' },
      { source: '/frankfurt-to-madeira', destination: '/frankfurt-to-madeira.html' },
      { source: '/funchal-short-term-rentals', destination: '/funchal-short-term-rentals.html' },
      { source: '/lisbon-to-madeira', destination: '/lisbon-to-madeira.html' },
      { source: '/liverpool-to-madeira', destination: '/liverpool-to-madeira.html' },
      { source: '/london-to-madeira', destination: '/london-to-madeira.html' },
      { source: '/lido-funchal', destination: '/lido-funchal.html' },
      { source: '/madeira-apartment-rentals', destination: '/madeira-apartment-rentals.html' },
      { source: '/madeira-christmas-swimming', destination: '/madeira-christmas-swimming.html' },
      { source: '/madeira-events-calendar', destination: '/madeira-events-calendar.html' },
      { source: '/madeira-food-guide', destination: '/madeira-food-guide.html' },
      { source: '/madeira-guide-replacement', destination: '/madeira-guide-replacement.html' },
      { source: '/madeira-guide', destination: '/madeira-guide.html' },
      { source: '/madeira-history', destination: '/madeira-history.html' },
      { source: '/madeira-holiday-homes', destination: '/madeira-holiday-homes.html' },
      { source: '/madeira-hotel-deals', destination: '/madeira-hotel-deals.html' },
      { source: '/madeira-ocean-view-apartments', destination: '/madeira-ocean-view-apartments.html' },
      { source: '/madeira-safety', destination: '/madeira-safety.html' },
      { source: '/madeira-tours', destination: '/madeira-tours.html' },
      { source: '/madeira-villa-rentals', destination: '/madeira-villa-rentals.html' },
      { source: '/madeira-wine-tasting', destination: '/madeira-wine-tasting.html' },
      { source: '/madrid-to-madeira', destination: '/madrid-to-madeira.html' },
      { source: '/manchester-to-madeira', destination: '/manchester-to-madeira.html' },
      { source: '/munich-to-madeira', destination: '/munich-to-madeira.html' },
      { source: '/paris-to-madeira', destination: '/paris-to-madeira.html' },
      { source: '/penthouse-view-ocean-canico', destination: '/penthouse-view-ocean-canico.html' },
      { source: '/poncha', destination: '/poncha.html' },
      { source: '/porto-to-madeira', destination: '/porto-to-madeira.html' },
      { source: '/vienna-to-madeira', destination: '/vienna-to-madeira.html' },
      { source: '/where-to-eat-madeira', destination: '/where-to-eat-madeira.html' },
      { source: '/where-to-stay-madeira', destination: '/where-to-stay-madeira.html' },
      { source: '/zurich-to-madeira', destination: '/zurich-to-madeira.html' },
      { source: '/google89a0de19c9eba75c', destination: '/google89a0de19c9eba75c.html' },
    ]
  },
}

export default withSentryConfig(withPayload(nextConfig, { devBundleServerPackages: false }), {
  silent: true,
  org: 'o4512266386276352',
  project: '4512266408886352',
  widenClientFileUpload: true,
  bundleSizeOptimizations: { excludeDebugStatements: true },
  webpack: { automaticVercelMonitors: true },
})
