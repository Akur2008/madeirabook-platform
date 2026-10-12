'use client'

import { useEffect, useState } from 'react'

import BookingSearchSheet, { nextWeekend, toISODate } from './BookingSearchSheet'

const ESCAPE_CARD_URL = 'https://app.madeirabook.com/api/escape-card'
const BOOKINGS_URL = 'https://app.madeirabook.com/api/stats/bookings-count'
const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const FALLBACK_CITY = 'Lisbon'

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

export default function EscapeCard() {
  const [escapeCard, setEscapeCard] = useState<EscapeCardData | null>(null)
  const [bookingsCount, setBookingsCount] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  // Dates come from the client clock — compute after mount to avoid
  // server/client timezone mismatches during hydration.
  const [weekend, setWeekend] = useState<{ arrival: Date; departure: Date } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setWeekend(nextWeekend()), 0)

    fetch(ESCAPE_CARD_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setEscapeCard(d))
      .catch(() => setEscapeCard(null))
    fetch(BOOKINGS_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBookingsCount(typeof d?.count === 'number' ? d.count : null))
      .catch(() => setBookingsCount(null))

    return () => clearTimeout(t)
  }, [])

  const city = escapeCard?.city || FALLBACK_CITY
  const price = escapeCard ? formatPrice(escapeCard) : null
  const weekendLabel = weekend
    ? `${weekend.arrival.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekend.departure.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : null

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setSheetOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setSheetOpen(true)
          }
        }}
        className="w-full max-w-md cursor-pointer rounded-2xl border border-white/15 px-6 pb-7 pt-6 text-left backdrop-blur-xl transition-colors hover:bg-white/5"
        style={{ background: 'rgba(10, 20, 32, 0.75)' }}
      >
        <p className="mb-0 text-2xl font-light leading-tight text-white/95 md:text-3xl" style={SERIF}>
          Escape from {city}
        </p>
        <p className="mb-0 mt-2 text-sm text-white/60">
          Next weekend{weekendLabel ? ` · ${weekendLabel}` : ''}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {price && (
            <span className="text-lg font-medium text-white/90">{price}</span>
          )}
          {bookingsCount !== null && bookingsCount > 0 && (
            <span className="flex items-center gap-2 text-xs text-white/60">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              {bookingsCount} booked this month
            </span>
          )}
        </div>

        <span className="mt-6 block w-full rounded-full border border-white/30 bg-white/10 py-3 text-center text-sm uppercase tracking-widest text-white transition-colors group-hover:bg-white/20">
          Find your dates →
        </span>
      </div>

      <BookingSearchSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initialArrival={weekend ? toISODate(weekend.arrival) : undefined}
        initialDeparture={weekend ? toISODate(weekend.departure) : undefined}
      />
    </>
  )
}
