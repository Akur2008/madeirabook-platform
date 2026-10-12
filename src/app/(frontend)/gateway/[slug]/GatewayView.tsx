'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { useAudioEngine } from '@/audio/useAudioEngine'
import { AUDIO_STARTED_KEY } from '@/audio/AudioEngineProvider'
import { useAutoplayVideo } from '@/components/useAutoplayVideo'
import { AUTOPLAY_SOUND_KEY } from '@/app/(frontend)/components/GatewayCard'
import type { SluicePage } from '@/payload-types'

const styles = `
@keyframes gatewayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`

export default function GatewayView({ sluicePage }: { sluicePage: SluicePage }) {
  const engine = useAudioEngine()
  const ambientUrl = sluicePage.ambientAudioUrl
  const [tapVisible, setTapVisible] = useState(false)
  const { videoRef, needsTap: videoNeedsTap, playNow } = useAutoplayVideo()

  // Arriving from a gateway card: try to resume audio on its flag.
  // If the browser still demands a gesture, a one-tap pill appears below.
  useEffect(() => {
    let flagged = false
    try {
      flagged = sessionStorage.getItem(AUTOPLAY_SOUND_KEY) === '1'
      if (flagged) sessionStorage.removeItem(AUTOPLAY_SOUND_KEY)
    } catch {
      return
    }
    if (!flagged) return
    void engine.start()
    const t = setTimeout(() => {
      try {
        if (localStorage.getItem(AUDIO_STARTED_KEY) !== '1') setTapVisible(true)
      } catch {
        setTapVisible(true)
      }
    }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!engine.isStarted || !ambientUrl) return
    void engine.playVideo(ambientUrl, { loop: true })
    return () => engine.stopVideo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.isStarted, ambientUrl])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0a1420]">
      <style>{styles}</style>
      <div
        className="relative aspect-[9/16] w-[min(100%,450px,calc(100dvh*9/16))] overflow-hidden"
        style={{ animation: 'gatewayFadeIn 500ms ease-out both' }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={sluicePage.videoUrl ?? undefined}
          poster={sluicePage.posterUrl ?? undefined}
          muted
          autoPlay
          loop
          playsInline
          preload="auto"
          controls={false}
        />

        <Link
          href="/"
          className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Back"
        >
          ←
        </Link>

        {(videoNeedsTap || (tapVisible && !engine.isStarted)) && (
          <button
            type="button"
            onClick={() => {
              playNow()
              void engine.start()
              setTapVisible(false)
            }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-[#0a1420]/80 px-6 py-2.5 text-sm text-white/90 backdrop-blur-md transition-colors hover:bg-white/10"
          >
            Tap for sound &amp; video �
          </button>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 pb-16">
          <h1 className="mb-2 text-3xl font-bold leading-tight text-white">
            {sluicePage.title}
          </h1>
          {sluicePage.shortDescription && (
            <p className="mb-5 text-sm leading-snug text-white/80">
              {sluicePage.shortDescription}
            </p>
          )}
          <button
            type="button"
            onClick={() => console.log('Book this escape:', sluicePage.slug)}
            className="w-full rounded-full bg-white px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-black transition-colors hover:bg-white/85"
          >
            Book this escape
          </button>
        </div>
      </div>
    </div>
  )
}
