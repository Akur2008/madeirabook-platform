'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { CSSProperties } from 'react'

import AiConciergeWidget, {
  ASK_CONCIERGE_EVENT,
} from '@/components/AiConciergeWidget'
import type { OasisHotelPin } from '../../(frontend)/components/OasisMap'
import MapModal from './MapModal'
import VideoBottomSheet from './VideoBottomSheet'

const R2 = 'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev'

// Two-layer ambience: cicadas/ocean bed + birds on top. Plain <audio>
// elements (not the shared AudioEngine — the oasis group has no provider).
const CICADAS_URL = `${R2}/sounds/oasis-cicadas-ocean.m4a`
const BIRDS_URL = `${R2}/sounds/oasis-birds.wav`
const CICADAS_VOLUME = 0.2
const BIRDS_VOLUME = 0.1
const DUCKED_VOLUME = 0.05
const FADE_MS = 600
const OASIS_MUTED_KEY = 'oasis_sound_muted'
const WHATSAPP_URL = 'https://wa.me/351919304028'

function readOasisMuted(): boolean {
  try {
    return localStorage.getItem(OASIS_MUTED_KEY) === '1'
  } catch {
    return false
  }
}

const mutedListeners = new Set<() => void>()

function subscribeMuted(listener: () => void): () => void {
  mutedListeners.add(listener)
  return () => mutedListeners.delete(listener)
}

function serverMuted(): boolean {
  return false
}

function writeOasisMuted(value: boolean): void {
  try {
    if (value) localStorage.setItem(OASIS_MUTED_KEY, '1')
    else localStorage.removeItem(OASIS_MUTED_KEY)
  } catch {
    // private mode
  }
  for (const listener of mutedListeners) listener()
}

export interface HeroVideoSpot {
  id: string
  title: string
  videoUrl: string // vertical 9:16 mp4
  hotelSlug: string
  thumbnailUrl: string
  description: string
  // Position on the hero stage in % — m: mobile, d: desktop.
  // Tuned to the artwork in /images/oasis-hero-bg.jpg; adjust with the final image.
  x: { m: string; d: string }
  y: { m: string; d: string }
  size?: { m: string; d: string }
}

// MVP: static config. The circles mirror the video bubbles baked into the
// hero artwork; videoUrl placeholders get replaced by real 9:16 reels.
const HERO_VIDEOS: HeroVideoSpot[] = [
  {
    id: 'quinta-da-serra',
    title: 'Quinta da Serra',
    videoUrl: `${R2}/uploads/quinta-da-serra-v3-reel-with-audio.mp4`,
    hotelSlug: 'quinta-da-serra',
    thumbnailUrl: `${R2}/uploads/quinta-da-serra-hero.jpg`,
    description: 'A bio-luxury sanctuary above the clouds of Câmara de Lobos.',
    x: { m: '17%', d: '16%' },
    y: { m: '32%', d: '36%' },
  },
  {
    id: 'savoy-palace',
    title: 'Savoy Palace',
    videoUrl: '/videos/reference-33s.mp4',
    hotelSlug: 'savoy-palace',
    thumbnailUrl: `${R2}/uploads/savoy-palace-photo-2.jpg`,
    description: 'Funchal’s grand dame — rooftop pool over the harbour.',
    x: { m: '82%', d: '72%' },
    y: { m: '30%', d: '30%' },
  },
  {
    id: 'reids-palace',
    title: "Reid's Palace",
    videoUrl: '/videos/hd-dolby-42s.mp4',
    hotelSlug: 'reids-palace-belmond',
    thumbnailUrl: `${R2}/uploads/reids-palace-belmond-exterior-1.jpg`,
    description: 'A Belmond legend on its own cliff above the Atlantic.',
    x: { m: '14%', d: '28%' },
    y: { m: '54%', d: '68%' },
  },
  {
    id: 'cliff-bay',
    title: 'The Cliff Bay',
    videoUrl: `${R2}/homepage-video-ocean-1.mp4`,
    hotelSlug: 'the-cliff-bay',
    thumbnailUrl: `${R2}/uploads/the-cliff-bay-view-1.jpg`,
    description: 'PortoBay’s clifftop classic with the island’s calmest pool.',
    x: { m: '88%', d: '84%' },
    y: { m: '53%', d: '58%' },
  },
  {
    id: 'ponta-do-sol',
    title: 'Ponta do Sol',
    videoUrl: '/videos/reference-33s.mp4',
    hotelSlug: 'estalagem-da-ponta-do-sol',
    thumbnailUrl: `${R2}/uploads/estalagem-da-ponta-do-sol-exterior-1.jpg`,
    description: 'Design hotel on the sunniest point of the island.',
    x: { m: '21%', d: '38%' },
    y: { m: '80%', d: '82%' },
  },
  {
    id: 'saccharum',
    title: 'Saccharum',
    videoUrl: '/videos/hd-dolby-42s.mp4',
    hotelSlug: 'saccharum-resort',
    thumbnailUrl: `${R2}/uploads/saccharum-resort-photo-2.jpg`,
    description: 'A sugar-cane estate turned resort in Calheta’s marina.',
    x: { m: '73%', d: '64%' },
    y: { m: '78%', d: '80%' },
  },
]

