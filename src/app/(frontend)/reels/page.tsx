import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Ambassador Reel — Madeirabook',
  description: 'Preview of the 6-second Instagram Reels promo for creators.',
  robots: { index: false, follow: false },
}

export default function ReelsPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#030712] px-6 py-16 text-white">
      <div className="w-full max-w-sm">
        <div className="aspect-[9/16] overflow-hidden rounded-2xl border border-white/15 bg-black">
          <video
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
            poster="/images/madeira-beach-01.jpg"
            src="/videos/ambassador-reel.mp4"
          />
        </div>
        <p className="mt-4 text-center text-sm text-white/50">
          Final cut pending — drop the video at{' '}
          <code className="text-[#10b981]">public/videos/ambassador-reel.mp4</code>
        </p>
      </div>
    </div>
  )
}
