'use client'

import React, { useState } from 'react'

export default function SetupPayouts({ token }: { token: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleClick() {
    setError('')
    setStatus('loading')
    try {
      const res = await fetch(
        `/api/ambassador/onboarding-link?token=${token}`,
      )
      const data = (await res.json()) as { url?: string; error?: string }
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      setStatus('error')
      setError(data.error || 'Something went wrong. Please try again.')
    } catch {
      setStatus('error')
      setError('Network error. Please try again.')
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'loading'}
        className="block w-full rounded-md border border-[#10b981]/50 bg-[#10b981]/10 px-4 py-4 text-center text-sm font-semibold text-[#10b981] transition-colors hover:bg-[#10b981]/20 disabled:opacity-50"
      >
        {status === 'loading' ? 'Opening Stripe…' : '💳 Set up payouts (Stripe)'}
      </button>
      {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}
    </div>
  )
}
