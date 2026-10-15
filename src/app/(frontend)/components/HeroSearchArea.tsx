'use client'

import { useState } from 'react'

import { BookingSearchInline } from './BookingSearchSheet'
import EscapeCard from './EscapeCard'

// Hero search cluster: compact date search + Escape Card.
// While search results are shown the Escape Card is hidden (kept mounted)
// so results and the form stay inside the first viewport.
export default function HeroSearchArea() {
  const [resultsVisible, setResultsVisible] = useState(false)

  return (
    <>
      <div className="mt-8 flex w-full justify-center">
        <BookingSearchInline onResultsVisible={setResultsVisible} />
      </div>
      <div
        className={`mt-8 w-full justify-center ${resultsVisible ? 'hidden' : 'flex'}`}
        aria-hidden={resultsVisible}
      >
        <EscapeCard />
      </div>
    </>
  )
}
