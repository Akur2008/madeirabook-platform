'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'

type SubscribeFormProps = {
  title?: string
  description?: string
  source?: string
}

type ResolvedSource = { source: string; hidden: boolean }

function resolveSource(pathname: string): ResolvedSource {
  if (pathname.startsWith('/legal')) return { source: '', hidden: true }

  const gateway = pathname.match(/^\/gateway\/([^/]+)/)
  if (gateway) return { source: `gateway:${gateway[1]}`, hidden: false }

  const city = pathname.match(/^\/cit(?:y|ies)\/([^/]+)/)
  if (city) return { source: `city:${city[1]}`, hidden: false }

  return { source: `page:${pathname}`, hidden: false }
}

export default function SubscribeForm({
  title = 'Get the free Madeira guide',
  description = 'Best weeks to fly, cheapest apartments, local restaurants. Free PDF.',
  source,
}: SubscribeFormProps) {
  const pathname = usePathname()
  const auto = resolveSource(pathname ?? '/')
  const resolvedSource = source ?? auto.source
  const hidden = !source && auto.hidden

  const [email, setEmail] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  if (hidden) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!agreed) {
      setError('Please accept the Privacy Policy to continue.')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: resolvedSource, agreed }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setError('Network error. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-neutral-950 p-6 text-center text-white">
        <p className="text-lg font-semibold text-green-400">Check your email!</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-white/10 bg-neutral-950 p-6 text-white">
      <h3 className="mb-2 font-serif text-2xl font-medium tracking-wide">{title}</h3>
      <p className="mb-5 text-sm leading-snug text-white/70">{description}</p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="mb-3 w-full rounded-md border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-green-500"
        />

        <label className="mb-4 flex cursor-pointer items-start gap-2 text-xs leading-snug text-white/70">
          <input
            type="checkbox"
            name="agreed"
            required
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-green-600"
          />
          <span>
            I agree to receive emails from Madeirabook and accept the{' '}
            <a
              href="/legal/privacy"
              className="underline underline-offset-2 hover:text-white"
            >
              Privacy Policy
            </a>
          </span>
        </label>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-md bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
        >
          {status === 'loading' ? 'Sending…' : 'Get the guide'}
        </button>
      </form>
    </div>
  )
}
