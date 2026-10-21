'use client'

import { useEffect, useRef } from 'react'

// Aviasales search form (Travelpayouts promo_id=7879): origin input,
// destination FNC, date picker, Search button. Same embed params as
// book-flights.html; dark bg tuned to the page color.
const WIDGET_SRC =
  'https://tpemd.com/content?currency=eur&trs=575770&shmarker=779585.website' +
  '&show_hotels=false&powered_by=true&locale=en' +
  '&searchUrl=www.aviasales.com%2Fsearch' +
  '&primary_override=%2310B981&color_button=%2310B981&color_icons=%2310B981' +
  '&dark=%230A1420&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4' +
  '&color_focused=%2310B981&border_radius=0&no_labels=&plain=true' +
  '&origin=LIS&destination=FNC&promo_id=7879&campaign_id=100'

export default function AviasalesWidget() {
  const containerRef = useRef<HTMLDivElement>(null)

  // The tpemd script locates its own <script> tag via document.currentScript
  // and renders the widget next to it, so we inject it into the container
  // after mount instead of rendering it through JSX.
  useEffect(() => {
    const el = containerRef.current
    if (!el || el.dataset.loaded === '1') return
    const script = document.createElement('script')
    script.src = WIDGET_SRC
    script.async = true
    script.charset = 'utf-8'
    el.dataset.loaded = '1'
    el.appendChild(script)
  }, [])

  return (
    <div
      ref={containerRef}
      className="min-h-[200px] w-full overflow-hidden rounded-2xl border border-white/15 bg-white/5"
    />
  )
}
