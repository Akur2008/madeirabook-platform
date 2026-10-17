import type { Metadata } from 'next'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import OasisMap, { type OasisHotelPin } from '../../(frontend)/components/OasisMap'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Madeira Oasis — The collection',
  description:
    'Fifteen hand-picked luxury hotels across Madeira on one map. Request a stay through the Madeira Oasis concierge.',
  alternates: { canonical: '/oasis' },
}

export default async function OasisPage() {
  const payload = await getPayload({ config: await config })

  // "tenant: oasis" maps to brand = madeiraoasis on the shared Properties collection
  const { docs: properties } = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { brand: { equals: 'madeiraoasis' } },
        { status: { equals: 'published' } },
        { hotelType: { equals: 'hotel' } },
      ],
    },
    limit: 200,
    depth: 1,
  })

  const hotels: OasisHotelPin[] = properties.flatMap((p) => {
    const geo =
      p.geoCoordinates?.lat != null && p.geoCoordinates?.lng != null
        ? p.geoCoordinates
        : typeof p.location === 'object'
          ? p.location?.geoCoordinates
          : null
    if (geo?.lat == null || geo?.lng == null) return []

    const cover = p.media?.[0]?.image
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
      },
    ]
  })

  return (
    <div className="h-dvh overflow-hidden bg-[#fdfbf7]">
      <OasisMap hotels={hotels} />
    </div>
  )
}
