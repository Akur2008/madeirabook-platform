import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import ExploreMap from '../../components/ExploreMap'
import WhatsAppButton from '../../links/WhatsAppButton'

export const revalidate = 60

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const
const REF_CODE_RE = /^[a-z0-9_-]{2,50}$/
const DEFAULT_ACCENT = '#d4af37'

type Slugged = { slug?: string | null }

function slugsOf(list: unknown): string[] {
  if (!Array.isArray(list)) return []
  return list
    .map((item) =>
      typeof item === 'object' && item !== null
        ? (item as Slugged).slug
        : null,
    )
    .filter((s): s is string => Boolean(s))
}

async function getReferral(code: string) {
  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'referrals',
    where: {
      and: [
        { status: { equals: 'active' } },
        {
          or: [{ code: { equals: code } }, { aliases: { contains: code } }],
        },
      ],
    },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

export async function generateMetadata(props: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const { code } = await props.params
  if (!REF_CODE_RE.test(code)) return {}
  const referral = await getReferral(code)
  if (!referral) return {}
  const name = referral.displayName || referral.creatorName
  return {
    title: `Curated by ${name} — Madeira map`,
    description:
      referral.bio ??
      `${name}'s curated Madeira: handpicked beaches and restaurants on one map.`,
    robots: { index: false, follow: false },
  }
}

export default async function AmbassadorMapPage(props: {
  params: Promise<{ code: string }>
}) {
  const { code } = await props.params
  if (!REF_CODE_RE.test(code)) notFound()

  const referral = await getReferral(code)
  if (!referral) notFound()

  const displayName = referral.displayName || referral.creatorName
  const accent = referral.accentColor || DEFAULT_ACCENT

  const app =
    typeof referral.sourceApplication === 'object' &&
    referral.sourceApplication !== null
      ? referral.sourceApplication
      : null
  const igHandle =
    (app?.instagramHandle ?? '').replace(/^@+/, '') || referral.code

  // Only the ambassador's curated spots are passed to the map.
  const beachSlugs = new Set(slugsOf(referral.selectedBeaches))
  const restaurantSlugs = new Set(slugsOf(referral.selectedRestaurants))

  const payload = await getPayload({ config: await config })
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
    // Gold Oasis pins are a privilege — only fetched for hand-picked
    // ambassadors (referrals.oasisAccess in /admin). Orquídea is the only
    // Oasis address shown publicly for now.
    referral.oasisAccess === true
      ? payload.find({
          collection: 'properties',
          where: {
            and: [
              { status: { equals: 'published' } },
              { slug: { contains: 'orquidea' } },
            ],
          },
          limit: 200,
          depth: 1,
        })
      : Promise.resolve({ docs: [] }),
  ])

  const uploadUrl = (u: unknown): string | null =>
    typeof u === 'object' && u !== null && 'url' in u
      ? ((u as { url?: string | null }).url ?? null)
      : null

  const mapPins = ambassadorPins.flatMap((p) => {
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

  const mapOasisStays = oasisProperties.flatMap((p) => {
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
  })

  const waMessage = `Hi! I found your map on Instagram (@${igHandle}). I want to escape to Madeira!`

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      {/* Ambassador hero — accent color with a dark gradient overlay */}
      <header
        className="relative shrink-0 overflow-hidden"
        style={{ backgroundColor: accent }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0a1420]" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-8 text-center sm:py-10">
          {referral.avatarUrl ? (
            // avatarUrl comes from CMS — arbitrary host, plain <img>
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={referral.avatarUrl}
              alt={displayName}
              className="h-16 w-16 rounded-full border-2 border-white/70 object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/70 bg-white/10 text-2xl shadow-lg">
              🧭
            </div>
          )}
          <h1
            className="mt-4 text-3xl font-light tracking-tight text-white sm:text-4xl"
            style={SERIF}
          >
            Curated by {displayName}
          </h1>
          {referral.bio && (
            <p className="mt-2 max-w-md text-sm leading-snug text-white/75">
              {referral.bio}
            </p>
          )}
          <p className="mt-3 text-[11px] uppercase tracking-widest text-white/45">
            {mapBeaches.length + mapRestaurants.length + mapPins.length} handpicked places ·
            Powered by Madeirabook
          </p>
        </div>
      </header>

      {/* Curated map — pin clicks carry ?ref={code} to the spot pages */}
      <div className="relative flex-1">
        <ExploreMap
          properties={[]}
          beaches={mapBeaches}
          restaurants={mapRestaurants}
          ambassadorPins={mapPins}
          oasisStays={mapOasisStays}
          refCode={referral.code}
          ambassador={{
            displayName,
            avatarUrl: referral.avatarUrl ?? null,
            accentColor: accent,
          }}
        />
      </div>

      {/* Floating WhatsApp concierge — attribution is appended client-side
          from the madeirabook_ref cookie set by middleware */}
      <WhatsAppButton
        className="fixed bottom-5 right-5 z-[1100] flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-2xl text-white shadow-[0_4px_20px_rgba(37,211,102,0.45)] transition-transform hover:scale-105"
        message={waMessage}
        label="💬"
      />
    </div>
  )
}
