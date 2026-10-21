'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { useAudioEngine } from '@/audio/useAudioEngine'

const FALLBACK_URL =
  'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev/sounds/ocean-ambient.m4a'
const AMBIENT_VOLUME = 0.25
const AUDIO_MUTED_KEY = 'madeirabook_audio_muted'

function readMuted(): boolean {
  try {
    return localStorage.getItem(AUDIO_MUTED_KEY) === '1'
  } catch {
    return false
  }
}

function setMuted(value: boolean): void {
  try {
    if (value) localStorage.setItem(AUDIO_MUTED_KEY, '1')
    else localStorage.removeItem(AUDIO_MUTED_KEY)
  } catch {
    // private mode
  }
}

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

  // `isStarted` is only a persisted "user enabled sound" flag — it survives
  // reloads while the AudioContext does not. Real playback state lives on the
  // ambient channel; toggling on it keeps the button honest (one click to
  // play, one click to pause).
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
    if (ambientPlaying) {
      setMuted(true)
      await engine.stop()
      return
    }
    setMuted(false)
    await engine.start()
    await playOcean()
  }, [engine, playOcean, ambientPlaying])

  // First-interaction autostart: tap, keypress and wheel all count as "the
  // visitor is here". Browsers only treat click/tap/keypress as a gesture
  // that can resume an AudioContext — wheel cannot — so listeners stay armed
  // until playback is actually running and each gesture retries the pending
  // resume. A user who muted sound via this button stays muted across visits.
  useEffect(() => {
    if (ambientPlaying || readMuted()) return
    const onFirstGesture = (e: Event) => {
      if (e.target instanceof Node && btnRef.current?.contains(e.target)) return
      void engine.start().then(playOcean)
    }
    window.addEventListener('pointerdown', onFirstGesture)
    window.addEventListener('keydown', onFirstGesture)
    window.addEventListener('wheel', onFirstGesture)
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture)
      window.removeEventListener('keydown', onFirstGesture)
      window.removeEventListener('wheel', onFirstGesture)
    }
  }, [engine, playOcean, ambientPlaying])

  return (
    <>
      <style>{styles}</style>
      <button
        ref={btnRef}
        type="button"
        aria-label={ambientPlaying ? 'Mute sound' : 'Enable sound'}
        onClick={() => void toggle()}
        className="fixed bottom-6 right-6 z-[2000] flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-[22px] backdrop-blur-sm transition-colors hover:bg-black/80"
        style={{
          animation: ambientPlaying ? 'soundButtonPulse 2s infinite' : 'none',
        }}
      >
        <span
          className={
            ambientPlaying
              ? 'opacity-100 drop-shadow-[0_0_6px_rgba(34,197,94,0.9)]'
              : 'opacity-50 grayscale'
          }
        >
          {ambientPlaying ? '🔊' : '🔇'}
        </span>
      </button>
    </>
  )
}
