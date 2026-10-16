'use client'

import React, { useState } from 'react'

type State = 'idle' | 'sending' | 'sent' | 'error'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/owner/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
        Check your email — if that address is registered as an owner, a login
        link is on its way.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#d4af37]"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="w-full rounded-lg bg-[#d4af37] py-3 font-semibold text-[#0a1420] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {state === 'sending' ? 'Sending…' : 'Send magic link'}
      </button>
      {state === 'error' && (
        <p className="text-sm text-red-300">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  )
}
