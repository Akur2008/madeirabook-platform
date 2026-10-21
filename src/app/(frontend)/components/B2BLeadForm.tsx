'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'

const INPUT =
  'w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-[#d4af37]'

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
      <div className="w-full rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 p-6 text-center">
        <p className="text-lg font-semibold text-[#d4af37]">
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

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-lg bg-[#d4af37] px-4 py-3 text-sm font-semibold text-[#030712] transition-colors hover:bg-[#e5c04b] disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending…' : submitLabel}
      </button>
    </form>
  )
}
