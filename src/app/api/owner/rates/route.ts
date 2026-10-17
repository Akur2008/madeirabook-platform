import { NextResponse } from 'next/server'

import { invalidateOwnerCalendar } from '@/lib/ownerCalendarCache'
import { getCurrentOwner, getOwnerSmoobuIds } from '@/lib/ownerAuth'
import { setRates } from '@/lib/smoobu'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

// POST /api/owner/rates
// Body: { aptId, startDate, endDate, price, minNights? }
// Writes the daily price / min stay to Smoobu for one of the owner's units.
export async function POST(req: Request) {
  const owner = await getCurrentOwner()
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (owner.hasActiveSubscription !== true) {
    return NextResponse.json(
      { error: 'subscription_required' },
      { status: 403 },
    )
  }

  let body: {
    aptId?: unknown
    startDate?: unknown
    endDate?: unknown
    price?: unknown
    minNights?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const aptId = Number(body.aptId)
  const startDate = String(body.startDate || '')
  const endDate = String(body.endDate || '')
  const price = Number(body.price)
  const minNights =
    body.minNights == null || body.minNights === ''
      ? null
      : Number(body.minNights)

  if (!Number.isFinite(aptId) || aptId <= 0) {
    return NextResponse.json({ error: 'Invalid aptId' }, { status: 400 })
  }
  if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
    return NextResponse.json(
      { error: 'startDate / endDate must be YYYY-MM-DD' },
      { status: 400 },
    )
  }
  if (endDate < startDate) {
    return NextResponse.json(
      { error: 'endDate must be on or after startDate' },
      { status: 400 },
    )
  }
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json(
      { error: 'Price must be greater than 0' },
      { status: 400 },
    )
  }
  if (minNights !== null && (!Number.isFinite(minNights) || minNights < 0)) {
    return NextResponse.json({ error: 'Invalid minNights' }, { status: 400 })
  }

  // Owners may only write rates for their own units.
  const ownerIds = await getOwnerSmoobuIds(owner.id)
  if (!ownerIds.includes(aptId)) {
    return NextResponse.json(
      { error: 'Apartment not linked to your account' },
      { status: 403 },
    )
  }

  try {
    await setRates([aptId], startDate, endDate, price, minNights)
    invalidateOwnerCalendar(owner.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('owner rates update failed:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update rates' },
      { status: 502 },
    )
  }
}
