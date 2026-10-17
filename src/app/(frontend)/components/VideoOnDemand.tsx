'use client'

import { useState } from 'react'

interface VideoOnDemandProps {
  videoUrl: string | null
  posterUrl: string | null
  alt: string
}

// Poster-first video: never autoplays. The poster fills the frame; a tap on
// the play button fades the poster out and mounts the <video> element.
export default function VideoOnDemand({
  videoUrl,
  posterUrl,
  alt,
}: VideoOnDemandProps) {
  const [started, setStarted] = useState(false)

  if (!videoUrl) {
    return posterUrl ? (
      // posterUrl may be a Wikimedia URL outside next/image remotePatterns
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={posterUrl}
        alt={alt}
        className="h-full w-full object-cover object-center"
      />
    ) : null
  }

  return (
    <div className="relative h-full w-full">
      {posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
            started ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        />
      )}
      {started ? (
        <video
          className="absolute inset-0 h-full w-full object-cover object-center"
          src={videoUrl}
          poster={posterUrl ?? undefined}
          autoPlay
          controls
          loop
          playsInline
        />
      ) : (
        <button
          type="button"
          onClick={() => setStarted(true)}
          aria-label={`Play video — ${alt}`}
          className="group absolute inset-0 flex cursor-pointer items-center justify-center"
        >
          <span className="flex flex-col items-center gap-3">
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/50 bg-black/45 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-black/60">
              <svg
                viewBox="0 0 24 24"
                width="30"
                height="30"
                fill="currentColor"
                aria-hidden="true"
                className="ml-1 text-white"
              >
                <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.5-6.86a1.03 1.03 0 0 0 0-1.76L9.56 4.26A1.03 1.03 0 0 0 8 5.14z" />
              </svg>
            </span>
            <span className="rounded-full bg-black/45 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm">
              Play video
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
