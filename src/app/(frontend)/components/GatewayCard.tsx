'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef } from 'react'

import type { SluicePage } from '@/payload-types'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export const AUTOPLAY_SOUND_KEY = 'mb_autoplay_sound'

export default function GatewayCard({ page }: { page: SluicePage }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoUrl = page.videoUrl ?? null

  // Lazy-load: the video source is attached only when the card approaches
  // the viewport; playback runs while the card is visible and pauses when
  // it leaves (mobile vertical scroll).
  useEffect(() => {
    const card = cardRef.current
    const video = videoRef.current
    if (!card || !video || !videoUrl) return

    video.muted = true
    let visible = false

    const tryPlay = () => {
      if (visible && video.src) void video.play().catch(() => {})
    }

    const loadObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          if (!video.src) {
            video.src = videoUrl
            video.load()
          }
          tryPlay()
          loadObserver.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )

    const playObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible = entry.isIntersecting
          if (visible) tryPlay()
          else video.pause()
        }
      },
      { threshold: 0.2 },
    )

    loadObserver.observe(card)
    playObserver.observe(card)
    return () => {
      loadObserver.disconnect()
      playObserver.disconnect()
    }
  }, [videoUrl])

  // Sound follows the cursor on hover-capable devices. If the browser
  // refuses audible playback without a gesture, fall back to muted.
  const handleMouseEnter = () => {
    const video = videoRef.current
    if (!video || !videoUrl) return
    video.muted = false
    void video.play().catch(() => {
      video.muted = true
      void video.play().catch(() => {})
    })
  }

  const handleMouseLeave = () => {
    const video = videoRef.current
    if (video) video.muted = true
  }

  return (
    <Link
      ref={cardRef}
      href={`/gateway/${page.slug}`}
      onClick={() => {
        try {
          sessionStorage.setItem(AUTOPLAY_SOUND_KEY, '1')
        } catch {
          // storage unavailable
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative block h-[45vh] overflow-hidden rounded-2xl border border-white/10 md:h-[60vh]"
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={page.posterUrl ?? undefined}
          muted
          loop
          playsInline
          preload="none"
          controls={false}
        />
      ) : (
        page.posterUrl && (
          <Image
            src={page.posterUrl}
            alt={page.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )
      )}

      {/* Mini bottom-sheet: same glass panel language as EscapeCardSheet */}
      <div
        className="absolute inset-x-3 bottom-3 rounded-xl border border-white/15 p-4 pt-3 backdrop-blur-xl"
        style={{ background: 'rgba(10, 20, 32, 0.72)' }}
      >
        <div className="mx-auto mb-3 h-0.5 w-8 rounded-full bg-white/20" />
        <h3 className="text-xl font-light leading-tight text-white/95" style={SERIF}>
          {page.title}
        </h3>
        {page.shortDescription && (
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-white/60">
            {page.shortDescription}
          </p>
        )}
        <span className="mt-4 block w-full rounded-full bg-white py-2.5 text-center text-xs font-semibold uppercase tracking-widest text-[#0a1420] transition-colors group-hover:bg-white/85">
          Enter this path →
        </span>
      </div>
    </Link>
  )
}
