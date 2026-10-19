'use client'

import { useEffect, useRef, useState } from 'react'

export interface GalleryVideo {
  id: string | number
  title: string
  videoUrl: string
  posterUrl: string
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

function VideoModal({ video, onClose }: { video: GalleryVideo; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const el = videoRef.current
    if (el) {
      el.play().catch(() => {
        el.muted = true
        void el.play().catch(() => {})
      })
    }
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/60 text-xl text-white/90 backdrop-blur-sm transition-colors hover:bg-white/10"
      >
        ✕
      </button>
      <div
        className="w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          poster={video.posterUrl}
          controls
          autoPlay
          playsInline
          className="max-h-[85vh] w-full rounded-lg"
        />
        <p className="mt-3 text-center text-sm text-white/60" style={SERIF}>
          {video.title}
        </p>
      </div>
    </div>
  )
}

export default function CollectionsGallery({ videos }: { videos: GalleryVideo[] }) {
  const [active, setActive] = useState<GalleryVideo | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v)}
            className="group relative block overflow-hidden rounded-2xl border border-white/10 text-left transition-colors hover:border-white/25"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.posterUrl}
                alt={v.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-black/50 pl-1 text-xl text-white backdrop-blur-sm transition-transform group-hover:scale-110">
                  ▶
                </span>
              </div>
            </div>
            <div className="p-4">
              <span className="block text-lg font-light text-white/95" style={SERIF}>
                {v.title}
              </span>
            </div>
          </button>
        ))}
      </div>
      {active && <VideoModal video={active} onClose={() => setActive(null)} />}
    </>
  )
}
