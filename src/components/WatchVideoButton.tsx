'use client'

import { useState } from 'react'

import HotelVideoSheet from './HotelVideoSheet'

interface WatchVideoButtonProps {
  videoUrl: string
  title: string
  cta: { label: string; href: string } | null
  // 'hero': outlined button over the photo hero; 'gold': oasis light
  // sections; 'dark': madeirabook navy pages.
  theme?: 'hero' | 'gold' | 'dark'
}

// [ Watch Video ] button on hotel pages — opens the same full-screen
// HotelVideoSheet the homepage phone frames use.
export default function WatchVideoButton({
  videoUrl,
  title,
  cta,
  theme = 'hero',
}: WatchVideoButtonProps) {
  const [open, setOpen] = useState(false)

  const btnCls = {
    hero: 'rounded-lg border-white/60 bg-black/30 px-5 py-2.5 text-white backdrop-blur-sm hover:bg-white/20',
    gold: 'rounded-full border-[#d4af37] px-6 py-3 text-[#8a7020] hover:bg-[#d4af37] hover:text-[#1c1a16]',
    dark: 'rounded-lg border-white/25 px-5 py-2.5 text-white hover:bg-white/10',
  }[theme]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 border text-sm font-semibold tracking-wide transition-colors ${btnCls}`}
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="currentColor"
          aria-hidden
        >
          <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.5-6.86a1.03 1.03 0 0 0 0-1.76L9.56 4.26A1.03 1.03 0 0 0 8 5.14z" />
        </svg>
        Watch Video
      </button>
      <HotelVideoSheet
        video={open ? { videoUrl, title } : null}
        onClose={() => setOpen(false)}
        cta={cta}
      />
    </>
  )
}
