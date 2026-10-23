import type { AmbientLayer } from './types'

const R2 = 'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev'

// The default site ambience: a cicadas/ocean bed with birds and a quiet
// ocean swell on top — the same three-layer mix the Oasis hero plays
// through its own <audio> elements.
// `gain` is a weight inside the ambient channel: at the default master
// volume (0.25) the layers land at the hero mix of 0.20 / 0.10 / 0.05.
// Local files first — R2 has no CORS headers, so WebAudio decode can only
// use the remote URL as a fallback for <audio>-style playback contexts.
export const DEFAULT_AMBIENT_LAYERS: AmbientLayer[] = [
  {
    src: ['/audio/oasis-cicadas-ocean.m4a', `${R2}/sounds/oasis-cicadas-ocean.m4a`],
    gain: 0.8,
  },
  {
    src: ['/audio/oasis-birds.m4a', `${R2}/sounds/oasis-birds.wav`],
    gain: 0.4,
  },
  {
    src: ['/audio/ocean-ambient.m4a', `${R2}/sounds/ocean-ambient.m4a`],
    gain: 0.2,
  },
]

// Identity of the default scene: the ambient channel reports the first
// layer's resolved URL — whichever fallback won — so this is how "is the
// default scene playing?" is detected.
const DEFAULT_AMBIENT_URLS = new Set(
  (DEFAULT_AMBIENT_LAYERS[0].src as string[]).map((s) => s),
)

export function isDefaultAmbientUrl(url: string | null | undefined): boolean {
  return url != null && DEFAULT_AMBIENT_URLS.has(url)
}
