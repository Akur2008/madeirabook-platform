'use client'

import { format } from 'date-fns'
import Image from 'next/image'
import { useCallback, useRef, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { Drawer } from 'vaul'

import { useAudioEngine } from '@/audio/useAudioEngine'

import {
  SEARCH_URL,
  contactMailto,
  formatMoney,
  normalizeImage,
  toISODate,
  type SearchResult,
} from '../components/BookingSearchSheet'

import 'react-day-picker/style.css'

const SHEET_MS = 400

type Status = 'idle' | 'loading' | 'results' | 'empty' | 'error'

export default function BookSearch() {
  const engine = useAudioEngine()
  const [range, setRange] = useState<DateRange | undefined>()
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<SearchResult[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searchedDates, setSearchedDates] = useState<{
    arrival: string
    departure: string
    nights: number
  } | null>(null)
  const [creatingSlug, setCreatingSlug] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState(false)
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

  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, 'd MMM')} — ${format(range.to, 'd MMM')}`
      : range?.from
        ? `${format(range.from, 'd MMM')} — select check-out`
        : 'Select check-in date'

  const handleRangeSelect = useCallback((next: DateRange | undefined) => {
    searchSeq.current += 1
    setRange(next)
    setStatus('idle')
    setResults([])
    setSearchedDates(null)
    setCreatingSlug(null)
    setCheckoutError(false)
    setSheetOpen(false)
  }, [])

  const handleSearch = useCallback(async () => {
    if (!range?.from || !range?.to || range.from >= range.to) return
    const seq = ++searchSeq.current
    const arrival = toISODate(range.from)
    const departure = toISODate(range.to)
    setStatus('loading')
    setResults([])
    setSearchedDates({
      arrival,
      departure,
      nights: Math.round((range.to.getTime() - range.from.getTime()) / 86400000),
    })
    try {
      const res = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arrivalDate: arrival, departureDate: departure }),
      })
      if (!res.ok) throw new Error(`search ${res.status}`)
      const data = (await res.json()) as SearchResult[]
      if (seq !== searchSeq.current) return
      if (Array.isArray(data) && data.length > 0) {
        setResults(data.slice(0, 3))
        setStatus('results')
      } else {
        setStatus('empty')
      }
      handleSheetOpenChange(true)
    } catch {
      if (seq === searchSeq.current) {
        setStatus('error')
        handleSheetOpenChange(true)
      }
    }
  }, [range, handleSheetOpenChange])

  const handleBook = useCallback(
    async (slug: string) => {
      if (!searchedDates || creatingSlug) return
      setCreatingSlug(slug)
      setCheckoutError(false)
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertySlug: slug,
            arrival: searchedDates.arrival,
            departure: searchedDates.departure,
          }),
        })
        const data = (await res.json().catch(() => null)) as {
          url?: string
        } | null
        if (!res.ok || typeof data?.url !== 'string' || !data.url) {
          throw new Error(`checkout ${res.status}`)
        }
        window.location.href = data.url
      } catch {
        setCreatingSlug(null)
        setCheckoutError(true)
      }
    },
    [searchedDates, creatingSlug],
  )

  return (
    <div className="mt-8">
      <div className="flex justify-center">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleRangeSelect}
          numberOfMonths={1}
          disabled={{ before: new Date() }}
          className="madeirabook-calendar"
        />
      </div>

      <p className="mb-0 mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm text-white/80">
        {rangeLabel}
      </p>

      <button
        type="button"
        onClick={handleSearch}
        disabled={
          !range?.from ||
          !range?.to ||
          range.from >= range.to ||
          status === 'loading'
        }
        className="mt-4 block w-full rounded-full border border-white/30 bg-white/10 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white/20 disabled:opacity-40"
      >
        {status === 'loading' ? 'Searching…' : 'Search'}
      </button>

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
            <Drawer.Title className="sr-only">Available stays</Drawer.Title>
            <Drawer.Description className="sr-only">
              Available stays for the selected dates.
            </Drawer.Description>

            <div className="overflow-y-auto px-6 pb-10 pt-4">
              {searchedDates && (
                <p className="mb-0 text-center text-xs uppercase tracking-widest text-white/40">
                  {format(new Date(`${searchedDates.arrival}T12:00:00`), 'd MMM')}
                  {' — '}
                  {format(new Date(`${searchedDates.departure}T12:00:00`), 'd MMM')}
                  {` · ${searchedDates.nights} night${searchedDates.nights === 1 ? '' : 's'}`}
                </p>
              )}

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

              {status === 'results' && searchedDates && (
                <div className="mt-4 flex flex-col gap-3">
                  {results.map((item) => {
                    const img = normalizeImage(item.coverImage)
                    const isCreating = creatingSlug === item.slug
                    return (
                      <div
                        key={item.slug}
                        className="flex items-center gap-4 rounded-xl border border-white/15 bg-white/5 p-3"
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
                          <p className="mb-0 mt-1 text-sm text-white/60">
                            {isCreating ? (
                              'Opening checkout…'
                            ) : item.price == null ? (
                              'Contact us via email for availability'
                            ) : (
                              <>
                                <span className="font-semibold text-white/90">
                                  {item.estimate ? 'from ' : ''}
                                  {formatMoney(item.price, item.currency)}
                                </span>
                                {` total · ${searchedDates.nights} nights`}
                              </>
                            )}
                          </p>
                        </div>
                        {item.price == null ? (
                          <a
                            href={contactMailto(item.name)}
                            className="shrink-0 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                          >
                            Email
                          </a>
                        ) : isCreating ? (
                          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border border-white/30 border-t-white" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBook(item.slug)}
                            disabled={creatingSlug !== null}
                            className="shrink-0 rounded-full border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
                          >
                            Book
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {checkoutError && (
                    <p className="mb-0 mt-1 text-center text-sm text-red-400">
                      Could not start checkout. Try again.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
