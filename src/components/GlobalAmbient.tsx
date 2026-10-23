'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useSyncExternalStore } from 'react'

import {
  isExternallyManagedAmbient,
  isPageDrivenAmbient,
} from '@/audio/ambientPolicy'
import {
  DEFAULT_AMBIENT_LAYERS,
  isDefaultAmbientUrl,
} from '@/audio/defaultAmbient'
import {
  readCocoonEnabled,
  serverCocoonEnabled,
  subscribeCocoonEnabled,
} from '@/audio/cocoonEnabled'
import {
  readSoundMuted,
  serverSoundMuted,
  subscribeSoundMuted,
} from '@/audio/soundMuted'
import { DEFAULT_AMBIENT_VOLUME } from '@/audio/types'
import { useAudioEngine } from '@/audio/useAudioEngine'

const CROSSFADE_MS = 1500
const ENGINE_STOP_MS = 400

function currentHost(): string {
  return typeof window === 'undefined' ? '' : window.location.hostname
}

// Global ambient policy, mounted once per root layout inside
// AudioEngineProvider. Keeps the default cicadas/ocean/birds scene playing
// on every page that doesn't own its sound — and crossfades back to it
// (1.5s) when the visitor returns from a page that played something else
// (e.g. the whale breathing exercise on /sluice-test).
export default function GlobalAmbient() {
  const engine = useAudioEngine()
  const pathname = usePathname()
  const muted = useSyncExternalStore(
    subscribeSoundMuted,
    readSoundMuted,
    serverSoundMuted,
  )
  // Header "3D SOUND COCOON" toggle — off means the default scene stays
  // silent even when the master mute is off.
  const cocoonOn = useSyncExternalStore(
    subscribeCocoonEnabled,
    readCocoonEnabled,
    serverCocoonEnabled,
  )
  // True while a scene switch (play/crossfade) is in flight — the async
  // buffer load means several state emissions can fire before the new
  // scene's url becomes visible; the guard prevents re-triggering.
  const switchInFlight = useRef(false)

  const ambient = engine.state?.channels.globalAmbient
  const playing = ambient?.playing ?? false
  const url = ambient?.url ?? null
  const ctxRunning = engine.state?.started ?? false

  useEffect(() => {
    const host = currentHost()

    if (isExternallyManagedAmbient(pathname, host)) {
      // The Oasis hero owns the sound here — keep the engine silent.
      if (playing) engine.stopAmbient(ENGINE_STOP_MS)
      return
    }

    // Pages like /sluice-test drive the ambient channel themselves.
    if (isPageDrivenAmbient(pathname)) return

    if (muted || !cocoonOn) {
      if (playing) engine.stopAmbient(ENGINE_STOP_MS)
      return
    }

    if (switchInFlight.current || isDefaultAmbientUrl(url)) return

    if (playing) {
      switchInFlight.current = true
      void engine
        .crossfadeToLayers(DEFAULT_AMBIENT_LAYERS, CROSSFADE_MS, {
          masterVolume: DEFAULT_AMBIENT_VOLUME,
        })
        .finally(() => {
          switchInFlight.current = false
        })
    } else if (ctxRunning) {
      // Engine is live but silent (e.g. a page stopped ambient on unmount)
      // — bring the default scene back.
      switchInFlight.current = true
      void engine
        .playAmbientLayers(DEFAULT_AMBIENT_LAYERS, {
          masterVolume: DEFAULT_AMBIENT_VOLUME,
        })
        .finally(() => {
          switchInFlight.current = false
        })
    }
    // Context not running yet: the gesture listeners below start it.
  }, [engine, pathname, muted, cocoonOn, playing, url, ctxRunning])

  // First-gesture autostart + resume after reload (the armed flag survives
  // reloads; the AudioContext does not). Any click/tap/keypress/wheel that
  // isn't on the sound toggle counts. Pages that own their audio are
  // skipped — their own code starts the sound.
  useEffect(() => {
    const onGesture = (e: Event) => {
      if (muted || !cocoonOn) return
      const host = currentHost()
      if (
        isExternallyManagedAmbient(pathname, host) ||
        isPageDrivenAmbient(pathname)
      ) {
        return
      }
      if (
        e.target instanceof Element &&
        e.target.closest('[data-sound-toggle]')
      ) {
        return
      }
      if (engine.state?.channels.globalAmbient.playing) return
      void engine.start().then(() =>
        engine.playAmbientLayers(DEFAULT_AMBIENT_LAYERS, {
          masterVolume: DEFAULT_AMBIENT_VOLUME,
        }),
      )
    }
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)
    window.addEventListener('wheel', onGesture)
    return () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
      window.removeEventListener('wheel', onGesture)
    }
  }, [engine, muted, cocoonOn, pathname])

  return null
}
