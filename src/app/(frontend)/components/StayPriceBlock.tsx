'use client'

import { useEffect, useRef, useState } from 'react'

import {
  ESTIMATE_NOTE,
  SEARCH_URL,
  formatMoney,
  nextWeekend,
  priceBreakdownText,
  toISODate,
  type SearchResult,
} from './BookingSearchSheet'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DEBOUNCE_MS = 350

type Status = 'idle' | 'loading' | 'found' | 'unavailable' | 'error'

// Live PMS price for one stay inside the map pin card: dates default to the
// next weekend, every change re-queries /api/search-availability and picks
// this property's row. When the PMS has no data the API returns the DB
// estimate (estimate flag) and the card says so; a fetch failure degrades
// to the static "€X / night" line plus the estimate note.
export default function StayPriceBlock({
  slug,
  fallbackText,
}: {
  slug: string
  fallbackText?: string | null
}) {
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [item, setItem] = useState<SearchResult | null>(null)
  const seq = useRef(0)

  const todayISO = toISODate(new Date())
  const nights =
    DATE_RE.test(arrival) && DATE_RE.test(departure) && arrival < departure
      ? Math.round((Date.parse(departure) - Date.parse(arrival)) / 86400000)
      : null

  // Dates come from the client clock — set after mount, not during render.
  useEffect(() => {
    const t = setTimeout(() => {
      const weekend = nextWeekend()
      setArrival(toISODate(weekend.arrival))
      setDeparture(toISODate(weekend.departure))
    }, 0)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (nights === null) return
    const mySeq = ++seq.current
    const t = setTimeout(async () => {
      setStatus('loading')
      try {
        const res = await fetch(SEARCH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ arrivalDate: arrival, departureDate: departure }),
        })
        if (!res.ok) throw new Error(`search ${res.status}`)
        const data = (await res.json()) as SearchResult[]
        if (mySeq !== seq.current) return
        const found = Array.isArray(data)
          ? (data.find((i) => i.slug === slug) ?? null)
          : null
        setItem(found)
        setStatus(found ? 'found' : 'unavailable')
      } catch {
        if (mySeq === seq.current) {
          setItem(null)
          setStatus('error')
        }
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [slug, arrival, departure, nights])

  const handleArrival = (value: string) => {
    setItem(null)
    setStatus('idle')
    setArrival(value)
    setDeparture((prev) => {
      if (prev && prev > value) return prev
      const d = new Date(`${value}T12:00:00`)
      d.setDate(d.getDate() + 2)
      return toISODate(d)
    })
  }

  const handleDeparture = (value: string) => {
    setItem(null)
    setStatus('idle')
    setDeparture(value)
  }

  const breakdown = item ? priceBreakdownText(item, nights) : null

  return (
    <div className="mt-5 rounded-xl border border-white/15 bg-white/5 p-3">
      <div className="grid grid-cols-2 gap-2 text-left">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/45">
            Check-in
          </span>
          <input
            type="date"
            required
            min={todayISO}
            value={arrival}
            onChange={(e) => handleArrival(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-2.5 py-2 text-xs text-white outline-none transition-colors focus:border-white/50"
            style={{ colorScheme: 'dark' }}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/45">
            Check-out
          </span>
          <input
            type="date"
            required
            min={arrival || todayISO}
            value={departure}
            onChange={(e) => handleDeparture(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-2.5 py-2 text-xs text-white outline-none transition-colors focus:border-white/50"
            style={{ colorScheme: 'dark' }}
          />
        </label>
      </div>

      <div className="mt-3 text-center">
        {status === 'loading' && (
          <p className="mb-0 text-xs text-white/50">Checking live price…</p>
        )}
        {status === 'idle' && (
          <p className="mb-0 text-xs text-white/45">
            Pick your dates to see the live price.
          </p>
        )}
        {status === 'found' && item && item.price != null && (
          <>
            <p className="mb-0 text-sm text-white/70">
              <span className="text-base font-semibold text-white/95">
                {item.estimate ? 'from ' : ''}
                {formatMoney(item.price, item.currency)}
              </span>
              {` total · ${item.nights ?? nights} night${(item.nights ?? nights) === 1 ? '' : 's'}`}
            </p>
            {breakdown && (
              <p className="mb-0 mt-0.5 text-xs text-white/45">{breakdown}</p>
            )}
            {item.estimate && (
              <p className="mb-0 mt-0.5 text-xs text-white/45">
                {ESTIMATE_NOTE}
              </p>
            )}
          </>
        )}
        {status === 'found' && item && item.price == null && (
          <p className="mb-0 text-xs text-white/60">
            Contact us via email for availability
          </p>
        )}
        {status === 'unavailable' && (
          <p className="mb-0 text-xs text-white/60">
            No availability for these dates
          </p>
        )}
        {status === 'error' && (
          <p className="mb-0 text-xs text-white/60">
            {fallbackText ? `${fallbackText} · ` : ''}
            {ESTIMATE_NOTE}
          </p>
        )}
      </div>
    </div>
  )
}
