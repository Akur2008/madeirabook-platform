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

// The "get the app" modal — shared by the deep-link button and the
// info-only pill (which always opens the modal, no navigation attempt).
function OfflineNavModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Get offline navigation"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[#0a1420] p-6 text-center shadow-2xl">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
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
            className="block w-full rounded-full border border-[#10b981] bg-[#10b981] py-3 text-sm font-semibold uppercase tracking-widest text-[#0a1420] transition-colors hover:bg-[#059669]"
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
  )
}

// The marketing pill under the homepage map — opens the instructions
// modal (app links + steps) rather than attempting the om:// deep link.
export function OfflineNavInfoPill() {
  const [modalOpen, setModalOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-5 py-2.5 text-sm transition-colors hover:bg-[#10b981]/20"
      >
        <span aria-hidden>🧭</span>
        <span className="font-semibold uppercase tracking-widest text-[#34d399]">
          Offline Navigation
        </span>
        <span className="text-white/60">
          Download once. Navigate anywhere.
        </span>
      </button>
      {modalOpen && <OfflineNavModal onClose={() => setModalOpen(false)} />}
    </>
  )
}

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

      {modalOpen && <OfflineNavModal onClose={() => setModalOpen(false)} />}
    </>
  )
}
