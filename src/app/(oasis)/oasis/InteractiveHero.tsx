'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { CSSProperties } from 'react'

import {
  readSoundMuted,
  serverSoundMuted,
  subscribeSoundMuted,
} from '@/audio/soundMuted'
import type { OasisHotelPin } from '../../(frontend)/components/OasisMap'
import MapModal from './MapModal'
import VideoBottomSheet from './VideoBottomSheet'

const R2 = 'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev'

// Two-layer ambience: cicadas/ocean bed + birds on top. Plain <audio>
// elements — the hero owns the soundtrack on this page; the global
// AudioEngine stays silent here (see ambientPolicy) and the shared
// muted flag keeps the layout's sound button in control.
const CICADAS_URL = `${R2}/sounds/oasis-cicadas-ocean.m4a`
const BIRDS_URL = `${R2}/sounds/oasis-birds.wav`
const CICADAS_VOLUME = 0.2
const BIRDS_VOLUME = 0.1
const DUCKED_VOLUME = 0.05
const FADE_MS = 600

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
  // and the client snapshot hydrates without a mismatch. Shared with the
  // layout's SoundButton.
  const soundMuted = useSyncExternalStore(
    subscribeSoundMuted,
    readSoundMuted,
    serverSoundMuted,
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
    const cicadas = cicadasRef.current
    const birds = birdsRef.current
    if (!cicadas || !birds) return
    // Only mark as started once playback actually begins — a play() call
    // without a prior user gesture rejects, and the listeners below must
    // stay armed.
    Promise.all([cicadas.play(), birds.play()])
      .then(() => {
        startedRef.current = true
      })
      .catch(() => undefined)
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

  // Try to (re)start on mount and whenever the flag flips to unmuted —
  // succeeds when a gesture already happened (e.g. navigating back from
  // another page, or tapping the layout's sound button); otherwise the
  // gesture listeners below do the job.
  useEffect(() => {
    if (!soundMuted && !startedRef.current) startTracks()
  }, [soundMuted, startTracks])

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

      {/* Ambient layers — looped; started on the first pointer/scroll
          gesture. The global floating buttons (WhatsApp / AI / sound) live
          in the (oasis) layout and drive these tracks via the shared
          muted flag. */}
      <audio ref={cicadasRef} src={CICADAS_URL} loop muted={soundMuted} preload="auto" />
      <audio ref={birdsRef} src={BIRDS_URL} loop muted={soundMuted} preload="auto" />
    </section>
  )
}
