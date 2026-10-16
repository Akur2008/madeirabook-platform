'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { useAudioEngine } from '@/audio/useAudioEngine'

const FALLBACK_URL =
  'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev/sounds/ocean-ambient.m4a'
const AMBIENT_VOLUME = 0.25

const styles = `
@keyframes soundButtonPulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55); }
  70% { box-shadow: 0 0 0 12px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
`

export default function SoundButton() {
  const engine = useAudioEngine()
  const btnRef = useRef<HTMLButtonElement>(null)
  const urlRef = useRef(FALLBACK_URL)
  const userMutedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/sounds/active')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { url?: string } | null) => {
        if (!cancelled && typeof data?.url === 'string' && data.url) {
          urlRef.current = data.url
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const ambientPlaying = engine.state?.channels.globalAmbient.playing ?? false

  const playOcean = useCallback(async () => {
    try {
      await engine.playAmbient(urlRef.current, {
        loop: true,
        volume: AMBIENT_VOLUME,
      })
    } catch {
      // stay silent — the pulsing button invites another tap
    }
  }, [engine])

  const toggle = useCallback(async () => {
    if (engine.isStarted) {
      userMutedRef.current = true
      await engine.stop()
      return
    }
    userMutedRef.current = false
    await engine.start()
    await playOcean()
  }, [engine, playOcean])

  // Browsers only treat click/tap/keypress as a user gesture for autoplay —
  // scroll does not count. Start ambient on the first tap anywhere on the
  // page (also covers the "sound left on in a previous session" resume case),
  // unless the user explicitly muted via this button.
  useEffect(() => {
    if (ambientPlaying || userMutedRef.current) return
    const onFirstGesture = (e: PointerEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return
      void engine.start().then(playOcean)
    }
    window.addEventListener('pointerdown', onFirstGesture, { once: true })
    return () => window.removeEventListener('pointerdown', onFirstGesture)
  }, [engine, playOcean, ambientPlaying])

  return (
    <>
      <style>{styles}</style>
      <button
        ref={btnRef}
        type="button"
        aria-label={engine.isStarted ? 'Mute sound' : 'Enable sound'}
        onClick={() => void toggle()}
        className="fixed bottom-6 right-6 z-[2000] flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-[22px] backdrop-blur-sm transition-colors hover:bg-black/80"
        style={{
          animation: engine.isStarted ? 'soundButtonPulse 2s infinite' : 'none',
        }}
      >
        <span
          className={
            engine.isStarted
              ? 'opacity-100 drop-shadow-[0_0_6px_rgba(34,197,94,0.9)]'
              : 'opacity-50 grayscale'
          }
        >
          {engine.isStarted ? '🔊' : '🔇'}
        </span>
      </button>
    </>
  )
}
