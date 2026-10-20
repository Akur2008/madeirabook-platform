import 'dotenv/config'

// Validation runner for GET /api/google/hotel-center/feed. Needs the dev
// server running (npm run dev) unless --base points elsewhere.
// Run: npx tsx scripts/test-google-hotel-center.ts
//      [--checkin=YYYY-MM-DD] [--checkout=YYYY-MM-DD] [--base=http://localhost:3000]

const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]

const BASE = arg('base') || process.env.APP_URL || 'http://localhost:3000'

function plusDays(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
}

const CHECKIN = arg('checkin') || plusDays(30)
const CHECKOUT = arg('checkout') || plusDays(35)

let passed = 0
let failed = 0

function check(name: string, ok: boolean, detail = ''): void {
  if (ok) {
    passed += 1
    console.log(`  PASS ${name}${detail ? ` — ${detail}` : ''}`)
  } else {
    failed += 1
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function count(haystack: string, needle: RegExp): number {
  return (haystack.match(needle) || []).length
}

async function get(path: string) {
  const started = Date.now()
  const res = await fetch(`${BASE}${path}`)
  return { res, ms: Date.now() - started, body: await res.text() }
}

async function main() {
  console.log(`Base: ${BASE}  window: ${CHECKIN} -> ${CHECKOUT}`)

  console.log('\n=== 1. XML feed ===')
  const xml = await get(
    `/api/google/hotel-center/feed?checkin=${CHECKIN}&checkout=${CHECKOUT}`,
  )
  check('status 200', xml.res.status === 200, `got ${xml.res.status}`)
  check('content-type xml', (xml.res.headers.get('content-type') || '').includes('xml'))
  check('root element', /<HotelCenterFeed[\s>]/.test(xml.body))

  const hotels = count(xml.body, /<Hotel>/g)
  const properties = count(xml.body, /<Property>/g)
  const rooms = count(xml.body, /<Room>/g)
  const prices = count(xml.body, /<Price[\s>]/g)
  console.log(`  counts: hotels=${hotels} properties=${properties} rooms=${rooms} prices=${prices}`)
  check('1 hotel / 1 property', hotels === 1 && properties === 1)
  check('>=1 room / matching prices', rooms >= 1 && prices === rooms)

  check('property id', xml.body.includes('<PropertyID>hotel-orquidea</PropertyID>'))
  check('name', xml.body.includes('<Name>Hotel Orqu'))
  check('address block', /<Address>[\s\S]*<Postal>[\s\S]*<\/Address>/.test(xml.body))
  check('geo coords', /<Latitude>\d/.test(xml.body) && /<Longitude>-\d/.test(xml.body))
  check('landing page', xml.body.includes('<LandingPageURL>') && xml.body.includes('/p/hotel-orquidea'))
  check('image url', /<ImageURL>https:\/\//.test(xml.body))
  check('room id', /<RoomID>(unit-type-\d+|standard-room)<\/RoomID>/.test(xml.body))
  check('occupancy 2', xml.body.includes('<Occupancy>2</Occupancy>'))
  check(
    'stay dates',
    xml.body.includes(`<CheckinDate>${CHECKIN}</CheckinDate>`) &&
      xml.body.includes(`<CheckoutDate>${CHECKOUT}</CheckoutDate>`),
  )
  check('baserate > 0', /<Baserate>[1-9]\d*\.?\d*<\/Baserate>/.test(xml.body))

  console.log('\n=== 2. JSON feed ===')
  const js = await get(
    `/api/google/hotel-center/feed?checkin=${CHECKIN}&checkout=${CHECKOUT}&format=json`,
  )
  check('status 200', js.res.status === 200, `got ${js.res.status}`)
  let parsed: {
    hotelCenterFeed?: {
      hotel?: {
        property?: Record<string, unknown>
        rooms?: Record<string, unknown>[]
      }
    }
  } = {}
  try {
    parsed = JSON.parse(js.body)
  } catch {
    /* handled below */
  }
  const property = parsed.hotelCenterFeed?.hotel?.property
  const room = parsed.hotelCenterFeed?.hotel?.rooms?.[0]
  check('json property', property?.propertyId === 'hotel-orquidea')
  check('json room', typeof room?.roomId === 'string' && room?.nights === 5)
  check('json price', typeof room?.total === 'number' && (room.total as number) > 0, `total=${room?.total}`)

  console.log('\n=== 3. Defaults + error handling ===')
  const bare = await get('/api/google/hotel-center/feed')
  check('bare url -> 200 xml', bare.res.status === 200 && /<HotelCenterFeed[\s>]/.test(bare.body))
  const badDates = await get(
    `/api/google/hotel-center/feed?checkin=${CHECKOUT}&checkout=${CHECKIN}`,
  )
  check('inverted dates -> 400', badDates.res.status === 400)
  const badFormat = await get('/api/google/hotel-center/feed?format=yaml')
  check('bad format -> 400', badFormat.res.status === 400)

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
