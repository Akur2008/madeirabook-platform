import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import type { Upload } from '@/payload-types'

export const revalidate = 60

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export const metadata: Metadata = {
  title: 'Madeira Guides — Madeirabook',
  description:
    'Local guides to Madeira: gastronomy, hidden spots, logistics and island history.',
  alternates: {
    canonical: 'https://www.madeirabook.com/guides',
  },
}

const uploadUrl = (u: unknown): string | null =>
  typeof u === 'object' && u !== null && 'url' in u && typeof (u as Upload).url === 'string'
    ? ((u as Upload).url as string)
    : null

export default async function GuidesPage() {
  const payload = await getPayload({ config: await config })
  const { docs: guides } = await payload.find({
    collection: 'guides',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 24,
    depth: 1,
  })

  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <nav className="text-sm text-white/50">
          <Link href="/" className="transition-colors hover:text-white/80">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/80">Guides</span>
        </nav>

        <h1
          className="mt-8 text-4xl font-light text-white/95 md:text-5xl"
          style={SERIF}
        >
          Madeira guides
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
          Where to eat, where to swim, how to get around — field notes from the
          island.
        </p>

        {guides.length === 0 ? (
          <p className="mt-12 text-white/50">New guides coming soon.</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {guides.map((g) => {
              const coverUrl = uploadUrl(g.coverImage)
              return (
                <Link
                  key={g.id}
                  href={`/guides/${g.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-white/25"
                >
                  {coverUrl && (
                    <Image
                      src={coverUrl}
                      alt={g.title}
                      width={800}
                      height={600}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="p-5">
                    {g.category && (
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#d4af37]">
                        {g.category}
                      </p>
                    )}
                    <h2
                      className="mt-1 text-xl font-light leading-tight text-white/95"
                      style={SERIF}
                    >
                      {g.title}
                    </h2>
                    {g.excerpt && (
                      <p className="mb-0 mt-2 line-clamp-3 text-sm text-white/60">
                        {g.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
