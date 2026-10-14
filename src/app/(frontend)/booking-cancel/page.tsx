import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Checkout cancelled — Madeirabook',
  robots: { index: false, follow: false },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const
const SLUG_RE = /^[a-z0-9-]+$/i

export default async function BookingCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>
}) {
  const { slug } = await searchParams
  const backHref = slug && SLUG_RE.test(slug) ? `/p/${slug}` : '/'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0a1420] px-6 text-center">
      <h1 className="text-4xl font-light text-white/95" style={SERIF}>
        Checkout cancelled
      </h1>
      <p className="mb-0 mt-4 max-w-md text-sm text-white/70">
        Your booking was not completed. Try again anytime.
      </p>
      <Link
        href={backHref}
        className="mt-8 rounded-full border border-white/30 bg-white/10 px-8 py-3 text-sm uppercase tracking-widest text-white transition-colors hover:bg-white/20"
      >
        Back to property
      </Link>
    </div>
  )
}
