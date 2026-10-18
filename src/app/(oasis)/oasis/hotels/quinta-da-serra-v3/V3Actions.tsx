'use client'

import React, { useSyncExternalStore } from 'react'

import { ASK_CONCIERGE_EVENT } from '@/components/AiConciergeWidget'

const REF_COOKIE = 'madeirabook_ref'

function readRef(): string | null {
  const param = new URLSearchParams(window.location.search).get('ref')
  if (param) return param
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${REF_COOKIE}=([^;]*)`),
  )
  return match ? decodeURIComponent(match[1]) : null
}

function withRef(href: string): string {
  const ref = readRef()
  if (!ref) return href
  return `${href}${href.includes('?') ? '&' : '?'}ref=${encodeURIComponent(ref)}`
}

const emptySubscribe = () => () => {}

type BookingLinkProps = {
  href: string
  className?: string
  children: React.ReactNode
}

// External booking link that carries the ambassador ref code (?ref= or the
// madeirabook_ref cookie set by middleware) through to the destination.
// Same hydration pattern as OasisLink: clean href for SSR/crawlers, ref-aware
// href once mounted on the client.
export function BookingLink({ href, className, children }: BookingLinkProps) {
  const resolved = useSyncExternalStore(
    emptySubscribe,
    () => withRef(href),
    () => href,
  )
  return (
    <a
      href={resolved}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      suppressHydrationWarning
    >
      {children}
    </a>
  )
}

type ConciergeAskButtonProps = {
  message?: string
  className?: string
  children: React.ReactNode
}

// Opens the AI concierge — with a pre-configured question when `message` is set.
export function ConciergeAskButton({
  message,
  className,
  children,
}: ConciergeAskButtonProps) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent(ASK_CONCIERGE_EVENT, { detail: { message } }),
        )
      }
      className={className}
    >
      {children}
    </button>
  )
}
