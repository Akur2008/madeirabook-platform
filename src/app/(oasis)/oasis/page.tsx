import type { Metadata } from 'next'
import { getPayload, type Where } from 'payload'
import React from 'react'

import config from '@/payload.config'
import type {
  OasisHotelPin,
  OasisPoiPin,
} from '../../(frontend)/components/OasisMap'
import InteractiveHero from './InteractiveHero'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Madeira Oasis — The collection',
  description:
    'Fifteen hand-picked luxury hotels across Madeira on one map. Request a stay through the Madeira Oasis concierge.',
  alternates: { canonical: '/' },
}

export default async function OasisPage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string; zoom?: string }>
}) {
  const { lat, lng, zoom } = await searchParams
  const parsedLat = Number(lat)
  const parsedLng = Number(lng)
  const parsedZoom = Number(zoom)
  const hasCenter =
    lat != null && lng != null && Number.isFinite(parsedLat) && Number.isFinite(parsedLng)

  const payload = await getPayload({ config: await config })

  // "tenant: oasis" maps to brand = madeiraoasis on the shared Properties
  // collection; brand 'both' (e.g. Hotel Orquídea) is published on the
  // Oasis map and on madeirabook at the same time.
  const { docs: properties } = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { brand: { in: ['madeiraoasis', 'both'] } },
        { status: { equals: 'published' } },
      ],
    },
    limit: 200,
    depth: 1,
  })

  // Curated side layers — only entries hand-picked for the Oasis map.
  const featuredWhere: Where = {
    and: [
      { status: { equals: 'published' } },
      { isFeaturedOasis: { equals: true } },
    ],
  }
  const [{ docs: beachDocs }, { docs: restaurantDocs }] = await Promise.all([
    payload.find({
      collection: 'beaches',
      where: featuredWhere,
      limit: 50,
    }),
    payload.find({
      collection: 'restaurants',
      where: featuredWhere,
      limit: 50,
    }),
  ])

  const toPoiPin = (
    doc: {
      id: number | string
      slug: string
      name: string
      geoCoordinates?: { lat?: number | null; lng?: number | null } | null
      shortDescription?: string | null
    },
    kind: OasisPoiPin['kind'],
    subtitle?: string | null,
  ): OasisPoiPin[] =>
    doc.geoCoordinates?.lat != null && doc.geoCoordinates?.lng != null
      ? [
          {
            id: doc.id,
            slug: doc.slug,
            name: doc.name,
            kind,
            lat: doc.geoCoordinates.lat,
            lng: doc.geoCoordinates.lng,
            subtitle: subtitle ?? null,
          },
        ]
      : []

  const beaches: OasisPoiPin[] = beachDocs.flatMap((b) =>
    toPoiPin(b, 'beach', b.shortDescription),
  )
  const restaurants: OasisPoiPin[] = restaurantDocs.flatMap((r) =>
    toPoiPin(
      r,
      'restaurant',
      [r.cuisine, r.michelinStars ? '★'.repeat(r.michelinStars) : null]
        .filter(Boolean)
        .join(' · ') || null,
    ),
  )

  const hotels: OasisHotelPin[] = properties.flatMap((p) => {
    const geo =
      p.geoCoordinates?.lat != null && p.geoCoordinates?.lng != null
        ? p.geoCoordinates
        : typeof p.location === 'object'
          ? p.location?.geoCoordinates
          : null
    if (geo?.lat == null || geo?.lng == null) return []

    const mediaItems = (p.media ?? []).map((m) => m.image)
    const isVideo = (img: (typeof mediaItems)[number]) =>
      typeof img === 'object' &&
      img !== null &&
      Boolean(
        img.mimeType?.startsWith('video/') ||
          /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(img.url),
      )
    const cover = mediaItems.find((img) => !isVideo(img))
    const video = mediaItems.find(isVideo)
    return [
      {
        id: p.id,
        slug: p.slug,
        title: p.title,
        lat: geo.lat,
        lng: geo.lng,
        category: p.category,
        locationName:
          p.location && typeof p.location === 'object' ? p.location.name : null,
        shortDescription: p.shortDescription,
        coverImage:
          cover && typeof cover === 'object' ? (cover.url ?? null) : null,
        photoUrl:
          cover && typeof cover === 'object' ? (cover.url ?? null) : null,
        videoUrl:
          video && typeof video === 'object' ? (video.url ?? null) : null,
        address:
          [
            p.address?.street,
            [p.address?.postal, p.address?.city].filter(Boolean).join(' ') ||
              null,
            p.address?.country,
          ]
            .filter(Boolean)
            .join(', ') || null,
      },
    ]
  })

  return (
    <div className="h-dvh overflow-hidden bg-[#171310]">
      <InteractiveHero
        hotels={hotels}
        beaches={beaches}
        restaurants={restaurants}
        initialLat={hasCenter ? parsedLat : undefined}
        initialLng={hasCenter ? parsedLng : undefined}
        initialZoom={zoom != null && Number.isFinite(parsedZoom) ? parsedZoom : undefined}
      />
    </div>
  )
}
