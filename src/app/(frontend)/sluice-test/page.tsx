'use client'

import { useEffect, useRef, useState } from 'react'
import { useAudioEngine } from '@/audio/useAudioEngine'

const TIMING = {
  INTRO_MS: 24000,
  VIDEO_MS: 33000,
  BREATH_PROMPT_MS: 9000,
  IMMERSION_MS: 42000,
  DONE_CARD_AT_MS: 5000,
}

const BREATH_TICK_MS = 1400

const AUDIO = {
  WHALES: '/audio/whales.m4a',
  VIDEO_MADEIRA_AUDIO: '/audio/reference-33s.m4a',
  VIDEO_IMMERSION_AUDIO: '/audio/hd-dolby-42s.m4a',
}

const VIDEO = {
  MADEIRA: '/videos/reference-33s.mp4',
  IMMERSION: '/videos/hd-dolby-42s.mp4',
}

const VOLUME = {
  WHALES_INTRO_START: 0.22,
  WHALES_INTRO_END: 0.32,
  WHALES_BREATH: 0.35,
  WHALES_IMMERSION: 0.12,
  WHALES_DONE: 0.25,
  VIDEO_MADEIRA_FULL: 0.7,
  VIDEO_IMMERSION_FULL: 0.75,
}

const BREATH_STEPS = [
  { label: 'Breathe in', seconds: 5 },
  { label: 'Hold', seconds: 5 },
  { label: 'Breathe out', seconds: 8 },
  { label: 'Rest', seconds: 3 },
] as const

type Phase =
  | 'idle'
  | 'intro'
  | 'video'
  | 'breath-prompt'
  | 'breath-first'
  | 'immersion'
  | 'done'
type IntroMode = 'quiz' | 'statement'

const PROGRESS_KEY = 'madeirabook_sluice_progress'
const PROGRESS_TTL_MS = 60 * 60 * 1000
const RESTORABLE_PHASES: readonly Phase[] = ['intro', 'video']

function readStoredPhase(): Phase | null {
  try {
    const raw = sessionStorage.getItem(PROGRESS_KEY)
    if (!raw) return null
    const { phase, timestamp } = JSON.parse(raw) as {
      phase?: Phase
      timestamp?: number
    }
    if (typeof timestamp !== 'number') return null
    if (Date.now() - timestamp > PROGRESS_TTL_MS) return null
    if (!phase || !RESTORABLE_PHASES.includes(phase)) return null
    return phase
  } catch {
    return null
  }
}

