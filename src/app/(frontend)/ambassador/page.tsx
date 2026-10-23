import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import SaveAsAppSheet from '@/components/SaveAsAppSheet'
import { isBookable } from '@/lib/pricing-rules'
import B2BContactButtons from '../components/B2BContactButtons'
import B2BLeadForm from '../components/B2BLeadForm'
import ExploreMap from '../components/ExploreMap'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Madeirabook for Creators — Your Interactive Map of Madeira',
  description:
    'Earn a commission on every booking made through your curated Madeira map.',
  robots: { index: false, follow: false },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const STEPS = [
  {
    n: '1',
    title: 'Request access',
    text: 'Leave your Instagram and WhatsApp — we review every creator personally.',
  },
  {
    n: '2',
    title: 'Pick your favorite spots & hotels',
    text: 'Curate beaches, restaurants, trails and stays for your audience.',
  },
  {
    n: '3',
    title: 'Share your unique link & earn',
    text: 'Every booking through your branded map pays you a commission.',
  },
]

export default async function AmbassadorPage() {
  const payload = await getPayload({ config: await config })

  const [{ docs: properties }, { docs: beaches }, { docs: restaurants }] =
    await Promise.all([
      payload.find({
        collection: 'properties',
        where: { status: { equals: 'published' } },
        limit: 30,
        depth: 1,
      }),
      payload.find({
        collection: 'beaches',
        where: { status: { equals: 'published' } },
        limit: 30,
        depth: 0,
      }),
      payload.find({
        collection: 'restaurants',
        where: { status: { equals: 'published' } },
        limit: 30,
        depth: 0,
      }),
    ])

  const mapStays = properties.flatMap((p) => {
    const loc = typeof p.location === 'object' ? p.location : null
    if (loc?.geoCoordinates?.lat == null || loc?.geoCoordinates?.lng == null)
      return []
    const bookable = isBookable(p)
    return [
      {
        id: p.id,
        slug: p.slug,
        title: p.title,
        lat: loc.geoCoordinates.lat,
        lng: loc.geoCoordinates.lng,
        pricePerNight: bookable ? p.pricePerNight : null,
        bookable,
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
      },
    ]
  })

  return (
    <div className="min-h-dvh bg-[#030712] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-lg font-black tracking-tight text-white"
          >
            Madeirabook
          </Link>
          <span className="text-xs uppercase tracking-wider text-[#10b981]/80">
            For Creators
          </span>
        </div>
      </header>

      {/* Hero — deep blue with a subtle radial dot grid */}
      <section
        className="relative px-6 py-20 md:py-28"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1
            className="text-4xl font-light leading-tight text-white sm:text-5xl md:text-6xl"
            style={SERIF}
          >
            Your Interactive Map of Madeira
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/70 md:text-lg">
            Earn a commission on every booking made through your curated map.
          </p>
        </div>
      </section>

      {/* Live white-label map demo */}
      <section className="mx-auto max-w-6xl px-6">
        <p className="mb-6 text-center text-sm uppercase tracking-wider text-white/40">
          This is what your audience sees — your name, your picks, your brand
        </p>
        <div className="h-[420px] overflow-hidden rounded-2xl border border-white/10 md:h-[560px]">
          <ExploreMap
            properties={mapStays}
            beaches={mapBeaches}
            restaurants={mapRestaurants}
            ambassador={{
              displayName: "@yourhandle's Madeira",
              accentColor: '#10b981',
            }}
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2
          className="text-center text-3xl font-light text-white/90 md:text-4xl"
          style={SERIF}
        >
          How it works
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-7"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#10b981]/40 text-lg font-semibold text-[#10b981]">
                {s.n}
              </div>
              <h3 className="mt-4 text-xl text-white" style={SERIF}>
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Lead form */}
      <section className="mx-auto max-w-md px-6 pb-24">
        <h2
          className="text-center text-3xl font-light text-white/90"
          style={SERIF}
        >
          Request Access
        </h2>
        <p className="mt-3 text-center text-sm text-white/50">
          We onboard a limited number of creators at a time.
        </p>
        <div className="mt-8">
          <B2BLeadForm
            type="ambassador"
            firstFieldPlaceholder="Instagram URL"
            submitLabel="Request Access"
          />
        </div>
        <B2BContactButtons whatsappMessage="Hi! I want to become a Madeirabook ambassador." />
      </section>

      {/* Save as App */}
      <section className="border-t border-white/10 px-6 py-10 text-center">
        <SaveAsAppSheet variant="dark" />
      </section>
    </div>
  )
}
