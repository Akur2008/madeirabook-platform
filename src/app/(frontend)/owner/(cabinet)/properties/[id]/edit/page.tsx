import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import { getCurrentOwner } from '@/lib/ownerAuth'

import PropertyForm from '../../_components/PropertyForm'
import { getFormOptions } from '../../_lib'

export const dynamic = 'force-dynamic'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

function relIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) =>
      typeof v === 'object' && v !== null
        ? (v as { id?: unknown }).id
        : v,
    )
    .filter((x): x is number => typeof x === 'number')
}

function relId(value: unknown): string {
  if (value === null || value === undefined) return ''
  const id =
    typeof value === 'object' ? (value as { id?: unknown }).id : value
  return typeof id === 'number' ? String(id) : ''
}

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const owner = await getCurrentOwner()
  if (!owner) redirect('/owner/login')

  const { id } = await params
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'properties',
    where: {
      and: [{ id: { equals: Number(id) } }, { owner: { equals: owner.id } }],
    },
    limit: 1,
    depth: 1,
  })
  const p = docs[0]
  if (!p) notFound()

  const { amenities, houseRules, locations } = await getFormOptions()

  return (
    <div className="max-w-2xl">
      <Link
        href="/owner/properties"
        className="text-sm text-white/50 transition-colors hover:text-white"
      >
        &larr; Properties
      </Link>
      <h1 className="mt-4 text-3xl font-medium" style={SERIF}>
        Edit property
      </h1>
      <p className="mb-6 mt-2 text-sm text-white/50">
        Slug: <span className="font-mono">{p.slug}</span>
      </p>

      <PropertyForm
        mode="edit"
        propertyId={p.id}
        amenities={amenities}
        houseRules={houseRules}
        locations={locations}
        initial={{
          title: p.title ?? '',
          slug: p.slug ?? '',
          description: p.description ?? '',
          shortDescription: p.shortDescription ?? '',
          pricePerNight:
            p.pricePerNight !== null && p.pricePerNight !== undefined
              ? String(p.pricePerNight)
              : '',
          cleaningFee:
            p.cleaningFee !== null && p.cleaningFee !== undefined
              ? String(p.cleaningFee)
              : '',
          sizeM2:
            p.sizeM2 !== null && p.sizeM2 !== undefined
              ? String(p.sizeM2)
              : '',
          bedrooms:
            p.bedrooms !== null && p.bedrooms !== undefined
              ? String(p.bedrooms)
              : '1',
          bathrooms:
            p.bathrooms !== null && p.bathrooms !== undefined
              ? String(p.bathrooms)
              : '1',
          maxGuests:
            p.maxGuests !== null && p.maxGuests !== undefined
              ? String(p.maxGuests)
              : '2',
          checkInTime: p.checkInTime ?? '15:00',
          checkOutTime: p.checkOutTime ?? '11:00',
          location: relId(p.location),
          pmsPropertyId: p.pmsPropertyId ?? '',
          isVerified: p.isVerified ?? false,
          status: p.status ?? 'draft',
          amenities: relIds(p.amenities),
          houseRules: relIds(p.houseRules),
        }}
      />

      <div className="mt-4 flex items-center gap-4 text-sm">
        <Link
          href={`/owner/properties/${p.id}/media`}
          className="text-emerald-300 transition-colors hover:text-emerald-200"
        >
          Manage photos
        </Link>
        <Link
          href={`/p/${p.slug}`}
          target="_blank"
          className="text-white/50 transition-colors hover:text-white"
        >
          View public page &rarr;
        </Link>
      </div>
    </div>
  )
}
