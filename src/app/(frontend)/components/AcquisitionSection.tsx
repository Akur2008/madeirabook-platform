import Link from 'next/link'
import React from 'react'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export default function AcquisitionSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Link
          href="/owner"
          className="block rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-[#d4af37]/50"
        >
          <p className="text-xs uppercase tracking-wider text-[#d4af37]/80">
            Madeira Property Management
          </p>
          <h3 className="mt-3 text-2xl" style={SERIF}>
            Trust your property to Madeira's best hands
          </h3>
          <p className="mt-4 leading-relaxed text-white/60">
            88% дохода напрямую на ваш счёт через Stripe Connect Express.
            Прозрачная аналитика, отсутствие рутины, персональный уход.
          </p>
          <span className="mt-6 inline-block text-sm font-medium text-[#d4af37]">
            Become a partner →
          </span>
        </Link>

        <a
          href="mailto:hello@madeirabook.com?subject=Ambassador%20application"
          className="block rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-[#10b981]/50"
        >
          <p className="text-xs uppercase tracking-wider text-[#10b981]/80">
            Creators & Ambassadors
          </p>
          <h3 className="mt-3 text-2xl" style={SERIF}>
            Create content, earn from your recommendations
          </h3>
          <p className="mt-4 leading-relaxed text-white/60">
            Официальная амбассадорская программа для фотографов, блогеров,
            авторов. Получайте 2% с каждого бронирования по вашей реферальной
            ссылке.
          </p>
          <span className="mt-6 inline-block text-sm font-medium text-[#10b981]">
            Apply now →
          </span>
        </a>
      </div>
    </section>
  )
}
