'use client'

import React, { useState } from 'react'

import type { CalendarApartment } from './calendarShared'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const INPUT =
  'w-full rounded-lg border border-white/15 bg-[#0d1a2a] px-3 py-2 text-sm text-white/90 placeholder-white/30 focus:border-emerald-400/60 focus:outline-none'

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-white/40">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

export default function CreateBookingModal({
  apartments,
  onClose,
  onSaved,
}: {
  apartments: CalendarApartment[]
  onClose: () => void
  onSaved: () => void
}) {
  const bookable = apartments.filter((a) => a.aptId != null)
  const [form, setForm] = useState({
    aptId: bookable[0]?.aptId != null ? String(bookable[0].aptId) : '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    arrivalDate: '',
    departureDate: '',
    adults: '2',
    arrivalTime: '',
    street: '',
    postalCode: '',
    location: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }))

  const save = async () => {
    if (!form.aptId || !form.firstName || !form.arrivalDate || !form.departureDate) {
      setError('Property, first name and dates are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/owner/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aptId: Number(form.aptId),
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          arrivalDate: form.arrivalDate,
          departureDate: form.departureDate,
          adults: Number(form.adults) || 2,
          arrivalTime: form.arrivalTime,
          address: {
            street: form.street,
            postalCode: form.postalCode,
            location: form.location,
          },
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create booking')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0e1a28] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-xl font-medium" style={SERIF}>
            New manual booking
          </h3>
          <button
            onClick={onClose}
            className="text-xl leading-none text-white/40 transition-colors hover:text-white"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Property">
              <select
                value={form.aptId}
                onChange={(e) => set('aptId')(e.target.value)}
                className={INPUT}
              >
                {bookable.map((a) => (
                  <option key={a.id} value={String(a.aptId)}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="First name">
            <input
              value={form.firstName}
              onChange={(e) => set('firstName')(e.target.value)}
              className={INPUT}
              autoFocus
            />
          </Field>
          <Field label="Last name">
            <input
              value={form.lastName}
              onChange={(e) => set('lastName')(e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => set('phone')(e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Country">
            <input
              value={form.country}
              onChange={(e) => set('country')(e.target.value)}
              className={INPUT}
              placeholder="PT"
            />
          </Field>
          <Field label="Adults">
            <input
              type="number"
              min="1"
              step="1"
              value={form.adults}
              onChange={(e) => set('adults')(e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Arrival date">
            <input
              type="date"
              value={form.arrivalDate}
              onChange={(e) => set('arrivalDate')(e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Departure date">
            <input
              type="date"
              value={form.departureDate}
              onChange={(e) => set('departureDate')(e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Arrival time">
            <input
              type="time"
              value={form.arrivalTime}
              onChange={(e) => set('arrivalTime')(e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Street">
            <input
              value={form.street}
              onChange={(e) => set('street')(e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Postal code">
            <input
              value={form.postalCode}
              onChange={(e) => set('postalCode')(e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="City / location">
            <input
              value={form.location}
              onChange={(e) => set('location')(e.target.value)}
              className={INPUT}
            />
          </Field>
        </div>

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
          {saving ? 'Creating…' : 'Create booking'}
        </button>
      </div>
    </div>
  )
}