export default function SluiceTest() {
  const engine = useAudioEngine()
  const [phase, setPhase] = useState<Phase>('idle')
  const [introMode, setIntroMode] = useState<IntroMode>('statement')
  const [breathStep, setBreathStep] = useState(0)
  const [breathSecond, setBreathSecond] = useState(1)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const breathStepRef = useRef(0)
  const cycleCountRef = useRef(0)

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t as any))
    timersRef.current = []
  }

  const startBreathLoop = (onFirstCycleComplete?: () => void) => {
    if (breathIntervalRef.current) return
    breathStepRef.current = 0
    cycleCountRef.current = 0
    let secondInStep = 1
    setBreathStep(0)
    setBreathSecond(1)

    breathIntervalRef.current = setInterval(() => {
      secondInStep++
      const currentStep = BREATH_STEPS[breathStepRef.current]

      if (secondInStep > currentStep.seconds) {
        const nextStep = (breathStepRef.current + 1) % BREATH_STEPS.length
        if (nextStep === 0) {
          cycleCountRef.current++
          if (cycleCountRef.current === 1 && onFirstCycleComplete) {
            onFirstCycleComplete()
          }
        }
        breathStepRef.current = nextStep
        setBreathStep(nextStep)
        secondInStep = 1
      }
      setBreathSecond(secondInStep)
    }, BREATH_TICK_MS)
  }

  const stopBreathLoop = () => {
    if (breathIntervalRef.current) {
      clearInterval(breathIntervalRef.current)
      breathIntervalRef.current = null
    }
  }

  const handleStart = async () => {
    await engine.start()
    engine.playAmbient(AUDIO.WHALES, { loop: true, volume: VOLUME.WHALES_INTRO_START })
    setPhase('intro')
  }


  useEffect(() => {
    if (phase === 'idle') return
    clearTimers()

    if (phase === 'intro') {
      timersRef.current.push(
        setTimeout(() => engine.setVolume('globalAmbient', VOLUME.WHALES_INTRO_END), 12000),
      )
      timersRef.current.push(setTimeout(() => setPhase('video'), TIMING.INTRO_MS))
    }

    if (phase === 'video') {
      engine.setVolume('videoAudio', 0)
      engine.playVideo(AUDIO.VIDEO_MADEIRA_AUDIO, { loop: false })
      const steps = 50
      for (let i = 1; i <= steps; i++) {
        timersRef.current.push(
          setTimeout(() => {
            engine.setVolume('videoAudio', (i / steps) * VOLUME.VIDEO_MADEIRA_FULL)
          }, i * 100),
        )
      }
      timersRef.current.push(setTimeout(() => setPhase('breath-prompt'), TIMING.VIDEO_MS))
    }

    if (phase === 'breath-prompt') {
      const steps = 10
      for (let i = 1; i <= steps; i++) {
        timersRef.current.push(
          setTimeout(
            () => engine.setVolume('videoAudio', VOLUME.VIDEO_MADEIRA_FULL * (1 - i / steps)),
            i * 80,
          ),
        )
      }
      timersRef.current.push(
        setTimeout(() => {
          engine.stopVideo()
          engine.unduck(VOLUME.WHALES_BREATH, 1200)
        }, 800),
      )
      timersRef.current.push(setTimeout(() => setPhase('breath-first'), TIMING.BREATH_PROMPT_MS))
    }

    if (phase === 'breath-first') {
      startBreathLoop(() => {
        setPhase('immersion')
      })
    }

    if (phase === 'immersion') {
      engine.setVolume('videoAudio', VOLUME.VIDEO_IMMERSION_FULL)
      engine.playVideo(AUDIO.VIDEO_IMMERSION_AUDIO, { loop: false })
      timersRef.current.push(setTimeout(() => engine.duck(VOLUME.WHALES_IMMERSION, 800), 500))
      timersRef.current.push(setTimeout(() => setPhase('done'), TIMING.IMMERSION_MS))
    }

    if (phase === 'done') {
      // Останавливаем видео, возвращаем китов, показываем однотонный экран
      engine.stopVideo()
      engine.unduck(VOLUME.WHALES_DONE, 1200)
    }

    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    return () => {
      stopBreathLoop()
      clearTimers()
    }
  }, [])

  // Restore an in-progress phase on mount (intro/video only, < 60 min old).
  // AudioContext still needs a user gesture, so audio resumes on first tap.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = readStoredPhase()
    if (!stored) return
    const t = setTimeout(() => setPhase(stored), 0)
    const resumeAudio = () => {
      engine.start()
      if (stored === 'intro') {
        engine.playAmbient(AUDIO.WHALES, {
          loop: true,
          volume: VOLUME.WHALES_INTRO_START,
        })
      }
    }
    window.addEventListener('pointerdown', resumeAudio, { once: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', resumeAudio)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist the current phase so a reloaded tab can resume
  useEffect(() => {
    try {
      sessionStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({ phase, timestamp: Date.now() }),
      )
    } catch {
      // storage unavailable
    }
  }, [phase])

  const showBreathFullScreen = phase === 'breath-first'
  const showBreathOverlay = phase === 'immersion' || phase === 'done'

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden bg-[#0a1420]">
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translate(-50%, 80px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeInSoft {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <VideoPreloader />

      {phase === 'idle' && <StartScreen onStart={handleStart} />}

      {phase === 'intro' && (
        <IntroScreen
          mode={introMode}
          onModeToggle={() => setIntroMode(m => (m === 'quiz' ? 'statement' : 'quiz'))}
        />
      )}

      {phase === 'video' && <VideoLayer src={VIDEO.MADEIRA} objectFit="cover" />}

      {phase === 'breath-prompt' && <BreathPromptScreen />}

      {showBreathFullScreen && <BreathScreen step={breathStep} second={breathSecond} />}

      {phase === 'immersion' && (
        <VideoLayer src={VIDEO.IMMERSION} objectFit="contain" letterbox />
      )}

      {phase === 'done' && (
        <div
          className="absolute inset-0 bg-[#0a1420] flex flex-col items-center justify-center text-center px-6"
          style={{ animation: 'fadeInSoft 1500ms ease-out forwards' }}
        >
          <p
            className="text-white/80 text-xl md:text-2xl"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            The escape is waiting.
          </p>
        </div>
      )}

      {showBreathOverlay && <BreathOverlay step={breathStep} second={breathSecond} />}

      {phase === 'done' && (
        <EscapeCard onBook={() => alert('BottomSheet will open here')} />
      )}

    </main>
  )
}

// ─────────────────────────────────────────────────────────────

function VideoPreloader() {
  return (
    <div
      aria-hidden
      className="fixed w-px h-px opacity-0 pointer-events-none overflow-hidden"
    >
      {Object.values(VIDEO).map(src => (
        <video key={src} src={src} preload="auto" muted playsInline />
      ))}
    </div>
  )
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
      <div
        className="w-32 h-32 rounded-full bg-white/5 animate-pulse"
        style={{ animationDuration: '4s' }}
      />
      <button
        onClick={onStart}
        className="mt-16 px-10 py-3 rounded-full border border-white/40 text-white/90 text-sm tracking-widest uppercase hover:bg-white/10 transition-colors"
      >
        Tap to begin
      </button>
      <p className="mt-6 text-xs text-white/40">Enable sound for full experience</p>
    </div>
  )
}

function IntroScreen({
  mode,
  onModeToggle,
}: {
  mode: IntroMode
  onModeToggle: () => void
}) {
  const [statementLine, setStatementLine] = useState(0)
  const statementLines = [
    'The city is loud.',
    'Your mind is louder.',
    'Madeira remembers how to be quiet.',
    'Give us two minutes.',
  ]

  useEffect(() => {
    if (mode !== 'statement') return
    if (statementLine >= statementLines.length - 1) return
    const t = setTimeout(() => setStatementLine(s => s + 1), 6000)
    return () => clearTimeout(t)
  }, [statementLine, mode])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      {mode === 'statement' ? (
        <TypewriterLine key={statementLine} line={statementLines[statementLine]} />
      ) : (
        <QuizFlow />
      )}

      <button
        onClick={onModeToggle}
        className="absolute bottom-6 right-6 text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        switch mode
      </button>
    </div>
  )
}

