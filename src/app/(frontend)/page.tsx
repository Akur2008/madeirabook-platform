import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import HotelStories from '@/components/HotelStories'
import { HOTEL_STORIES } from '@/lib/hotel-stories'
import SaveAsAppSheet from '@/components/SaveAsAppSheet'
import SubscribeForm from '@/components/SubscribeForm'
import AcquisitionSection from './components/AcquisitionSection'
import EscapeCard from './components/EscapeCard'
import ExploreMap from './components/ExploreMap'
import Header from './components/Header'
import HomepageHeroVideo from './components/HomepageHeroVideo'
import HomepageTrioRotation from './components/HomepageTrioRotation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Madeirabook — rare places to stay in Madeira',
  description:
    'Curated stays in Madeira — direct booking, honest prices, no mass tourism.',
  openGraph: {
    title: 'Madeirabook',
    description:
      'Curated stays in Madeira — direct booking, honest prices.',
    type: 'website',
    url: 'https://www.madeirabook.com/',
  },
  alternates: {
    canonical: 'https://www.madeirabook.com/',
  },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Madeirabook',
  url: 'https://www.madeirabook.com/',
  description:
    'Curated stays in Madeira — direct booking, honest prices.',
  potentialAction: {
    '@type': 'SearchAction',
    target:
      'https://www.madeirabook.com/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

const WHY_CARDS = [
  {
    emoji: '☀️',
    title: 'Summer all year',
    text: '+22°C in January while Europe freezes. Ocean, sun, hiking — every month.',
    href: 'https://www.madeirabook.com/best-time-to-visit-madeira.html',
  },
  {
    emoji: '🛡️',
    title: 'Safest in Europe',
    text: 'No snakes. No scorpions. No venomous spiders. Perfect for families.',
    href: 'https://www.madeirabook.com/madeira-safety.html',
  },
  {
    emoji: '🎭',
    title: 'Events off-season',
    text: "Carnival, Flower Festival, Wine Week, Christmas. The best months aren't summer.",
    href: 'https://www.madeirabook.com/madeira-events-calendar.html',
  },
]

const REF_COOKIE = 'madeirabook_ref'
const REF_CODE_RE = /^[a-z0-9_-]{2,50}$/

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const payload = await getPayload({ config: await config })

  // Ambassador white-label: ?ref= wins over the 30-day cookie (fresh attribution)
  const cookieStore = await cookies()
  const { ref } = await searchParams
  const refCode =
    (typeof ref === 'string' && REF_CODE_RE.test(ref) ? ref : null) ??
    cookieStore.get(REF_COOKIE)?.value ??
    null

  let ambassador: {
    displayName: string
    avatarUrl: string | null
    accentColor: string | null
    selectedBeachesSlugs: string[]
  } | null = null

  if (refCode) {
    const { docs } = await payload.find({
      collection: 'referrals',
      where: {
        and: [
          { status: { equals: 'active' } },
          {
            or: [{ code: { equals: refCode } }, { aliases: { contains: refCode } }],
          },
        ],
      },
      limit: 1,
      depth: 1,
      select: {
        code: true,
        aliases: true,
        status: true,
        creatorName: true,
        displayName: true,
        avatarUrl: true,
        accentColor: true,
        selectedBeaches: true,
      },
    })
    const doc = docs[0]
    if (doc) {
      const raw = (doc.displayName ?? doc.creatorName).trim()
      const name = raw.split('@')[0].trim()
      ambassador = {
        displayName: /madeira/i.test(name) ? name : `${name}'s Madeira`,
        avatarUrl: doc.avatarUrl ?? null,
        accentColor: doc.accentColor ?? null,
        selectedBeachesSlugs: (doc.selectedBeaches ?? [])
          .map((b) => (typeof b === 'object' && b !== null ? b.slug : null))
          .filter((s): s is string => Boolean(s)),
      }
    }
  }

  const { docs: properties } = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { status: { equals: 'published' } },
        { brand: { not_equals: 'madeiraoasis' } },
      ],
    },
    limit: 12,
    depth: 2,
  })

  const { docs: mapProperties } = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { status: { equals: 'published' } },
        { brand: { not_equals: 'madeiraoasis' } },
      ],
    },
    limit: 50,
    depth: 1,
  })

  const { docs: beaches } = await payload.find({
    collection: 'beaches',
    where: { status: { equals: 'published' } },
    limit: 50,
    depth: 1,
  })

  const { docs: restaurants } = await payload.find({
    collection: 'restaurants',
    where: { status: { equals: 'published' } },
    limit: 50,
    depth: 1,
  })

  const { docs: trails } = await payload.find({
    collection: 'trails',
    where: { status: { equals: 'published' } },
    limit: 50,
    depth: 1,
  })

  const { docs: viewpoints } = await payload.find({
    collection: 'viewpoints',
    where: { status: { equals: 'published' } },
    limit: 50,
    depth: 1,
  })

  const mapStays = mapProperties.flatMap((p) => {
    const loc = typeof p.location === 'object' ? p.location : null
    const geo =
      p.geoCoordinates?.lat != null && p.geoCoordinates?.lng != null
        ? p.geoCoordinates
        : loc?.geoCoordinates
    if (geo?.lat == null || geo?.lng == null) return []
    const mediaItems = (p.media ?? []).map((m) => m.image)
    const cover = mediaItems.find(
      (img) =>
        typeof img === 'object' &&
        img !== null &&
        !(
          img.mimeType?.startsWith('video/') ||
          /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(img.url)
        ),
    )
    const video = mediaItems.find(
      (img) =>
        typeof img === 'object' &&
        img !== null &&
        (img.mimeType?.startsWith('video/') ||
          /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(img.url)),
    )
    return [
      {
        id: p.id,
        slug: p.slug,
        title: p.title,
        lat: geo.lat,
        lng: geo.lng,
        pricePerNight: p.pricePerNight,
        coverImage: cover && typeof cover === 'object' ? (cover.url ?? null) : null,
        videoUrl: video && typeof video === 'object' ? (video.url ?? null) : null,
        shortDescription: p.shortDescription,
        address:
          [
            p.address?.street,
            [p.address?.postal, p.address?.city].filter(Boolean).join(' ') ||
              null,
            p.address?.country,
          ]
            .filter(Boolean)
            .join(', ') || null,
        featured: p.featured,
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
        featured: b.featured,
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
        featured: r.featured,
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
        featured: t.featured,
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
        featured: v.featured,
      },
    ]
  })

  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Playfair+Display:wght@400;500&display=swap"
      />

      {/* 1. Header */}
      <Header refCode={refCode} />

      {/* 2. Hero: fixed ocean loop + always-visible escape card */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6 py-16">
        <HomepageHeroVideo />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-[#0a1420]" />
        <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
          <h1
            className="max-w-4xl text-4xl font-light leading-tight text-white/95 sm:text-5xl md:text-6xl"
            style={SERIF}
          >
            Madeira remembers how to be quiet.
          </h1>
          <p className="mt-5 text-base text-white/70 md:text-lg">
            A two-minute escape from the city noise.
          </p>
          <div id="search" className="scroll-mt-24" />
          <div className="mt-8 flex w-full justify-center">
            <EscapeCard />
          </div>
        </div>
      </section>

      {/* 2.1. Save as App — inline CTA, clear of the fixed WhatsApp/Sound
          buttons in the bottom-right corner */}
      <div className="mt-10 flex justify-center px-6">
        <SaveAsAppSheet variant="dark" />
      </div>

      {/* 2.25. Explore map — stays, beaches, restaurants */}
      <section id="map" className="mx-auto mt-16 max-w-6xl scroll-mt-24 px-6">
        <h2
          className="text-center text-3xl font-light text-white/90 md:text-4xl"
          style={SERIF}
        >
          Explore Madeira
        </h2>
        <p className="mx-auto mb-8 mt-3 max-w-2xl text-center text-white/60">
          {mapStays.length} curated stays · {mapBeaches.length} beaches ·{' '}
          {mapRestaurants.length} restaurants · {mapTrails.length} trails ·{' '}
          {mapViewpoints.length} viewpoints. Tap any pin.
        </p>
        <div className="h-[400px] overflow-hidden rounded-xl border border-white/10 md:h-[600px]">
          <ExploreMap
            properties={mapStays}
            beaches={mapBeaches}
            restaurants={mapRestaurants}
            trails={mapTrails}
            viewpoints={mapViewpoints}
            ambassador={ambassador}
          />
        </div>
        {/* Offline navigation — Organic Maps deep link lives on every pin sheet */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-5 py-2.5 text-sm">
            <span aria-hidden>🧭</span>
            <span className="font-semibold uppercase tracking-widest text-[#d4af37]">
              Offline Navigation
            </span>
            <span className="text-white/60">
              Download once. Navigate anywhere.
            </span>
          </div>
        </div>
      </section>

      {/* 2.5. Stays grid — published properties */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <h2
          className="mb-12 text-center text-3xl font-light text-white/90 md:text-4xl"
          style={SERIF}
        >
          Our stays in Madeira
        </h2>
        {properties.length === 0 ? (
          <p className="text-center text-white/50">New stays coming soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {properties.map((p) => {
              const cover = p.media?.[0]?.image
              const coverUrl = cover && typeof cover === 'object' ? cover.url : null
              return (
                <Link
                  key={p.id}
                  href={`/p/${p.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-white/25"
                >
                  {coverUrl && (
                    <Image
                      src={coverUrl}
                      alt={p.title}
                      width={800}
                      height={600}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="p-5">
                    <h3
                      className="text-xl font-light leading-tight text-white/95"
                      style={SERIF}
                    >
                      {p.title}
                    </h3>
                    {p.pricePerNight && (
                      <p className="mb-0 mt-2 text-sm text-white/60">
                        From €{p.pricePerNight} / night
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* 2.75. Hotel Stories — phone-frame posters; video only loads in the
          full-screen sheet on tap */}
      <HotelStories stories={HOTEL_STORIES} theme="dark" />

      {/* 3. Weather widget (meteoblue) */}
      <section id="weather" className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-3 text-center text-3xl font-light text-white/90 md:text-4xl"
            style={SERIF}
          >
            Weather in Madeira
          </h2>
          <p className="mb-8 mt-0 text-center text-sm text-white/50">
            Wind and rain over the island — live.
          </p>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <iframe
              src="https://www.meteoblue.com/en/weather/maps/widget/funchal_portugal_2267827?windAnimation=1&gust=0&satellite=1&cloudsAndPrecipitation=0&temperature=0&sunshine=0&extremeForecastIndex=0&geoloc=fixed&tempunit=C&lengthunit=metric&windunit=m%252Fs&zoom=9&autowidth=auto&user_key=341c1d820f9b092c&embed_key=53ce891855e5d876&sig=91a5f1d457090096cef4c482c287a7724642523963efe45f3edd0dbbf4c635ee"
              scrolling="no"
              sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
              style={{
                width: '100%',
                height: '300px',
                border: 0,
                overflow: 'hidden',
                display: 'block',
              }}
              title="Weather map of Madeira — meteoblue"
            />
          </div>
          <div className="mt-1 text-right text-[11px]">
            <a
              href="https://www.meteoblue.com/en/weather/week/index"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 transition-colors hover:text-white/70"
            >
              meteoblue
            </a>
          </div>
        </div>
      </section>

      {/* 4. Landscape trio: mountains → forest → ocean, fixed clips */}
      <HomepageTrioRotation />

      {/* 5. Why guests come back — light contrast block */}
      <section className="bg-[#f8fafc] px-6 py-16 text-[#0f172a] md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
            Why guests come back to Madeira
          </h2>
          <p className="mx-auto mb-0 mt-3 max-w-2xl text-center text-base text-slate-500">
            Not just a summer island. Madeira works all year — and guests return
            winter, spring and next summer.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {WHY_CARDS.map((card) => (
              <a
                key={card.title}
                href={card.href}
                className="block rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="text-3xl">{card.emoji}</div>
                <h3 className="mt-3 text-lg font-bold">{card.title}</h3>
                <p className="mb-0 mt-2 text-[15px] leading-relaxed text-slate-500">
                  {card.text}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Subscribe */}
      <section className="flex justify-center px-6 py-16 md:py-20">
        <SubscribeForm />
      </section>

      {/* 6.5. Acquisition: owners + creators */}
      <AcquisitionSection />

      {/* 7. Minimal footer — 3 links only */}
      <footer className="border-t border-white/10 px-6 pt-10 pb-24">
        <nav className="flex flex-col items-center gap-4 text-sm text-white/50 sm:flex-row sm:justify-center sm:gap-10">
          <Link href="/legal/privacy" className="transition-colors hover:text-white/80">
            Privacy Policy
          </Link>
          <Link href="/legal/terms" className="transition-colors hover:text-white/80">
            Terms of Service
          </Link>
          <Link href="/guides" className="transition-colors hover:text-white/80">
            Guides
          </Link>
          <a
            href="mailto:hello@madeirabook.com"
            className="transition-colors hover:text-white/80"
          >
            Contacts
          </a>
        </nav>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
      />
    </div>
  )
}
