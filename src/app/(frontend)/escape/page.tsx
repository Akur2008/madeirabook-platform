import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'

export const revalidate = 60

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export const metadata: Metadata = {
  title: 'Escape from your city to Madeira — Madeirabook',
  description:
    'Direct flights to Madeira from cities across Europe. Curated stays, honest prices, no mass tourism.',
  openGraph: {
    title: 'Escape from your city to Madeira',
    description:
      'Direct flights to Madeira from cities across Europe. Curated stays, honest prices.',
    type: 'website',
    url: 'https://www.madeirabook.com/escape',
  },
  alternates: {
    canonical: 'https://www.madeirabook.com/escape',
  },
}

export default async function EscapeIndexPage() {
  const payload = await getPayload({ config: await config })
  const { docs: cities } = await payload.find({
    collection: 'cities',
    where: { status: { equals: 'published' } },
    limit: 100,
    depth: 0,
    sort: 'name',
  })

  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h1 className="text-4xl font-light text-white/95 md:text-5xl" style={SERIF}>
          Escape from your city to Madeira
        </h1>
        <p className="mt-3 text-base text-white/60">
          Direct flights, ocean-front stays, no mass tourism.
        </p>

        {cities.length === 0 ? (
          <p className="mt-10 text-white/50">New routes coming soon.</p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {cities.map((city) => (
              <Link
                key={city.id}
                href={`/escape/${city.slug}`}
                className="group block rounded-2xl border border-white/10 p-6 transition-colors hover:border-white/25"
              >
                <h2
                  className="text-xl font-light leading-tight text-white/95"
                  style={SERIF}
                >
                  {city.name}
                </h2>
                <p className="mb-0 mt-2 text-sm text-white/60">
                  {city.airportCode} → FNC
                  {city.basePrice ? ` · from €${city.basePrice}` : ''}
                </p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-14">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
