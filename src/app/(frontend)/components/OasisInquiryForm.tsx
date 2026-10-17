'use client'

import { useState } from 'react'

interface OasisInquiryFormProps {
  hotelTitle: string
}

type FormState = 'idle' | 'sending' | 'sent' | 'error'

const inputClass =
  'w-full rounded-lg border border-[#1c1a16]/15 bg-white px-4 py-3 text-sm text-[#1c1a16] outline-none transition-colors placeholder:text-[#1c1a16]/35 focus:border-[#d4af37]'

export default function OasisInquiryForm({
  hotelTitle,
}: OasisInquiryFormProps) {
  const [state, setState] = useState<FormState>('idle')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dates, setDates] = useState('')
  const [message, setMessage] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/oasis/inquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          dates,
          message,
          page: window.location.pathname,
        }),
      })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-2xl border border-[#d4af37]/40 bg-white p-8 text-center">
        <p className="font-serif text-2xl text-[#1c1a16]">Request received</p>
        <p className="mt-3 text-sm text-[#1c1a16]/60">
          The Madeira Oasis concierge will reply about {hotelTitle} within one
          business day.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-[#1c1a16]/10 bg-white p-6 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className={inputClass}
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={inputClass}
        />
      </div>
      <input
        value={dates}
        onChange={(e) => setDates(e.target.value)}
        placeholder="Preferred dates (e.g. 12–20 June 2026)"
        className={`mt-4 ${inputClass}`}
      />
      <textarea
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell us about your stay — party size, occasions, preferences…"
        rows={4}
        className={`mt-4 ${inputClass}`}
      />
      {state === 'error' && (
        <p className="mt-3 text-sm text-red-700">
          Something went wrong. Please try again.
        </p>
      )}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="mt-6 w-full rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold tracking-wide text-[#1c1a16] transition-colors hover:bg-[#c29c2e] disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : 'Send inquiry'}
      </button>
    </form>
  )
}
