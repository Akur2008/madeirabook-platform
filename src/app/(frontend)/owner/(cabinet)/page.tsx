import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import { getCurrentOwner } from '@/lib/ownerAuth'

export const dynamic = 'force-dynamic'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const TILES = [
  { icon: '🔔', label: 'Arrivals today', value: '0' },
  { icon: '💰', label: 'Next payout', value: '€0 (—)' },
  { icon: '📅', label: 'Occupancy this month', value: '0%' },
  { icon: '⭐', label: 'Rating', value: '—' },
]

export default async function OwnerDashboardPage() {
  const owner = await getCurrentOwner()
  if (!owner) redirect('/owner/login')

  const payload = await getPayload({ config: await config })
  const { docs: properties } = await payload.find({
    collection: 'properties',
    where: { owner: { equals: owner.id } },
    limit: 100,
    depth: 0,
    sort: 'title',
  })

  return (
    <div>
      <h1 className="text-3xl font-medium" style={SERIF}>
        Dashboard
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TILES.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <div className="text-2xl">{tile.icon}</div>
            <div className="mt-3 text-xl font-semibold">{tile.value}</div>
            <div className="mt-1 text-xs text-white/50">{tile.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-medium" style={SERIF}>
        Your properties
      </h2>
      {properties.length === 0 ? (
        <p className="mt-4 text-sm text-white/50">
          No properties linked to your account yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {properties.map((p) => (
            <li key={p.id}>
              <Link
                href={`/owner/properties/${p.id}`}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm transition-colors hover:border-white/30"
              >
                <span>{p.title}</span>
                <span className="text-white/40">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
