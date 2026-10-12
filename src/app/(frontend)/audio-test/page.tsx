'use client'

import React, { useState } from 'react'
import { useAudioEngine } from '@/audio/useAudioEngine'
import { ChannelName } from '@/audio/types'

const R2 = 'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev'

// R2 primary, local public/audio fallback (R2 bucket lacks CORS for now)
const AMBIENT_URL = [`${R2}/sounds/ocean-ambient.m4a`, '/audio/ambient-dawn.m4a']
const AMBIENT_ALT_URL = [`${R2}/gateways/catamaran.m4a`, '/audio/ambient-crickets.m4a']
const SLUICE_URL = [`${R2}/gateways/above-clouds.m4a`, '/audio/sluice-bird.m4a']
const VIDEO_URL = [`${R2}/gateways/dolphins.m4a`, '/audio/ambient-dawn.m4a']

const CHANNELS: ChannelName[] = ['globalAmbient', 'sluiceBuffer', 'videoAudio']

const btn =
  'rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-40'

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
    <div className="mx-auto max-w-2xl px-6 py-12 text-white">
      <h1 className="mb-2 text-3xl font-bold">AudioEngine Test</h1>
      <p className="mb-6 text-[13px] text-gray-400">
        context: {engine.state?.contextState ?? 'uninitialized'} · started:{' '}
        {String(engine.isStarted)}
      </p>

      {!engine.isStarted && (
        <button
          className={`${btn} mb-6 border-green-600 bg-green-800 text-base hover:bg-green-700`}
          onClick={run('start()', () => engine.start())}
        >
          ▶ Start Engine
        </button>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3">
        {CHANNELS.map((name) => {
          const ch = engine.state?.channels[name]
          return (
            <div
              key={name}
              className="rounded-md border border-gray-700 bg-gray-900 p-3"
              data-channel={name}
            >
              <div className="text-[11px] uppercase text-gray-400">{name}</div>
              <div className="font-mono text-2xl" data-volume>
                {(ch?.volume ?? 0).toFixed(2)}
              </div>
              <div className="break-all text-[11px] text-gray-500">
                {ch?.playing ? `playing: ${ch.url}` : 'idle'}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          className={btn}
          disabled={disabled}
          onClick={run('playAmbient(dawn, loop, 0.25)', () =>
            engine.playAmbient(AMBIENT_URL, { loop: true, volume: 0.25 }),
          )}
        >
          Play Ambient
        </button>
        <button
          className={btn}
          disabled={disabled}
          onClick={run('playSluice(2s)', () => engine.playSluice(SLUICE_URL, 2))}
        >
          Play Sluice
        </button>
        <button
          className={btn}
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
          className={btn}
          disabled={disabled}
          onClick={run(
            `crossfade(${ambientAlt ? 'crickets' : 'dawn'} -> ${ambientAlt ? 'dawn' : 'crickets'}, 1500ms)`,
            async () => {
              const from = ambientAlt ? AMBIENT_ALT_URL : AMBIENT_URL
              const to = ambientAlt ? AMBIENT_URL : AMBIENT_ALT_URL
              await engine.crossfade(from[0], to, 1500)
              setAmbientAlt(!ambientAlt)
            },
          )}
        >
          Crossfade Ambient
        </button>
        <button
          className={btn}
          disabled={disabled}
          onClick={run('duckToBackground(600ms)', () => engine.duckToBackground())}
        >
          Duck to background
        </button>
        <button
          className={btn}
          disabled={disabled}
          onClick={run('restoreFromBackground(800ms)', () =>
            engine.restoreFromBackground(),
          )}
        >
          Restore
        </button>
        <button
          className={`${btn} border-red-700 hover:bg-red-900`}
          disabled={disabled}
          onClick={run('stopAll()', () => {
            engine.stopAll()
            setVideoOn(false)
          })}
        >
          Stop All
        </button>
      </div>

      <h2 className="mb-2 text-base font-semibold">Event log</h2>
      <div className="h-56 overflow-y-auto rounded-md border border-gray-700 bg-black p-3 font-mono text-xs text-green-400">
        {log.length === 0 ? (
          <div className="text-gray-600">no events yet</div>
        ) : (
          log.map((entry, i) => <div key={i}>{entry}</div>)
        )}
      </div>
    </div>
  )
}
