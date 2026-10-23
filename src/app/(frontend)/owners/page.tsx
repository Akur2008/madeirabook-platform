import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import SaveAsAppSheet from '@/components/SaveAsAppSheet'
import B2BContactButtons from '../components/B2BContactButtons'
import B2BLeadForm from '../components/B2BLeadForm'
import CalendarMockup from './CalendarMockup'

export const metadata: Metadata = {
  title: 'Madeirabook for Owners — Property Management & PMS',
  description:
    'Full PMS, direct bookings, and Stripe payouts in one cabinet.',
  robots: { index: false, follow: false },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const FEATURES = [
  {
    title: 'Full Pricing Calendar',
    text: 'Edit rates directly — per night, per season, per channel.',
  },
  {
    title: 'Manual Bookings & Cancellations',
    text: 'Add direct reservations and manage cancellations in one click.',
  },
  {
    title: 'Channel Management',
    text: 'Booking.com and Airbnb synced automatically via Smoobu.',
  },
  {
    title: 'Direct Stripe Payouts',
    text: 'Money lands on your account — no middlemen, no delays.',
  },
  {
    title: 'Own Branded Page on Madeirabook',
    text: 'A dedicated property page with direct booking, zero OTA commission.',
  },
]

export default function OwnersPage() {
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
          <div className="flex items-center gap-4">
            <Link
              href="/owner/login"
              className="text-xs text-white/50 transition-colors hover:text-white"
            >
              Owner sign in →
            </Link>
            <span className="hidden text-xs uppercase tracking-wider text-[#10b981]/80 sm:inline">
              For Owners
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
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
            Manage Your Property, Not Just a Listing.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/70 md:text-lg">
            Full PMS, direct bookings, and Stripe payouts in one cabinet.
          </p>
        </div>
      </section>

      {/* Features + mockup */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2">
        <ul className="space-y-5">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex gap-4">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#10b981]/40 text-xs text-[#10b981]">
                ✓
              </span>
              <div>
                <p className="font-semibold text-white">{f.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/55">
                  {f.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <CalendarMockup />
      </section>

      {/* Lead form */}
      <section className="mx-auto max-w-md px-6 py-24">
        <h2
          className="text-center text-3xl font-light text-white/90"
          style={SERIF}
        >
          Request a Demo
        </h2>
        <p className="mt-3 text-center text-sm text-white/50">
          We will walk you through the cabinet on a short call.
        </p>
        <div className="mt-8">
          <B2BLeadForm
            type="owner"
            firstFieldPlaceholder="Property Name / Link"
            submitLabel="Request a Demo"
          />
        </div>
        <B2BContactButtons whatsappMessage="Hi! I want a demo of the Madeirabook owner cabinet." />
      </section>

      {/* Save as App */}
      <section className="border-t border-white/10 px-6 py-10 text-center">
        <SaveAsAppSheet variant="dark" />
      </section>
    </div>
  )
}
