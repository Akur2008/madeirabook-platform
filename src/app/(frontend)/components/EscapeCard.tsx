'use client'

import { useEffect, useState } from 'react'

import BookingDrawer from './BookingDrawer'
import { nextWeekend } from './BookingSearchSheet'

const ESCAPE_CARD_URL = '/api/escape-card'
const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const FALLBACK_CITY = 'Lisbon'

type EscapeCardData = {
  city?: string
  country?: string
  cheapestPrice?: number
  cheapestDate?: string
  currency?: string
  fromTemp?: number | null
  fromWeatherCode?: number | null
  toTemp?: number | null
  toWeatherCode?: number | null
  fallback?: boolean
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function weatherIcon(code: number | null | undefined): string {
  if (code === null || code === undefined) return '🌤️'
  if (code <= 1) return '☀️'
  if (code <= 3) return '⛅'
  if (code === 45 || code === 48) return '🌫️'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return '❄️'
  if (code >= 95 && code <= 99) return '⛈️'
  return '🌤️'
}

export default function EscapeCard() {
  const [escapeCard, setEscapeCard] = useState<EscapeCardData | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  // Dates come from the client clock — compute after mount to avoid
  // server/client timezone mismatches during hydration.
  const [weekend, setWeekend] = useState<{ arrival: Date; departure: Date } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setWeekend(nextWeekend()), 0)

    fetch(ESCAPE_CARD_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.fallback === true) {
          console.info('escape-card: showing fallback data', d)
        }
        setEscapeCard(d)
      })
      .catch(() => setEscapeCard(null))

    return () => clearTimeout(t)
  }, [])

  const city = escapeCard?.city || FALLBACK_CITY
  const hasPrice = typeof escapeCard?.cheapestPrice === 'number'
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
        className="w-full max-w-md cursor-pointer rounded-2xl border border-white/15 p-6 text-left backdrop-blur-xl transition-colors hover:bg-white/5 md:p-8"
        style={{ background: 'rgba(10, 20, 32, 0.75)' }}
      >
        <p className="mb-0 text-2xl font-light leading-tight text-white/95 md:text-3xl" style={SERIF}>
          Escape from {city}
        </p>
        <p className="mb-0 mt-2 text-sm text-white/60">
          Next weekend{weekendLabel ? ` · ${weekendLabel}` : ''}
        </p>

        {hasPrice && (
          <p className="mt-4 text-lg text-white/90">
            Cheapest:{' '}
            {escapeCard!.fallback === true || !escapeCard!.cheapestDate ? (
              <>
                <span className="font-medium">€{escapeCard!.cheapestPrice}</span> (next weekend)
              </>
            ) : (
              <>
                <span className="font-medium">{formatDate(escapeCard!.cheapestDate!)}</span>
                {' — '}
                <span className="font-medium">€{escapeCard!.cheapestPrice}</span>
              </>
            )}
          </p>
        )}
        {hasPrice && (
          <p className="text-xs text-white/60">
            🔥 Prices rise closer to Friday
          </p>
        )}
        {typeof escapeCard?.toTemp === 'number' && (
          <p className="text-sm text-white/70 mt-2">
            {typeof escapeCard.fromTemp === 'number' && (
              <>
                {weatherIcon(escapeCard.fromWeatherCode)} {city} {escapeCard.fromTemp}°C
                <span className="mx-2">➔</span>
              </>
            )}
            {weatherIcon(escapeCard.toWeatherCode)} Madeira {escapeCard.toTemp}°C
          </p>
        )}

        <span className="mt-6 block w-full rounded-full border border-white/30 bg-white/10 py-3 text-center text-sm uppercase tracking-widest text-white transition-colors group-hover:bg-white/20">
          Find your dates →
        </span>
      </div>

      <BookingDrawer open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}
