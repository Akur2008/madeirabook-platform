import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import EscapeCardSheet from './components/EscapeCardSheet'
import GatewayCard from './components/GatewayCard'

export const dynamic = 'force-dynamic'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export default async function HomePage() {
  const payload = await getPayload({ config: await config })

  const { docs: gateways } = await payload.find({
    collection: 'sluice-pages',
    where: { status: { equals: 'published' } },
    limit: 3,
    depth: 0,
  })

  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      {/* 1. Hero */}
      <section className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#0a1420] to-[#0d1a2b] px-6 text-center">
        <h1
          className="max-w-4xl text-4xl font-light leading-tight text-white/95 sm:text-5xl md:text-6xl"
          style={SERIF}
        >
          Madeira remembers how to be quiet.
        </h1>
        <p className="mt-6 text-base text-white/60 md:text-lg">
          A two-minute escape from the city noise.
        </p>

        <Link
          href="/sluice-test"
          className="mt-14 rounded-full border border-white/40 px-10 py-3 text-sm uppercase tracking-widest text-white/90 transition-colors hover:bg-white/10"
        >
          Begin the escape →
        </Link>

        <EscapeCardSheet />
      </section>

      {/* 2. Emotional gateways preview */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <h2
          className="mb-12 text-center text-3xl font-light text-white/90 md:text-4xl"
          style={SERIF}
        >
          Three paths into silence
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gateways.map((page) => (
            <GatewayCard key={page.id} page={page} />
          ))}
        </div>
      </section>

      {/* 3. Minimal footer — nothing else, no menus */}
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
    </div>
  )
}
