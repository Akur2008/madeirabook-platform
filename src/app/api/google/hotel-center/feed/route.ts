import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import {
  generateHotelCenterFeed,
  toHotelCenterJson,
  toHotelCenterXml,
} from '@/lib/googleHotelCenter'
import { isValidDate } from '@/lib/googleAri'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function plusDays(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
}

// GET /api/google/hotel-center/feed
//   ?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&guests=2&format=xml|json
//   &hotels=slug1,slug2
//
// Multi-hotel Hotel Center feed: one <Hotel> per feed property (default
// FEED_HOTEL_SLUGS — Hotel Orquídea and Barceló Funchal Oldtown, overridable
// via GOOGLE_HOTEL_FEED_SLUGS or the `hotels` param). Each <Hotel> carries a
// <Property> block (id, name, address, geo, landing page, image) and one
// <Room> per active UnitType with per-night price/availability taken from
// the PMS when linked, else the DB rate.
// Defaults to the next 30 days so the bare URL always returns a usable feed.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const format = (sp.get('format') || 'xml').trim().toLowerCase()
  const checkin = (sp.get('checkin') || plusDays(0)).trim()
  const checkout = (sp.get('checkout') || plusDays(30)).trim()
  const guestsParam = (sp.get('guests') || '').trim()
  const guests = guestsParam ? Number(guestsParam) : undefined
  const hotels = (sp.get('hotels') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (format !== 'xml' && format !== 'json') {
    return NextResponse.json({ error: 'format must be xml or json' }, { status: 400 })
  }
  if (!isValidDate(checkin) || !isValidDate(checkout) || checkin >= checkout) {
    return NextResponse.json(
      { error: 'checkin/checkout must be YYYY-MM-DD and checkin < checkout' },
      { status: 400 },
    )
  }
  if (guests !== undefined && (!Number.isInteger(guests) || guests < 1)) {
    return NextResponse.json({ error: 'guests must be a positive integer' }, { status: 400 })
  }

  let feed
  try {
    feed = await generateHotelCenterFeed({ checkin, checkout, guests, hotels })
  } catch (err) {
    console.error('google/hotel-center feed failed:', err)
    return NextResponse.json({ error: 'feed_generation_failed' }, { status: 500 })
  }
  if (!feed) {
    return NextResponse.json({ error: 'no_feed_hotels_found' }, { status: 404 })
  }

  if (format === 'json') {
    return NextResponse.json(toHotelCenterJson(feed), {
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  return new Response(toHotelCenterXml(feed), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
