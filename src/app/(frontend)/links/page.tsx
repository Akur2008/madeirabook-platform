import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

export const metadata: Metadata = {
  title: 'Madeirabook — Links',
  description: 'All Madeirabook links in one place.',
  robots: { index: false, follow: false },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const SECONDARY_BTN =
  'block w-full rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center text-white transition hover:border-white/30'

export default function LinksPage() {
  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      <div className="mx-auto max-w-md px-6 py-12">
        <div className="text-center text-4xl font-medium tracking-tight" style={SERIF}>
          Madeirabook
        </div>
        <h1 className="mt-6 text-center text-2xl text-white/90" style={SERIF}>
          Curated Stays &amp; Sanctuaries in Madeira
        </h1>
        <p className="mt-3 text-center text-sm text-white/50">
          Direct booking · No mass tourism · Honest luxury
        </p>

        <div className="mt-10 space-y-4">
          <Link
            href="/"
            className="block w-full rounded-xl bg-[#10b981] px-6 py-4 text-center font-medium text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            Book Your Stay
          </Link>
          <Link href="/" className={SECONDARY_BTN}>
            Our Stays &amp; Villas
          </Link>
          <Link href="/escape" className={SECONDARY_BTN}>
            Escape from your city
          </Link>
          <Link href="/" className={SECONDARY_BTN}>
            For Property Owners &amp; Creators
          </Link>
          <a
            href="https://wa.me/351919304028?text=Hi%20Madeirabook"
            target="_blank"
            rel="noopener"
            className={SECONDARY_BTN}
          >
            💬 WhatsApp Concierge
          </a>
        </div>

        <footer className="mt-12 text-center text-xs text-white/30">
          © 2026 Madeirabook
        </footer>
      </div>
    </div>
  )
}
