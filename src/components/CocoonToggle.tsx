'use client'

import { usePathname } from 'next/navigation'
import React, { useCallback, useSyncExternalStore } from 'react'

import { isExternallyManagedAmbient } from '@/audio/ambientPolicy'
import {
  readCocoonEnabled,
  serverCocoonEnabled,
  subscribeCocoonEnabled,
  writeCocoonEnabled,
} from '@/audio/cocoonEnabled'
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
@keyframes cocoonWave {
  0%, 100% { transform: scaleY(0.35); }
  50% { transform: scaleY(1); }
}
.cocoon-wave-bar {
  transform-origin: center;
  animation: cocoonWave 1.2s ease-in-out infinite;
}
`

// Host never changes during a session; the external-store pattern keeps
// SSR and hydration identical ('') and reveals the real host after mount.
const subscribeNoop = () => () => {}
const readHost = () => window.location.hostname
const serverHost = () => ''

// Animated wave glyph for the "3D SOUND COCOON" toggle. Bars freeze flat
// when the cocoon is off.
function WaveIcon({ on }: { on: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {[4, 8, 12, 16, 20].map((x, i) => (
        <line
          key={x}
          x1={x}
          y1={on ? 8 : 11}
          x2={x}
          y2={on ? 16 : 13}
          className={on ? 'cocoon-wave-bar' : undefined}
          style={
            on ? { animationDelay: `${i * 0.15}s`, transformBox: 'fill-box' } : undefined
          }
        />
      ))}
    </svg>
  )
}

// The header's global ambient toggle: switches the ocean/cicadas/birds
// cocoon on and off. It reflects the effective state — the bottom-bar
// master mute flips it to OFF — while the cocoonEnabled flag survives so
// unmuting brings the cocoon back. Tapping ON while muted unmutes.
export default function CocoonToggle() {
  const engine = useAudioEngine()
  const pathname = usePathname()
  const cocoonOn = useSyncExternalStore(
    subscribeCocoonEnabled,
    readCocoonEnabled,
    serverCocoonEnabled,
  )
  const muted = useSyncExternalStore(
    subscribeSoundMuted,
    readSoundMuted,
    serverSoundMuted,
  )
  const host = useSyncExternalStore(subscribeNoop, readHost, serverHost)

  // Pages with their own <audio> ambience outside the engine (Oasis hero)
  // — there the toggle drives the shared muted flag, like SoundButton.
  const externalAmbient = isExternallyManagedAmbient(pathname, host)

  const on = externalAmbient ? !muted : cocoonOn && !muted

  const toggle = useCallback(async () => {
    if (externalAmbient) {
      writeSoundMuted(on)
      if (on) await engine.stop()
      return
    }
    if (on) {
      writeCocoonEnabled(false)
      engine.stopAmbient(400)
      return
    }
    writeCocoonEnabled(true)
    if (muted) writeSoundMuted(false)
    try {
      await engine.start()
      await engine.playAmbientLayers(DEFAULT_AMBIENT_LAYERS, {
        masterVolume: DEFAULT_AMBIENT_VOLUME,
      })
    } catch {
      // stay silent — the button invites another tap
    }
  }, [engine, on, muted, externalAmbient])

  return (
    <>
      <style>{styles}</style>
      <button
        type="button"
        data-sound-toggle
        aria-label={on ? 'Turn 3D sound cocoon off' : 'Turn 3D sound cocoon on'}
        aria-pressed={on}
        onClick={() => void toggle()}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 backdrop-blur transition-colors ${
          on
            ? 'border-[#10b981]/50 bg-[#0a1420]/70 text-[#10b981]'
            : 'border-white/15 bg-[#0a1420]/60 text-white/45'
        }`}
      >
        <WaveIcon on={on} />
        <span className="flex flex-col items-start leading-none">
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em]">
            3D Sound Cocoon
          </span>
          <span
            className={`mt-1 text-[9px] font-bold uppercase tracking-[0.18em] ${
              on ? 'text-emerald-300' : 'text-white/40'
            }`}
          >
            {on ? '✓ ON' : '☐ OFF'}
          </span>
        </span>
      </button>
    </>
  )
}
