import Link from 'next/link'
import React from 'react'

const NAV_LINKS = [
  { label: 'Map', href: '/explore' },
  { label: 'Flights', href: '/flights' },
  { label: 'Weather', href: '/#weather' },
]

// Shared sizing so both header buttons are identical in height and padding.
const HEADER_BTN =
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:px-5 sm:py-2.5 sm:text-sm'

export default function Header({ refCode }: { refCode?: string | null }) {
  const bookHref = refCode ? `/book?ref=${encodeURIComponent(refCode)}` : '/book'

  return (
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
            <Link
              key={l.label}
              href={l.href}
              className="transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 justify-self-end sm:gap-3">
          <Link
            href="/sluice-test"
            className={`${HEADER_BTN} border-white/25 bg-[#0a1420] text-white hover:bg-white/10`}
          >
            Try the escape →
          </Link>
          <Link
            href={bookHref}
            className={`${HEADER_BTN} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500`}
          >
            Book →
          </Link>
        </div>
      </div>
      <nav className="flex gap-5 overflow-x-auto px-4 pb-3 text-sm font-medium text-white/70 md:hidden">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="whitespace-nowrap transition-colors hover:text-white"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
