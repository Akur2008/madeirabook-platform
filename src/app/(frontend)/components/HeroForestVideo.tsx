'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAutoplayVideo } from '@/components/useAutoplayVideo'

const VIDEO_URL =
  'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev/homepage-hero-forest.mp4'
const POSTER_URL =
  'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev/homepage-hero-forest-poster.jpg'

export default function HeroForestVideo() {
  const { videoRef, needsTap, playNow } = useAutoplayVideo()
  const [soundOn, setSoundOn] = useState(false)
  const [heroVisible, setHeroVisible] = useState(true)

  const toggleSound = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    playNow()
    video.muted = soundOn
    setSoundOn(!soundOn)
  }, [playNow, soundOn, videoRef])

  // The toggle floats with the fixed button stack only while the hero is
  // actually on screen — it scrolls away when the video does.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.2 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [videoRef])

  return (
    <>
      <video
        ref={videoRef}
        src={VIDEO_URL}
        poster={POSTER_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label="Madeira mountain peaks in the clouds"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {heroVisible && (
        <button
          type="button"
          aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
          onClick={toggleSound}
          className="fixed bottom-56 right-6 z-20 flex h-12 cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/80"
        >
          <span className="text-[18px]">{soundOn ? '🔇' : '🔊'}</span>
          <span className="text-xs font-semibold uppercase tracking-widest">
            {soundOn ? 'Mute' : 'Enable sound'}
          </span>
        </button>
      )}
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
