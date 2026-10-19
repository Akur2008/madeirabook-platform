'use client'

import { useAutoplayVideo } from '@/components/useAutoplayVideo'

export default function HomepageHeroVideo({
  videoUrl,
  posterUrl,
}: {
  videoUrl: string
  posterUrl: string
}) {
  const { videoRef, needsTap, playNow } = useAutoplayVideo()

  return (
    <>
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label="Madeira ocean cliffs and waves"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {needsTap && (
        <button
          type="button"
          onClick={playNow}
          className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-[#0a1420]/80 px-6 py-2.5 text-sm text-white/90 backdrop-blur-md transition-colors hover:bg-white/10"
        >
          Tap to play
        </button>
      )}
    </>
  )
}
