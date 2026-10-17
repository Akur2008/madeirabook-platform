import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { ownerCalendarCache } from '@/lib/ownerCalendarCache'
import { getCurrentOwner } from '@/lib/ownerAuth'
import {
  getRates,
  getReservations,
  type SmoobuRatesMap,
} from '@/lib/smoobu'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_TTL_MS = 5 * 60 * 1000
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

interface CalendarResponse {
  month: string
  apartments: { id: number; name: string; aptId: number | null }[]
  rates: SmoobuRatesMap
  bookings: {
    id: number
    propertyId: number
    aptId: number
    arrival: string
    departure: string
    channel: string
    guestName: string
    guestEmail: string
    guestPhone: string
    price: number
    adults: number
    children: number
    guests: number
    checkIn: string
    checkOut: string
  }[]
}

// In-memory cache shared across dev hot reloads; invalidated by the
// owner mutation routes (rates / bookings) after writes to Smoobu.
const cache = ownerCalendarCache as Map<
  string,
  { at: number; data: CalendarResponse }
>

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function GET(req: Request) {
  const owner = await getCurrentOwner()
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const monthParam = url.searchParams.get('month') || ''
  let year: number
  let monthIdx: number // 0-based
  if (MONTH_REGEX.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number)
    year = y
    monthIdx = m - 1
  } else {
    const now = new Date()
    year = now.getFullYear()
    monthIdx = now.getMonth()
  }
  const month = `${year}-${String(monthIdx + 1).padStart(2, '0')}`

  const cacheKey = `${owner.id}:${month}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.data)
  }

  try {
    const payload = await getPayload({ config: await config })
    const { docs: properties } = await payload.find({
      collection: 'properties',
      where: { owner: { equals: owner.id } },
      limit: 100,
      depth: 0,
      sort: 'title',
    })

    const apartments = properties.map((p) => ({
      id: p.id,
      name: p.title,
      aptId:
        p.pmsPropertyId && Number.isFinite(Number(p.pmsPropertyId))
          ? Number(p.pmsPropertyId)
          : null,
    }))
    const aptIds = apartments
      .map((a) => a.aptId)
      .filter((id): id is number => id !== null)

    // Fetch one month of padding on both sides so bookings and rates
    // spanning the month boundary still render correctly.
    const from = fmtDate(new Date(year, monthIdx - 1, 1))
    const to = fmtDate(new Date(year, monthIdx + 2, 0))

    const [rates, reservations] = await Promise.all([
      aptIds.length ? getRates(aptIds, from, to) : Promise.resolve({}),
      getReservations(from, to),
    ])

    const aptIdSet = new Set(aptIds.map(String))
    const bookings: CalendarResponse['bookings'] = []
    for (const b of reservations) {
      const aptId = String(b.apartment?.id ?? '')
      if (!aptIdSet.has(aptId)) continue
      if (b['is-blocked-booking']) continue
      if (b.status === 'cancelled' || b.type === 'cancellation') continue

      const prop = apartments.find((a) => String(a.aptId) === aptId)
      if (!prop) continue

      bookings.push({
        id: b.id,
        propertyId: prop.id,
        aptId: Number(aptId),
        arrival: b.arrival,
        departure: b.departure,
        channel: b.channel?.name || 'Direct',
        guestName:
          b['guest-name'] ||
          `${b.firstname || ''} ${b.lastname || ''}`.trim(),
        guestEmail: b.email || '',
        guestPhone: b.phone || '',
        price: Number(b.price) || 0,
        adults: Number(b.adults) || 0,
        children: Number(b.children) || 0,
        guests: (Number(b.adults) || 0) + (Number(b.children) || 0),
        checkIn: b['check-in'] || '',
        checkOut: b['check-out'] || '',
      })
    }

    const data: CalendarResponse = {
      month,
      apartments,
      rates,
      bookings,
    }
    cache.set(cacheKey, { at: Date.now(), data })
    console.log(
      `owner calendar: user ${owner.id} month ${month} — ${apartments.length} apartments, ${bookings.length} bookings`,
    )
    return NextResponse.json(data)
  } catch (e) {
    console.error('owner calendar failed:', e)
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : 'Failed to load calendar data',
      },
      { status: 502 },
    )
  }
}
