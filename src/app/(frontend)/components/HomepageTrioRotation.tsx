'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { useAutoplayVideo } from '@/components/useAutoplayVideo'

export interface TrioVideo {
  category: string
  videoUrl: string
  posterUrl: string
  title?: string | null
}

const SERIF = { fontFamily: 'Playfair Display, Cormorant Garamond, serif' } as const

const R2 = 'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev'

// Fixed vertical order: top → bottom. Videos are frozen — no rotation.
const BLOCKS = [
  {
    category: 'mountains',
    heading: 'Mountains & Viewpoints',
    video: {
      category: 'mountains',
      videoUrl: `${R2}/homepage-video-mountains-3.mp4`,
      posterUrl: `${R2}/homepage-video-mountains-3-poster.jpg`,
      title: 'Mountains & Viewpoints',
    },
  },
  {
    category: 'forest',
    heading: 'Forest & Levadas',
    video: {
      category: 'forest',
      videoUrl: `${R2}/homepage-video-forest-3.mp4`,
      posterUrl: `${R2}/homepage-video-forest-3-poster.jpg`,
      title: 'Forest & Levadas',
    },
  },
  {
    category: 'ocean',
    heading: 'Ocean & Sunsets',
    video: {
      category: 'ocean',
      videoUrl: `${R2}/homepage-video-ocean-3.mp4`,
      posterUrl: `${R2}/homepage-video-ocean-3-poster.jpg`,
      title: 'Ocean & Sunsets',
    },
  },
] as const

function TrioBlock({
  video,
  heading,
  category,
}: {
  video: TrioVideo
  heading: string
  category: string
}) {
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
      <video
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/50" />
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <h3
          className="text-center text-3xl font-light tracking-wide text-white/95 drop-shadow-md md:text-5xl"
          style={SERIF}
        >
          {heading}
        </h3>
      </div>
      {needsTap && (
        <button
          type="button"
          onClick={playNow}
          className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/25 bg-[#0a1420]/80 px-5 py-2 text-xs text-white/90 backdrop-blur-md transition-colors hover:bg-white/10"
        >
          Tap to play
        </button>
      )}
      <Link
        href={`/collections/${category}`}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/25 bg-black/40 px-5 py-2 text-xs text-white/85 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
      >
        View all in gallery →
      </Link>
    </div>
  )
}

export default function HomepageTrioRotation() {
  return (
    <section aria-label="Madeira landscapes">
      {BLOCKS.map((b) => (
        <TrioBlock key={b.category} video={b.video} heading={b.heading} category={b.category} />
      ))}
    </section>
  )
}
