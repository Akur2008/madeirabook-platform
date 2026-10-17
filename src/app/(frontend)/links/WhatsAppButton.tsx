'use client'

import { useEffect, useRef } from 'react'

const WA_BASE = 'https://wa.me/79626854685'
const REF_COOKIE = 'madeirabook_ref'

function readRefCookie(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${REF_COOKIE}=([^;]*)`),
  )
  return match ? decodeURIComponent(match[1]) : null
}

interface WhatsAppButtonProps {
  className?: string
  message: string
  label: string
}

export default function WhatsAppButton({
  className,
  message,
  label,
}: WhatsAppButtonProps) {
  const anchorRef = useRef<HTMLAnchorElement>(null)

  // Rewrite href in-place once mounted: ?ref= param wins, then the
  // referral cookie set by middleware. No state — avoids hydration
  // mismatch and cascading renders.
  useEffect(() => {
    const ref =
      new URLSearchParams(window.location.search).get('ref') ??
      readRefCookie()
    if (ref && anchorRef.current) {
      const text = `${message} (ref: ${ref})`
      anchorRef.current.href = `${WA_BASE}?text=${encodeURIComponent(text)}`
    }
  }, [message])

  return (
    <a
      ref={anchorRef}
      href={`${WA_BASE}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener"
      className={className}
    >
      {label}
    </a>
  )
}
