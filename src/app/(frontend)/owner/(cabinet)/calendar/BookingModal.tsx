'use client'

import React from 'react'

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
}: {
  booking: CalendarBooking
  propertyName: string
  onClose: () => void
}) {
  const color = channelColor(booking.channel)
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
      </div>
    </div>
  )
}
