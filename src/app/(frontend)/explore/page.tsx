import type { Metadata } from 'next'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import ExploreMapInteractive from '../components/ExploreMapInteractive'
import Header from '../components/Header'

export const revalidate = 60

const uploadUrl = (u: unknown): string | null =>
  typeof u === 'object' && u !== null && 'url' in u && typeof (u as { url?: unknown }).url === 'string'
    ? (u as { url: string }).url
    : null

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

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    lat?: string
    lng?: string
    zoom?: string
    ref?: string
  }>
}) {
  const { lat, lng, zoom, ref } = await searchParams
  const parsedLat = Number(lat)
  const parsedLng = Number(lng)
  const parsedZoom = Number(zoom)
  const initialCenter =
    lat != null && lng != null && Number.isFinite(parsedLat) && Number.isFinite(parsedLng)
      ? { lat: parsedLat, lng: parsedLng }
      : null
  const initialZoom = zoom != null && Number.isFinite(parsedZoom) ? parsedZoom : undefined

  const payload = await getPayload({ config: await config })

  const { docs: mapProperties } = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { status: { equals: 'published' } },
        { brand: { not_equals: 'madeiraoasis' } },
      ],
    },
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

  // Approved ambassador pins promoted to the global map ("Community Pick").
  const { docs: communityPins } = await payload.find({
    collection: 'ambassador-pins',
    where: {
      and: [
        { status: { equals: 'approved' } },
        { promotedToGlobal: { equals: true } },
      ],
    },
    limit: 200,
    depth: 1,
  })

  const mapStays = mapProperties.flatMap((p) => {
    const loc = typeof p.location === 'object' ? p.location : null
    const geo =
      p.geoCoordinates?.lat != null && p.geoCoordinates?.lng != null
        ? p.geoCoordinates
        : loc?.geoCoordinates
    if (geo?.lat == null || geo?.lng == null) return []
    const cover = p.media?.[0]?.image
    return [
      {
        id: p.id,
        slug: p.slug,
        title: p.title,
        lat: geo.lat,
        lng: geo.lng,
        pricePerNight: p.pricePerNight,
        coverImage: cover && typeof cover === 'object' ? (cover.url ?? null) : null,
        photoUrl: cover && typeof cover === 'object' ? (cover.url ?? null) : null,
        shortDescription: p.shortDescription,
        meta: p.pricePerNight ? `€${p.pricePerNight} / night` : null,
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
        photoUrl: uploadUrl(b.media?.[0]?.image) ?? b.heroImage ?? null,
        shortDescription: b.shortDescription,
        meta:
          [b.highlights?.[0], b.bestTimeToVisit].filter(Boolean).join(' · ') || null,
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
        photoUrl: uploadUrl(r.media?.[0]?.image) ?? r.heroImage ?? null,
        shortDescription: r.shortDescription,
        meta:
          [
            r.cuisine,
            r.averagePrice ? `~€${r.averagePrice}` : null,
            r.googleRating ? `★ ${r.googleRating}` : null,
          ]
            .filter(Boolean)
            .join(' · ') || null,
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
        photoUrl: uploadUrl(t.media?.[0]?.image) ?? t.heroImage ?? null,
        shortDescription: t.shortDescription,
        meta:
          [t.prCode, t.distanceKm ? `${t.distanceKm} km` : null, t.difficulty]
            .filter(Boolean)
            .join(' · ') || null,
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
        photoUrl: uploadUrl(v.media?.[0]?.image) ?? v.heroImage ?? null,
        shortDescription: v.shortDescription,
        meta:
          [v.type, v.elevationM ? `${v.elevationM} m` : null, v.bestTime]
            .filter(Boolean)
            .join(' · ') || null,
      },
    ]
  })

  const mapCommunityPins = communityPins.flatMap((p) => {
    if (p.coordinates?.lat == null || p.coordinates?.lng == null) return []
    const owner =
      typeof p.referral === 'object' && p.referral !== null ? p.referral : null
    return [
      {
        id: p.id,
        title: p.title,
        lat: p.coordinates.lat,
        lng: p.coordinates.lng,
        photoUrl: uploadUrl(p.photo),
        videoUrl: uploadUrl(p.video),
        shortDescription: p.description,
        addedBy: owner?.displayName || owner?.creatorName || null,
        refCode: owner?.code ?? null,
      },
    ]
  })

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      <Header refCode={ref} />

      {/* The map fills whatever space the header leaves */}
      <div className="explore-fullmap min-h-0 flex-1">
        <ExploreMapInteractive
          properties={mapStays}
          beaches={mapBeaches}
          restaurants={mapRestaurants}
          trails={mapTrails}
          viewpoints={mapViewpoints}
          communityPins={mapCommunityPins}
          initialLat={initialCenter?.lat}
          initialLng={initialCenter?.lng}
          initialZoom={initialZoom}
        />
      </div>
    </div>
  )
}
