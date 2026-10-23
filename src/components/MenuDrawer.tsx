'use client'

import Link from 'next/link'
import React, { useEffect } from 'react'

import { ASK_CONCIERGE_EVENT } from '@/components/AiConciergeWidget'
import { WHALE_BREATH_EVENT } from '@/components/WhaleBreathModal'

const SERIF = { fontFamily: 'Playfair Display, Cormorant Garamond, serif' } as const

const DRAWER_MS = 350
const DRAWER_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

type MenuIconName = 'stay' | 'plane' | 'map' | 'waves' | 'sparkles'

const MENU_ICON_PATHS: Record<MenuIconName, React.ReactNode> = {
  stay: (
    <>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  plane: (
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  ),
  map: (
    <>
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
      <path d="M15 5.764v15" />
      <path d="M9 3.236v15" />
    </>
  ),
  waves: (
    <>
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </>
  ),
}

function MenuIcon({ name }: { name: MenuIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-[#10b981]/80 transition-colors group-hover:text-[#10b981]"
    >
      {MENU_ICON_PATHS[name]}
    </svg>
  )
}

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

  const links: Array<{
    icon: MenuIconName
    label: string
    hint: string
    href: string
  }> = [
    {
      icon: 'stay',
      label: 'Find Your Sanctuary',
      hint: 'Curated stays, direct booking',
      href: withRef('/stays', refCode),
    },
    {
      icon: 'plane',
      label: 'Escape Routes',
      hint: 'Cheapest flights to Funchal',
      href: '/flights',
    },
    {
      icon: 'map',
      label: 'Interactive Ambassador Map',
      hint: '92 curated places on one map',
      href: '/explore',
    },
  ]

  const itemClass =
    'group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left transition-colors hover:border-[#10b981]/50 hover:bg-[#10b981]/10'

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
        className="absolute right-0 top-0 flex h-full w-[80%] max-w-sm flex-col border-l border-[#10b981]/25 bg-[#0a1420] shadow-2xl transition-transform"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transitionDuration: `${DRAWER_MS}ms`,
          transitionTimingFunction: DRAWER_EASE,
        }}
      >
        <div className="flex items-center justify-between border-b border-[#10b981]/20 px-6 py-5">
          <p
            className="text-xl text-[#10b981]"
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
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <MenuIcon name={item.icon} />
              </span>
              <span className="flex flex-col">
                <span className="text-lg font-medium text-white/95">{item.label}</span>
                <span className="text-xs text-[#10b981]/70">{item.hint}</span>
              </span>
            </Link>
          ))}

          <button type="button" onClick={openWhaleBreath} className={itemClass}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <MenuIcon name="waves" />
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-medium text-white/95">Whale Breath Soundscape</span>
              <span className="text-xs text-[#10b981]/70">Two minutes of ocean breath</span>
            </span>
          </button>

          <button type="button" onClick={openConcierge} className={itemClass}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <MenuIcon name="sparkles" />
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-medium text-white/95">AI Island Concierge</span>
              <span className="text-xs text-[#10b981]/70">Ask anything about Madeira</span>
            </span>
          </button>
        </nav>

        <div className="border-t border-[#10b981]/20 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.25em] text-[#10b981]/60">
            Rare places. Honest quiet.
          </p>
        </div>
      </aside>
    </div>
  )
}
