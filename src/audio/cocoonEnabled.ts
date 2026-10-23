'use client'

// The header "3D SOUND COCOON" toggle's own flag — separate from the
// master `soundMuted` flag so the bottom-bar mute can silence everything
// temporarily while the toggle keeps its ON state (unmute restores the
// cocoon without touching the header). Defaults to ON.

export const COCOON_ENABLED_KEY = 'madeirabook_cocoon_enabled'

const listeners = new Set<() => void>()

export function readCocoonEnabled(): boolean {
  try {
    return localStorage.getItem(COCOON_ENABLED_KEY) !== '0'
  } catch {
    return true
  }
}

export function writeCocoonEnabled(value: boolean): void {
  try {
    if (value) localStorage.removeItem(COCOON_ENABLED_KEY)
    else localStorage.setItem(COCOON_ENABLED_KEY, '0')
  } catch {
    // private mode
  }
  for (const listener of listeners) listener()
}

export function subscribeCocoonEnabled(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function serverCocoonEnabled(): boolean {
  return true
}
