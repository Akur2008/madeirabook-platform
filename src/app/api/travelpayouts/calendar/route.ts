import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const REVALIDATE_SECONDS = 3600
const MADEIRA_IATA = 'FNC'
const ORIGIN_RE = /^[A-Z]{3}$/
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

type CalendarEntry = {
  price?: number
}

export async function GET(req: NextRequest) {
  const origin = (req.nextUrl.searchParams.get('origin') ?? '')
    .trim()
    .toUpperCase()
  const month = (req.nextUrl.searchParams.get('month') ?? '').trim()

  if (!ORIGIN_RE.test(origin) || !MONTH_RE.test(month)) {
    return NextResponse.json(
      { error: 'Expected origin=<IATA> and month=<YYYY-MM>' },
      { status: 400 },
    )
  }

  const token = process.env.TRAVELPAYOUTS_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: 'TRAVELPAYOUTS_TOKEN is not configured' },
      { status: 503 },
    )
  }

  try {
    const url =
      `https://api.travelpayouts.com/v1/prices/calendar` +
      `?origin=${origin}&destination=${MADEIRA_IATA}` +
      `&depart_date=${month}&calendar_type=departure_date` +
      `&currency=EUR&token=${token}`
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`travelpayouts ${res.status}`)

    const body = (await res.json()) as { data?: Record<string, CalendarEntry> }
    const prices = Object.entries(body?.data ?? {})
      .map(([date, entry]) => ({ date, price: entry?.price }))
      .filter(
        (p): p is { date: string; price: number } =>
          typeof p.price === 'number' && Number.isFinite(p.price),
      )
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(
      {
        origin,
        destination: MADEIRA_IATA,
        month,
        currency: 'EUR',
        prices,
      },
      {
        headers: {
          'Cache-Control':
            'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    )
  } catch (err) {
    console.warn('travelpayouts calendar: fetch failed', err)
    return NextResponse.json(
      { error: 'Upstream price fetch failed' },
      { status: 502 },
    )
  }
}