// The whiskey/cigar tray in the artwork centre and the map bubble in the
// bottom-right corner — both open the map modal.
const TRAY_POS = { x: { m: '50%', d: '50%' }, y: { m: '62%', d: '60%' } }
const MAP_POS = { x: { m: '86%', d: '91%' }, y: { m: '88%', d: '85%' } }

const anchorVars = (p: {
  x: { m: string; d: string }
  y: { m: string; d: string }
  size?: { m: string; d: string }
}): CSSProperties =>
  ({
    '--x-m': p.x.m,
    '--y-m': p.y.m,
    '--x-d': p.x.d,
    '--y-d': p.y.d,
    ...(p.size ? { '--s-m': p.size.m, '--s-d': p.size.d } : {}),
  }) as CSSProperties

const PlayIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
  >
    <circle cx="12" cy="12" r="11" fill="rgba(13,10,7,0.45)" stroke="#d4af37" />
    <path d="M9.5 7.5v9l8-4.5-8-4.5z" fill="#d4af37" />
  </svg>
)

const MapIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#d4af37"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M9 4 3.5 6.2v13L9 17l6 2.2 5.5-2.2v-13L15 6.5 9 4z" />
    <path d="M9 4v13M15 6.5v12.7" />
  </svg>
)

interface InteractiveHeroProps {
  hotels: OasisHotelPin[]
  initialLat?: number
  initialLng?: number
  initialZoom?: number
}

