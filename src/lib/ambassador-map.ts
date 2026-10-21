import type { Payload } from 'payload'

import { FEATURES } from '@/lib/features'
import type { Referral } from '@/payload-types'

type Slugged = { slug?: string | null }

function slugsOf(list: unknown): string[] {
  if (!Array.isArray(list)) return []
  return list
    .map((item) =>
      typeof item === 'object' && item !== null ? (item as Slugged).slug : null,
    )
    .filter((s): s is string => Boolean(s))
}

const uploadUrl = (u: unknown): string | null =>
  typeof u === 'object' && u !== null && 'url' in u
    ? ((u as { url?: string | null }).url ?? null)
    : null

export interface AmbassadorMapBeach {
  id: number
  slug: string
  name: string
  lat: number
  lng: number
  heroImage?: string | null
}

export interface AmbassadorMapRestaurant {
  id: number
  slug: string
  name: string
  lat: number
  lng: number
  cuisine?: string | null
  averagePrice?: number | null
  heroImage?: string | null
}

export interface AmbassadorMapPin {
  id: number
  title: string
  lat: number
  lng: number
  description?: string | null
  photoUrl?: string | null
  videoUrl?: string | null
}

export interface AmbassadorMapOasisStay {
  id: number
  slug: string
  title: string
  lat: number
  lng: number
  shortDescription?: string | null
  coverImage?: string | null
}

export interface AmbassadorMapData {
  beaches: AmbassadorMapBeach[]
  restaurants: AmbassadorMapRestaurant[]
  pins: AmbassadorMapPin[]
  oasisStays: AmbassadorMapOasisStay[]
}

// Everything an ambassador's map renders: their curated beaches/restaurants,
// approved own pins, and (feature-flagged) the read-only Oasis hotel pins.
// Pins the map can't place (missing coordinates) are dropped here.
export async function fetchAmbassadorMapData(
  payload: Payload,
  referral: Referral,
): Promise<AmbassadorMapData> {
  const beachSlugs = new Set(slugsOf(referral.selectedBeaches))
  const restaurantSlugs = new Set(slugsOf(referral.selectedRestaurants))

  // Gold Oasis pins: FEATURES.ambassadorOasisAccess enables the preview for
  // every ambassador; referrals.oasisAccess remains the per-ambassador
  // privilege flag (and the sole gate for Oasis commission payouts).
  const showOasis =
    FEATURES.ambassadorOasisAccess || referral.oasisAccess === true

  const [
    { docs: beaches },
    { docs: restaurants },
    { docs: ambassadorPins },
    { docs: oasisProperties },
  ] = await Promise.all([
    beachSlugs.size
      ? payload.find({
          collection: 'beaches',
          where: {
            and: [
              { status: { equals: 'published' } },
              { slug: { in: [...beachSlugs] } },
            ],
          },
          limit: 200,
          depth: 1,
        })
      : Promise.resolve({ docs: [] }),
    restaurantSlugs.size
      ? payload.find({
          collection: 'restaurants',
          where: {
            and: [
              { status: { equals: 'published' } },
              { slug: { in: [...restaurantSlugs] } },
            ],
          },
          limit: 200,
          depth: 1,
        })
      : Promise.resolve({ docs: [] }),
    payload.find({
      collection: 'ambassador-pins',
      where: {
        and: [
          { referral: { equals: referral.id } },
          { status: { equals: 'approved' } },
        ],
      },
      limit: 100,
      depth: 1,
    }),
    showOasis
      ? payload.find({
          collection: 'properties',
          where: {
            and: [
              { brand: { equals: 'madeiraoasis' } },
              { status: { equals: 'published' } },
            ],
          },
          limit: 200,
          depth: 1,
        })
      : Promise.resolve({ docs: [] }),
  ])

  return {
    beaches: beaches.flatMap((b) => {
      if (b.geoCoordinates?.lat == null || b.geoCoordinates?.lng == null)
        return []
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
    }),
    restaurants: restaurants.flatMap((r) => {
      if (r.geoCoordinates?.lat == null || r.geoCoordinates?.lng == null)
        return []
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
    }),
    pins: ambassadorPins.flatMap((p) => {
      if (p.coordinates?.lat == null || p.coordinates?.lng == null) return []
      return [
        {
          id: p.id,
          title: p.title,
          lat: p.coordinates.lat,
          lng: p.coordinates.lng,
          description: p.description,
          photoUrl: uploadUrl(p.photo),
          videoUrl: uploadUrl(p.video),
        },
      ]
    }),
    oasisStays: oasisProperties.flatMap((p) => {
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
          shortDescription: p.shortDescription,
          coverImage:
            cover && typeof cover === 'object' ? (cover.url ?? null) : null,
        },
      ]
    }),
  }
}