function TypewriterLine({ line }: { line: string }) {
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    let i = 0
    const typeInterval = setInterval(() => {
      i++
      setCharCount(Math.min(i, line.length))
      if (i >= line.length) clearInterval(typeInterval)
    }, 50)
    return () => clearInterval(typeInterval)
  }, [line])

  return (
    <p
      className="text-xl md:text-3xl font-light text-white/90"
      style={{ fontFamily: 'Cormorant Garamond, serif' }}
    >
      {line.slice(0, charCount)}
      {charCount < line.length && <span className="animate-pulse">|</span>}
    </p>
  )
}

function QuizFlow() {
  const [step, setStep] = useState(0)
  const screens = [
    { q: 'What does your body ask for right now?', a: ['Reset the noise', 'Find the height', 'Slow down'] },
    { q: 'How much time do you have?', a: ['1 minute', '3 minutes'] },
    { q: 'Sound on?', a: ['Yes, play with sound', 'Silent'] },
  ]
  const current = screens[step]
  const isLast = step === screens.length - 1

  return (
    <div className="w-full max-w-md">
      <p className="text-xl md:text-2xl font-light text-white/90 mb-10" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
        {current.q}
      </p>
      <div className="flex flex-col gap-3">
        {current.a.map(answer => (
          <button
            key={answer}
            onClick={() => !isLast && setStep(s => s + 1)}
            className="px-6 py-3 rounded-full border border-white/30 text-white/80 text-sm hover:bg-white/10 transition-colors"
          >
            {answer}
          </button>
        ))}
      </div>
    </div>
  )
}

