import { NextRequest, NextResponse } from 'next/server'
import { getPayload, type Payload } from 'payload'

import config from '@payload-config'
import { getCurrentOwner } from '@/lib/ownerAuth'
import { parsePropertyBody } from '../shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getOwnedProperty(payload: Payload, ownerId: number, id: string) {
  const numId = Number(id)
  if (!Number.isInteger(numId) || numId <= 0) return null
  const { docs } = await payload.find({
    collection: 'properties',
    where: {
      and: [{ id: { equals: numId } }, { owner: { equals: ownerId } }],
    },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const owner = await getCurrentOwner()
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = parsePropertyBody(raw)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config: await config })
    const existing = await getOwnedProperty(payload, owner.id, id)
    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const slug = (parsed.data.slug || existing.slug).trim()
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }
    const { totalDocs: conflicts } = await payload.count({
      collection: 'properties',
      where: {
        and: [{ slug: { equals: slug } }, { id: { not_equals: existing.id } }],
      },
    })
    if (conflicts) {
      return NextResponse.json(
        { error: 'Slug is already taken' },
        { status: 409 },
      )
    }

    const doc = await payload.update({
      collection: 'properties',
      id: existing.id,
      data: { ...parsed.data, slug },
    })

    console.log(`owner ${owner.id} updated property ${existing.id}`)
    return NextResponse.json({ id: doc.id })
  } catch (e) {
    console.error('owner property update failed:', e)
    const message = e instanceof Error ? e.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const owner = await getCurrentOwner()
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  try {
    const payload = await getPayload({ config: await config })
    const existing = await getOwnedProperty(payload, owner.id, id)
    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const { totalDocs: bookings } = await payload.count({
      collection: 'bookings',
      where: { property: { equals: existing.id } },
    })

    if (bookings > 0) {
      await payload.update({
        collection: 'properties',
        id: existing.id,
        data: { status: 'draft' },
      })
      console.log(
        `property ${existing.id} has ${bookings} bookings, hidden as draft`,
      )
      return NextResponse.json({ ok: true, archived: true })
    }

    await payload.delete({ collection: 'properties', id: existing.id })
    console.log(`owner ${owner.id} deleted property ${existing.id}`)
    return NextResponse.json({ ok: true, deleted: true })
  } catch (e) {
    console.error('owner property delete failed:', e)
    const message = e instanceof Error ? e.message : 'Delete failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
