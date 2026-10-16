import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import ExploreMap from '../components/ExploreMap'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Explore Madeira — 92 curated places | Madeirabook',
  description:
    '3 stays · 10 beaches · 39 restaurants · 20 trails · 20 viewpoints. Interactive map of Madeira.',
  openGraph: {
    title: 'Explore Madeira',
    description:
      '92 curated places on one map: stays, beaches, restaurants, trails, viewpoints.',
    images: [{ url: '/og/explore-map.png', width: 1200, height: 630 }],
    url: 'https://www.madeirabook.com/explore',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og/explore-map.png'],
  },
  alternates: {
    canonical: 'https://www.madeirabook.com/explore',
  },
}

export default async function ExplorePage() {
  const payload = await getPayload({ config: await config })

  const { docs: mapProperties } = await payload.find({
    collection: 'properties',
    where: { status: { equals: 'published' } },
    limit: 200,
    depth: 1,
  })

  const { docs: beaches } = await payload.find({
    collection: 'beaches',
    where: { status: { equals: 'published' } },
    limit: 200,
    depth: 1,
  })

  const { docs: restaurants } = await payload.find({
    collection: 'restaurants',
    where: { status: { equals: 'published' } },
    limit: 200,
    depth: 1,
  })

  const { docs: trails } = await payload.find({
    collection: 'trails',
    where: { status: { equals: 'published' } },
    limit: 200,
    depth: 1,
  })

  const { docs: viewpoints } = await payload.find({
    collection: 'viewpoints',
    where: { status: { equals: 'published' } },
    limit: 200,
    depth: 1,
  })

  const mapStays = mapProperties.flatMap((p) => {
    const loc = typeof p.location === 'object' ? p.location : null
    if (loc?.geoCoordinates?.lat == null || loc?.geoCoordinates?.lng == null) return []
    const cover = p.media?.[0]?.image
    return [
      {
        id: p.id,
        slug: p.slug,
        title: p.title,
        lat: loc.geoCoordinates.lat,
        lng: loc.geoCoordinates.lng,
        pricePerNight: p.pricePerNight,
        coverImage: cover && typeof cover === 'object' ? (cover.url ?? null) : null,
      },
    ]
  })

  const mapBeaches = beaches.flatMap((b) => {
    if (b.geoCoordinates?.lat == null || b.geoCoordinates?.lng == null) return []
    return [
      {
        id: b.id,
        slug: b.slug,
        name: b.name,
        lat: b.geoCoordinates.lat,
        lng: b.geoCoordinates.lng,
        heroImage: b.heroImage,
      },
    ]
  })

  const mapRestaurants = restaurants.flatMap((r) => {
    if (r.geoCoordinates?.lat == null || r.geoCoordinates?.lng == null) return []
    return [
      {
        id: r.id,
        slug: r.slug,
        name: r.name,
        lat: r.geoCoordinates.lat,
        lng: r.geoCoordinates.lng,
        cuisine: r.cuisine,
        averagePrice: r.averagePrice,
        heroImage: r.heroImage,
      },
    ]
  })

  const mapTrails = trails.flatMap((t) => {
    if (t.geoCoordinates?.lat == null || t.geoCoordinates?.lng == null) return []
    return [
      {
        id: t.id,
        slug: t.slug,
        name: t.name,
        lat: t.geoCoordinates.lat,
        lng: t.geoCoordinates.lng,
        distanceKm: t.distanceKm,
        difficulty: t.difficulty,
      },
    ]
  })

  const mapViewpoints = viewpoints.flatMap((v) => {
    if (v.geoCoordinates?.lat == null || v.geoCoordinates?.lng == null) return []
    return [
      {
        id: v.id,
        slug: v.slug,
        name: v.name,
        lat: v.geoCoordinates.lat,
        lng: v.geoCoordinates.lng,
        elevationM: v.elevationM,
        type: v.type,
      },
    ]
  })

  return (
    <div className="h-dvh overflow-hidden bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      <Link
        href="/"
        className="fixed left-4 top-4 z-20 text-lg font-black tracking-tight text-white"
      >
        Madeirabook
      </Link>
      <Link
        href="/"
        className="fixed right-4 top-4 z-20 inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 sm:px-5 sm:py-2.5 sm:text-sm"
      >
        Book your stay →
      </Link>

      {/* 64px top offset keeps the floating logo/CTA clear of the in-map filter bar */}
      <div className="explore-fullmap mt-16 h-[calc(100dvh-64px)]">
        <ExploreMap
          properties={mapStays}
          beaches={mapBeaches}
          restaurants={mapRestaurants}
          trails={mapTrails}
          viewpoints={mapViewpoints}
        />
      </div>
    </div>
  )
}
