import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Choose your escape — Madeirabook',
  description: 'Three stays in Madeira. Pick yours.',
}

const STAYS = [
  {
    name: 'Apartamentos do Mar 303',
    desc: 'Studio, 3rd floor, ocean view',
    guests: 2,
    url: 'https://app.madeirabook.com/p/apartamentos-do-mar-303',
  },
  {
    name: 'Apartamentos do Mar 607',
    desc: 'Studio, 6th floor, panoramic view',
    guests: 2,
    url: 'https://app.madeirabook.com/p/apartamentos-do-mar-607',
  },
  {
    name: 'Penthouse on the Beach Madeira',
    desc: 'Penthouse, top floor, direct ocean',
    guests: 4,
    url: 'https://app.madeirabook.com/p/penthouse-on-the-beach-madeira',
  },
]

export default function BookingPage() {
  return (
    <main className="min-h-[100dvh] bg-[#0a1420] px-6 py-16 md:py-24">
      <div className="max-w-5xl mx-auto">
        <h1
          className="text-3xl md:text-5xl font-light text-white/95 text-center"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          Choose your escape
        </h1>
        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {STAYS.map(stay => (
            <div
              key={stay.url}
              className="rounded-2xl border border-white/15 bg-white/5 p-6 flex flex-col"
            >
              <h2
                className="text-2xl text-white/95"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                {stay.name}
              </h2>
              <p className="mt-2 text-sm text-white/60">{stay.desc}</p>
              <p className="mt-1 text-xs text-white/40 tracking-widest uppercase">
                {stay.guests} guests
              </p>
              <a
                href={stay.url}
                className="mt-6 py-3 rounded-full border border-white/30 text-white/90 text-sm tracking-widest uppercase text-center hover:bg-white/10 transition-colors"
              >
                Reserve →
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
