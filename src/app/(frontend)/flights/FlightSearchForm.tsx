'use client'

import { addMonths, format, startOfMonth } from 'date-fns'
import { useCallback, useMemo, useRef, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { Drawer } from 'vaul'

import { useAudioEngine } from '@/audio/useAudioEngine'

import {
  DEFAULT_DESTINATION_IATA,
  DEFAULT_ORIGIN_IATA,
  aviasalesUrl,
  resolveCity,
  toISODate,
  type PriceRow,
} from './flightUtils'

import 'react-day-picker/style.css'

const SHEET_MS = 400
const MAX_SHEET_ROWS = 20

type SearchStatus = 'idle' | 'loading' | 'results' | 'empty' | 'error'

const inputCls =
  'w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-white/50'
const labelCls = 'mb-1.5 block text-xs uppercase tracking-wider text-white/50'

export default function FlightSearchForm() {
  const engine = useAudioEngine()
  const [originInput, setOriginInput] = useState('Lisbon')
  const [destInput, setDestInput] = useState('Funchal')
  const [range, setRange] = useState<DateRange | undefined>()
  const [passengers, setPassengers] = useState(1)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [rows, setRows] = useState<PriceRow[]>([])
  const [route, setRoute] = useState({
    origin: DEFAULT_ORIGIN_IATA,
    destination: DEFAULT_DESTINATION_IATA,
  })
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

  const today = useMemo(() => new Date(), [])
  const todayISO = toISODate(today)

  const departISO = range?.from ? toISODate(range.from) : null
  const returnISO =
    range?.from && range?.to && range.to > range.from ? toISODate(range.to) : null
  const selectedPrice = useMemo(
    () => (departISO ? (rows.find((r) => r.date === departISO)?.price ?? null) : null),
    [departISO, rows],
  )

  const datesLabel = departISO
    ? returnISO
      ? `${format(new Date(`${departISO}T12:00:00`), 'd MMM')} — ${format(new Date(`${returnISO}T12:00:00`), 'd MMM')}`
      : `${format(new Date(`${departISO}T12:00:00`), 'd MMM')} — one way`
    : 'Depart — Return'

  // Fetches every calendar month covered by the picked range (current month
  // when nothing is picked) and opens the results sheet — never redirects.
  const handleSearch = useCallback(async () => {
    const origin = resolveCity(originInput, DEFAULT_ORIGIN_IATA)
    const destination = resolveCity(destInput, DEFAULT_DESTINATION_IATA)
    const months = new Set<string>()
    const rangeEnd = range?.to ?? range?.from ?? today
    for (
      let d = startOfMonth(range?.from ?? today);
      d <= rangeEnd;
      d = addMonths(d, 1)
    ) {
      months.add(format(d, 'yyyy-MM'))
    }

    const seq = ++searchSeq.current
    setRoute({ origin, destination })
    setStatus('loading')
    setRows([])
    handleSheetOpenChange(true)
    try {
      const payloads = await Promise.all(
        [...months].map(async (month) => {
          const res = await fetch(
            `/api/travelpayouts/calendar?origin=${origin}&destination=${destination}&month=${month}`,
          )
          if (!res.ok) throw new Error(`calendar ${res.status}`)
          const body = (await res.json()) as { prices?: PriceRow[] }
          return Array.isArray(body.prices) ? body.prices : []
        }),
      )
      if (seq !== searchSeq.current) return
      const byDate = new Map<string, number>()
      for (const list of payloads) {
        for (const row of list) byDate.set(row.date, row.price)
      }
      const merged = [...byDate.entries()]
        .filter(([date]) => date >= todayISO)
        .map(([date, price]) => ({ date, price }))
        .sort((a, b) => a.price - b.price)
      setRows(merged)
      setStatus(merged.length ? 'results' : 'empty')
      if (!range?.from && merged.length) {
        setRange({ from: new Date(`${merged[0].date}T12:00:00`), to: undefined })
      }
    } catch {
      if (seq === searchSeq.current) setStatus('error')
    }
  }, [originInput, destInput, range, today, todayISO, handleSheetOpenChange])

  const pickDepart = useCallback((iso: string) => {
    const from = new Date(`${iso}T12:00:00`)
    setRange((r) => ({ from, to: r?.to && r.to > from ? r.to : undefined }))
  }, [])

  const book = useCallback(() => {
    if (!departISO) return
    window.open(
      aviasalesUrl({
        origin: route.origin,
        destination: route.destination,
        departISO,
        returnISO,
        passengers,
      }),
      '_blank',
      'noopener,noreferrer',
    )
  }, [departISO, returnISO, route, passengers])

  return (
    <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>From</span>
          <input
            type="text"
            value={originInput}
            onChange={(e) => setOriginInput(e.target.value)}
            placeholder="Lisbon or LIS"
            autoComplete="off"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>To</span>
          <input
            type="text"
            value={destInput}
            onChange={(e) => setDestInput(e.target.value)}
            placeholder="Funchal or FNC"
            autoComplete="off"
            className={inputCls}
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <span className={labelCls}>Dates</span>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            aria-expanded={pickerOpen}
            className={`${inputCls} text-left hover:bg-white/10`}
          >
            {datesLabel}
          </button>
        </div>
        <label className="block">
          <span className={labelCls}>Passengers</span>
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className={inputCls}
          >
            {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n} className="bg-[#0a1420]">
                {n} {n === 1 ? 'passenger' : 'passengers'}
              </option>
            ))}
          </select>
        </label>
      </div>

      {pickerOpen && (
        <div className="mt-3 flex justify-center rounded-xl border border-white/10 bg-white/5 py-3">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={1}
            disabled={{ before: today }}
            className="madeirabook-calendar"
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleSearch}
        disabled={status === 'loading'}
        className="mt-4 block w-full rounded-full border border-emerald-600 bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
      >
        {status === 'loading' ? 'Searching…' : 'Search flights'}
      </button>

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
            <Drawer.Title className="sr-only">Flight search results</Drawer.Title>
            <Drawer.Description className="sr-only">
              Departure dates with the lowest fares for the searched route.
            </Drawer.Description>

            <div className="overflow-y-auto px-4 pb-3 pt-3">
              <p className="mb-0 text-center text-xs uppercase tracking-widest text-white/40">
                {route.origin} → {route.destination} · {passengers}{' '}
                {passengers === 1 ? 'passenger' : 'passengers'}
              </p>

              {status === 'loading' && (
                <p className="mb-0 mt-6 text-center text-sm text-white/60">
                  Loading fares…
                </p>
              )}
              {status === 'error' && (
                <p className="mb-0 mt-6 text-center text-sm text-red-400">
                  Couldn&apos;t load prices — try again.
                </p>
              )}
              {status === 'empty' && (
                <p className="mb-0 mt-6 text-center text-sm text-white/60">
                  No cached fares for this route and month.
                </p>
              )}

              {status === 'results' && (
                <>
                  {departISO && (
                    <div className="mt-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-center">
                      <p className="mb-0 text-sm text-white/60">Depart</p>
                      <p className="mb-0 mt-1 text-lg font-semibold text-white">
                        {format(new Date(`${departISO}T12:00:00`), 'EEE d MMM yyyy')}
                      </p>
                      <p className="mb-0 mt-2 text-sm text-white/60">
                        {returnISO
                          ? `Return ${format(new Date(`${returnISO}T12:00:00`), 'EEE d MMM yyyy')}`
                          : 'One way'}
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

                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-widest text-white/40">
                      Cheapest departure dates
                    </p>
                    <div className="flex flex-col gap-2">
                      {rows.slice(0, MAX_SHEET_ROWS).map((row) => {
                        const isSelected = row.date === departISO
                        return (
                          <button
                            key={row.date}
                            type="button"
                            onClick={() => pickDepart(row.date)}
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
                </>
              )}
            </div>

            {/* The only Aviasales exit in the form: books the selected dates. */}
            <div className="shrink-0 border-t border-white/10 px-4 pb-6 pt-3">
              <button
                type="button"
                onClick={book}
                disabled={!departISO}
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
