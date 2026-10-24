'use client'

import React, { useSyncExternalStore } from 'react'

export const COOKIE_CONSENT_KEY = 'mb_cookie_consent'
export const COOKIE_CONSENT_EVENT = 'mb:cookie-consent'

export type CookieConsentValue = 'accepted' | 'declined'

export function readCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(COOKIE_CONSENT_KEY)
  return value === 'accepted' || value === 'declined' ? value : null
}

export function subscribeCookieConsent(onChange: () => void): () => void {
  window.addEventListener(COOKIE_CONSENT_EVENT, onChange)
  return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange)
}

const subscribeNoop = () => () => {}

export default function CookieConsent() {
  // Two snapshots: "are we on the client" (avoids SSR/hydration flash) and
  // the stored consent, live-updated via the CustomEvent dispatched below.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
  const consent = useSyncExternalStore(
    subscribeCookieConsent,
    readCookieConsent,
    () => null,
  )

  if (!mounted || consent) return null

  const decide = (value: CookieConsentValue) => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value)
    window.dispatchEvent(
      new CustomEvent<CookieConsentValue>(COOKIE_CONSENT_EVENT, {
        detail: value,
      }),
    )
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-[3000] mx-auto max-w-xl rounded-2xl border border-white/15 bg-[#0a1420]/95 p-4 text-white shadow-2xl backdrop-blur sm:bottom-6 sm:p-5"
    >
      <p className="text-sm leading-snug text-white/85">
        We use cookies for analytics and to remember your preferences. Details
        in our{' '}
        <a
          href="/legal/cookies"
          className="underline underline-offset-2 hover:text-white"
        >
          Cookie Policy
        </a>{' '}
        and{' '}
        <a
          href="/legal/privacy"
          className="underline underline-offset-2 hover:text-white"
        >
          Privacy Policy
        </a>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => decide('accepted')}
          className="flex-1 cursor-pointer rounded-lg bg-[#10b981] px-4 py-2.5 text-sm font-semibold text-[#0a1420] transition-colors hover:bg-[#0ea372]"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => decide('declined')}
          className="flex-1 cursor-pointer rounded-lg border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
