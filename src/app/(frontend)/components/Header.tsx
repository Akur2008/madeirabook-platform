'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import CocoonToggle from '@/components/CocoonToggle'
import MenuDrawer from '@/components/MenuDrawer'

import BookingSearchSheet from './BookingSearchSheet'

const SERIF = { fontFamily: 'Playfair Display, Cormorant Garamond, serif' } as const

// Smart header: Playfair logo left, the 3D-sound-cocoon toggle in the
// center, Book Stay + burger on the right. Book Stay opens the search
// BottomSheet in place — no navigation. The burger opens the icon
// drawer — there is no inline nav anymore. On phones the toggle drops to
// its own centered row so all three zones stay readable.
export default function Header({ refCode }: { refCode?: string | null }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [bookOpen, setBookOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a1420]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:py-3 sm:px-6">
          <Link
            href="/"
            style={SERIF}
            className="justify-self-start text-xl tracking-tight text-white sm:text-2xl"
          >
            Madeirabook
          </Link>
          <div className="hidden justify-self-center sm:block">
            <CocoonToggle />
          </div>
          <div className="flex items-center gap-2 justify-self-end sm:gap-3">
            <button
              type="button"
              onClick={() => setBookOpen(true)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-white/30 bg-[#0a1420]/70 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/10 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Book Stay
            </button>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-white/30 bg-[#0a1420]/70 text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex justify-center px-4 pb-3 pt-2 sm:hidden">
          <CocoonToggle />
        </div>
      </header>

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        refCode={refCode}
      />
      <BookingSearchSheet
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        refCode={refCode}
      />
    </>
  )
}
