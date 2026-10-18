'use client'

import { useCallback, useState } from 'react'

import { useAutoplayVideo } from '@/components/useAutoplayVideo'

const VIDEO_URL =
  'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev/uploads/quinta-da-serra-v3-reel-with-audio.mp4'
const POSTER_URL =
  'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev/uploads/quinta-da-serra-v3-hero.jpg'

// Full-viewport reel section — plays muted, a bottom-right toggle unmutes the
// embedded mountain ambient track. Same gesture/needsTap pattern as the
// homepage HeroForestVideo (iOS blocks autoplay even muted in Low Power Mode).
export default function V3ReelVideo() {
  const { videoRef, needsTap, playNow } = useAutoplayVideo()
  const [soundOn, setSoundOn] = useState(false)

  const toggleSound = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    playNow()
    video.muted = soundOn
    setSoundOn(!soundOn)
  }, [playNow, soundOn, videoRef])

  return (
    <section
      aria-label="Quinta da Serra reel"
      className="relative flex h-dvh min-h-[560px] w-full items-end overflow-hidden bg-[#1a1a1a]"
    >
      <video
        ref={videoRef}
        poster={POSTER_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/70 via-[#1a1a1a]/20 to-[#1a1a1a]/10" />

      <div className="pointer-events-none relative mx-auto w-full max-w-5xl px-6 pb-16 md:pb-24">
        <p className="font-serif text-3xl font-medium italic leading-tight text-white md:text-5xl">
          A quiet retreat above the clouds.
        </p>
      </div>

      <button
        type="button"
        aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
        onClick={toggleSound}
        className="absolute bottom-6 right-6 z-20 flex h-12 cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/80"
      >
        <span className="text-[18px]">{soundOn ? '🔇' : '🔊'}</span>
        <span className="text-xs font-semibold uppercase tracking-widest">
          {soundOn ? 'Mute' : 'Enable sound'}
        </span>
      </button>

      {needsTap && (
        <button
          type="button"
          onClick={playNow}
          className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-[#0a1420]/80 px-6 py-2.5 text-sm text-white/90 backdrop-blur-md transition-colors hover:bg-white/10"
        >
          Tap to play
        </button>
      )}
    </section>
  )
}
