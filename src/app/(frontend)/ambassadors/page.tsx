import type { Metadata } from 'next'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import ApplyForm from './ApplyForm'

export const metadata: Metadata = {
  title: 'Madeirabook — Ambassadors',
  description: 'Create your own Madeira map. Earn 2% from every booking.',
  robots: { index: false, follow: false },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export const dynamic = 'force-dynamic'

export default async function AmbassadorsPage() {
  const payload = await getPayload({ config: await config })

  const [{ docs: beaches }, { docs: restaurants }] = await Promise.all([
    payload.find({
      collection: 'beaches',
      where: { status: { equals: 'published' } },
      sort: 'name',
      limit: 200,
      depth: 0,
    }),
    payload.find({
      collection: 'restaurants',
      where: { status: { equals: 'published' } },
      sort: 'name',
      limit: 200,
      depth: 0,
    }),
  ])

  const spotOptions = (docs: { id: number | string; name: string }[]) =>
    docs.map((d) => ({ id: String(d.id), name: d.name }))

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
          <ApplyForm
            beaches={spotOptions(beaches)}
            restaurants={spotOptions(restaurants)}
          />
        </div>
      </div>
    </div>
  )
}