function VideoLayer({
  src,
  objectFit = 'cover',
  letterbox = false,
}: {
  src: string
  objectFit?: 'cover' | 'contain'
  letterbox?: boolean
}) {
  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center">
      <video
        src={src}
        autoPlay
        muted
        playsInline
        loop={false}
        className={`absolute inset-0 w-full h-full ${
          objectFit === 'cover' ? 'object-cover' : 'object-contain'
        }`}
        style={letterbox ? { maxHeight: '100vh' } : undefined}
      />
    </div>
  )
}

function BreathPromptScreen() {
  const [visibleLines, setVisibleLines] = useState(0)
  const lines = [
    'Now we will breathe together.',
    'One cycle.',
    'In for 5.',
    'Hold for 5.',
    'Out for 8.',
    'Rest for 3.',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines(v => Math.min(v + 1, lines.length))
    }, 1400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
      <div className="space-y-3">
        {lines.map((line, i) => (
          <p
            key={i}
            className="text-white/80 text-lg md:text-[1.4rem]"
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              opacity: i < visibleLines ? 1 : 0,
              transform: i < visibleLines ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 700ms ease, transform 700ms ease',
            }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}

function BreathScreen({ step, second }: { step: number; second: number }) {
  const current = BREATH_STEPS[step]
  const totalSeconds = current.seconds
  const scale =
    step === 0 ? 0.8 + (0.4 * second) / totalSeconds :
    step === 1 ? 1.2 :
    step === 2 ? 1.2 - (0.4 * second) / totalSeconds :
    0.8

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div
        className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-white/30 transition-transform duration-1400 ease-linear"
        style={{ transform: `scale(${scale})` }}
      />
      <p className="mt-10 md:mt-16 text-white/70 tracking-widest uppercase text-sm">{current.label}</p>
      <p
        className="mt-4 text-5xl md:text-6xl font-light text-white/95 tabular-nums"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        {second}
      </p>
    </div>
  )
}

function BreathOverlay({ step, second }: { step: number; second: number }) {
  const current = BREATH_STEPS[step]
  const totalSeconds = current.seconds
  const scale =
    step === 0 ? 0.85 + (0.3 * second) / totalSeconds :
    step === 1 ? 1.15 :
    step === 2 ? 1.15 - (0.3 * second) / totalSeconds :
    0.85

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
      <div
        className="w-28 h-28 rounded-full border border-white/40 transition-transform duration-1400 ease-linear"
        style={{ transform: `scale(${scale})`, background: 'rgba(255,255,255,0.04)' }}
      />
      <p className="mt-10 text-white/70 tracking-widest uppercase text-xs">
        {current.label}
      </p>
      <p
        className="mt-2 text-4xl md:text-5xl font-light text-white/95 tabular-nums"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        {second}
      </p>
    </div>
  )
}

function EscapeCard({ onBook }: { onBook: () => void }) {
  return (
    <div
      className="absolute bottom-4 md:bottom-8 left-1/2 w-[88%] max-w-[340px] md:max-w-[380px] rounded-2xl p-5 backdrop-blur-xl border border-white/15 z-30"
      style={{
        background: 'rgba(10, 20, 32, 0.6)',
        animation: `fadeSlideUp 2200ms cubic-bezier(0.16, 1, 0.3, 1) ${TIMING.DONE_CARD_AT_MS}ms backwards`,
        transform: 'translateX(-50%)',
      }}
    >
      <p className="text-white/95 text-xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
        Ready to go?
      </p>
      <button
        onClick={onBook}
        className="mt-4 w-full py-3 rounded-full bg-white/10 border border-white/30 text-white text-sm tracking-widest uppercase hover:bg-white/20 transition-colors"
      >
        Begin →
      </button>
    </div>
  )
}