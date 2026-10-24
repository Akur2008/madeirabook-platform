'use client'

import { useState } from 'react'

import BookingSearchSheet from './BookingSearchSheet'
import EscapeCard from './EscapeCard'

// Escape pages: EscapeCard pinned to the page's city. "Book Sanctuary"
// opens the booking sheet locally instead of redirecting to /book.
export default function EscapeBookCard({
  city,
  fromIata,
  refCode,
}: {
  city: string
  fromIata: string
  refCode?: string | null
}) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="w-full max-w-md">
      <EscapeCard
        city={city}
        fromIata={fromIata}
        onBook={() => setSheetOpen(true)}
      />
      <BookingSearchSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        refCode={refCode}
        originCity={city}
        originIata={fromIata}
      />
    </div>
  )
}
