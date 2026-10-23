'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useAudioEngine } from '@/audio/useAudioEngine'

export const SEARCH_URL = '/api/search-availability'
export const STAY_BASE_URL = ''
const SHEET_MS = 400
const SHEET_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export type SearchResult = {
  slug: string
  name: string
  price: number | null
  currency?: string
  coverImage?: string | null
  // True when price is a DB estimate (no live PMS rate) — render "from €X".
  estimate?: boolean
  nights?: number
  // Stay total minus the cleaning fee — the "n nights" part of the price.
  accommodation?: number | null
  cleaningFee?: number | null
}

export const ESTIMATE_NOTE =
  'Estimated price. Final price will be confirmed at checkout.'

// Second line under the total: "€200 stay + €50 cleaning fee" when the price
// carries a cleaning fee, else the average nightly rate.
export function priceBreakdownText(
  item: SearchResult,
  nights: number | null,
): string | null {
  if (item.price == null) return null
  const n = item.nights ?? nights
  if (item.accommodation != null && item.cleaningFee) {
    return `${formatMoney(item.accommodation, item.currency)} stay + ${formatMoney(item.cleaningFee, item.currency)} cleaning fee`
  }
  if (item.accommodation != null && n && n > 0) {
    return `avg ${formatMoney(item.accommodation / n, item.currency)} / night`
  }
  return null
}

// Price block shared by every availability result row: the PMS total with
// the nights + cleaning-fee breakdown, and the estimate note when the price
// is the DB fallback rather than a live PMS quote.
export function SearchResultPrice({
  item,
  nights,
}: {
  item: SearchResult
  nights: number | null
}) {
  if (item.price == null) {
    return (
      <p className="mb-0 mt-1 text-sm text-white/60">
        Contact us via email for availability
      </p>
    )
  }
  const n = item.nights ?? nights
  const breakdown = priceBreakdownText(item, n)
  return (
    <>
      <p className="mb-0 mt-1 text-sm text-white/60">
        <span className="font-semibold text-white/90">
          {item.estimate ? 'from ' : ''}
          {formatMoney(item.price, item.currency)}
        </span>
        {n != null && ` total · ${n} night${n === 1 ? '' : 's'}`}
      </p>
      {breakdown && (
        <p className="mb-0 mt-0.5 text-xs text-white/45">{breakdown}</p>
      )}
      {item.estimate && (
        <p className="mb-0 mt-0.5 text-xs text-white/45">{ESTIMATE_NOTE}</p>
      )}
    </>
  )
}

export const CONTACT_EMAIL = 'hello@madeiraoasis.com'

