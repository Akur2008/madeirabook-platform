import type { Metadata } from 'next'
import React from 'react'

import ApplyForm from './ApplyForm'

export const metadata: Metadata = {
  title: 'Madeirabook — Ambassadors',
  description: 'Create your own Madeira map. Earn 2% from every booking.',
  robots: { index: false, follow: false },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export default function AmbassadorsPage() {
  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      <div className="mx-auto max-w-md px-6 py-12">
        <h1
          className="text-center text-4xl font-medium tracking-tight text-white"
          style={SERIF}
        >
          Create your own Madeira map.
        </h1>
        <p className="mt-4 text-center text-xl text-white/80" style={SERIF}>
          Earn 2% from every booking. By invitation only.
        </p>
        <p className="mt-4 text-center text-sm leading-snug text-white/50">
          We work with 10 curated creators at a time. You curate the guide — we
          power the platform. Apply for an invitation below.
        </p>

        <div className="mt-10">
          <ApplyForm />
        </div>
      </div>
    </div>
  )
}
