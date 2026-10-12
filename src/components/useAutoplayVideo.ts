'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const TAP_FALLBACK_DELAY_MS = 1500

// iOS (esp. Low Power Mode) blocks autoplay even for muted inline video.
// Retry play() on mount, on canplay, and when the tab becomes visible;
// if the video is still paused after the retry window, surface needsTap
// so the caller can offer a one-tap fallback that runs inside a gesture.
export function useAutoplayVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [needsTap, setNeedsTap] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const tryPlay = () => {
      if (video.paused) void video.play().catch(() => {})
    }

    tryPlay()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') tryPlay()
    }
    const onPlaying = () => setNeedsTap(false)

    video.addEventListener('canplay', tryPlay)
    video.addEventListener('playing', onPlaying)
    document.addEventListener('visibilitychange', onVisibility)

    const fallbackTimer = setTimeout(() => {
      if (video.paused) setNeedsTap(true)
    }, TAP_FALLBACK_DELAY_MS)

    return () => {
      video.removeEventListener('canplay', tryPlay)
      video.removeEventListener('playing', onPlaying)
      document.removeEventListener('visibilitychange', onVisibility)
      clearTimeout(fallbackTimer)
    }
  }, [])

  const playNow = useCallback(() => {
    const video = videoRef.current
    if (video) void video.play().catch(() => {})
  }, [])

  return { videoRef, needsTap, playNow }
}
