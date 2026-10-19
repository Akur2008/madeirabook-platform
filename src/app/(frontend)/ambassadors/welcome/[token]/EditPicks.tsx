'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const MAX_PICKS = 5

export type SpotOption = { id: string; name: string }

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
    <fieldset className="rounded-md border border-white/15 p-3">
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
                  ? 'bg-[#d4af37]/15 text-white'
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
                className="h-3.5 w-3.5 shrink-0 accent-[#d4af37]"
              />
              {o.name}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function EditPicks({
  token,
  beaches,
  restaurants,
  initialBeachIds,
  initialRestaurantIds,
}: {
  token: string
  beaches: SpotOption[]
  restaurants: SpotOption[]
  initialBeachIds: string[]
  initialRestaurantIds: string[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedBeaches, setSelectedBeaches] = useState<string[]>(initialBeachIds)
  const [selectedRestaurants, setSelectedRestaurants] =
    useState<string[]>(initialRestaurantIds)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

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

  function openModal() {
    setSelectedBeaches(initialBeachIds)
    setSelectedRestaurants(initialRestaurantIds)
    setError('')
    setStatus('idle')
    setOpen(true)
  }

  async function handleSave() {
    setError('')
    setStatus('loading')
    try {
      const res = await fetch('/api/ambassador/picks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          selectedBeaches,
          selectedRestaurants,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) {
        setOpen(false)
        setTimeout(() => router.refresh(), 0)
      } else {
        setStatus('error')
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setError('Network error. Please try again.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="block w-full rounded-md border border-white/20 bg-white/5 px-4 py-4 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
      >
        ✏️ Edit my picks
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit my picks"
            className="w-full max-w-md rounded-xl border border-white/15 bg-[#0a1420] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit my picks</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md px-2 py-1 text-xl leading-none text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-xs text-white/50">
              Up to {MAX_PICKS} of each — your map updates right after saving.
            </p>

            <div className="mt-4 space-y-4">
              <SpotPicker
                label="Beaches"
                options={beaches}
                selected={selectedBeaches}
                onToggle={toggle(setSelectedBeaches)}
              />
              <SpotPicker
                label="Restaurants"
                options={restaurants}
                selected={selectedRestaurants}
                onToggle={toggle(setSelectedRestaurants)}
              />
            </div>

            {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}

            <button
              type="button"
              onClick={handleSave}
              disabled={status === 'loading'}
              className="mt-5 w-full rounded-md bg-[#d4af37] px-4 py-3 text-sm font-semibold text-[#0a1420] transition-colors hover:bg-[#e5c04b] disabled:opacity-50"
            >
              {status === 'loading' ? 'Saving…' : 'Save my picks'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
