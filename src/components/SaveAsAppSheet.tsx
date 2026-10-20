'use client'

import { useEffect, useRef, useState } from 'react'
import { Drawer } from 'vaul'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface SaveAsAppSheetProps {
  /** Trigger styling: 'dark' for dark footers, 'light' for light footers. */
  variant?: 'dark' | 'light'
}

type PlatformTab = 'ios' | 'android'

const STEPS: Record<PlatformTab, string[]> = {
  ios: [
    'Tap the Share icon (square with arrow).',
    'Scroll down, tap "Add to Home Screen".',
    'Tap "Add" (top-right).',
  ],
  android: [
    'Tap the three dots (menu) in Chrome.',
    'Tap "Add to Home screen" or "Install app".',
    'Confirm "Add".',
  ],
}

export default function SaveAsAppSheet({ variant = 'dark' }: SaveAsAppSheetProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<PlatformTab>('ios')
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstallPrompt(null)
      setInstalled(true)
      if (toastTimer.current) clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setInstalled(false), 3000)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const installNatively = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === 'light'
            ? 'inline-flex items-center gap-2 rounded-full border border-[#1c1a16]/15 px-4 py-2 transition-colors hover:border-[#1c1a16]/30 hover:text-[#1c1a16]'
            : 'inline-flex items-center gap-2 rounded-full border border-gray-600 px-4 py-2 text-gray-300 transition-colors hover:border-gray-400 hover:text-white'
        }
      >
        📱 Save as App
      </button>

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-[1200] mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-2xl border border-white/15 border-b-0 bg-[#0a1420] outline-none">
            <Drawer.Handle className="mx-auto mb-2 mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20" />
            <Drawer.Close
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
            >
              ✕
            </Drawer.Close>
            <Drawer.Title className="sr-only">Save as App</Drawer.Title>
            <Drawer.Description className="sr-only">
              How to add this site to your home screen.
            </Drawer.Description>

            <div className="overflow-y-auto px-6 pb-8">
              <h2
                className="mt-2 text-center text-3xl font-light leading-tight text-white/95"
                style={SERIF}
              >
                Save as App
              </h2>
              <p className="mb-0 mt-2 text-center text-sm text-white/55">
                Add this site to your home screen for one-tap access.
              </p>

              {installPrompt && (
                <button
                  type="button"
                  onClick={installNatively}
                  className="mt-5 w-full rounded-full border border-emerald-500 bg-emerald-500 py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-emerald-400"
                >
                  Install app
                </button>
              )}

              <div className="mt-6 flex rounded-full border border-white/15 bg-white/5 p-1">
                {(['ios', 'android'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTab(p)}
                    className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                      tab === p
                        ? 'bg-white text-[#0a1420]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {p === 'ios' ? 'iOS' : 'Android'}
                  </button>
                ))}
              </div>

              <ol className="mb-0 mt-5 space-y-3 text-sm leading-relaxed text-white/75">
                {STEPS[tab].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs text-white/60">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {installed && (
        <div className="fixed bottom-6 left-1/2 z-[1300] -translate-x-1/2 rounded-full border border-emerald-500/50 bg-[#0a1420] px-5 py-2.5 text-sm font-semibold text-emerald-400 shadow-lg">
          App installed ✓
        </div>
      )}
    </>
  )
}
