import { NextResponse } from 'next/server'

import { checkAvailability } from '@/lib/smoobu'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// POST /api/search-availability — ported from madeirabook-core
// routes/search.js. Body: { arrivalDate, departureDate } (YYYY-MM-DD).
// Returns only available properties, sorted by price asc:
//   [{ slug, name, price, currency, coverImage }]
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_dates' }, { status: 400 })
  }

  const { arrivalDate: rawArrival, departureDate: rawDeparture } = (body ??
    {}) as Record<string, unknown>
  const arrivalDate = typeof rawArrival === 'string' ? rawArrival.trim() : ''
  const departureDate =
    typeof rawDeparture === 'string' ? rawDeparture.trim() : ''

  if (
    !DATE_RE.test(arrivalDate) ||
    !DATE_RE.test(departureDate) ||
    arrivalDate >= departureDate
  ) {
    return NextResponse.json({ error: 'invalid_dates' }, { status: 400 })
  }

  try {
    const items = await checkAvailability({ arrivalDate, departureDate })
    return NextResponse.json(items)
  } catch (err) {
    console.error('search-availability failed', err)
    return NextResponse.json({ error: 'search_unavailable' }, { status: 500 })
  }
}
