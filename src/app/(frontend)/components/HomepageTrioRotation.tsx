'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { useAutoplayVideo } from '@/components/useAutoplayVideo'

export interface TrioVideo {
  category: string
  videoUrl: string
  posterUrl: string
  title?: string | null
}

const SERIF = { fontFamily: 'Playfair Display, Cormorant Garamond, serif' } as const

// Fixed vertical order: top → bottom.
const BLOCKS = [
  { category: 'mountains', heading: 'Mountains & Viewpoints' },
  { category: 'forest', heading: 'Forest & Levadas' },
  { category: 'ocean', heading: 'Ocean & Sunsets' },
] as const

type Picked = Record<(typeof BLOCKS)[number]['category'], TrioVideo | null>

function pickRandom(videos: TrioVideo[], category: string): TrioVideo | null {
  const pool = videos.filter((v) => v.category === category)
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

function TrioBlock({ video, heading }: { video: TrioVideo | null; heading: string }) {
  const { videoRef, needsTap, playNow } = useAutoplayVideo()
  const blockRef = useRef<HTMLDivElement>(null)

  // Same visibility contract as GatewayCard: the clip plays while the
  // block is on screen and pauses when it scrolls away — three decoders
  // running below the fold would burn battery for nothing.
  useEffect(() => {
    const block = blockRef.current
    const el = videoRef.current
    if (!block || !el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.2 },
    )
    observer.observe(block)
    return () => observer.disconnect()
  }, [videoRef, video])

  return (
    <div ref={blockRef} className="relative h-[45vh] w-full overflow-hidden md:h-[65vh]">
      {video && (
        <video
          key={video.videoUrl}
          ref={videoRef}
          src={video.videoUrl}
          poster={video.posterUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label={video.title ?? heading}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/50" />
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <h3
          className="text-center text-3xl font-light tracking-wide text-white/95 drop-shadow-md md:text-5xl"
          style={SERIF}
        >
          {heading}
        </h3>
      </div>
      {needsTap && video && (
        <button
          type="button"
          onClick={playNow}
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/25 bg-[#0a1420]/80 px-5 py-2 text-xs text-white/90 backdrop-blur-md transition-colors hover:bg-white/10"
        >
          Tap to play
        </button>
      )}
    </div>
  )
}

// Client-only render flag: SSR and the hydration pass return false, so
// no <video> is rendered server-side and the random pick below can never
// mismatch the hydrated DOM.
const emptySubscribe = () => () => {}
const onClient = () => true
const onServer = () => false

export default function HomepageTrioRotation({ videos }: { videos: TrioVideo[] }) {
  const mounted = useSyncExternalStore(emptySubscribe, onClient, onServer)

  // Random pick per category, computed once on mount — every page load
  // rotates the selection while block order stays fixed.
  const [picked] = useState<Picked>(() => ({
    mountains: pickRandom(videos, 'mountains'),
    forest: pickRandom(videos, 'forest'),
    ocean: pickRandom(videos, 'ocean'),
  }))

  return (
    <section aria-label="Madeira landscapes">
      {BLOCKS.map((b) => (
        <TrioBlock
          key={b.category}
          video={mounted ? picked[b.category] : null}
          heading={b.heading}
        />
      ))}
    </section>
  )
}
