import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { getReservations } from '@/lib/pms'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/ical/[propertyId].ics — iCal export of the property's booked
// dates. Paste this URL into Zeevou (Settings -> iCal import) so external
// channels see our direct bookings. Sources: PMS reservations (routed by
// property.pms) + rows from our own bookings collection (status=paid).
// DTEND is the checkout day (exclusive), per RFC 5545 all-day events.

function icsDate(d: Date | string): string {
  const s = typeof d === 'string' ? d : d.toISOString()
  return s.slice(0, 10).replace(/-/g, '')
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

interface BusyRange {
  arrival: string
  departure: string
  summary: string
  uid: string
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params
  const idStr = String(slug?.[0] || '').replace(/\.ics$/i, '')
  const propertyId = Number(idStr)
  if (!Number.isFinite(propertyId) || propertyId <= 0) {
    return NextResponse.json({ error: 'Invalid property id' }, { status: 400 })
  }

  const payload = await getPayload({ config: await config })
  let property
  try {
    property = await payload.findByID({
      collection: 'properties',
      id: propertyId,
      depth: 0,
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const now = new Date()
  const from = new Date(now)
  from.setUTCMonth(from.getUTCMonth() - 1)
  const to = new Date(now)
  to.setUTCFullYear(to.getUTCFullYear() + 1)
  const fromStr = from.toISOString().slice(0, 10)
  const toStr = to.toISOString().slice(0, 10)

  const ranges: BusyRange[] = []

  if (property.pmsPropertyId) {
    try {
      const bookings = await getReservations(property, fromStr, toStr)
      for (const b of bookings) {
        if (b.cancelled || b.blocked) continue
        if (!b.arrival || !b.departure) continue
        ranges.push({
          arrival: b.arrival,
          departure: b.departure,
          summary: `Booked (${b.channel || 'PMS'})`,
          uid: `pms-${b.id}@madeirabook`,
        })
      }
    } catch (e) {
      console.warn(`ical: pms reservations failed for ${propertyId}:`, e)
    }
  }

  try {
    const { docs } = await payload.find({
      collection: 'bookings',
      where: {
        and: [
          { property: { equals: propertyId } },
          { status: { equals: 'paid' } },
          { departure: { greater_than: from.toISOString() } },
          { arrival: { less_than: to.toISOString() } },
        ],
      },
      limit: 500,
      depth: 0,
    })
    for (const b of docs) {
      if (!b.arrival || !b.departure) continue
      ranges.push({
        arrival: String(b.arrival).slice(0, 10),
        departure: String(b.departure).slice(0, 10),
        summary: 'Booked (direct)',
        uid: `bk-${b.id}@madeirabook`,
      })
    }
  } catch (e) {
    console.warn(`ical: local bookings failed for ${propertyId}:`, e)
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Madeirabook//Property Availability//EN',
    `X-WR-CALNAME:${escapeIcsText(property.title)}`,
  ]
  for (const r of ranges) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${r.uid}`,
      `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART;VALUE=DATE:${icsDate(r.arrival)}`,
      `DTEND;VALUE=DATE:${icsDate(r.departure)}`,
      `SUMMARY:${escapeIcsText(r.summary)}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${propertyId}.ics"`,
      'Cache-Control': 'no-cache',
    },
  })
}
