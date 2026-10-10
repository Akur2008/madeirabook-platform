'use client'

import React from 'react'
import { useAudioEngine } from '@/audio/useAudioEngine'

export default function SoundButton() {
  const { isStarted, start, stop } = useAudioEngine()

  return (
    <button
      type="button"
      aria-label={isStarted ? 'Mute sound' : 'Enable sound'}
      onClick={() => (isStarted ? void stop() : void start())}
      className={[
        'fixed z-50 flex h-12 w-12 items-center justify-center rounded-full',
        'border border-white/20 bg-black/60 text-2xl backdrop-blur-sm',
        'transition-colors duration-300 hover:bg-black/80',
        isStarted ? 'shadow-[0_0_16px_rgba(34,197,94,0.6)]' : '',
      ].join(' ')}
      style={{ bottom: '90px', right: '20px' }}
    >
      <span
        className={
          isStarted
            ? 'animate-pulse drop-shadow-[0_0_6px_rgba(34,197,94,0.9)]'
            : 'opacity-50 grayscale'
        }
      >
        🔊
      </span>
    </button>
  )
}
