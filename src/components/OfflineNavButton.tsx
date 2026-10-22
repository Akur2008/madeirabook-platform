'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { isOasisHost } from '@/lib/oasis-domain'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const APP_STORE_URL =
  'https://apps.apple.com/app/organic-maps-offline-maps/id1567437057'
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=app.organicmaps'

// How long to wait for the OS to hand the om:// link to Organic Maps
// before assuming the app is not installed.
const DEEP_LINK_TIMEOUT_MS = 1500

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

export interface OfflineNavButtonProps {
  lat: number
  lng: number
  name: string
  className?: string
}

export default function OfflineNavButton({
  lat,
  lng,
  name,
  className,
}: OfflineNavButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current)
    },
    [],
  )

  const navigate = useCallback(() => {
    // Desktop browsers can never handle om:// — go straight to the modal.
    if (!isMobileDevice()) {
      setModalOpen(true)
      return
    }

    const appName = isOasisHost(window.location.hostname)
      ? 'Madeira Oasis'
      : 'Madeirabook'
    const url = `om://map?v=1&ll=${lat},${lng}&n=${encodeURIComponent(
      name,
    )}&appname=${encodeURIComponent(appName)}`

    // When the OS hands the scheme to Organic Maps the page loses
    // visibility; if it stays visible the scheme had no handler.
    let handedOff = false
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') handedOff = true
    }
    document.addEventListener('visibilitychange', onVisibility)

    const startedAt = Date.now()
    window.location.href = url
    fallbackTimer.current = setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibility)
      // The timer can fire late after a backgrounded tab returns — treat a
      // big delay as "the app did open" rather than showing the modal.
      const stillForeground =
        document.visibilityState === 'visible' &&
        Date.now() - startedAt < DEEP_LINK_TIMEOUT_MS + 2500
      if (!handedOff && stillForeground) setModalOpen(true)
    }, DEEP_LINK_TIMEOUT_MS)
  }, [lat, lng, name])

  return (
    <>
      <button type="button" onClick={navigate} className={className}>
        🧭 Navigate Offline
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[1400] flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Get offline navigation"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[#0a1420] p-6 text-center shadow-2xl">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setModalOpen(false)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
            >
              ✕
            </button>
            <p className="text-xs leading-relaxed text-white/50">
              1. Download the app. 2. Download the Madeira map. 3. Come back
              and tap &quot;Navigate Offline&quot;.
            </p>
            <div className="mt-3 text-3xl" aria-hidden>
              🧭
            </div>
            <h3
              className="mt-3 text-2xl font-light text-white/95"
              style={SERIF}
            >
              Get offline navigation
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Organic Maps works without internet — download once, navigate
              anywhere.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-full border border-[#d4af37] bg-[#d4af37] py-3 text-sm font-semibold uppercase tracking-widest text-[#1c1a16] transition-colors hover:bg-[#c9a227]"
              >
                Download for iPhone
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-full border border-white/30 bg-white/10 py-3 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white/20"
              >
                Download for Android
              </a>
            </div>
            <p className="mt-4 text-xs text-white/45">
              Already have the app? Tap &quot;Navigate Offline&quot; again.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
