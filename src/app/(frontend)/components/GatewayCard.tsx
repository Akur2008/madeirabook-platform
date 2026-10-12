'use client'

import Link from 'next/link'
import React from 'react'

import type { SluicePage } from '@/payload-types'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export default function GatewayCard({ page }: { page: SluicePage }) {
  return (
    <Link
      href={`/gateway/${page.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-white/10"
    >
      {page.posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.posterUrl}
          alt={page.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}

      {/* Mini bottom-sheet: same glass panel language as EscapeCardSheet */}
      <div
        className="absolute inset-x-3 bottom-3 rounded-xl border border-white/15 p-4 pt-3 backdrop-blur-xl"
        style={{ background: 'rgba(10, 20, 32, 0.72)' }}
      >
        <div className="mx-auto mb-3 h-0.5 w-8 rounded-full bg-white/20" />
        <h3 className="text-xl font-light leading-tight text-white/95" style={SERIF}>
          {page.title}
        </h3>
        {page.shortDescription && (
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-white/60">
            {page.shortDescription}
          </p>
        )}
        <span className="mt-4 block w-full rounded-full bg-white py-2.5 text-center text-xs font-semibold uppercase tracking-widest text-[#0a1420] transition-colors group-hover:bg-white/85">
          Enter this path →
        </span>
      </div>
    </Link>
  )
}