export function contactMailto(name?: string): string {
  const subject = name
    ? `Availability inquiry — ${name}`
    : 'Availability inquiry'
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`
}

type Status = 'idle' | 'loading' | 'results' | 'empty' | 'error'

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function nextWeekend(now = new Date()): { arrival: Date; departure: Date } {
  const delta = (5 - now.getDay() + 7) % 7
  const arrival = new Date(now)
  arrival.setDate(now.getDate() + delta)
  const departure = new Date(arrival)
  departure.setDate(arrival.getDate() + 2)
  return { arrival, departure }
}

export function formatMoney(price: number, currency?: string): string {
  const amount = Math.round(price)
  if (!currency || currency === 'EUR' || currency === '€') return `€${amount}`
  return `${amount} ${currency}`
}

export function normalizeImage(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${STAY_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export default function BookingSearchSheet({
  open,
  onClose,
  initialArrival,
  initialDeparture,
}: {
  open: boolean
  onClose: () => void
  initialArrival?: string
  initialDeparture?: string
}) {
  const engine = useAudioEngine()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState('')

  const todayISO = toISODate(new Date())

  // Open/close lifecycle: mount → slide up, slide down → unmount.
  // State updates live inside rAF/timeout callbacks (not the effect body)
  // to satisfy react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!open) return
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    engine.duckToBackground(SHEET_MS)
    const raf = requestAnimationFrame(() => {
      const weekend = nextWeekend()
      setArrival(initialArrival ?? toISODate(weekend.arrival))
      setDeparture(initialDeparture ?? toISODate(weekend.departure))
      setStatus('idle')
      setError('')
      setMounted(true)
      // Flip the transform on the next frame so the slide-up animates.
      requestAnimationFrame(() => setVisible(true))
    })
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open || !mounted) return
    engine.restoreFromBackground(SHEET_MS)
    const raf = requestAnimationFrame(() => setVisible(false))
    closeTimerRef.current = setTimeout(() => setMounted(false), SHEET_MS + 16)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted])

  // Lock body scroll and close on Escape while the sheet is up.
  useEffect(() => {
    if (!mounted) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [mounted, onClose])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const handleArrivalChange = useCallback(
    (value: string) => {
      setArrival(value)
      setDeparture((prev) => {
        if (prev && prev > value) return prev
        const d = new Date(`${value}T12:00:00`)
        d.setDate(d.getDate() + 2)
        return toISODate(d)
      })
    },
    [],
  )

  const handleSearch = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setError('')
      if (!DATE_RE.test(arrival) || !DATE_RE.test(departure) || arrival >= departure) {
        setError('Pick valid arrival and departure dates.')
        return
      }
      setStatus('loading')
      setResults([])
      try {
        const res = await fetch(SEARCH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ arrivalDate: arrival, departureDate: departure }),
        })
        if (!res.ok) throw new Error(`search ${res.status}`)
        const data = (await res.json()) as SearchResult[]
        if (Array.isArray(data) && data.length > 0) {
          setResults(data.slice(0, 3))
          setStatus('results')
        } else {
          setStatus('empty')
        }
      } catch {
        setStatus('error')
      }
    },
    [arrival, departure],
  )

  const nights =
    DATE_RE.test(arrival) && DATE_RE.test(departure) && arrival < departure
      ? Math.round(
          (new Date(`${departure}T12:00:00`).getTime() -
            new Date(`${arrival}T12:00:00`).getTime()) /
            86400000,
        )
      : null

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        style={{
          opacity: visible ? 1 : 0,
          transitionTimingFunction: SHEET_EASE,
          transitionDuration: `${SHEET_MS}ms`,
        }}
        onClick={onClose}
      />
      <div
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-white/15 border-b-0 backdrop-blur-xl"
        style={{
          background: 'rgba(10, 20, 32, 0.85)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: `transform ${SHEET_MS}ms ${SHEET_EASE}`,
        }}
      >
        <div className="overflow-y-auto px-6 pb-10 pt-4">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
          >
            ✕
          </button>

          <p className="mb-0 text-2xl font-light text-white/95" style={SERIF}>
            When are you escaping?
          </p>

          <form onSubmit={handleSearch} className="mt-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">
                  Arrival
                </span>
                <input
                  type="date"
                  required
                  min={todayISO}
                  value={arrival}
                  onChange={(e) => handleArrivalChange(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-white/50"
                  style={{ colorScheme: 'dark' }}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">
                  Departure
                </span>
                <input
                  type="date"
                  required
                  min={arrival || todayISO}
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-white/50"
                  style={{ colorScheme: 'dark' }}
                />
              </label>
            </div>

            {error && <p className="mb-0 mt-3 text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-5 block w-full rounded-full border border-white/30 bg-white/10 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              {status === 'loading' ? 'Searching…' : 'Search →'}
            </button>
          </form>

          {status === 'empty' && (
            <p className="mb-0 mt-6 text-center text-sm text-white/60">
              No availability for these dates.{' '}
              <a
                href={contactMailto()}
                className="text-white/90 underline underline-offset-2"
              >
                Contact us via email for availability
              </a>
            </p>
          )}

          {status === 'error' && (
            <p className="mb-0 mt-6 text-center text-sm text-red-400">
              Something went wrong. Try again.
            </p>
          )}

          {status === 'results' && (
            <div className="mt-6 flex flex-col gap-3">
              {results.map((item) => {
                const img = normalizeImage(item.coverImage)
                const href =
                  item.price == null
                    ? contactMailto(item.name)
                    : `${STAY_BASE_URL}/p/${item.slug}?arrival=${arrival}&departure=${departure}`
                return (
                  <a
                    key={item.slug}
                    href={href}
                    className="group flex items-center gap-4 rounded-xl border border-white/15 bg-white/5 p-3 transition-colors hover:bg-white/10"
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs text-white/40">
                        no photo
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="mb-0 truncate text-sm font-medium text-white/90">
                        {item.name}
                      </p>
                      <SearchResultPrice item={item} nights={nights} />
                    </div>
                    <span className="text-white/40 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

// Compact inline variant rendered inside the hero on the home page.
// Search results appear above the form so they stay in the first viewport.
export function BookingSearchInline({
  onResultsVisible,
}: {
  onResultsVisible?: (visible: boolean) => void
}) {
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState('')
  const [searched, setSearched] = useState<{
    arrival: string
    departure: string
    nights: number
  } | null>(null)
  const searchSeq = useRef(0)

  const todayISO = toISODate(new Date())

  // Dates come from the client clock — compute after mount to avoid
  // server/client timezone mismatches during hydration.
  useEffect(() => {
    const t = setTimeout(() => {
      const weekend = nextWeekend()
      setArrival(toISODate(weekend.arrival))
      setDeparture(toISODate(weekend.departure))
    }, 0)
    return () => clearTimeout(t)
  }, [])

  // Let the parent hide heavy hero blocks while results occupy the viewport.
  useEffect(() => {
    onResultsVisible?.(status === 'results')
  }, [status, onResultsVisible])

  const resetSearch = useCallback(() => {
    searchSeq.current += 1
    setStatus('idle')
    setResults([])
    setSearched(null)
    setError('')
  }, [])

  const handleArrivalChange = useCallback(
    (value: string) => {
      resetSearch()
      setArrival(value)
      setDeparture((prev) => {
        if (prev && prev > value) return prev
        const d = new Date(`${value}T12:00:00`)
        d.setDate(d.getDate() + 2)
        return toISODate(d)
      })
    },
    [resetSearch],
  )

  const handleDepartureChange = useCallback(
    (value: string) => {
      resetSearch()
      setDeparture(value)
    },
    [resetSearch],
  )

  const handleClose = useCallback(() => {
    resetSearch()
    const weekend = nextWeekend()
    setArrival(toISODate(weekend.arrival))
    setDeparture(toISODate(weekend.departure))
  }, [resetSearch])

  const handleSearch = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setError('')
      if (!DATE_RE.test(arrival) || !DATE_RE.test(departure) || arrival >= departure) {
        setError('Pick valid arrival and departure dates.')
        return
      }
      const seq = ++searchSeq.current
      setStatus('loading')
      setResults([])
      try {
        const res = await fetch(SEARCH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ arrivalDate: arrival, departureDate: departure }),
        })
        if (!res.ok) throw new Error(`search ${res.status}`)
        const data = (await res.json()) as SearchResult[]
        if (seq !== searchSeq.current) return
        setSearched({
          arrival,
          departure,
          nights: Math.round(
            (new Date(`${departure}T12:00:00`).getTime() -
              new Date(`${arrival}T12:00:00`).getTime()) /
              86400000,
          ),
        })
        if (Array.isArray(data) && data.length > 0) {
          setResults(data.slice(0, 3))
          setStatus('results')
        } else {
          setStatus('empty')
        }
      } catch {
        if (seq === searchSeq.current) setStatus('error')
      }
    },
    [arrival, departure],
  )

  return (
    <div className="w-full max-w-3xl">
      {status === 'results' && searched && (
        <div
          className="relative mb-3 rounded-2xl border border-white/15 p-4 text-left backdrop-blur-xl"
          style={{ background: 'rgba(10, 20, 32, 0.75)' }}
        >
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
          >
            ✕
          </button>
          <div
            className="pr-10 text-lg font-light text-white/95"
            style={SERIF}
          >
            Available: {formatShortDate(searched.arrival)} —{' '}
            {formatShortDate(searched.departure)}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {results.map((item) => {
              const img = normalizeImage(item.coverImage)
              const href =
                item.price == null
                  ? contactMailto(item.name)
                  : `${STAY_BASE_URL}/p/${item.slug}?arrival=${searched.arrival}&departure=${searched.departure}`
              return (
                <a
                  key={item.slug}
                  href={href}
                  className="group flex flex-col rounded-xl border border-white/15 bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  {img ? (
                    <Image
                      src={img}
                      alt={item.name}
                      width={320}
                      height={107}
                      className="aspect-[3/1] w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[3/1] w-full items-center justify-center rounded-lg bg-white/10 text-xs text-white/40">
                      no photo
                    </div>
                  )}
                  <div className="mt-2 truncate text-sm font-medium text-white/90">
                    {item.name}
                  </div>
                  <SearchResultPrice item={item} nights={searched.nights} />
                  <span className="mt-2 block w-full rounded-full border border-white/30 bg-white/10 py-1.5 text-center text-xs uppercase tracking-widest text-white transition-colors group-hover:bg-white/20">
                    {item.price == null ? 'Email →' : 'Book →'}
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {status === 'empty' && (
        <div className="mb-3 text-sm text-white/60">
          No availability for these dates.{' '}
          <a
            href={contactMailto()}
            className="text-white/90 underline underline-offset-2"
          >
            Contact us via email for availability
          </a>
        </div>
      )}
      {status === 'error' && (
        <div className="mb-3 text-sm text-red-400">
          Something went wrong. Try again.
        </div>
      )}

      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 gap-3 text-left sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">
            Arrival
          </span>
          <input
            type="date"
            required
            min={todayISO}
            value={arrival}
            onChange={(e) => handleArrivalChange(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-white/50"
            style={{ colorScheme: 'dark' }}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">
            Departure
          </span>
          <input
            type="date"
            required
            min={arrival || todayISO}
            value={departure}
            onChange={(e) => handleDepartureChange(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-white/50"
            style={{ colorScheme: 'dark' }}
          />
        </label>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white/20 disabled:opacity-50 sm:w-auto"
        >
          {status === 'loading' ? 'Searching…' : 'Search →'}
        </button>
      </form>
      {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
    </div>
  )
}
