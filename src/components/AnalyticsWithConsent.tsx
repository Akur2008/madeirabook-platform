'use client'

import { Analytics } from '@vercel/analytics/next'
import React, { useSyncExternalStore } from 'react'

import {
  readCookieConsent,
  subscribeCookieConsent,
} from './CookieConsent'

// Mounts Vercel Analytics only after the visitor accepts cookies — either
// from a stored choice or live via the consent banner's CustomEvent.
export default function AnalyticsWithConsent() {
  const consent = useSyncExternalStore(
    subscribeCookieConsent,
    readCookieConsent,
    () => null,
  )
  return consent === 'accepted' ? <Analytics /> : null
}
