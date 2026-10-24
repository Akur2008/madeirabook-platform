import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import EscapeBookButton from '../../components/EscapeBookButton'
import EscapeBookCard from '../../components/EscapeBookCard'
import Header from '../../components/Header'
import { ESCAPE_SEO } from './escape-copy'

export const revalidate = 60

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const WHY_TILES = [
  {
    emoji: '☀️',
    title: 'Warm all year',
    text: '+20°C in winter while Europe freezes.',
  },
  {
    emoji: '🛡️',
    title: 'No venomous animals',
    text: 'The safest island in Europe.',
  },
  {
    emoji: '🌊',
    title: 'Ocean-front stays',
    text: 'No mass tourism.',
  },
]

function formatDuration(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

type CopyCity = {
  name: string
  airportCode?: string | null
  flightDurationMinutes?: number | null
  basePrice?: number | null
  currency?: string | null
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
}

function renderEscapeCopy(text: string, city: CopyCity): string {
  const symbol = CURRENCY_SYMBOLS[city.currency ?? ''] ?? '€'
  return text
    .replaceAll('{name}', city.name)
    .replaceAll('{airportCode}', city.airportCode ?? '')
    .replaceAll(
      '{duration}',
      formatDuration(city.flightDurationMinutes) ?? 'a few hours',
    )
    .replaceAll(
      '{price}',
      city.basePrice != null ? String(city.basePrice) : '—',
    )
    .replaceAll('{currencySymbol}', symbol)
}

// Fallback for cities without bespoke copy — still unique via city data.
function fallbackParagraphs(city: CopyCity): string[] {
  const duration = formatDuration(city.flightDurationMinutes) ?? 'a few hours'
  const route = city.airportCode ? `${city.airportCode} → FNC` : 'to FNC'
  const price =
    city.basePrice != null
      ? ` with fares from ${CURRENCY_SYMBOLS[city.currency ?? ''] ?? '€'}${city.basePrice} one way`
      : ''
  return [
    `Getting to Madeira from ${city.name} is simple: flights ${route} take about ${duration}${price}. Land, pick up your bags, and the ocean is minutes away.`,
    `While ${city.name} works through its grey season, Madeira holds +20°C and ocean light all year. The best window is October to April — warm days, low fares and quiet trails.`,
    'Madeira is quiet luxury as a landscape: UNESCO laurel forest, natural lava pools, levada paths above the clouds and ocean-front stays away from mass tourism.',
    'Book your sanctuary direct on madeirabook — curated stays, honest prices, no middlemen.',
  ]
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'cities',
    where: { status: { equals: 'published' } },
    limit: 100,
    depth: 0,
  })
  return docs.map((city) => ({ citySlug: city.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>
}): Promise<Metadata> {
  const { citySlug } = await params
  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'cities',
    where: { slug: { equals: citySlug }, status: { equals: 'published' } },
    limit: 1,
  })
  if (!docs.length) return { title: 'Not found' }
  const city = docs[0]
  const url = `https://www.madeirabook.com/escape/${city.slug}`
  const title = `Flights from ${city.name} to Madeira — Quiet Luxury Escape | Madeirabook`
  const description = ESCAPE_SEO[city.slug]
    ? renderEscapeCopy(ESCAPE_SEO[city.slug].meta, city)
    : `Direct flights ${city.airportCode} → FNC in about ${formatDuration(city.flightDurationMinutes) ?? 'a few hours'}. ${city.description?.slice(0, 120) ?? ''}`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function EscapePage({
  params,
}: {
  params: Promise<{ citySlug: string }>
}) {
  const { citySlug } = await params
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'cities',
    where: { slug: { equals: citySlug }, status: { equals: 'published' } },
    limit: 1,
  })
  if (!docs.length) notFound()
  const city = docs[0]

  const { docs: properties } = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { status: { equals: 'published' } },
        { brand: { not_equals: 'madeiraoasis' } },
      ],
    },
    limit: 3,
    depth: 2,
  })

  const duration = formatDuration(city.flightDurationMinutes)
  const flightFacts = [
    city.airportCode ? `Direct flights ${city.airportCode} → FNC` : null,
    duration ? `About ${duration}` : null,
    city.basePrice ? `From €${city.basePrice} one way` : null,
  ].filter((f): f is string => Boolean(f))

  const faqs = (city.faqs ?? []).filter(
    (f) => f.question && f.answer,
  )

  const seoParagraphs = (ESCAPE_SEO[city.slug]?.paragraphs ?? fallbackParagraphs(city)).map(
    (p) => renderEscapeCopy(p, city),
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: `Escape from ${city.name} to Madeira`,
    description: city.description || '',
    touristDestination: {
      '@type': 'Place',
      name: 'Madeira, Portugal',
      address: { '@type': 'PostalAddress', addressCountry: 'PT' },
    },
    itinerary: {
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'Flight',
            departureAirport: city.airportCode,
            arrivalAirport: 'FNC',
            description: `Direct flight ${city.name} → Madeira`,
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'LodgingBusiness',
            name: 'Madeirabook — curated stays in Madeira',
            address: { '@type': 'PostalAddress', addressCountry: 'PT' },
          },
        },
      ],
    },
    ...(city.basePrice && {
      offers: {
        '@type': 'Offer',
        price: city.basePrice,
        priceCurrency: city.currency || 'EUR',
        availability: 'https://schema.org/InStock',
        url: `https://www.madeirabook.com/escape/${city.slug}?utm_source=ai_search&utm_medium=chatgpt`,
      },
    }),
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://www.madeirabook.com/escape/${city.slug}?utm_source=ai_search&utm_medium=chatgpt`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'LodgingReservation',
        name: `Book a stay in Madeira from ${city.name}`,
      },
    },
  }

  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      <Header />

      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h1 className="text-4xl font-light text-white/95 md:text-5xl" style={SERIF}>
          Escape from {city.name} to Madeira
        </h1>
        {city.hero && (
          <p className="mt-3 text-base text-white/60">{city.hero}</p>
        )}

        {flightFacts.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-3">
            {flightFacts.map((f) => (
              <span
                key={f}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {city.description && (
          <p className="mt-8 max-w-3xl leading-relaxed text-white/75">
            {city.description}
          </p>
        )}

        <div className="mt-10">
          <EscapeBookCard city={city.name} fromIata={city.airportCode} />
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
            Getting from {city.name} to Madeira
          </h2>
          <div className="mt-6 max-w-3xl space-y-5 leading-relaxed text-white/75">
            {seoParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
            Our stays in Madeira
          </h2>
          {properties.length === 0 ? (
            <p className="mt-6 text-white/50">New stays coming soon.</p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {properties.map((p) => {
                const cover = p.media?.[0]?.image
                const coverUrl =
                  cover && typeof cover === 'object' ? cover.url : null
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

        <section className="mt-16">
          <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
            Why Madeira
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {WHY_TILES.map((tile) => (
              <div
                key={tile.title}
                className="rounded-2xl border border-white/10 p-7"
              >
                <div className="text-3xl">{tile.emoji}</div>
                <h3 className="mt-3 text-lg font-light text-white/95" style={SERIF}>
                  {tile.title}
                </h3>
                <p className="mb-0 mt-2 text-sm leading-relaxed text-white/60">
                  {tile.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {faqs.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
              Questions about flying from {city.name}
            </h2>
            <dl className="mt-8 space-y-6">
              {faqs.map((f) => (
                <div key={f.id ?? f.question}>
                  <dt className="text-base font-medium text-white/90">
                    {f.question}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-white/70">
                    {f.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <div className="mt-14 flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            ← Back to home
          </Link>
          <EscapeBookButton
            city={city.name}
            fromIata={city.airportCode}
            label="Book sanctuary →"
            className="inline-flex items-center justify-center rounded-lg border border-emerald-600 bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          />
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