export default function InteractiveHero({
  hotels,
  initialLat,
  initialLng,
  initialZoom,
}: InteractiveHeroProps) {
  const [mapOpen, setMapOpen] = useState(false)
  const [activeVideo, setActiveVideo] = useState<HeroVideoSpot | null>(null)
  // The artwork is dropped in by the owner; hide the <img> if it 404s so the
  // dark gradient scene underneath still reads as a finished hero.
  const [bgMissing, setBgMissing] = useState(false)
  // Persisted mute flag — external store so SSR always renders "unmuted"
  // and the client snapshot hydrates without a mismatch.
  const soundMuted = useSyncExternalStore(
    subscribeMuted,
    readOasisMuted,
    serverMuted,
  )

  const cicadasRef = useRef<HTMLAudioElement>(null)
  const birdsRef = useRef<HTMLAudioElement>(null)
  const startedRef = useRef(false)
  const fadeRafsRef = useRef(new Map<HTMLAudioElement, number>())

  const fadeTo = useCallback((el: HTMLAudioElement, to: number) => {
    const rafs = fadeRafsRef.current
    const prev = rafs.get(el)
    if (prev != null) cancelAnimationFrame(prev)
    const from = el.volume
    if (from === to) return
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / FADE_MS)
      el.volume = from + (to - from) * t
      if (t < 1) rafs.set(el, requestAnimationFrame(step))
      else rafs.delete(el)
    }
    rafs.set(el, requestAnimationFrame(step))
  }, [])

  const startTracks = useCallback(() => {
    startedRef.current = true
    void cicadasRef.current?.play().catch(() => undefined)
    void birdsRef.current?.play().catch(() => undefined)
  }, [])

  // Base volumes — JSX `volume` is not a mapped prop, so set it directly.
  useEffect(() => {
    if (cicadasRef.current) cicadasRef.current.volume = CICADAS_VOLUME
    if (birdsRef.current) birdsRef.current.volume = BIRDS_VOLUME
    const rafs = fadeRafsRef.current
    return () => {
      for (const id of rafs.values()) cancelAnimationFrame(id)
      rafs.clear()
    }
  }, [])

  // Autostart on the first gesture. A stored mute disarms autostart —
  // the visitor's silence survives reloads.
  useEffect(() => {
    if (soundMuted || startedRef.current) return
    window.addEventListener('pointerdown', startTracks)
    window.addEventListener('scroll', startTracks, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', startTracks)
      window.removeEventListener('scroll', startTracks)
    }
  }, [soundMuted, startTracks])

  // Duck both layers while a video sheet is open; restore on close.
  useEffect(() => {
    const ducked = activeVideo != null
    const cicadas = cicadasRef.current
    const birds = birdsRef.current
    if (!cicadas || !birds) return
    fadeTo(cicadas, ducked ? DUCKED_VOLUME : CICADAS_VOLUME)
    fadeTo(birds, ducked ? DUCKED_VOLUME : BIRDS_VOLUME)
  }, [activeVideo, fadeTo])

  const toggleSound = useCallback(() => {
    const next = !soundMuted
    writeOasisMuted(next)
    // Unmuting counts as a user gesture — start (or resume) playback now.
    if (!next) startTracks()
  }, [soundMuted, startTracks])

  const openConcierge = useCallback(() => {
    window.dispatchEvent(new CustomEvent(ASK_CONCIERGE_EVENT))
  }, [])

  return (
    <section className="relative h-full w-full overflow-hidden bg-[#171310]">
      {!bgMissing && (
        // Local file supplied by the owner — plain <img> on purpose.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/oasis-hero-bg.jpg"
          alt=""
          aria-hidden
          onError={() => setBgMissing(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Hides the heading baked into the artwork; grounds the fixed header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-[#0d0a07] via-[#0d0a07]/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-[#0d0a07]/85 via-[#0d0a07]/30 to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 top-0 px-6 pt-24 text-center md:pt-28">
        <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#d4af37]">
          A private collection
        </p>
        <h1
          className="font-serif mt-3 text-4xl leading-tight text-[#d4af37] md:text-6xl"
          style={{ textShadow: '0 2px 26px rgba(0,0,0,0.6)' }}
        >
          Madeira Oasis
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#f5efe3]/75">
          Fifteen rare addresses across the island — booked through one
          concierge.
        </p>
      </div>

      {HERO_VIDEOS.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => setActiveVideo(v)}
          aria-label={`Play video — ${v.title}`}
          className="oasis-anchored oasis-spot group rounded-full"
          style={anchorVars(v)}
        >
          <span
            aria-hidden
            className="oasis-pulse absolute inset-0 rounded-full border border-[#d4af37]/70"
          />
          <span className="absolute inset-0 overflow-hidden rounded-full border-2 border-[#d4af37]/80 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105">
            {/* Hotel thumbnails come from R2 — arbitrary host, plain <img> */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/25 transition-colors duration-300 group-hover:bg-black/10">
            <PlayIcon />
          </span>
          <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.16em] text-[#f5efe3]/85 [text-shadow:0_1px_6px_rgba(0,0,0,0.8)] md:mt-2 md:text-[10px]">
            {v.title}
          </span>
        </button>
      ))}

      {/* 3D tray — the centrepiece of the artwork, acts as the map button */}
      <div className="oasis-anchored oasis-tray-stage" style={anchorVars(TRAY_POS)}>
        <button
          type="button"
          onClick={() => setMapOpen(true)}
          aria-label="Open the hotel map"
          className="oasis-tray block w-[min(54vw,300px)] rounded-2xl border border-[#d4af37]/60 bg-[#14100c]/55 px-6 py-4 text-center backdrop-blur-sm"
        >
          <span className="font-serif block text-lg leading-tight text-[#f5efe3] md:text-xl">
            The Collection
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
            Explore the map
          </span>
        </button>
      </div>

      {/* Map bubble — bottom right of the artwork */}
      <button
        type="button"
        onClick={() => setMapOpen(true)}
        aria-label="Open the map"
        className="oasis-anchored oasis-spot group rounded-full"
        style={anchorVars({
          ...MAP_POS,
          size: { m: '56px', d: '72px' },
        })}
      >
        <span
          aria-hidden
          className="oasis-pulse absolute inset-0 rounded-full border border-[#d4af37]/70"
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-[#d4af37]/80 bg-[#14100c]/70 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
          <MapIcon />
        </span>
        <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.16em] text-[#f5efe3]/85 [text-shadow:0_1px_6px_rgba(0,0,0,0.8)] md:mt-2 md:text-[10px]">
          Map
        </span>
      </button>

      <VideoBottomSheet spot={activeVideo} onClose={() => setActiveVideo(null)} />
      <MapModal
        open={mapOpen}
        onOpenChange={setMapOpen}
        hotels={hotels}
        initialLat={initialLat}
        initialLng={initialLng}
        initialZoom={initialZoom}
      />

      {/* Ambient layers — looped; started on the first pointer/scroll gesture */}
      <audio ref={cicadasRef} src={CICADAS_URL} loop muted={soundMuted} preload="auto" />
      <audio ref={birdsRef} src={BIRDS_URL} loop muted={soundMuted} preload="auto" />

      {/* Floating actions — stacked above the artwork's map bubble so both
          stay reachable (map bubble center ~85–88% down the right edge) */}
      <div className="fixed bottom-[24%] right-4 z-[1200] flex flex-col items-center gap-3 md:right-6">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#14100c]/75 text-[#25d366] shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-transform hover:scale-105"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
        </a>
        <button
          type="button"
          onClick={openConcierge}
          aria-label="Ask the AI concierge"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#14100c]/75 text-[#d4af37] shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-transform hover:scale-105"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleSound}
          aria-label={soundMuted ? 'Unmute ambience' : 'Mute ambience'}
          aria-pressed={soundMuted}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#14100c]/75 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-transform hover:scale-105"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="#d4af37"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={soundMuted ? 'opacity-40' : 'opacity-100'}
          >
            <path d="M11 5 6.5 9H3v6h3.5L11 19V5z" fill="#d4af37" stroke="none" />
            {soundMuted ? (
              <path d="m16 9 5 6m0-6-5 6" />
            ) : (
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" />
            )}
          </svg>
        </button>
      </div>

      {/* The concierge panel mounts here without its own launcher — the gold
          button above opens it via ASK_CONCIERGE_EVENT. */}
      <AiConciergeWidget hideLauncherButton />
    </section>
  )
}
