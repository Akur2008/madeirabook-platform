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

const CHECKIN = arg('checkin') || plusDays(0)
const CHECKOUT = arg('checkout') || plusDays(30)
const EXPECTED_SLUGS = ['hotel-orquidea', 'barcelo-funchal-oldtown']

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
  check('2 hotels / 2 properties', hotels === 2 && properties === 2)
  check('>=2 rooms / matching prices', rooms >= 2 && prices === rooms)

  for (const slug of EXPECTED_SLUGS) {
    check(`property id ${slug}`, xml.body.includes(`<PropertyID>${slug}</PropertyID>`))
  }
  check('name Orquidea', xml.body.includes('<Name>Hotel Orqu'))
  check('name Barcelo', xml.body.includes('<Name>Barcel'))
  check('address block', count(xml.body, /<Address>[\s\S]*?<\/Address>/g) === 2)
  check('geo coords', count(xml.body, /<Latitude>\d/g) === 2)
  check('landing pages', count(xml.body, /<LandingPageURL>/g) === 2)
  check('room id', /<RoomID>(unit-type-\d+|standard-room)<\/RoomID>/.test(xml.body))
  check(
    'stay dates',
    xml.body.includes(`<CheckinDate>${CHECKIN}</CheckinDate>`) &&
      xml.body.includes(`<CheckoutDate>${CHECKOUT}</CheckoutDate>`),
  )
  check('baserate > 0', /<Baserate>[1-9]\d*\.?\d*<\/Baserate>/.test(xml.body))
  check(
    'availability element',
    /<Availability status="(available|blocked)"/.test(xml.body),
  )
  check('nightly rates', /<NightlyRates>[\s\S]*?<Night date=/.test(xml.body))
  const nightCount = count(xml.body, /<Night date="/g)
  console.log(`  nightly entries: ${nightCount}`)
  check('nightly covers window', nightCount >= rooms)

  console.log('\n=== 2. JSON feed ===')
  const js = await get(
    `/api/google/hotel-center/feed?checkin=${CHECKIN}&checkout=${CHECKOUT}&format=json`,
  )
  check('status 200', js.res.status === 200, `got ${js.res.status}`)
  let parsed: {
    hotelCenterFeed?: {
      hotels?: {
        property?: Record<string, unknown>
        rooms?: Record<string, unknown>[]
      }[]
    }
  } = {}
  try {
    parsed = JSON.parse(js.body)
  } catch {
    /* handled below */
  }
  const feedHotels = parsed.hotelCenterFeed?.hotels ?? []
  check('json 2 hotels', feedHotels.length === 2, `got ${feedHotels.length}`)
  check(
    'json property ids',
    feedHotels.every((h) => EXPECTED_SLUGS.includes(h.property?.propertyId as string)),
  )
  const firstRoom = feedHotels[0]?.rooms?.[0]
  check('json room', typeof firstRoom?.roomId === 'string')
  check(
    'json price',
    typeof firstRoom?.total === 'number' && (firstRoom.total as number) > 0,
    `total=${firstRoom?.total}`,
  )
  check('json availability', typeof firstRoom?.available === 'boolean')
  check('json nightly', Array.isArray(firstRoom?.nightly))

  console.log('\n=== 3. hotels= override ===')
  const single = await get(`/api/google/hotel-center/feed?hotels=hotel-orquidea&format=json`)
  let singleParsed: { hotelCenterFeed?: { hotels?: { property?: { propertyId?: string } }[] } } = {}
  try {
    singleParsed = JSON.parse(single.body)
  } catch {
    /* handled below */
  }
  check(
    'single hotel override',
    single.res.status === 200 &&
      singleParsed.hotelCenterFeed?.hotels?.length === 1 &&
      singleParsed.hotelCenterFeed?.hotels?.[0]?.property?.propertyId === 'hotel-orquidea',
  )

  console.log('\n=== 4. Defaults + error handling ===')
  const bare = await get('/api/google/hotel-center/feed')
  check('bare url -> 200 xml', bare.res.status === 200 && /<HotelCenterFeed[\s>]/.test(bare.body))
  const badDates = await get(
    `/api/google/hotel-center/feed?checkin=${CHECKOUT}&checkout=${CHECKIN}`,
  )
  check('inverted dates -> 400', badDates.res.status === 400)
  const badFormat = await get('/api/google/hotel-center/feed?format=yaml')
  check('bad format -> 400', badFormat.res.status === 400)
  const missing = await get('/api/google/hotel-center/feed?hotels=no-such-hotel')
  check('unknown hotel -> 404', missing.res.status === 404)

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
