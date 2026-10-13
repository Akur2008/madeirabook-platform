'use client'

import { format } from 'date-fns'
import { useCallback, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { Drawer } from 'vaul'

import { useAudioEngine } from '@/audio/useAudioEngine'

import 'react-day-picker/style.css'

const SHEET_MS = 400
const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

type Tab = 'stay' | 'flights'

const TABS: { id: Tab; label: string }[] = [
  { id: 'stay', label: 'Stay' },
  { id: 'flights', label: 'Flights' },
]

export interface BookingDrawerProps {
  propertySlug?: string
  propertyTitle?: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function BookingDrawer({
  propertySlug,
  propertyTitle,
  trigger,
  open,
  onOpenChange,
}: BookingDrawerProps) {
  const engine = useAudioEngine()
  const [internalOpen, setInternalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('stay')
  const [range, setRange] = useState<DateRange | undefined>()

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        engine.duckToBackground(SHEET_MS)
        setActiveTab('stay')
      } else {
        engine.restoreFromBackground(SHEET_MS)
      }
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [engine, isControlled, onOpenChange],
  )

  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, 'd MMM')} — ${format(range.to, 'd MMM')}`
      : range?.from
        ? `${format(range.from, 'd MMM')} — select check-out`
        : 'Select check-in date'

  const handleSearch = useCallback(() => {
    console.log('[BookingDrawer] search availability (Phase 2)', {
      propertySlug,
      from: range?.from,
      to: range?.to,
    })
    alert('Phase 2')
  }, [propertySlug, range])

  return (
    <Drawer.Root open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
      <Drawer.Portal>
        {/* z-[1200] to stay above Leaflet map panes/controls (z-index up to 1000) */}
        <Drawer.Overlay className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[1200] mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-2xl border border-white/15 border-b-0 bg-[#0a1420] outline-none">
          <Drawer.Handle className="mx-auto mb-4 mt-4 h-1 w-10 shrink-0 rounded-full bg-white/20" />
          <Drawer.Close
            aria-label="Close"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
          >
            ✕
          </Drawer.Close>
          <Drawer.Title className="sr-only">
            {propertyTitle ? `Book ${propertyTitle}` : 'Book your stay'}
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            Pick your dates and plan your trip to Madeira.
          </Drawer.Description>

          <div className="shrink-0 px-6">
            {propertyTitle && (
              <p className="mb-3 mt-0 text-xs uppercase tracking-widest text-white/40">
                {propertyTitle}
              </p>
            )}

            <div
              role="tablist"
              aria-label="Booking options"
              className="flex rounded-full border border-white/15 bg-white/5 p-1"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 rounded-full py-2 text-xs uppercase tracking-widest transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white/15 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto px-6 pb-10">
            {activeTab === 'stay' ? (
              <>
                <p
                  className="mb-0 mt-6 text-2xl font-light text-white/95"
                  style={SERIF}
                >
                  When are you escaping?
                </p>

                <div className="mt-5 flex justify-center">
                  <DayPicker
                    mode="range"
                    selected={range}
                    onSelect={setRange}
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
                  disabled={!range?.from || !range?.to}
                  className="mt-5 block w-full rounded-full border border-white/30 bg-white/10 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white/20 disabled:opacity-40"
                >
                  Search availability
                </button>
              </>
            ) : (
              <>
                <p
                  className="mb-0 mt-6 text-2xl font-light text-white/95"
                  style={SERIF}
                >
                  Getting here
                </p>
                <p className="mb-0 mt-4 text-sm leading-relaxed text-white/70">
                  Direct flights to Funchal (FNC) from major European cities.
                </p>
                <p className="mb-0 mt-2 text-sm text-white/60">
                  From €17 (Lisbon) / €27 (London) / €75 (Munich)
                </p>
                <a
                  href="https://www.aviasales.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 block w-full rounded-full border border-white/30 bg-white/10 py-3 text-center text-sm uppercase tracking-widest text-white transition-colors hover:bg-white/20"
                >
                  Check flights →
                </a>
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
