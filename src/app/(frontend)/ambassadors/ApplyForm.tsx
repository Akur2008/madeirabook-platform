'use client'

import React, { useState } from 'react'

const INPUT =
  'w-full rounded-md border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-green-500'

const AUDIENCE_OPTIONS = [
  { label: 'Audience size', value: '' },
  { label: '5k-10k', value: '5k-10k' },
  { label: '10k-30k', value: '10k-30k' },
  { label: '30k-100k', value: '30k-100k' },
  { label: '100k+', value: '100k+' },
]

const NICHE_OPTIONS = [
  { label: 'Niche', value: '' },
  { label: 'Travel', value: 'travel' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Portugal & Madeira', value: 'portugal-madeira' },
  { label: 'Other', value: 'other' },
]

const MIN_PICKS = 3
const MAX_PICKS = 5

type SpotOption = { id: string; name: string }

function SpotPicker({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: SpotOption[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <fieldset className="rounded-md border border-white/20 p-3">
      <legend className="px-1 text-xs text-white/50">
        {label} ({selected.length}/{MAX_PICKS})
      </legend>
      <div className="mt-1 grid max-h-44 grid-cols-1 gap-1 overflow-y-auto pr-1">
        {options.map((o) => {
          const checked = selected.includes(o.id)
          const disabled = !checked && selected.length >= MAX_PICKS
          return (
            <label
              key={o.id}
              className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                checked
                  ? 'bg-green-500/15 text-white'
                  : disabled
                    ? 'text-white/25'
                    : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(o.id)}
                className="h-3.5 w-3.5 shrink-0 accent-green-500"
              />
              {o.name}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function ApplyForm({
  beaches,
  restaurants,
}: {
  beaches: SpotOption[]
  restaurants: SpotOption[]
}) {
  const [form, setForm] = useState({
    name: '',
    instagramHandle: '',
    email: '',
    audienceSize: '',
    niche: '',
    mainCity: '',
    sampleReelUrl: '',
    message: '',
  })
  const [selectedBeaches, setSelectedBeaches] = useState<string[]>([])
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  function update(field: keyof typeof form) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function toggle(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    return (id: string) =>
      setter((prev) =>
        prev.includes(id)
          ? prev.filter((v) => v !== id)
          : prev.length < MAX_PICKS
            ? [...prev, id]
            : prev,
      )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (
      selectedBeaches.length < MIN_PICKS ||
      selectedBeaches.length > MAX_PICKS ||
      selectedRestaurants.length < MIN_PICKS ||
      selectedRestaurants.length > MAX_PICKS
    ) {
      setStatus('error')
      setError(`Pick ${MIN_PICKS}-${MAX_PICKS} beaches and ${MIN_PICKS}-${MAX_PICKS} restaurants.`)
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          selectedBeaches,
          selectedRestaurants,
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
      <div className="w-full rounded-lg border border-white/10 bg-white/5 p-6 text-center text-white">
        <p className="text-lg font-semibold text-green-400">Application received.</p>
        <p className="mt-2 text-sm text-white/60">
          We reply within 48 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 text-white">
      <input
        type="text"
        name="name"
        required
        value={form.name}
        onChange={update('name')}
        placeholder="Name"
        className={INPUT}
      />
      <input
        type="text"
        name="instagramHandle"
        required
        value={form.instagramHandle}
        onChange={update('instagramHandle')}
        placeholder="@yourhandle"
        className={INPUT}
      />
      <input
        type="email"
        name="email"
        required
        value={form.email}
        onChange={update('email')}
        placeholder="Email"
        className={INPUT}
      />
      <select
        name="audienceSize"
        required
        value={form.audienceSize}
        onChange={update('audienceSize')}
        className={`${INPUT} ${form.audienceSize ? '' : 'text-white/40'}`}
      >
        {AUDIENCE_OPTIONS.map((o) => (
          <option
            key={o.label}
            value={o.value}
            disabled={o.value === ''}
            className="bg-[#0a1420] text-white"
          >
            {o.label}
          </option>
        ))}
      </select>
      <select
        name="niche"
        required
        value={form.niche}
        onChange={update('niche')}
        className={`${INPUT} ${form.niche ? '' : 'text-white/40'}`}
      >
        {NICHE_OPTIONS.map((o) => (
          <option
            key={o.label}
            value={o.value}
            disabled={o.value === ''}
            className="bg-[#0a1420] text-white"
          >
            {o.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="mainCity"
        value={form.mainCity}
        onChange={update('mainCity')}
        placeholder="Main city of your audience"
        className={INPUT}
      />
      <input
        type="url"
        name="sampleReelUrl"
        value={form.sampleReelUrl}
        onChange={update('sampleReelUrl')}
        placeholder="Link to 1 Reel you're proud of (optional)"
        className={INPUT}
      />
      <textarea
        name="message"
        value={form.message}
        onChange={update('message')}
        maxLength={300}
        rows={4}
        placeholder="Tell us about your audience (optional)"
        className={`${INPUT} resize-none`}
      />

      <SpotPicker
        label="Pick 3-5 beaches for your map"
        options={beaches}
        selected={selectedBeaches}
        onToggle={toggle(setSelectedBeaches)}
      />
      <SpotPicker
        label="Pick 3-5 restaurants for your map"
        options={restaurants}
        selected={selectedRestaurants}
        onToggle={toggle(setSelectedRestaurants)}
      />

      <label className="flex cursor-pointer items-start gap-2 text-xs leading-snug text-white/60">
        <input
          type="checkbox"
          name="agreed"
          required
          className="mt-0.5 accent-green-500"
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
        className="w-full rounded-md bg-green-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending…' : 'Apply for invitation'}
      </button>

      <p className="pt-1 text-center text-xs text-white/40">
        We reply within 48 hours. hello@madeirabook.com
      </p>
    </form>
  )
}
