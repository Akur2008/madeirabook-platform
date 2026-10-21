import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import Header from '../components/Header'
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

export default function BookPage() {
  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      <Header />

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
