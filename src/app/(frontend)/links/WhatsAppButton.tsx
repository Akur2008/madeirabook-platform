'use client'

import { useEffect, useRef } from 'react'

const WA_BASE = 'https://wa.me/351919304028'
const DEFAULT_HREF = `${WA_BASE}?text=Hi%20Madeirabook`
const REF_COOKIE = 'madeirabook_ref'

function readRefCookie(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${REF_COOKIE}=([^;]*)`),
  )
  return match ? decodeURIComponent(match[1]) : null
}

export default function WhatsAppButton({ className }: { className?: string }) {
  const anchorRef = useRef<HTMLAnchorElement>(null)

  // Rewrite href in-place once mounted: ?ref= param wins, then the
  // referral cookie set by middleware. No state — avoids hydration
  // mismatch and cascading renders.
  useEffect(() => {
    const ref =
      new URLSearchParams(window.location.search).get('ref') ??
      readRefCookie()
    if (ref && anchorRef.current) {
      const text = `Hi Madeirabook, I came from ${ref}`
      anchorRef.current.href = `${WA_BASE}?text=${encodeURIComponent(text)}`
    }
  }, [])

  return (
    <a
      ref={anchorRef}
      href={DEFAULT_HREF}
      target="_blank"
      rel="noopener"
      className={className}
    >
      💬 WhatsApp Concierge
    </a>
  )
}
