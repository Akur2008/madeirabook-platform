'use client'

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Drawer } from 'vaul'

import { useAudioEngine } from '@/audio/useAudioEngine'

const SHEET_MS = 400
const DESTINATION_IATA = 'FNC'
const AVIASALES_MARKER = '779585'
const TRIP_NIGHTS = 7
const MAX_MONTHS_AHEAD = 6
const ORIGIN_DEBOUNCE_MS = 400
const IATA_RE = /^[a-zA-Z]{3}$/

// Cities that have dedicated "-to-madeira" pages on the site.
const CITY_TO_IATA: Record<string, string> = {
  amsterdam: 'AMS',
  barcelona: 'BCN',
  berlin: 'BER',
  brussels: 'BRU',
  dublin: 'DUB',
  edinburgh: 'EDI',
  frankfurt: 'FRA',
  lisbon: 'LIS',
  liverpool: 'LPL',
  london: 'LON',
  madrid: 'MAD',
  manchester: 'MAN',
  munich: 'MUC',
  paris: 'PAR',
  porto: 'OPO',
  vienna: 'VIE',
  zurich: 'ZRH',
}

const DEFAULT_ORIGIN = 'LIS'
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

type PriceRow = { date: string; price: number }

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function resolveOrigin(input: string): string {
  const trimmed = input.trim()
  if (IATA_RE.test(trimmed)) return trimmed.toUpperCase()
  return CITY_TO_IATA[trimmed.toLowerCase()] ?? DEFAULT_ORIGIN
}

function ddmm(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}`
}

function aviasalesUrl(origin: string, depISO: string): string {
  const dep = new Date(`${depISO}T12:00:00`)
  const ret = addDays(dep, TRIP_NIGHTS)
  return `https://www.aviasales.com/search/${origin}${ddmm(dep)}${DESTINATION_IATA}${ddmm(ret)}?marker=${AVIASALES_MARKER}`
}

