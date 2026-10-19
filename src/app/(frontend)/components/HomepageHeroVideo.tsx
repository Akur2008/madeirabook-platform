'use client'

import { useAutoplayVideo } from '@/components/useAutoplayVideo'

const HERO_VIDEO_URL =
  'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev/homepage-video-ocean-1.mp4'
const HERO_POSTER_URL =
  'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev/homepage-video-ocean-1-poster.jpg'

export default function HomepageHeroVideo() {
  const { videoRef, needsTap, playNow } = useAutoplayVideo()

  return (
    <>
      <video
        ref={videoRef}
        src={HERO_VIDEO_URL}
        poster={HERO_POSTER_URL}
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
