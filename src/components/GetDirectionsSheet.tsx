'use client'

import { useCallback, useState } from 'react'
import { Drawer } from 'vaul'

import OfflineNavButton from './OfflineNavButton'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export interface GetDirectionsSheetProps {
  lat: number
  lng: number
  name: string
  address?: string | null
  theme?: 'dark' | 'gold'
  /** Controlled mode (e.g. opened from a Leaflet popup). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Render only the sheet — an external UI controls `open`. */
  hideTrigger?: boolean
}

export default function GetDirectionsSheet({
  lat,
  lng,
  name,
  address,
  theme = 'dark',
  open,
  onOpenChange,
  hideTrigger = false,
}: GetDirectionsSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  const locationLabel = address?.trim() || `${lat}, ${lng}`

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            theme === 'gold'
              ? 'inline-flex items-center justify-center rounded-lg border border-[#10b981] bg-[#10b981] px-5 py-2.5 text-sm font-semibold text-[#0a1420] transition-colors hover:bg-[#059669]'
              : 'inline-flex items-center justify-center rounded-lg border border-emerald-600 bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500'
          }
        >
          Get Directions
        </button>
      )}

      <Drawer.Root open={isOpen} onOpenChange={setOpen}>
        <Drawer.Portal>
          {/* Plain backdrop div — an outside tap must not close the card
              (only the ✕ or a swipe-down may). z-[1200] to stay above
              Leaflet map panes/controls (z-index up to 1000). */}
          <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-[1200] mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-2xl border border-white/15 border-b-0 bg-[#0a1420] outline-none">
            <Drawer.Handle className="mx-auto mb-2 mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20" />
            <Drawer.Close
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
            >
              ✕
            </Drawer.Close>
            <Drawer.Title className="sr-only">Directions to {name}</Drawer.Title>
            <Drawer.Description className="sr-only">
              Open offline navigation to this place.
            </Drawer.Description>

            <div className="overflow-y-auto px-6 pb-8">
              <p className="mb-0 mt-2 text-center text-xs uppercase tracking-widest text-white/40">
                Directions to
              </p>
              <h2
                className="mt-2 text-center text-3xl font-light leading-tight text-white/95"
                style={SERIF}
              >
                {name}
              </h2>
              <p className="mb-0 mt-2 text-center text-sm text-white/55">
                {locationLabel}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <OfflineNavButton
                  lat={lat}
                  lng={lng}
                  name={name}
                  className="w-full whitespace-nowrap rounded-full border border-[#10b981] bg-[#10b981] py-3.5 text-xs font-semibold uppercase tracking-widest text-[#0a1420] transition-colors hover:bg-[#059669] sm:text-sm"
                />
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}
