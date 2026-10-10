'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { AudioEngine } from './audioEngine'
import { ChannelName, EngineState } from './types'

export const AUDIO_STARTED_KEY = 'madeirabook_audio_started'

const armedListeners = new Set<() => void>()

function readArmed(): boolean {
  try {
    return localStorage.getItem(AUDIO_STARTED_KEY) === '1'
  } catch {
    return false
  }
}

function setArmed(value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(AUDIO_STARTED_KEY, '1')
    } else {
      localStorage.removeItem(AUDIO_STARTED_KEY)
    }
  } catch {
    // private mode
  }
  for (const listener of armedListeners) listener()
}

function subscribeArmed(listener: () => void): () => void {
  armedListeners.add(listener)
  return () => armedListeners.delete(listener)
}

function serverArmed(): boolean {
  return false
}

export interface AudioEngineContextValue {
  isStarted: boolean
  state: EngineState | null
  start: () => Promise<void>
  stop: () => Promise<void>
  playAmbient: (url: string, options?: { loop?: boolean; volume?: number }) => Promise<void>
  playSluice: (url: string, durationSec?: number) => Promise<void>
  playVideo: (url: string, options?: { loop?: boolean }) => Promise<void>
  stopVideo: () => void
  stopAll: () => void
  setVolume: (channel: ChannelName, value: number) => void
  duck: (targetVolume?: number, duration?: number) => void
  unduck: (targetVolume?: number, duration?: number) => void
  crossfade: (fromUrl: string, toUrl: string, duration?: number) => Promise<void>
}

const AudioEngineContext = createContext<AudioEngineContextValue | null>(null)

export function AudioEngineProvider({ children }: { children: React.ReactNode }) {
  const engineRef = useRef<AudioEngine | null>(null)
  const isStarted = useSyncExternalStore(subscribeArmed, readArmed, serverArmed)
  const [state, setState] = useState<EngineState | null>(null)

  const engine = useCallback((): AudioEngine => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine()
      engineRef.current.subscribe(setState)
    }
    return engineRef.current
  }, [])

  const start = useCallback(async () => {
    await engine().start()
    setArmed(true)
  }, [engine])

  const stop = useCallback(async () => {
    engine().stopAll()
    await engine().suspend()
    setArmed(false)
  }, [engine])

  useEffect(() => {
    if (!isStarted) return
    const resume = () => {
      void engine().start()
    }
    window.addEventListener('pointerdown', resume, { once: true })
    return () => window.removeEventListener('pointerdown', resume)
  }, [isStarted, engine])

  const value = useMemo<AudioEngineContextValue>(
    () => ({
      isStarted,
      state,
      start,
      stop,
      playAmbient: (url, options) => engine().playAmbient(url, options),
      playSluice: (url, durationSec) => engine().playSluice(url, durationSec),
      playVideo: (url, options) => engine().playVideo(url, options),
      stopVideo: () => engine().stopVideo(),
      stopAll: () => engine().stopAll(),
      setVolume: (channel, v) => engine().setVolume(channel, v),
      duck: (targetVolume, duration) => engine().duck(targetVolume, duration),
      unduck: (targetVolume, duration) => engine().unduck(targetVolume, duration),
      crossfade: (fromUrl, toUrl, duration) => engine().crossfade(fromUrl, toUrl, duration),
    }),
    [isStarted, state, start, stop, engine],
  )

  return <AudioEngineContext.Provider value={value}>{children}</AudioEngineContext.Provider>
}

export function useAudioEngineContext(): AudioEngineContextValue {
  const ctx = useContext(AudioEngineContext)
  if (!ctx) throw new Error('useAudioEngine must be used inside AudioEngineProvider')
  return ctx
}
