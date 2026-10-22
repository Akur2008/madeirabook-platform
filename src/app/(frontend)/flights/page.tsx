import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import Header from '../components/Header'
import FlightCalendarSearch from './FlightCalendarSearch'
import FlightSearchForm from './FlightSearchForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Flights to Madeira — find the cheapest dates — Madeirabook',
  description:
    'Live flight prices to Funchal (FNC) from cities across Europe. Pick the cheapest day on the 14-day calendar.',
  openGraph: {
    title: 'Flights to Madeira — find the cheapest dates',
    description:
      'Live flight prices to Funchal (FNC). Cheapest dates on the 14-day calendar.',
    type: 'website',
    url: 'https://www.madeirabook.com/flights',
  },
  alternates: {
    canonical: 'https://www.madeirabook.com/flights',
  },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export default function FlightsPage() {
  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      <Header />

      <div className="mx-auto w-full max-w-xl px-6 pb-20">
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
          Flights to Madeira — find the cheapest dates
        </h1>
        <p className="mt-3 text-center text-sm text-white/60">
          Live fares to Funchal (FNC). Pick the cheapest day on the calendar.
        </p>

        <FlightSearchForm />
        <FlightCalendarSearch />
      </div>
    </div>
  )
}
