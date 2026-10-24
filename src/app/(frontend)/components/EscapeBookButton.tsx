'use client'

import { useState } from 'react'

import BookingSearchSheet from './BookingSearchSheet'

// Secondary CTA on escape pages: opens the booking sheet locally
// instead of navigating to /book.
export default function EscapeBookButton({
  city,
  fromIata,
  label,
  className,
}: {
  city: string
  fromIata: string
  label: string
  className?: string
}) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setSheetOpen(true)} className={className}>
        {label}
      </button>
      <BookingSearchSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        originCity={city}
        originIata={fromIata}
      />
    </>
  )
}
