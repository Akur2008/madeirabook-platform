'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'

const INPUT =
  'w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-[#10b981]'

export default function B2BLeadForm({
  type,
  firstFieldPlaceholder,
  submitLabel,
}: {
  type: 'ambassador' | 'owner'
  firstFieldPlaceholder: string
  submitLabel: string
}) {
  const pathname = usePathname()
  const [firstField, setFirstField] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setStatus('loading')
    try {
      const res = await fetch('/api/leads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'direct_web',
          page: pathname,
          type,
          whatsapp,
          instagramOrProperty: firstField,
          contactIdentifier: whatsapp,
        }),
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
      <div className="w-full rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 p-6 text-center">
        <p className="text-lg font-semibold text-[#10b981]">
          Thank you! We will contact you shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <input
        type="text"
        name="instagramOrProperty"
        required
        value={firstField}
        onChange={(e) => setFirstField(e.target.value)}
        placeholder={firstFieldPlaceholder}
        className={INPUT}
      />
      <input
        type="tel"
        name="whatsapp"
        required
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        placeholder="WhatsApp Number"
        className={INPUT}
      />

      <label className="flex cursor-pointer items-start gap-2 text-xs leading-snug text-white/60">
        <input
          type="checkbox"
          name="agreed"
          required
          className="mt-0.5 accent-[#10b981]"
        />
        <span>
          I agree to the processing of my data as described in the{' '}
          <a
            href="/legal/privacy"
            className="underline underline-offset-2 hover:text-white"
          >
            Privacy Policy
          </a>
        </span>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-lg bg-[#10b981] px-4 py-3 text-sm font-semibold text-[#030712] transition-colors hover:bg-[#e5c04b] disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending…' : submitLabel}
      </button>
    </form>
  )
}
