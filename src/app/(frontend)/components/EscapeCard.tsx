'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { nextWeekend } from './BookingSearchSheet'

const ESCAPE_CARD_URL = '/api/escape-card'
const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const FALLBACK_CITY = 'Lisbon'
const FALLBACK_IATA = 'LIS'
const MADEIRA_IATA = 'FNC'

type EscapeCardData = {
  city?: string
  country?: string
  fromIata?: string
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

export default function EscapeCard({
  city: cityOverride,
  fromIata: iataOverride,
  onBook,
}: {
  // Pin the card to a specific origin (escape pages) — overrides geo detection.
  city?: string
  fromIata?: string
  // When set, the Book button calls this instead of navigating to /book.
  onBook?: () => void
}) {
  const router = useRouter()
  const [escapeCard, setEscapeCard] = useState<EscapeCardData | null>(null)
  // Dates come from the client clock — compute after mount to avoid
  // server/client timezone mismatches during hydration.
  const [weekend, setWeekend] = useState<{ arrival: Date; departure: Date } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setWeekend(nextWeekend()), 0)

    const params = new URLSearchParams()
    if (cityOverride) params.set('city', cityOverride)
    if (iataOverride) params.set('from', iataOverride)
    const url = params.size ? `${ESCAPE_CARD_URL}?${params}` : ESCAPE_CARD_URL

    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.fallback === true) {
          console.info('escape-card: showing fallback data', d)
        }
        setEscapeCard(d)
      })
      .catch(() => setEscapeCard(null))

    return () => clearTimeout(t)
  }, [cityOverride, iataOverride])

  const city = escapeCard?.city || cityOverride || FALLBACK_CITY
  const fromIata = escapeCard?.fromIata || iataOverride || FALLBACK_IATA
  const hasPrice = typeof escapeCard?.cheapestPrice === 'number'
  const weekendLabel = weekend
    ? `${weekend.arrival.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekend.departure.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : null

  const goToBook = () => {
    if (onBook) {
      onBook()
      return
    }
    const ref = new URLSearchParams(window.location.search).get('ref')
    router.push(ref ? `/book?ref=${encodeURIComponent(ref)}` : '/book')
  }

  return (
    <div
      className="w-full max-w-md rounded-2xl border border-white/15 p-5 text-left backdrop-blur-xl md:p-6"
      style={{ background: 'rgba(10, 20, 32, 0.75)' }}
    >
      <Link
        href="/flights"
        className="block w-full rounded-full border border-[#10b981]/40 bg-[#10b981]/10 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#34d399] transition-colors hover:bg-[#10b981]/20"
      >
        ✈️ Flights from {city}
      </Link>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-2xl font-light text-white/95" style={SERIF}>
            {fromIata}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-white/45">
            {city}
          </span>
        </div>
        <div className="flex flex-1 items-center gap-2 px-2" aria-hidden>
          <span className="h-px flex-1 bg-white/20" />
          <span className="text-white/60">✈</span>
          <span className="h-px flex-1 bg-white/20" />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-light text-white/95" style={SERIF}>
            {MADEIRA_IATA}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-white/45">
            Madeira
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-sm text-white/70">
        {weekendLabel && (
          <p>
            Next weekend · <span className="text-white/90">{weekendLabel}</span>
          </p>
        )}
        {hasPrice && (
          <p>
            {escapeCard!.fallback === true || !escapeCard!.cheapestDate ? (
              <>
                Cheapest <span className="font-medium text-white/95">€{escapeCard!.cheapestPrice}</span>{' '}
                <span className="text-white/50">(next weekend)</span>
              </>
            ) : (
              <>
                <span className="text-white/90">{formatDate(escapeCard!.cheapestDate!)}</span>
                {' — '}
                <span className="font-medium text-white/95">€{escapeCard!.cheapestPrice}</span>
              </>
            )}
            <span className="ml-2 text-xs text-white/50">🔥 rises by Friday</span>
          </p>
        )}
        {typeof escapeCard?.toTemp === 'number' && (
          <p className="text-white/60">
            {typeof escapeCard.fromTemp === 'number' && (
              <>
                {weatherIcon(escapeCard.fromWeatherCode)} {city} {escapeCard.fromTemp}°C
                <span className="mx-2">→</span>
              </>
            )}
            {weatherIcon(escapeCard.toWeatherCode)} Madeira {escapeCard.toTemp}°C
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={goToBook}
        className="mt-6 block w-full rounded-full bg-[#10b981] py-3.5 text-center text-sm font-bold tracking-[0.22em] text-[#0a1420] transition-colors hover:bg-[#34d399]"
      >
        Book Sanctuary →
      </button>
    </div>
  )
}
