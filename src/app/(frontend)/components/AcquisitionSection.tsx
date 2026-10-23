import Link from 'next/link'
import React from 'react'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export default function AcquisitionSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Link
          href="/owners"
          className="block rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-[#10b981]/50"
        >
          <p className="text-xs uppercase tracking-wider text-[#10b981]/80">
            Madeira Property Management
          </p>
          <h3 className="mt-3 text-2xl" style={SERIF}>
            Trust your property to Madeira&rsquo;s best hands
          </h3>
          <p className="mt-4 leading-relaxed text-white/60">
            88% of income goes directly to your account via Stripe Connect
            Express. Transparent analytics, no routine, personal care.
          </p>
          <span className="mt-6 inline-block text-sm font-medium text-[#10b981]">
            Owner Login / PMS →
          </span>
        </Link>

        <Link
          href="/ambassador"
          className="block rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-[#10b981]/50"
        >
          <p className="text-xs uppercase tracking-wider text-[#10b981]/80">
            Creators & Ambassadors
          </p>
          <h3 className="mt-3 text-2xl" style={SERIF}>
            Create content, earn from your recommendations
          </h3>
          <p className="mt-4 leading-relaxed text-white/60">
            Official ambassador program for photographers, bloggers and
            creators. Earn 2% from every booking made through your referral
            link.
          </p>
          <span className="mt-6 inline-block text-sm font-medium text-[#10b981]">
            Become an Ambassador →
          </span>
        </Link>
      </div>
    </section>
  )
}
