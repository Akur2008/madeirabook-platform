import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { createProperty } from '@/lib/pms'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/admin/zeevou/publish
// Body: { propertyId }
// Publishes a Payload property to the Zeevou (Silver) account: creates
// property + unit_type + unit + rate_plan, then stores the returned
// zeevou_property_id in pmsPropertyId and sets pms = 'zeevou'.
export async function POST(req: Request) {
  const payload = await getPayload({ config: await config })

  const { user } = await payload.auth({ headers: await headers() })
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { propertyId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const propertyId = Number(body.propertyId)
  if (!Number.isFinite(propertyId) || propertyId <= 0) {
    return NextResponse.json({ error: 'Invalid propertyId' }, { status: 400 })
  }

  let property
  try {
    property = await payload.findByID({
      collection: 'properties',
      id: propertyId,
      depth: 1,
    })
  } catch {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  if (property.pms === 'zeevou' && property.pmsPropertyId) {
    return NextResponse.json(
      { error: 'already_published', zeevouId: property.pmsPropertyId },
      { status: 409 },
    )
  }

  const location =
    property.location && typeof property.location === 'object'
      ? (property.location as unknown as Record<string, unknown>)
      : null

  try {
    const { propertyId: zeevouId, pmsMeta } = await createProperty({
      name: property.title,
      shortName: property.slug,
      description: property.description || property.shortDescription || '',
      address: {
        street: '-',
        postalCode: '-',
        city: location?.title ? String(location.title) : 'Funchal',
        country: 'PT',
      },
      maxGuests: property.maxGuests ?? 2,
      bedrooms: property.bedrooms ?? 1,
      basePrice: property.pricePerNight ?? 100,
    })

    await payload.update({
      collection: 'properties',
      id: propertyId,
      data: {
        pms: 'zeevou',
        pmsPropertyId: String(zeevouId),
        pmsMeta,
      },
    })

    return NextResponse.json({ ok: true, zeevouId, pmsMeta })
  } catch (e) {
    console.error('zeevou publish failed:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Zeevou publish failed' },
      { status: 502 },
    )
  }
}
