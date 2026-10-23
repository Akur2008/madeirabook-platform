'use client'

import { usePathname } from 'next/navigation'
import React, { useCallback, useSyncExternalStore } from 'react'

import { isExternallyManagedAmbient } from '@/audio/ambientPolicy'
import { ASK_CONCIERGE_EVENT } from '@/components/AiConciergeWidget'
import {
  messageForPath,
  readRefCookie,
  WA_BASE,
} from '@/components/WhatsAppConciergeButton'
import {
  readCocoonEnabled,
  serverCocoonEnabled,
  subscribeCocoonEnabled,
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

const subscribeNoop = () => () => {}
const readHost = () => window.location.hostname
const serverHost = () => ''

const BTN =
  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors'

// Fixed bottom-right action bar: AI concierge, master mute, WhatsApp.
// Replaces the three stacked floating buttons — one horizontal pill.
export default function BottomActionBar() {
  const engine = useAudioEngine()
  const pathname = usePathname()
  const muted = useSyncExternalStore(
    subscribeSoundMuted,
    readSoundMuted,
    serverSoundMuted,
  )
  const cocoonOn = useSyncExternalStore(
    subscribeCocoonEnabled,
    readCocoonEnabled,
    serverCocoonEnabled,
  )
  const host = useSyncExternalStore(subscribeNoop, readHost, serverHost)

  const externalAmbient = isExternallyManagedAmbient(pathname, host)

  const channels = engine.state?.channels
  const anyPlaying =
    (channels?.globalAmbient.playing ||
      channels?.sluiceBuffer.playing ||
      channels?.videoAudio.playing) ??
    false
  const soundOn = externalAmbient ? !muted : anyPlaying && !muted

  // Master mute: kills everything at once (cocoon, video, whale) and —
  // unlike the header cocoon toggle — clears on unmute back to whatever
  // the toggle's flag says.
  const toggleMute = useCallback(async () => {
    if (!muted) {
      writeSoundMuted(true)
      await engine.stop()
      return
    }
    writeSoundMuted(false)
    await engine.start()
    if (!externalAmbient && cocoonOn) {
      try {
        await engine.playAmbientLayers(DEFAULT_AMBIENT_LAYERS, {
          masterVolume: DEFAULT_AMBIENT_VOLUME,
        })
      } catch {
        // stay silent — the button invites another tap
      }
    }
  }, [engine, muted, cocoonOn, externalAmbient])

  const openConcierge = useCallback(() => {
    window.dispatchEvent(new CustomEvent(ASK_CONCIERGE_EVENT, { detail: {} }))
  }, [])

  const openWhatsApp = useCallback(() => {
    const refCode = readRefCookie()
    const message = messageForPath(pathname)
    const text = refCode ? `${message} (ref: ${refCode})` : message
    const waUrl = `${WA_BASE}?text=${encodeURIComponent(text)}`

    fetch('/api/leads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'whatsapp',
        page: pathname,
        ...(refCode ? { refCode } : {}),
      }),
    }).catch(() => undefined)

    window.open(waUrl, '_blank', 'noopener')
  }, [pathname])

  // The owner cabinet is a back-office tool — no concierge there.
  if (pathname.startsWith('/owner')) return null

  return (
    <div className="fixed bottom-6 right-6 z-[2000] flex items-center gap-1 rounded-full border border-white/15 bg-black/60 p-1.5 shadow-lg backdrop-blur-sm">
      <button
        type="button"
        aria-label="Open AI concierge"
        onClick={openConcierge}
        className={`${BTN} text-emerald-300 hover:bg-white/10`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>

      <button
        type="button"
        data-sound-toggle
        aria-label={soundOn ? 'Mute all sound' : 'Unmute sound'}
        aria-pressed={!soundOn}
        onClick={() => void toggleMute()}
        className={`${BTN} text-lg hover:bg-white/10`}
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

      <button
        type="button"
        aria-label="Chat on WhatsApp"
        onClick={openWhatsApp}
        className={`${BTN} bg-[#25D366] text-white hover:bg-[#20bd5a]`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      </button>
    </div>
  )
}
