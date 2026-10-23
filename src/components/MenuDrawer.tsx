'use client'

import Link from 'next/link'
import React, { useEffect } from 'react'

import { ASK_CONCIERGE_EVENT } from '@/components/AiConciergeWidget'
import { WHALE_BREATH_EVENT } from '@/components/WhaleBreathModal'

const SERIF = { fontFamily: 'Playfair Display, Cormorant Garamond, serif' } as const

const DRAWER_MS = 350
const DRAWER_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

interface MenuDrawerProps {
  open: boolean
  onClose: () => void
  refCode?: string | null
}

function withRef(href: string, refCode?: string | null): string {
  if (!refCode) return href
  return `${href}${href.includes('?') ? '&' : '?'}ref=${encodeURIComponent(refCode)}`
}

// The burger navigation: slides in from the right at 80% width. Internal
// links keep the ambassador ref; the whale/concierge rows fire the global
// events their widgets listen for.
export default function MenuDrawer({ open, onClose, refCode }: MenuDrawerProps) {
  // Lock body scroll and close on Escape while the drawer is up.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const openWhaleBreath = () => {
    onClose()
    window.dispatchEvent(new CustomEvent(WHALE_BREATH_EVENT))
  }

  const openConcierge = () => {
    onClose()
    window.dispatchEvent(new CustomEvent(ASK_CONCIERGE_EVENT, { detail: {} }))
  }

  const links: Array<{ icon: string; label: string; hint: string; href: string }> = [
    {
      icon: '🏨',
      label: 'Find Your Sanctuary',
      hint: 'Curated stays, direct booking',
      href: withRef('/stays', refCode),
    },
    {
      icon: '✈️',
      label: 'Escape Routes',
      hint: 'Cheapest flights to Funchal',
      href: '/flights',
    },
    {
      icon: '🗺️',
      label: 'Interactive Ambassador Map',
      hint: '92 curated places on one map',
      href: '/explore',
    },
  ]

  const itemClass =
    'group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left transition-colors hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10'

  return (
    <div
      className={`fixed inset-0 z-[2200] ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
      inert={!open}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        style={{
          opacity: open ? 1 : 0,
          transitionDuration: `${DRAWER_MS}ms`,
          transitionTimingFunction: DRAWER_EASE,
        }}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute right-0 top-0 flex h-full w-[80%] max-w-sm flex-col border-l border-[#d4af37]/25 bg-[#0a1420] shadow-2xl transition-transform"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transitionDuration: `${DRAWER_MS}ms`,
          transitionTimingFunction: DRAWER_EASE,
        }}
      >
        <div className="flex items-center justify-between border-b border-[#d4af37]/20 px-6 py-5">
          <p
            className="text-xl text-[#d4af37]"
            style={SERIF}
          >
            Madeirabook
          </p>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-6">
          {links.map((item) => (
            <Link key={item.label} href={item.href} onClick={onClose} className={itemClass}>
              <span className="text-2xl" aria-hidden>
                {item.icon}
              </span>
              <span className="flex flex-col">
                <span className="text-lg font-medium text-white/95">{item.label}</span>
                <span className="text-xs text-[#d4af37]/70">{item.hint}</span>
              </span>
            </Link>
          ))}

          <button type="button" onClick={openWhaleBreath} className={itemClass}>
            <span className="text-2xl" aria-hidden>
              🐋
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-medium text-white/95">Whale Breath Soundscape</span>
              <span className="text-xs text-[#d4af37]/70">Two minutes of ocean breath</span>
            </span>
          </button>

          <button type="button" onClick={openConcierge} className={itemClass}>
            <span className="text-2xl" aria-hidden>
              💬
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-medium text-white/95">AI Island Concierge</span>
              <span className="text-xs text-[#d4af37]/70">Ask anything about Madeira</span>
            </span>
          </button>
        </nav>

        <div className="border-t border-[#d4af37]/20 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]/60">
            Rare places. Honest quiet.
          </p>
        </div>
      </aside>
    </div>
  )
}
