import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import SubscribeForm from '@/components/SubscribeForm'
import AcquisitionSection from './components/AcquisitionSection'
import EscapeCard from './components/EscapeCard'
import ExploreMap from './components/ExploreMap'
import GatewayCard from './components/GatewayCard'

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
    url: 'https://madeirabook-platform.vercel.app/',
  },
  alternates: {
    canonical: 'https://madeirabook-platform.vercel.app/',
  },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const HERO_IMAGE = 'https://www.madeirabook.com/images/madeira-cover-balcony.jpg'

const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Madeirabook',
  url: 'https://madeirabook-platform.vercel.app/',
  description:
    'Curated stays in Madeira — direct booking, honest prices.',
  potentialAction: {
    '@type': 'SearchAction',
    target:
      'https://madeirabook-platform.vercel.app/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

const NAV_LINKS = [
  { label: 'Stays', href: 'https://www.madeirabook.com/madeira-apartment-rentals.html' },
  { label: 'Flights', href: 'https://www.madeirabook.com/flights-to-madeira.html' },
  { label: 'Guides', href: 'https://www.madeirabook.com/madeira-guide.html' },
  { label: 'Weather', href: '#weather' },
]

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

// Shared sizing so both header buttons are identical in height and padding.
const HEADER_BTN =
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:px-5 sm:py-2.5 sm:text-sm'

export default async function HomePage() {
  const payload = await getPayload({ config: await config })

  const { docs: gateways } = await payload.find({
    collection: 'sluice-pages',
    where: { status: { equals: 'published' } },
    limit: 3,
    depth: 0,
  })

  const { docs: properties } = await payload.find({
    collection: 'properties',
    where: { status: { equals: 'published' } },
    limit: 12,
    depth: 2,
  })

  const { docs: mapProperties } = await payload.find({
    collection: 'properties',
    where: { status: { equals: 'published' } },
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

  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      {/* 1. Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a1420]/90 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[auto_auto_1fr] items-center gap-x-3 px-4 py-3 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
          <Link
            href="/"
            className="justify-self-start text-lg font-black tracking-tight text-white"
          >
            Madeirabook
          </Link>
          <nav className="hidden items-center justify-center gap-6 text-sm font-medium text-white/70 md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="transition-colors hover:text-white">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 justify-self-end sm:gap-3">
            <Link
              href="/sluice-test"
              className={`${HEADER_BTN} border-white/25 bg-[#0a1420] text-white hover:bg-white/10`}
            >
              Try the escape →
            </Link>
            <a
              href="https://app.madeirabook.com"
              className={`${HEADER_BTN} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500`}
            >
              Book →
            </a>
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto px-4 pb-3 text-sm font-medium text-white/70 md:hidden">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="whitespace-nowrap transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </header>

      {/* 2. Hero: Madeira image + always-visible escape card */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6 py-16">
        <Image
          src={HERO_IMAGE}
          alt="Madeira ocean view from a balcony"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
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
          {mapRestaurants.length} restaurants. Tap any pin.
        </p>
        <div className="h-[400px] overflow-hidden rounded-xl border border-white/10 md:h-[600px]">
          <ExploreMap
            properties={mapStays}
            beaches={mapBeaches}
            restaurants={mapRestaurants}
          />
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

      {/* 4. Emotional gateways triad */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <h2
          className="mb-12 text-center text-3xl font-light text-white/90 md:text-4xl"
          style={SERIF}
        >
          Three paths into silence
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {gateways.map((page) => (
            <GatewayCard key={page.id} page={page} />
          ))}
        </div>
      </section>

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
      <footer className="border-t border-white/10 px-6 py-10">
        <nav className="flex flex-col items-center gap-4 text-sm text-white/50 sm:flex-row sm:justify-center sm:gap-10">
          <Link href="/legal/privacy" className="transition-colors hover:text-white/80">
            Privacy Policy
          </Link>
          <Link href="/legal/terms" className="transition-colors hover:text-white/80">
            Terms of Service
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
