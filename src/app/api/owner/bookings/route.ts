import { NextResponse } from 'next/server'

import { invalidateOwnerCalendar } from '@/lib/ownerCalendarCache'
import { getCurrentOwner, getOwnerSmoobuIds } from '@/lib/ownerAuth'
import { createReservation } from '@/lib/smoobu'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

// POST /api/owner/bookings
// Body: { aptId, firstName, lastName, email, phone, country, arrivalDate,
//         departureDate, adults, arrivalTime, address: {street, postalCode,
//         location} }
// Creates a manual (direct) reservation in Smoobu for the owner's unit.
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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const aptId = Number(body.aptId)
  const firstName = String(body.firstName || '').trim()
  const lastName = String(body.lastName || '').trim()
  const email = String(body.email || '').trim()
  const phone = String(body.phone || '').trim()
  const country = String(body.country || '').trim()
  const arrivalDate = String(body.arrivalDate || '')
  const departureDate = String(body.departureDate || '')
  const adults = Number(body.adults)
  const arrivalTime = String(body.arrivalTime || '')
  const address = (body.address || {}) as Record<string, unknown>

  if (!Number.isFinite(aptId) || aptId <= 0) {
    return NextResponse.json({ error: 'Invalid aptId' }, { status: 400 })
  }
  if (!firstName) {
    return NextResponse.json(
      { error: 'firstName is required' },
      { status: 400 },
    )
  }
  if (!DATE_REGEX.test(arrivalDate) || !DATE_REGEX.test(departureDate)) {
    return NextResponse.json(
      { error: 'arrivalDate / departureDate must be YYYY-MM-DD' },
      { status: 400 },
    )
  }
  if (departureDate <= arrivalDate) {
    return NextResponse.json(
      { error: 'departureDate must be after arrivalDate' },
      { status: 400 },
    )
  }
  if (arrivalTime && !TIME_REGEX.test(arrivalTime)) {
    return NextResponse.json(
      { error: 'arrivalTime must be HH:MM' },
      { status: 400 },
    )
  }

  const ownerIds = await getOwnerSmoobuIds(owner.id)
  if (!ownerIds.includes(aptId)) {
    return NextResponse.json(
      { error: 'Apartment not linked to your account' },
      { status: 403 },
    )
  }

  try {
    const smoobuId = await createReservation({
      propertyId: aptId,
      arrivalDate,
      departureDate,
      guestName: firstName,
      lastName: lastName || '-',
      guestEmail: email || null,
      phone: phone || '-',
      country: country || 'PT',
      street: String(address.street || '-') || '-',
      postalCode: String(address.postalCode || '-') || '-',
      location: String(address.location || '-') || '-',
      arrivalTime: arrivalTime || '15:00',
      adults: Number.isFinite(adults) && adults > 0 ? adults : 2,
    })
    invalidateOwnerCalendar(owner.id)
    return NextResponse.json({ ok: true, smoobuId })
  } catch (e) {
    console.error('owner manual booking failed:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create booking' },
      { status: 502 },
    )
  }
}
