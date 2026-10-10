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
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          zIndex: 50,
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          fontSize: '22px',
          cursor: 'pointer',
          animation: isStarted ? 'soundButtonPulse 2s infinite' : 'none',
        }}
      >
        <span
          style={{
            filter: isStarted
              ? 'drop-shadow(0 0 6px rgba(34,197,94,0.9))'
              : 'grayscale(1)',
            opacity: isStarted ? 1 : 0.5,
          }}
        >
          🔊
        </span>
      </button>
    </>
  )
}
