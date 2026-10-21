import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import BookSearch from './BookSearch'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Book your stay — Madeirabook',
  description:
    'Pick your dates and book a curated stay in Madeira — direct booking, honest prices, no mass tourism.',
  openGraph: {
    title: 'Book your stay — Madeirabook',
    description:
      'Curated stays in Madeira — direct booking, honest prices.',
    type: 'website',
    url: 'https://www.madeirabook.com/book',
  },
  alternates: {
    canonical: 'https://www.madeirabook.com/book',
  },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const NAV_LINKS = [
  { label: 'Explore', href: '/explore' },
  { label: 'Stays', href: 'https://www.madeirabook.com/madeira-apartment-rentals.html' },
  { label: 'Flights', href: 'https://www.madeirabook.com/flights-to-madeira.html' },
  { label: 'Guides', href: 'https://www.madeirabook.com/madeira-guide.html' },
  { label: 'Collections', href: '/collections' },
  { label: 'Weather', href: '/#weather' },
]

// Shared sizing so header buttons are identical in height and padding.
const HEADER_BTN =
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:px-5 sm:py-2.5 sm:text-sm'

export default function BookPage() {
  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

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
              href="/explore"
              className={`${HEADER_BTN} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500`}
            >
              Map →
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

      <div className="mx-auto w-full max-w-md px-6 pb-20">
        <Link
          href="/"
          className="mt-6 inline-flex items-center text-sm font-medium text-white/50 transition-colors hover:text-white/90"
        >
          ← Back to home
        </Link>

        <h1
          className="mt-6 text-center text-3xl font-light leading-tight text-white/95 sm:text-4xl"
          style={SERIF}
        >
          Find your dates in Madeira
        </h1>
        <p className="mt-3 text-center text-sm text-white/60">
          Direct booking. Honest prices. No middlemen.
        </p>

        <BookSearch />
      </div>
    </div>
  )
}
