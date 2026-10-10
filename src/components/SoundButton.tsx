'use client'

import React from 'react'
import { useAudioEngine } from '@/audio/useAudioEngine'

const styles = `
@keyframes soundButtonPulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55); }
  70% { box-shadow: 0 0 0 12px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
`

export default function SoundButton() {
  const { isStarted, start, stop } = useAudioEngine()

  return (
    <>
      <style>{styles}</style>
      <button
        type="button"
        aria-label={isStarted ? 'Mute sound' : 'Enable sound'}
        onClick={() => (isStarted ? void stop() : void start())}
        className="fixed bottom-[90px] right-5 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/60 text-[22px] backdrop-blur-sm transition-colors hover:bg-black/80"
        style={{
          animation: isStarted ? 'soundButtonPulse 2s infinite' : 'none',
        }}
      >
        <span
          className={
            isStarted
              ? 'opacity-100 drop-shadow-[0_0_6px_rgba(34,197,94,0.9)]'
              : 'opacity-50 grayscale'
          }
        >
          🔊
        </span>
      </button>
    </>
  )
}
