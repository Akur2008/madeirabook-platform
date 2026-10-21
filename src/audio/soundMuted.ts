'use client'

// Shared "sound off" flag for every audio surface: the AudioEngine ambient
// scene (GlobalAmbient/SoundButton) and the Oasis hero's own <audio> tracks.
// useSyncExternalStore keeps SSR output stable ("unmuted") and hydrates the
// real value on the client without a mismatch.

export const SOUND_MUTED_KEY = 'madeirabook_audio_muted'

const listeners = new Set<() => void>()

export function readSoundMuted(): boolean {
  try {
    return localStorage.getItem(SOUND_MUTED_KEY) === '1'
  } catch {
    return false
  }
}

export function writeSoundMuted(value: boolean): void {
  try {
    if (value) localStorage.setItem(SOUND_MUTED_KEY, '1')
    else localStorage.removeItem(SOUND_MUTED_KEY)
  } catch {
    // private mode
  }
  for (const listener of listeners) listener()
}

export function subscribeSoundMuted(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function serverSoundMuted(): boolean {
  return false
}
