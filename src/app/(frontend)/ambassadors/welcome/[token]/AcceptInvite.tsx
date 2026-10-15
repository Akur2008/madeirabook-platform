'use client'

import React, { useState } from 'react'

export default function AcceptInvite({ token }: { token: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleAccept() {
    setError('')
    setStatus('loading')
    try {
      const res = await fetch('/api/ambassador/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) {
        setStatus('done')
      } else {
        setStatus('error')
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setError('Network error. Please try again.')
    }
  }

  if (status === 'done') {
    return (
      <div className="w-full rounded-lg border border-green-500/30 bg-green-500/10 p-6 text-center">
        <p className="text-lg font-semibold text-green-400">Welcome aboard.</p>
        <p className="mt-2 text-sm text-white/60">
          We&apos;ll contact you within 24 hours to set up payouts.
        </p>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAccept}
        disabled={status === 'loading'}
        className="w-full rounded-md bg-green-700 px-4 py-4 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
      >
        {status === 'loading' ? 'Accepting…' : 'Accept & connect Stripe →'}
      </button>
      {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}
    </div>
  )
}
