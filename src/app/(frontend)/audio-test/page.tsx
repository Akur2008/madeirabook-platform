'use client'

import React, { useState } from 'react'
import { useAudioEngine } from '@/audio/useAudioEngine'
import { ChannelName } from '@/audio/types'

const AMBIENT_URL = '/audio/ambient-dawn.m4a'
const AMBIENT_ALT_URL = '/audio/ambient-crickets.m4a'
const SLUICE_URL = '/audio/sluice-bird.m4a'
const VIDEO_URL = '/audio/ambient-dawn.m4a'

const CHANNELS: ChannelName[] = ['globalAmbient', 'sluiceBuffer', 'videoAudio']

const btnStyle: React.CSSProperties = {
  borderRadius: 6,
  border: '1px solid #4b5563',
  background: '#1f2937',
  color: '#fff',
  padding: '8px 16px',
  fontSize: 14,
  cursor: 'pointer',
}

const cardStyle: React.CSSProperties = {
  borderRadius: 6,
  border: '1px solid #374151',
  background: '#111827',
  padding: 12,
}

export default function AudioTestPage() {
  const engine = useAudioEngine()
  const [log, setLog] = useState<string[]>([])
  const [videoOn, setVideoOn] = useState(false)
  const [ambientAlt, setAmbientAlt] = useState(false)

  const addLog = (msg: string) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev].slice(0, 40))
  }

  const run = (label: string, fn: () => void | Promise<void>) => async () => {
    addLog(label)
    try {
      await fn()
    } catch (err) {
      addLog(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const disabled = !engine.isStarted

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px', color: '#fff' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>AudioEngine Test</h1>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>
        context: {engine.state?.contextState ?? 'uninitialized'} · started:{' '}
        {String(engine.isStarted)}
      </p>

      {!engine.isStarted && (
        <button
          style={{
            ...btnStyle,
            borderColor: '#16a34a',
            background: '#166534',
            fontSize: 16,
            marginBottom: 24,
          }}
          onClick={run('start()', () => engine.start())}
        >
          ▶ Start Engine
        </button>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {CHANNELS.map((name) => {
          const ch = engine.state?.channels[name]
          return (
            <div key={name} style={cardStyle} data-channel={name}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#9ca3af' }}>
                {name}
              </div>
              <div style={{ fontSize: 24, fontFamily: 'monospace' }} data-volume>
                {(ch?.volume ?? 0).toFixed(2)}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', wordBreak: 'break-all' }}>
                {ch?.playing ? `playing: ${ch.url}` : 'idle'}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        <button
          style={{ ...btnStyle, opacity: disabled ? 0.4 : 1 }}
          disabled={disabled}
          onClick={run('playAmbient(dawn, loop, 0.25)', () =>
            engine.playAmbient(AMBIENT_URL, { loop: true, volume: 0.25 }),
          )}
        >
          Play Ambient
        </button>
        <button
          style={{ ...btnStyle, opacity: disabled ? 0.4 : 1 }}
          disabled={disabled}
          onClick={run('playSluice(2s)', () => engine.playSluice(SLUICE_URL, 2))}
        >
          Play Sluice
        </button>
        <button
          style={{ ...btnStyle, opacity: disabled ? 0.4 : 1 }}
          disabled={disabled}
          onClick={run(videoOn ? 'stopVideo() + unduck' : 'playVideo() + duck', async () => {
            if (videoOn) {
              engine.stopVideo()
              setVideoOn(false)
            } else {
              await engine.playVideo(VIDEO_URL)
              setVideoOn(true)
            }
          })}
        >
          Toggle Video
        </button>
        <button
          style={{ ...btnStyle, opacity: disabled ? 0.4 : 1 }}
          disabled={disabled}
          onClick={run(
            `crossfade(${ambientAlt ? 'crickets' : 'dawn'} -> ${ambientAlt ? 'dawn' : 'crickets'}, 1500ms)`,
            async () => {
              const from = ambientAlt ? AMBIENT_ALT_URL : AMBIENT_URL
              const to = ambientAlt ? AMBIENT_URL : AMBIENT_ALT_URL
              await engine.crossfade(from, to, 1500)
              setAmbientAlt(!ambientAlt)
            },
          )}
        >
          Crossfade Ambient
        </button>
        <button
          style={{ ...btnStyle, borderColor: '#b91c1c', opacity: disabled ? 0.4 : 1 }}
          disabled={disabled}
          onClick={run('stopAll()', () => {
            engine.stopAll()
            setVideoOn(false)
          })}
        >
          Stop All
        </button>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Event log</h2>
      <div
        style={{
          height: 224,
          overflowY: 'auto',
          borderRadius: 6,
          border: '1px solid #374151',
          background: '#000',
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 12,
          color: '#4ade80',
        }}
      >
        {log.length === 0 ? (
          <div style={{ color: '#4b5563' }}>no events yet</div>
        ) : (
          log.map((entry, i) => <div key={i}>{entry}</div>)
        )}
      </div>
    </div>
  )
}
