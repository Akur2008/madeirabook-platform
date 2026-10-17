import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import './oasis.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://madeirabook-platform.vercel.app'),
  title: 'Madeira Oasis — A private collection of Madeira’s finest hotels',
  description:
    'Fifteen hand-picked luxury addresses across Madeira. Oceanfront resorts, historic quintas and boutique suites — booked through the Madeira Oasis concierge.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Madeira Oasis',
    description:
      'A private collection of Madeira’s finest hotels, booked through one concierge.',
    type: 'website',
  },
}

export default function OasisLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        {/* Playfair Display for headings; falls back to serif if the CDN is unreachable */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap"
        />

        {/* z-[1100] keeps the header above Leaflet's stacked panes on the map page */}
        <header className="fixed inset-x-0 top-0 z-[1100] border-b border-[#1c1a16]/10 bg-[#fdfbf7]/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link
              href="/oasis"
              className="font-serif text-xl font-semibold tracking-tight text-[#1c1a16]"
            >
              Madeira <span className="text-[#b8952e]">Oasis</span>
            </Link>
            <a
              href="mailto:concierge@madeirabook.com?subject=Stay%20request%20%E2%80%94%20Madeira%20Oasis"
              className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-4 py-2 text-xs font-semibold tracking-wide text-[#1c1a16] transition-colors hover:bg-transparent hover:text-[#8a7020] sm:px-6 sm:py-2.5 sm:text-sm"
            >
              Request a Stay
            </a>
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  )
}
