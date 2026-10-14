import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Booking confirmed — Madeirabook',
  robots: { index: false, follow: false },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export default function BookingSuccessPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0a1420] px-6 text-center">
      <h1 className="text-4xl font-light text-white/95" style={SERIF}>
        Booking confirmed
      </h1>
      <p className="mb-0 mt-4 max-w-md text-sm text-white/70">
        Thank you! We&apos;ve sent a confirmation to your email.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-white/30 bg-white/10 px-8 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white/20"
      >
        Back to home
      </Link>
    </div>
  )
}
