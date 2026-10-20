import { getPayload } from 'payload'

import config from '../src/payload.config.js'
import 'dotenv/config'

// Validation runner for GET /api/google/rates. Needs the dev server running
// (npm run dev) unless --base points elsewhere.
// Run: npx tsx scripts/test-google-rates.ts
//      [--hotel=slug] [--checkin=YYYY-MM-DD] [--checkout=YYYY-MM-DD]
//      [--base=http://localhost:3000]

const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]

const BASE = arg('base') || process.env.APP_URL || 'http://localhost:3000'

function plusDays(n: number): string {
  const d = new Date(Date.now() + n * 86400000)
  return d.toISOString().slice(0, 10)
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

async function resolveHotelId(): Promise<string> {
  if (arg('hotel')) return arg('hotel')!
  const payload = await getPayload({ config: await config })
  const found = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { status: { equals: 'published' } },
        { pmsPropertyId: { exists: true } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  const slug = found.docs[0]?.slug as string | undefined
  if (!slug) throw new Error('no published property found — pass --hotel=<slug>')
  console.log(`hotel_id resolved from DB: ${slug}`)
  return slug
}

async function get(path: string) {
  const started = Date.now()
  const res = await fetch(`${BASE}${path}`)
  return { res, ms: Date.now() - started, body: await res.text() }
}

async function main() {
  console.log(`Base: ${BASE}  window: ${CHECKIN} -> ${CHECKOUT}`)
  const hotel = await resolveHotelId()
  const qs = `hotel_id=${encodeURIComponent(hotel)}&checkin=${CHECKIN}&checkout=${CHECKOUT}`

  console.log('\n=== 1. XML live query (cold) ===')
  const xml1 = await get(`/api/google/rates?${qs}&currency=EUR`)
  check('status 200', xml1.res.status === 200, `got ${xml1.res.status}`)
  check('transaction xml', /<Transaction[\s>]/.test(xml1.body) && xml1.body.includes('<Baserate'))
  console.log(`  cold latency: ${xml1.ms}ms (cache: ${xml1.res.headers.get('x-ari-cache')})`)

  console.log('\n=== 2. JSON format ===')
  const js = await get(`/api/google/rates?${qs}&currency=EUR&format=json`)
  check('status 200', js.res.status === 200)
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(js.body)
  } catch {
    /* handled below */
  }
  const result = (parsed as { transaction?: { result?: Record<string, unknown> } })
    .transaction?.result
  check('result fields', Boolean(result?.baserate !== undefined && result?.nights === 5), JSON.stringify(result?.nights ?? '?'))
  const pos = (result?.pointsOfSale as { url?: string }[] | undefined)?.[0]?.url || ''
  check('deep link has dates', pos.includes(`checkin=${CHECKIN}`) && pos.includes(`checkout=${CHECKOUT}`), pos.slice(0, 90))

  console.log('\n=== 3. Cached repeat (<300ms target) ===')
  const warm = await get(`/api/google/rates?${qs}&currency=EUR`)
  check('cache HIT', warm.res.headers.get('x-ari-cache') === 'HIT', warm.res.headers.get('x-ari-cache') || 'none')
  // X-Response-Time measures the engine; total ms includes dev-server overhead.
  const engineMs = Number((warm.res.headers.get('x-response-time') || '9999').replace('ms', ''))
  check('engine under 300ms', engineMs < 300, `engine ${engineMs}ms, http total ${warm.ms}ms`)

  console.log('\n=== 4. ARI push (sandbox) ===')
  const push = await get(`/api/google/rates?${qs}&push=1`)
  check('status 200', push.res.status === 200)
  let pushJson: { push?: { mode?: string; status?: number | null; detail?: string } } = {}
  try {
    pushJson = JSON.parse(push.body)
  } catch {
    /* handled below */
  }
  check('push outcome present', Boolean(pushJson.push?.mode), pushJson.push?.mode || '?')
  if (pushJson.push?.mode === 'mock') {
    console.log('  mock log excerpt:')
    console.log((pushJson.push.detail || '').split('\n').slice(0, 12).map((l) => `    ${l}`).join('\n'))
  } else {
    console.log(`  pushed -> HTTP ${pushJson.push?.status}`)
  }

  console.log('\n=== 5. Error handling ===')
  const noHotel = await get('/api/google/rates')
  check('missing hotel_id -> 400', noHotel.res.status === 400)
  const badDates = await get(`/api/google/rates?hotel_id=${hotel}&checkin=${CHECKOUT}&checkout=${CHECKIN}`)
  check('inverted dates -> 400', badDates.res.status === 400)
  const badCur = await get(`/api/google/rates?${qs}&currency=USD`)
  check('USD -> 422', badCur.res.status === 422)
  const unknown = await get(`/api/google/rates?hotel_id=no-such-hotel&checkin=${CHECKIN}&checkout=${CHECKOUT}`)
  check('unknown hotel -> 404', unknown.res.status === 404)

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
