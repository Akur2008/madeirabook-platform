'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useAudioEngine } from '@/audio/useAudioEngine'

const SEARCH_URL = 'https://app.madeirabook.com/api/search-availability'
const STAY_BASE_URL = 'https://app.madeirabook.com'
const SHEET_MS = 400
const SHEET_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export type SearchResult = {
  slug: string
  name: string
  price: number
  currency?: string
  coverImage?: string | null
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

function formatMoney(price: number, currency?: string): string {
  const amount = Math.round(price)
  if (!currency || currency === 'EUR' || currency === '€') return `€${amount}`
  return `${amount} ${currency}`
}

function normalizeImage(url?: string | null): string | null {
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
              No availability. Try other dates.
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
                const href = `${STAY_BASE_URL}/p/${item.slug}?arrival=${arrival}&departure=${departure}`
                return (
                  <a
                    key={item.slug}
                    href={href}
                    className="group flex items-center gap-4 rounded-xl border border-white/15 bg-white/5 p-3 transition-colors hover:bg-white/10"
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={item.name}
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
                      <p className="mb-0 mt-1 text-sm text-white/60">
                        <span className="font-semibold text-white/90">
                          {formatMoney(item.price, item.currency)}
                        </span>
                        {nights !== null && ` total · ${nights} nights`}
                      </p>
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
