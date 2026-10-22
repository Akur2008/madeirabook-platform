'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Drawer } from 'vaul'

import OfflineNavButton from './OfflineNavButton'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export interface GetDirectionsSheetProps {
  lat: number
  lng: number
  name: string
  address?: string | null
  theme?: 'dark' | 'gold'
  /** Where "View on full map" navigates. Defaults per theme. */
  mapHref?: string
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
  mapHref,
  open,
  onOpenChange,
  hideTrigger = false,
}: GetDirectionsSheetProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current)
    },
    [],
  )

  const copyTarget = address?.trim() || `${lat}, ${lng}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyTarget)
    } catch {
      // Clipboard API needs a secure context / permission — fall back
      const ta = document.createElement('textarea')
      ta.value = copyTarget
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  // `ll` drops a pin at the exact coordinates (with the name as its label) —
  // `daddr`/`q`-only URLs left Apple Maps free to geocode the name wrong.
  const appleMapsUrl = `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(name)}`
  const fullMapHref =
    mapHref ??
    (theme === 'gold'
      ? `/oasis?lat=${lat}&lng=${lng}&zoom=13`
      : `/explore?lat=${lat}&lng=${lng}&zoom=13`)

  const backToSearch = () => {
    setOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const viewOnFullMap = () => {
    setOpen(false)
    router.push(fullMapHref)
  }

  const accent = theme === 'gold' ? '#D4AF37' : '#10b981'

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            theme === 'gold'
              ? 'inline-flex items-center justify-center rounded-lg border border-[#d4af37] bg-[#d4af37] px-5 py-2.5 text-sm font-semibold text-[#1c1a16] transition-colors hover:bg-[#c9a227]'
              : 'inline-flex items-center justify-center rounded-lg border border-emerald-600 bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500'
          }
        >
          Get Directions
        </button>
      )}

      <Drawer.Root open={isOpen} onOpenChange={setOpen}>
        <Drawer.Portal>
          {/* z-[1200] to stay above Leaflet map panes/controls (z-index up to 1000) */}
          <Drawer.Overlay className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm" />
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
              Copy the address or open directions in Apple Maps.
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
                {copyTarget}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full whitespace-nowrap rounded-full py-3.5 text-xs font-semibold uppercase tracking-widest transition-colors sm:text-sm"
                    style={{
                      backgroundColor: copied ? '#ffffff' : accent,
                      border: `1px solid ${accent}`,
                      color: copied ? accent : theme === 'gold' ? '#1c1a16' : '#ffffff',
                    }}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy address'}
                  </button>
                  <OfflineNavButton
                    lat={lat}
                    lng={lng}
                    name={name}
                    className="w-full whitespace-nowrap rounded-full border border-[#d4af37] bg-[#d4af37] py-3.5 text-xs font-semibold uppercase tracking-widest text-[#1c1a16] transition-colors hover:bg-[#c9a227] sm:text-sm"
                  />
                </div>

                <a
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-full border py-3 text-center text-sm uppercase tracking-widest text-white transition-colors hover:bg-white/10"
                  style={{ borderColor: accent }}
                >
                  🍎 Open in Apple Maps
                </a>

                <div className="mt-1 flex items-center justify-center gap-6 text-sm">
                  <button
                    type="button"
                    onClick={backToSearch}
                    className="text-white/55 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white/90"
                  >
                    Back to search
                  </button>
                  <button
                    type="button"
                    onClick={viewOnFullMap}
                    className="underline underline-offset-4 transition-colors"
                    style={{ color: accent }}
                  >
                    View on full map
                  </button>
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}
