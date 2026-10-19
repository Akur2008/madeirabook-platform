import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

export const metadata: Metadata = {
  title: 'Video collections — Madeirabook',
  description: 'Madeira in motion — mountains, forest levadas and ocean sunsets.',
  alternates: {
    canonical: 'https://www.madeirabook.com/collections',
  },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const R2 = 'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev'

const CATEGORIES = [
  {
    slug: 'mountains',
    title: 'Mountains & Viewpoints',
    poster: `${R2}/homepage-video-mountains-3-poster.jpg`,
  },
  {
    slug: 'forest',
    title: 'Forest & Levadas',
    poster: `${R2}/homepage-video-forest-3-poster.jpg`,
  },
  {
    slug: 'ocean',
    title: 'Ocean & Sunsets',
    poster: `${R2}/homepage-video-ocean-3-poster.jpg`,
  },
]

export default function CollectionsIndexPage() {
  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a1420]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="whitespace-nowrap text-sm text-white/60 transition-colors hover:text-white"
          >
            ← Back to home
          </Link>
          <h1
            className="flex-1 text-center text-xl font-light text-white/95 sm:text-2xl"
            style={SERIF}
          >
            Collections
          </h1>
          <span className="w-[110px] shrink-0 max-sm:hidden" aria-hidden />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="group block overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-white/25"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.poster}
                  alt={c.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <h2 className="text-xl font-light text-white/95" style={SERIF}>
                    {c.title}
                  </h2>
                  <span className="text-sm text-white/70 transition-colors group-hover:text-white">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
