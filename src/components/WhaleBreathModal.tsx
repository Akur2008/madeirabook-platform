'use client'

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import {
  readSoundMuted,
  serverSoundMuted,
  subscribeSoundMuted,
} from '@/audio/soundMuted'
import { useAudioEngine } from '@/audio/useAudioEngine'

// Open the modal from anywhere:
// window.dispatchEvent(new CustomEvent(WHALE_BREATH_EVENT))
export const WHALE_BREATH_EVENT = 'madeirabook:whale-breath'

const WHALES_URL = '/audio/whales.m4a'
const DUCK_MS = 900
const SHEET_MS = 400
const SHEET_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const SERIF = { fontFamily: 'Playfair Display, Cormorant Garamond, serif' } as const

const BREATH_TICK_MS = 1400
const BREATH_STEPS = [
  { label: 'Rest', seconds: 2 },
  { label: 'Breathe in through your nose', seconds: 3 },
  { label: 'Hold and relax', seconds: 5 },
  { label: 'Exhale fully, smile', seconds: 8 },
] as const

// Full-screen whale soundscape. The whales ride the engine's videoAudio
// channel: opening the modal ducks the ambient cocoon to silence, closing
// it fades the cocoon back in. The master mute wins over everything.
export default function WhaleBreathModal() {
  const engine = useAudioEngine()
  const [open, setOpen] = useState(false)
  const [breathStep, setBreathStep] = useState(0)
  const [breathSecond, setBreathSecond] = useState(1)
  const breathStepRef = useRef(0)
  const muted = useSyncExternalStore(
    subscribeSoundMuted,
    readSoundMuted,
    serverSoundMuted,
  )

  // The drawer dispatches the event inside a click — resuming the context
  // right here keeps the browser's user-gesture activation.
  useEffect(() => {
    const onOpen = () => {
      setOpen(true)
      if (!readSoundMuted()) void engine.start()
    }
    window.addEventListener(WHALE_BREATH_EVENT, onOpen)
    return () => window.removeEventListener(WHALE_BREATH_EVENT, onOpen)
  }, [engine])

  // One path for the whale: active while open && !muted. The cleanup
  // stops it — on close, on mute, and on unmount — and unducks the
  // ambient channel so the cocoon fades back in.
  useEffect(() => {
    if (!open || muted) return
    void engine.start()
    void engine.playVideo(WHALES_URL, { loop: true })
    // playVideo ducks ambient to 0.05 — take it the rest of the way down.
    engine.duck(0, DUCK_MS)
    return () => engine.stopVideo()
  }, [open, muted, engine])

  // Re-assert the duck whenever the ambient channel rises while the
  // modal is open — e.g. an unmute restarting the cocoon mid-session.
  const ambientVolume = engine.state?.channels.globalAmbient.volume ?? 0
  useEffect(() => {
    if (!open || muted || ambientVolume <= 0) return
    engine.duck(0, DUCK_MS)
  }, [open, muted, ambientVolume, engine])

  // Breathing pacer — the same 2-3-5-8 cycle as the sluice experience.
  // The reset lives in a timeout callback to satisfy
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!open) return
    breathStepRef.current = 0
    let secondInStep = 1
    const reset = setTimeout(() => {
      setBreathStep(0)
      setBreathSecond(1)
    }, 0)
    const interval = setInterval(() => {
      secondInStep++
      const current = BREATH_STEPS[breathStepRef.current]
      if (secondInStep > current.seconds) {
        breathStepRef.current = (breathStepRef.current + 1) % BREATH_STEPS.length
        setBreathStep(breathStepRef.current)
        secondInStep = 1
      }
      setBreathSecond(secondInStep)
    }, BREATH_TICK_MS)
    return () => {
      clearTimeout(reset)
      clearInterval(interval)
    }
  }, [open])

  // Scroll lock + Escape while the modal is up.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const step = BREATH_STEPS[breathStep]
  const scale =
    breathStep === 1
      ? 0.8 + (0.4 * breathSecond) / step.seconds
      : breathStep === 2
        ? 1.2
        : breathStep === 3
          ? 1.2 - (0.4 * breathSecond) / step.seconds
          : 0.8

  return (
    <div
      className={`fixed inset-0 z-[2300] ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
      inert={!open}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        style={{
          opacity: open ? 1 : 0,
          transitionDuration: `${SHEET_MS}ms`,
          transitionTimingFunction: SHEET_EASE,
        }}
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Whale Breath soundscape"
        className="absolute inset-x-4 top-1/2 mx-auto flex max-w-sm flex-col items-center rounded-3xl border border-[#10b981]/30 bg-[#0a1420]/95 px-8 pb-10 pt-8 text-center shadow-2xl"
        style={{
          opacity: open ? 1 : 0,
          transform: `translateY(-50%) scale(${open ? 1 : 0.95})`,
          transition: `opacity ${SHEET_MS}ms ${SHEET_EASE}, transform ${SHEET_MS}ms ${SHEET_EASE}`,
        }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>

        <span className="text-4xl" aria-hidden>
          🐋
        </span>
        <p className="mt-3 text-2xl text-[#10b981]" style={SERIF}>
          Whale Breath
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/40">
          Soundscape · 2 — 3 — 5 — 8
        </p>

        <div className="mt-8 flex h-40 items-center justify-center">
          <div
            className="h-32 w-32 rounded-full transition-transform ease-linear"
            style={{
              transform: `scale(${scale})`,
              transitionDuration: `${BREATH_TICK_MS}ms`,
              background:
                'radial-gradient(circle at 30% 30%, rgba(180, 220, 255, 0.35) 0%, rgba(120, 180, 240, 0.15) 40%, rgba(80, 140, 200, 0.05) 70%, transparent 100%)',
              boxShadow:
                '0 0 80px 20px rgba(120, 180, 240, 0.15), inset 0 0 60px 10px rgba(180, 220, 255, 0.1)',
            }}
          />
        </div>
        <p className="mt-2 text-sm uppercase tracking-widest text-white/70">
          {step.label}
        </p>
        <p className="mt-2 text-4xl font-light tabular-nums text-white/95" style={SERIF}>
          {breathSecond}
        </p>

        {muted && (
          <p className="mt-6 text-xs text-white/40">
            Sound is muted — unmute to hear the whales.
          </p>
        )}
      </div>
    </div>
  )
}
