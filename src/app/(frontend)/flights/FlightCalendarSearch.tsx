'use client'

import { addDays, format } from 'date-fns'
import { useCallback, useRef, useState } from 'react'
import { Drawer } from 'vaul'

import { useAudioEngine } from '@/audio/useAudioEngine'

const SHEET_MS = 400
const DESTINATION_IATA = 'FNC'
const AVIASALES_MARKER = '779585'
const TRIP_NIGHTS = 7
const WINDOW_DAYS = 14
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

type PriceRow = { date: string; price: number }
type Status = 'idle' | 'loading' | 'results' | 'empty' | 'error'

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

export default function FlightCalendarSearch() {
  const engine = useAudioEngine()
  const [originInput, setOriginInput] = useState('Lisbon')
  const [status, setStatus] = useState<Status>('idle')
  const [rows, setRows] = useState<PriceRow[]>([])
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN)
  const [sheetOpen, setSheetOpen] = useState(false)
  const searchSeq = useRef(0)

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

  const handleSearch = useCallback(async () => {
    const seq = ++searchSeq.current
    const resolved = resolveOrigin(originInput)
    setOrigin(resolved)
    setStatus('loading')
    setRows([])
    handleSheetOpenChange(true)

    const today = new Date()
    const fromISO = toISODate(today)
    const toISO = toISODate(addDays(today, WINDOW_DAYS - 1))
    const months = [...new Set([fromISO.slice(0, 7), toISO.slice(0, 7)])]

    try {
      const payloads = await Promise.all(
        months.map(async (month) => {
          const res = await fetch(
            `/api/travelpayouts/calendar?origin=${resolved}&month=${month}`,
          )
          if (!res.ok) throw new Error(`calendar ${res.status}`)
          return (await res.json()) as { prices?: PriceRow[] }
        }),
      )
      if (seq !== searchSeq.current) return
      const byDate = new Map<string, number>()
      for (const p of payloads) {
        for (const r of Array.isArray(p.prices) ? p.prices : []) {
          if (r.date >= fromISO && r.date <= toISO) byDate.set(r.date, r.price)
        }
      }
      const inWindow = [...byDate.entries()]
        .map(([date, price]) => ({ date, price }))
        .sort((a, b) => a.date.localeCompare(b.date))
      setRows(inWindow)
      setStatus(inWindow.length > 0 ? 'results' : 'empty')
    } catch {
      if (seq === searchSeq.current) setStatus('error')
    }
  }, [originInput, handleSheetOpenChange])

  const handleBook = useCallback(
    (date: string) => {
      window.open(aviasalesUrl(origin, date), '_blank', 'noopener,noreferrer')
    },
    [origin],
  )

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

      <button
        type="button"
        onClick={handleSearch}
        disabled={status === 'loading'}
        className="mt-4 block w-full rounded-full border border-white/30 bg-white/10 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white/20 disabled:opacity-40"
      >
        {status === 'loading' ? 'Searching…' : 'Search by calendar'}
      </button>
      <p className="mb-0 mt-3 text-center text-xs text-white/40">
        Cheapest one-way fares to Funchal (FNC) for the next {WINDOW_DAYS} days.
      </p>

      <Drawer.Root open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <Drawer.Portal>
          {/* z-[1200] to stay above Leaflet map panes/controls (z-index up to 1000) */}
          <Drawer.Overlay className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-[1200] mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-2xl border border-white/15 border-b-0 bg-[#0a1420] outline-none">
            <Drawer.Handle className="mx-auto mb-2 mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20" />
            <Drawer.Close
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
            >
              ✕
            </Drawer.Close>
            <Drawer.Title className="sr-only">Cheapest flight dates</Drawer.Title>
            <Drawer.Description className="sr-only">
              Cheapest one-way fares to Funchal for the next {WINDOW_DAYS} days.
            </Drawer.Description>

            <div className="overflow-y-auto px-6 pb-10 pt-4">
              <p className="mb-0 text-center text-xs uppercase tracking-widest text-white/40">
                {origin} → {DESTINATION_IATA} · next {WINDOW_DAYS} days ·{' '}
                {TRIP_NIGHTS}-night return
              </p>

              {status === 'loading' && (
                <p className="mb-0 mt-6 text-center text-sm text-white/60">
                  Loading prices…
                </p>
              )}

              {status === 'empty' && (
                <p className="mb-0 mt-6 text-center text-sm text-white/60">
                  No fares found. Try another origin city.
                </p>
              )}

              {status === 'error' && (
                <p className="mb-0 mt-6 text-center text-sm text-red-400">
                  Something went wrong. Try again.
                </p>
              )}

              {status === 'results' && (
                <div className="mt-4 flex flex-col gap-3">
                  {rows.map((row) => (
                    <div
                      key={row.date}
                      className="flex items-center gap-4 rounded-xl border border-white/15 bg-white/5 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="mb-0 text-sm font-medium text-white/90">
                          {format(new Date(`${row.date}T12:00:00`), 'EEE d MMM')}
                        </p>
                        <p className="mb-0 mt-1 text-sm text-white/60">
                          <span className="font-semibold text-white/90">
                            €{Math.round(row.price)}
                          </span>
                          {' one-way'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBook(row.date)}
                        className="shrink-0 rounded-full border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
                      >
                        Book →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
