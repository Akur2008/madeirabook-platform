import { NextResponse } from 'next/server'

import { invalidateOwnerCalendar } from '@/lib/ownerCalendarCache'
import { getCurrentOwner, getOwnerSmoobuIds } from '@/lib/ownerAuth'
import { cancelReservation, getReservations } from '@/lib/smoobu'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// DELETE /api/owner/bookings/[id]
// Cancels a Smoobu reservation. Ownership is verified by fetching the
// reservation from Smoobu and matching its apartment id against the
// owner's units — same check as the legacy Express app.
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
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

  const { id } = await ctx.params
  const smoobuId = Number(id)
  if (!Number.isFinite(smoobuId) || smoobuId <= 0) {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 })
  }

  try {
    const ownerIds = await getOwnerSmoobuIds(owner.id)
    if (!ownerIds.length) {
      return NextResponse.json(
        { error: 'No apartments linked to your account' },
        { status: 400 },
      )
    }

    const from = new Date()
    from.setMonth(from.getMonth() - 6)
    const to = new Date()
    to.setMonth(to.getMonth() + 18)
    const bookings = await getReservations(fmt(from), fmt(to))
    const booking = bookings.find((b) => Number(b.id) === smoobuId)
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found in Smoobu' },
        { status: 404 },
      )
    }
    const aptId = Number(booking.apartment?.id)
    if (!ownerIds.includes(aptId)) {
      return NextResponse.json({ error: 'Not your booking' }, { status: 403 })
    }

    await cancelReservation(smoobuId)
    invalidateOwnerCalendar(owner.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('owner booking cancel failed:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to cancel booking' },
      { status: 502 },
    )
  }
}