// Aviasales-style price calendar. The official Travelpayouts calendar widget
// is a sealed embed that always redirects to Aviasales on click — it exposes
// no date-select hook. This grid renders the same per-day lowest fares from
// our /api/travelpayouts/calendar proxy instead, so picking a date opens our
// own BottomSheet and Aviasales is only reached via the Book CTA.
export default function FlightCalendarSearch() {
  const engine = useAudioEngine()
  const [originInput, setOriginInput] = useState('Lisbon')
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN)
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()))
  // Stamped with the origin so stale fares never render for a new one.
  const [priceData, setPriceData] = useState<{
    origin: string
    map: Map<string, number>
  }>({ origin: DEFAULT_ORIGIN, map: new Map() })
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  // `${origin}:${YYYY-MM}` -> rows; the single source of truth for `prices`.
  const cacheRef = useRef(new Map<string, PriceRow[]>())
  const seqRef = useRef(0)

  const prices = useMemo(
    () => (priceData.origin === origin ? priceData.map : new Map<string, number>()),
    [priceData, origin],
  )
  const today = useMemo(() => startOfMonth(new Date()), [])
  const todayISO = toISODate(new Date())

  const collectPrices = useCallback((o: string) => {
    const next = new Map<string, number>()
    for (const [key, rows] of cacheRef.current) {
      if (!key.startsWith(`${o}:`)) continue
      for (const r of rows) next.set(r.date, r.price)
    }
    return next
  }, [])

  const handleSheetOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        engine.duckToBackground(SHEET_MS)
      } else {
        engine.restoreFromBackground(SHEET_MS)
      }
      setSheetOpen(next)
    },
    [engine],
  )

  // Debounce the free-text origin into a resolved IATA code.
  useEffect(() => {
    const t = setTimeout(() => setOrigin(resolveOrigin(originInput)), ORIGIN_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [originInput])

  // Load the visible month (plus a warm prefetch of the next one) whenever
  // the origin or the cursor moves.
  useEffect(() => {
    const seq = ++seqRef.current
    const months = [monthCursor, addMonths(monthCursor, 1)].map((d) => format(d, 'yyyy-MM'))
    const missing = months.filter((m) => !cacheRef.current.has(`${origin}:${m}`))
    if (!missing.length) {
      // All cached — still republish so an origin switch repaints the grid.
      Promise.resolve().then(() => {
        if (seq === seqRef.current) {
          setPriceData({ origin, map: collectPrices(origin) })
        }
      })
      return
    }
    setLoading(true)
    setFailed(false)
    Promise.all(
      missing.map(async (month) => {
        const res = await fetch(`/api/travelpayouts/calendar?origin=${origin}&month=${month}`)
        if (!res.ok) throw new Error(`calendar ${res.status}`)
        const body = (await res.json()) as { prices?: PriceRow[] }
        return { month, rows: Array.isArray(body.prices) ? body.prices : [] }
      }),
    )
      .then((payloads) => {
        if (seq !== seqRef.current) return
        const cache = cacheRef.current
        for (const { month, rows } of payloads) cache.set(`${origin}:${month}`, rows)
        setPriceData({ origin, map: collectPrices(origin) })
      })
      .catch(() => {
        if (seq === seqRef.current) setFailed(true)
      })
      .finally(() => {
        if (seq === seqRef.current) setLoading(false)
      })
  }, [origin, monthCursor, collectPrices])

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 }),
      }),
    [monthCursor],
  )

  const monthPrices = useMemo(
    () =>
      days
        .filter((d) => isSameMonth(d, monthCursor))
        .map((d) => prices.get(toISODate(d)))
        .filter((p): p is number => p != null),
    [days, monthCursor, prices],
  )
  const minPrice = monthPrices.length ? Math.min(...monthPrices) : null

  const cheapest = useMemo(
    () =>
      [...prices.entries()]
        .filter(([date]) => date >= todayISO)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 5)
        .map(([date, price]) => ({ date, price })),
    [prices, todayISO],
  )

  const pickDay = useCallback(
    (iso: string) => {
      setSelected(iso)
      handleSheetOpenChange(true)
    },
    [handleSheetOpenChange],
  )

  const canPrev = monthCursor > today
  const canNext = monthCursor < addMonths(today, MAX_MONTHS_AHEAD - 1)
  const selectedDate = selected ? new Date(`${selected}T12:00:00`) : null
  const selectedPrice = selected ? (prices.get(selected) ?? null) : null

  return (
    <div className="mt-6">
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">
          From
        </span>
        <input
          type="text"
          value={originInput}
          onChange={(e) => setOriginInput(e.target.value)}
          placeholder="Lisbon or LIS"
          autoComplete="off"
          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-white/50"
        />
      </label>

      <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => canPrev && setMonthCursor((m) => addMonths(m, -1))}
            disabled={!canPrev}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 disabled:opacity-25"
          >
            ‹
          </button>
          <p className="mb-0 text-sm font-medium uppercase tracking-widest text-white/80">
            {format(monthCursor, 'MMMM yyyy')}
          </p>
          <button
            type="button"
            onClick={() => canNext && setMonthCursor((m) => addMonths(m, 1))}
            disabled={!canNext}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 disabled:opacity-25"
          >
            ›
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <p
              key={w}
              className="mb-0 py-1 text-center text-[10px] uppercase tracking-wider text-white/40"
            >
              {w}
            </p>
          ))}
          {days.map((day) => {
            const iso = toISODate(day)
            const inMonth = isSameMonth(day, monthCursor)
            const past = iso < todayISO
            const price = prices.get(iso)
            const isSelected = iso === selected
            const disabled = !inMonth || past
            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => pickDay(iso)}
                aria-label={`${format(day, 'd MMMM')}${price != null ? `, €${Math.round(price)}` : ''}`}
                aria-pressed={isSelected}
                className={`flex min-h-[52px] flex-col items-center justify-center rounded-lg border px-1 py-1.5 transition-colors ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : disabled
                      ? 'border-transparent'
                      : price != null && price === minPrice
                        ? 'border-emerald-500/60 bg-white/5 hover:bg-white/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                } ${disabled ? 'opacity-25' : ''}`}
              >
                <span
                  className={`text-xs ${inMonth ? 'text-white/85' : 'text-white/30'}`}
                >
                  {format(day, 'd')}
                </span>
                {inMonth && !past && price != null && (
                  <span
                    className={`mt-0.5 text-[10px] leading-none ${
                      price === minPrice ? 'font-semibold text-emerald-400' : 'text-white/50'
                    }`}
                  >
                    €{Math.round(price)}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <p className="mb-0 mt-3 text-center text-xs text-white/40">
          {failed
            ? 'Prices failed to load — tap a day to search live on Aviasales.'
            : loading
              ? `Loading ${origin} → ${DESTINATION_IATA} fares…`
              : `Lowest one-way fares ${origin} → ${DESTINATION_IATA} · tap a day`}
        </p>
      </div>

      <Drawer.Root open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <Drawer.Portal>
          {/* z-[1200] to stay above Leaflet map panes/controls (z-index up to 1000) */}
          <Drawer.Overlay className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-[1200] mx-auto flex max-h-[80dvh] w-full max-w-md flex-col rounded-t-2xl border border-white/15 border-b-0 bg-[#0a1420] outline-none">
            <Drawer.Handle className="mx-auto mb-2 mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20" />
            <Drawer.Close
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
            >
              ✕
            </Drawer.Close>
            <Drawer.Title className="sr-only">Selected flight dates</Drawer.Title>
            <Drawer.Description className="sr-only">
              Fare for the picked date and the cheapest alternatives.
            </Drawer.Description>

            <div className="overflow-y-auto px-4 pb-3 pt-3">
              <p className="mb-0 text-center text-xs uppercase tracking-widest text-white/40">
                {origin} → {DESTINATION_IATA} · {TRIP_NIGHTS}-night return
              </p>

              {selectedDate && (
                <div className="mt-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-center">
                  <p className="mb-0 text-sm text-white/60">Depart</p>
                  <p className="mb-0 mt-1 text-lg font-semibold text-white">
                    {format(selectedDate, 'EEE d MMM yyyy')}
                  </p>
                  <p className="mb-0 mt-2 text-sm text-white/60">
                    Return {format(addDays(selectedDate, TRIP_NIGHTS), 'EEE d MMM yyyy')}
                  </p>
                  <p className="mb-0 mt-3 text-2xl font-semibold text-emerald-400">
                    {selectedPrice != null ? `€${Math.round(selectedPrice)}` : '—'}
                  </p>
                  <p className="mb-0 mt-1 text-xs text-white/50">
                    {selectedPrice != null
                      ? 'lowest cached one-way fare'
                      : 'no cached fare — check live prices'}
                  </p>
                </div>
              )}

              {cheapest.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs uppercase tracking-widest text-white/40">
                    Cheapest dates
                  </p>
                  <div className="flex flex-col gap-2">
                    {cheapest.map((row) => {
                      const isSelected = row.date === selected
                      return (
                        <button
                          key={row.date}
                          type="button"
                          onClick={() => setSelected(row.date)}
                          aria-pressed={isSelected}
                          className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/15'
                              : 'border-white/15 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-sm font-medium text-white/90">
                            {format(new Date(`${row.date}T12:00:00`), 'EEE d MMM')}
                          </span>
                          <span className="text-sm text-white/60">
                            <span className="font-semibold text-white/90">
                              €{Math.round(row.price)}
                            </span>
                            {' one-way'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* The only Aviasales exit on the page: books the selected date. */}
            <div className="shrink-0 border-t border-white/10 px-4 pb-6 pt-3">
              <button
                type="button"
                onClick={() =>
                  selected &&
                  window.open(aviasalesUrl(origin, selected), '_blank', 'noopener,noreferrer')
                }
                disabled={selected == null}
                className="block w-full whitespace-nowrap rounded-full border border-emerald-600 bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
              >
                Book on Aviasales →
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
