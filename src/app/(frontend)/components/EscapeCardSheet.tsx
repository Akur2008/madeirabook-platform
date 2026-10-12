'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useAudioEngine } from '@/audio/useAudioEngine'

const ESCAPE_CARD_URL = 'https://app.madeirabook.com/api/escape-card'
const BOOKINGS_URL = 'https://app.madeirabook.com/api/stats/bookings-count'
const STAY_URL = 'https://app.madeirabook.com/'
const SHEET_MS = 400
const SHEET_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

type EscapeCardData = {
  city?: string
  country?: string
  minPrice?: number
  currency?: string
  fallback?: boolean
}

function formatPrice(data: EscapeCardData): string | null {
  if (typeof data.minPrice !== 'number') return null
  if (data.currency === 'EUR') return `from €${data.minPrice}`
  return data.currency ? `from ${data.minPrice} ${data.currency}` : `from ${data.minPrice}`
}

export default function EscapeCardSheet() {
  const engine = useAudioEngine()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [escapeCard, setEscapeCard] = useState<EscapeCardData | null>(null)
  const [bookingsCount, setBookingsCount] = useState<number | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openSheet = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    engine.duckToBackground(SHEET_MS)
    setMounted(true)
    // Flip the transform on the next frame so the slide-up animates.
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)))

    fetch(ESCAPE_CARD_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setEscapeCard(d))
      .catch(() => setEscapeCard(null))
    fetch(BOOKINGS_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBookingsCount(typeof d?.count === 'number' ? d.count : null))
      .catch(() => setBookingsCount(null))
  }, [engine])

  const closeSheet = useCallback(() => {
    engine.restoreFromBackground(SHEET_MS)
    setOpen(false)
    closeTimerRef.current = setTimeout(() => setMounted(false), SHEET_MS)
  }, [engine])

  const handleStay = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      engine.restoreFromBackground(SHEET_MS)
      setTimeout(() => {
        window.location.href = STAY_URL
      }, 200)
    },
    [engine],
  )

  // Lock body scroll and close on Escape while the sheet is up.
  useEffect(() => {
    if (!mounted) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [mounted, closeSheet])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const price = escapeCard ? formatPrice(escapeCard) : null

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="mt-8 text-sm text-white/50 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/80"
      >
        ✨ See your nearest escape →
      </button>

      {mounted && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            style={{
              opacity: open ? 1 : 0,
              transitionTimingFunction: SHEET_EASE,
              transitionDuration: `${SHEET_MS}ms`,
            }}
            onClick={closeSheet}
          />
          <div
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-2xl border border-white/15 border-b-0 px-6 pb-10 pt-4 backdrop-blur-xl"
            style={{
              background: 'rgba(10, 20, 32, 0.75)',
              transform: open ? 'translateY(0)' : 'translateY(100%)',
              transition: `transform ${SHEET_MS}ms ${SHEET_EASE}`,
            }}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
            <button
              type="button"
              onClick={closeSheet}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
            >
              ✕
            </button>

            <p className="text-2xl font-light text-white/95" style={SERIF}>
              {escapeCard?.city ? `Your escape from ${escapeCard.city}` : 'Your escape'}
            </p>

            {price && <p className="mt-2 text-lg text-white/80">{price}</p>}

            {bookingsCount !== null && (
              <p className="mt-2 text-sm text-white/50">
                {bookingsCount} people booked in the last 30 days
              </p>
            )}

            <a
              href={STAY_URL}
              onClick={handleStay}
              className="mt-6 block w-full rounded-full border border-white/30 bg-white/10 py-3 text-center text-sm uppercase tracking-widest text-white transition-colors hover:bg-white/20"
            >
              Choose your stay →
            </a>
          </div>
        </div>
      )}
    </>
  )
}
