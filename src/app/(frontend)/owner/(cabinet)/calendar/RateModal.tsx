'use client'

import React, { useState } from 'react'

import type { RateDay } from './calendarShared'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const INPUT =
  'w-full rounded-lg border border-white/15 bg-[#0d1a2a] px-3 py-2 text-sm text-white/90 placeholder-white/30 focus:border-emerald-400/60 focus:outline-none'

export interface RateEditTarget {
  aptId: number
  aptName: string
  startDate: string
  endDate: string
  currentRate?: RateDay
}

export default function RateModal({
  target,
  onClose,
  onSaved,
}: {
  target: RateEditTarget
  onClose: () => void
  onSaved: () => void
}) {
  const [price, setPrice] = useState(
    target.currentRate?.price != null ? String(Math.round(target.currentRate.price)) : '',
  )
  const [minNights, setMinNights] = useState(
    target.currentRate?.min_length_of_stay != null
      ? String(target.currentRate.min_length_of_stay)
      : '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const rangeLabel =
    target.startDate === target.endDate
      ? target.startDate
      : `${target.startDate} → ${target.endDate}`

  const save = async () => {
    const priceNum = Number(price)
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError('Enter a price greater than 0')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/owner/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aptId: target.aptId,
          startDate: target.startDate,
          endDate: target.endDate,
          price: priceNum,
          minNights: minNights === '' ? null : Number(minNights),
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e1a28] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-medium" style={SERIF}>
              Edit price
            </h3>
            <p className="mt-1 text-xs text-white/50">
              {target.aptName} · {rangeLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xl leading-none text-white/40 transition-colors hover:text-white"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <label className="block text-xs uppercase tracking-wide text-white/40">
          New price (€)
        </label>
        <input
          type="number"
          min="1"
          step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={`${INPUT} mt-1`}
          placeholder="120"
          autoFocus
        />

        <label className="mt-4 block text-xs uppercase tracking-wide text-white/40">
          Min nights
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={minNights}
          onChange={(e) => setMinNights(e.target.value)}
          className={`${INPUT} mt-1`}
          placeholder="Leave empty to keep current"
        />

        {error && (
          <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
