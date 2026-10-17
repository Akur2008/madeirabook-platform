'use client'

import React, { useState } from 'react'

import { channelColor, type CalendarBooking } from './calendarShared'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-xs uppercase tracking-wide text-white/40">
        {label}
      </span>
      <span className="text-right text-sm text-white/90">{children}</span>
    </div>
  )
}

export default function BookingModal({
  booking,
  propertyName,
  onClose,
  onCancelled,
  readOnly = false,
}: {
  booking: CalendarBooking
  propertyName: string
  onClose: () => void
  onCancelled: () => void
  readOnly?: boolean
}) {
  const color = channelColor(booking.channel)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  const cancel = async () => {
    setCancelling(true)
    setError('')
    try {
      const res = await fetch(`/api/owner/bookings/${booking.id}`, {
        method: 'DELETE',
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`)
      onCancelled()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel')
      setCancelling(false)
      setConfirming(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0e1a28] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-xl font-medium" style={SERIF}>
            Booking details
          </h3>
          <button
            onClick={onClose}
            className="text-xl leading-none text-white/40 transition-colors hover:text-white"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="divide-y divide-white/5">
          <Row label="Property">{propertyName}</Row>
          <Row label="Channel">
            <span
              className="inline-block rounded px-2 py-0.5 text-xs font-semibold text-white"
              style={{ background: color }}
            >
              {booking.channel}
            </span>
          </Row>
          <Row label="Guest">{booking.guestName || '—'}</Row>
          {booking.guestEmail && <Row label="Email">{booking.guestEmail}</Row>}
          {booking.guestPhone && <Row label="Phone">{booking.guestPhone}</Row>}
          <Row label="Check-in">
            {booking.arrival}
            {booking.checkIn ? ` at ${booking.checkIn}` : ''}
          </Row>
          <Row label="Check-out">
            {booking.departure}
            {booking.checkOut ? ` at ${booking.checkOut}` : ''}
          </Row>
          <Row label="Guests">
            {booking.guests}
            {booking.children > 0 &&
              ` (${booking.adults} adults, ${booking.children} children)`}
          </Row>
          <Row label="Total">&euro;{booking.price.toFixed(2)}</Row>
          <Row label="Smoobu ID">#{booking.id}</Row>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {readOnly ? null : confirming ? (
          <div className="mt-5 rounded-lg border border-red-400/30 bg-red-400/10 p-3">
            <p className="text-sm text-red-200">
              Cancel this booking in Smoobu? This cannot be undone.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={cancel}
                disabled={cancelling}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Yes, cancel booking'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={cancelling}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/40 hover:text-white"
              >
                Keep
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="mt-5 w-full rounded-lg border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-400/10"
          >
            Cancel booking
          </button>
        )}
      </div>
    </div>
  )
}
