'use client'

import { usePathname } from 'next/navigation'
import React, { useCallback, useSyncExternalStore } from 'react'

import { isExternallyManagedAmbient } from '@/audio/ambientPolicy'
import { DEFAULT_AMBIENT_LAYERS } from '@/audio/defaultAmbient'
import {
  readSoundMuted,
  serverSoundMuted,
  subscribeSoundMuted,
  writeSoundMuted,
} from '@/audio/soundMuted'
import { DEFAULT_AMBIENT_VOLUME } from '@/audio/types'
import { useAudioEngine } from '@/audio/useAudioEngine'

const styles = `
@keyframes soundButtonPulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55); }
  70% { box-shadow: 0 0 0 12px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
`

// Host never changes during a session; the external-store pattern keeps
// SSR and hydration identical ('') and reveals the real host after mount.
const subscribeNoop = () => () => {}
const readHost = () => window.location.hostname
const serverHost = () => ''

export default function SoundButton() {
  const engine = useAudioEngine()
  const pathname = usePathname()
  const muted = useSyncExternalStore(
    subscribeSoundMuted,
    readSoundMuted,
    serverSoundMuted,
  )
  const host = useSyncExternalStore(subscribeNoop, readHost, serverHost)

  // Pages like the Oasis homepage run their own <audio> ambience outside
  // the engine; there the button toggles the shared muted flag only.
  const externalAmbient = isExternallyManagedAmbient(pathname, host)

  const ambientPlaying = engine.state?.channels.globalAmbient.playing ?? false
  const soundOn = externalAmbient ? !muted : ambientPlaying && !muted

  const toggle = useCallback(async () => {
    if (soundOn) {
      writeSoundMuted(true)
      await engine.stop()
      return
    }
    writeSoundMuted(false)
    if (externalAmbient) {
      // The page's own audio reacts to the muted flag itself.
      await engine.stop()
      return
    }
    try {
      await engine.start()
      await engine.playAmbientLayers(DEFAULT_AMBIENT_LAYERS, {
        masterVolume: DEFAULT_AMBIENT_VOLUME,
      })
    } catch {
      // stay silent — the button invites another tap
    }
  }, [engine, soundOn, externalAmbient])

  return (
    <>
      <style>{styles}</style>
      <button
        type="button"
        data-sound-toggle
        aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
        aria-pressed={soundOn}
        onClick={() => void toggle()}
        className="fixed bottom-6 right-6 z-[2000] flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-[22px] backdrop-blur-sm transition-colors hover:bg-black/80"
        style={{
          animation: soundOn ? 'soundButtonPulse 2s infinite' : 'none',
        }}
      >
        <span
          className={
            soundOn
              ? 'opacity-100 drop-shadow-[0_0_6px_rgba(34,197,94,0.9)]'
              : 'opacity-50 grayscale'
          }
        >
          {soundOn ? '🔊' : '🔇'}
        </span>
      </button>
    </>
  )
}
