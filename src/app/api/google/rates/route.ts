import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import {
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
  isValidDate,
  nightsBetween,
  pushAri,
  serveAriQuery,
  toTransactionJson,
  toTransactionXml,
} from '@/lib/googleAri'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_NIGHTS = 30

// GET /api/google/rates?hotel_id=<slug|pmsId|id>&checkin=YYYY-MM-DD
//   &checkout=YYYY-MM-DD&currency=EUR&format=xml|json&push=1
//
// Serves Google's Transaction response for a live pricing query. Unavailable
// itineraries return HTTP 200 with Baserate -1 (Google convention). With
// push=1 the same ARI data is also pushed to (or mocked for) the Google
// uploads endpoint and the outcome is returned as JSON.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const hotelId = (sp.get('hotel_id') || '').trim()
  const checkin = (sp.get('checkin') || '').trim()
  const checkout = (sp.get('checkout') || '').trim()
  const currency = (sp.get('currency') || BASE_CURRENCY).trim().toUpperCase()
  const format = (sp.get('format') || 'xml').trim().toLowerCase()
  const push = sp.get('push') === '1' || sp.get('push') === 'true'

  if (!hotelId) {
    return NextResponse.json({ error: 'missing hotel_id' }, { status: 400 })
  }
  if (!isValidDate(checkin) || !isValidDate(checkout) || checkin >= checkout) {
    return NextResponse.json(
      { error: 'checkin/checkout must be YYYY-MM-DD and checkin < checkout' },
      { status: 400 },
    )
  }
  if (nightsBetween(checkin, checkout).length > MAX_NIGHTS) {
    return NextResponse.json(
      { error: `stay exceeds ${MAX_NIGHTS} nights` },
      { status: 400 },
    )
  }
  if (!SUPPORTED_CURRENCIES.includes(currency as 'EUR')) {
    return NextResponse.json(
      { error: 'unsupported_currency', supported: SUPPORTED_CURRENCIES },
      { status: 422 },
    )
  }

  let served
  try {
    served = await serveAriQuery({ hotelId, checkin, checkout, currency })
  } catch (err) {
    console.error('google/rates failed:', err)
    return NextResponse.json({ error: 'ari_engine_failed' }, { status: 500 })
  }
  if (!served) {
    return NextResponse.json({ error: 'hotel_not_found' }, { status: 404 })
  }

  const headers = {
    'X-ARI-Cache': served.cached ? 'HIT' : 'MISS',
    'X-Response-Time': `${served.durationMs}ms`,
    'Cache-Control': 'no-store',
  }

  if (push) {
    const outcome = await pushAri(served.result)
    return NextResponse.json(
      { ...toTransactionJson(served.result), cached: served.cached, durationMs: served.durationMs, push: outcome },
      { headers },
    )
  }

  if (format === 'json') {
    return NextResponse.json(
      { ...toTransactionJson(served.result), cached: served.cached, durationMs: served.durationMs },
      { headers },
    )
  }

  return new Response(toTransactionXml(served.result), {
    headers: { ...headers, 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
