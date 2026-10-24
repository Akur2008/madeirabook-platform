import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import type { Upload } from '@/payload-types'
import RestaurantStories, {
  type RestaurantStoryItem,
} from '@/components/RestaurantStories'

import Header from '../components/Header'

export const revalidate = 60

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const uploadUrl = (u: unknown): string | null =>
  typeof u === 'object' && u !== null && 'url' in u && typeof (u as Upload).url === 'string'
    ? ((u as Upload).url as string)
    : null

export const metadata: Metadata = {
  title: 'Restaurants in Madeira — Madeirabook',
  description:
    'Curated restaurants in Madeira — Michelin dining, heritage quintas and local tables. Watch the stories, navigate offline.',
  openGraph: {
    title: 'Restaurants in Madeira — Madeirabook',
    description:
      'Curated restaurants in Madeira — Michelin dining, heritage quintas and local tables.',
    type: 'website',
    url: 'https://www.madeirabook.com/restaurants',
  },
  alternates: {
    canonical: 'https://www.madeirabook.com/restaurants',
  },
}

export default async function RestaurantsPage() {
  const payload = await getPayload({ config: await config })
  const { docs: restaurants } = await payload.find({
    collection: 'restaurants',
    where: { status: { equals: 'published' } },
    limit: 100,
    depth: 2,
    sort: 'name',
  })

  const items: RestaurantStoryItem[] = restaurants.flatMap((r) => {
    if (r.geoCoordinates?.lat == null || r.geoCoordinates?.lng == null)
      return []
    const video = r.videoFile
    const videoUrl =
      typeof video === 'object' && video?.mimeType?.startsWith('video/')
        ? uploadUrl(video)
        : null
    const posterUrl =
      r.posterUrl ?? uploadUrl(r.media?.[0]?.image) ?? r.heroImage ?? null
    const locationName =
      r.location && typeof r.location === 'object' ? r.location.name : null
    return [
      {
        id: r.id,
        slug: r.slug,
        name: r.name,
        meta: [r.cuisine, locationName].filter(Boolean).join(' · ') || null,
        videoUrl,
        posterUrl,
        lat: r.geoCoordinates.lat,
        lng: r.geoCoordinates.lng,
      },
    ]
  })

  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      <Header />

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <nav className="text-sm text-white/50">
          <Link href="/" className="transition-colors hover:text-white/80">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/80">Restaurants</span>
        </nav>

        <p className="mt-10 text-center text-[11px] font-medium uppercase tracking-[0.35em] text-white/50">
          Stories
        </p>
        <h1
          className="mt-3 text-center text-4xl font-light text-white/95 md:text-5xl"
          style={SERIF}
        >
          Restaurants of Madeira
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-white/60">
          {items.length} curated tables — tap a frame for the story, navigate
          there offline.
        </p>

        {items.length === 0 ? (
          <p className="mt-16 text-center text-white/50">
            New restaurants coming soon.
          </p>
        ) : (
          <RestaurantStories items={items} />
        )}

        <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/#map"
            className="inline-flex items-center justify-center rounded-lg border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            ← Back to map
          </Link>
          <Link
            href="/#search"
            className="inline-flex items-center justify-center rounded-lg border border-emerald-600 bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Find your dates →
          </Link>
        </div>
      </div>
    </div>
  )
}
