import 'dotenv/config'
import pg from 'pg'
import { getPayload } from 'payload'
import type { Payload, Where } from 'payload'
import config from '../src/payload.config.js'

const { Client } = pg

const stats = { ok: 0, skip: 0, fail: 0 }
const ok = (msg: string) => {
  stats.ok++
  console.log(`OK ${msg}`)
}
const skip = (msg: string) => {
  stats.skip++
  console.log(`SKIP ${msg}`)
}
const fail = (msg: string, err: unknown) => {
  stats.fail++
  console.log(`FAIL ${msg}: ${err instanceof Error ? err.message : String(err)}`)
}

const BOOKING_STATUSES = ['pending', 'paid', 'paid_no_pms', 'cancelled', 'refunded'] as const
type BookingStatus = (typeof BOOKING_STATUSES)[number]

const BOOKING_SOURCES = ['booking_channel', 'direct', 'owner_manual'] as const
type BookingSource = (typeof BOOKING_SOURCES)[number]

const toNum = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

const toIso = (v: unknown): string | undefined => {
  if (v === null || v === undefined || v === '') return undefined
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

async function findByField(
  payload: Payload,
  collection: 'webhook-events' | 'bookings' | 'properties',
  field: string,
  value: string,
) {
  const res = await payload.find({
    collection,
    where: { [field]: { equals: value } } as Where,
    limit: 1,
    depth: 0,
  })
  return res.docs[0] ?? null
}

async function main() {
  const legacy = new Client({ connectionString: process.env.LEGACY_DATABASE_URL })
  await legacy.connect()
  const payload = await getPayload({ config })

  console.log('--- webhook_events ---')
  const events = await legacy.query(
    `SELECT id, type, processed_at, created_at FROM webhook_events ORDER BY created_at`,
  )
  for (const row of events.rows) {
    if (!row.id || !row.type) {
      skip(`webhook_event (missing id/type)`)
      continue
    }
    try {
      const data = {
        eventId: row.id,
        eventType: row.type,
        processedAt: toIso(row.processed_at) ?? toIso(row.created_at) ?? new Date().toISOString(),
        status: 'processed' as const,
        createdAt: toIso(row.created_at),
      }
      const existing = await findByField(payload, 'webhook-events', 'eventId', row.id)
      if (existing) {
        await payload.update({ collection: 'webhook-events', id: existing.id, data })
      } else {
        await payload.create({ collection: 'webhook-events', data })
      }
      ok(`webhook_event ${row.id}`)
    } catch (e) {
      fail(`webhook_event ${row.id}`, e)
    }
  }

  console.log('--- bookings ---')
  const bookings = await legacy.query(
    `SELECT b.*, p.slug AS property_slug
     FROM bookings b LEFT JOIN properties p ON p.id = b.property_id
     ORDER BY b.id`,
  )
  for (const row of bookings.rows) {
    const label = row.stripe_session_id ?? `legacy#${row.id}`
    try {
      const status = BOOKING_STATUSES.includes(row.status) ? (row.status as BookingStatus) : null
      if (!status) {
        skip(`booking ${label} (unknown status: ${row.status})`)
        continue
      }
      const source = BOOKING_SOURCES.includes(row.source)
        ? (row.source as BookingSource)
        : 'direct'

      const property = row.property_slug
        ? await findByField(payload, 'properties', 'slug', row.property_slug)
        : null

      const data = {
        stripeSessionId: row.stripe_session_id ?? undefined,
        stripePaymentIntent: row.stripe_payment_intent ?? undefined,
        property: property?.id ?? undefined,
        propertySlug: row.property_slug ?? undefined,
        arrival: toIso(row.arrival_date),
        departure: toIso(row.departure_date),
        guestEmail: row.guest_email ?? undefined,
        guestTelegramId: toNum(row.guest_telegram_id),
        amountTotal: toNum(row.amount_cents),
        platformFeeCents: toNum(row.platform_fee_cents),
        currency: 'eur',
        status,
        source,
        smoobuBookingId: row.smoobu_booking_id ?? undefined,
        createdAt: toIso(row.created_at),
      }

      let existing = row.stripe_session_id
        ? await findByField(payload, 'bookings', 'stripeSessionId', row.stripe_session_id)
        : null
      if (!existing && row.smoobu_booking_id) {
        existing = await findByField(payload, 'bookings', 'smoobuBookingId', row.smoobu_booking_id)
      }
      if (existing) {
        await payload.update({ collection: 'bookings', id: existing.id, data })
      } else {
        await payload.create({ collection: 'bookings', data })
      }
      ok(`booking ${label}`)
    } catch (e) {
      fail(`booking ${label}`, e)
    }
  }

  console.log(`Done. OK: ${stats.ok}, SKIP: ${stats.skip}, FAIL: ${stats.fail}`)
  await legacy.end()
  process.exit(stats.fail > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
