import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import pg from 'pg'
import Stripe from 'stripe'

import config from '@payload-config'
import { sendBookingPaidEmail, sendTelegramMessage } from '@/lib/notify'
import { createReservation, markPaid } from '@/lib/smoobu'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_COMMISSION_PERCENT = 12

let stripeClient: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    stripeClient = new Stripe(key)
  }
  return stripeClient
}

let legacyPool: pg.Pool | null = null

// Booking records and webhook dedupe still live in the legacy core DB
// (same tables the old core webhook used). Returns null when
// LEGACY_DATABASE_URL is not set — the webhook then only logs.
async function legacyQuery(
  text: string,
  params: unknown[],
): Promise<pg.QueryResult | null> {
  const url = process.env.LEGACY_DATABASE_URL
  if (!url) return null
  if (!legacyPool) legacyPool = new pg.Pool({ connectionString: url })
  return legacyPool.query(text, params)
}

interface LegacyProperty {
  id: number
  isPlatform: boolean
  commissionPercent: number | null
  ownerEmail: string | null
}

async function getLegacyProperty(
  smoobuId: string,
): Promise<LegacyProperty | null> {
  const res = await legacyQuery(
    'SELECT p.id, p.is_platform, p.commission_percent, u.email AS owner_email '
      + 'FROM properties p LEFT JOIN users u ON u.id = p.owner_id '
      + 'WHERE p.smoobu_id = $1 LIMIT 1',
    [smoobuId],
  )
  const row = res?.rows?.[0]
  if (!row) return null
  return {
    id: row.id,
    isPlatform: row.is_platform === true,
    commissionPercent:
      row.commission_percent == null ? null : Number(row.commission_percent),
    ownerEmail: row.owner_email || null,
  }
}

function calcFee(amountCents: number, percent: number): number {
  return Math.round(amountCents * (percent / 100))
}

function paymentIntentId(
  pi: string | Stripe.PaymentIntent | null,
): string | null {
  if (!pi) return null
  return typeof pi === 'string' ? pi : pi.id
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const meta = session.metadata || {}
  const { propertySlug, arrival, departure } = meta
  if (!propertySlug || !arrival || !departure) {
    console.log(
      `webhook: session ${session.id} has no booking metadata, skipping`,
    )
    return
  }

  const guestEmail =
    session.customer_details?.email ?? session.customer_email ?? null
  const amountCents = session.amount_total ?? 0

  const payload = await getPayload({ config: await config })
  const found = await payload.find({
    collection: 'properties',
    where: { slug: { equals: propertySlug } },
    limit: 1,
  })
  const property = found.docs[0]
  if (!property) {
    console.error(
      `webhook: property '${propertySlug}' not found (session ${session.id})`,
    )
  }
  const propertyTitle = property?.title || propertySlug
  const smoobuId = property?.pmsPropertyId
    ? String(property.pmsPropertyId)
    : null

  const legacy = smoobuId ? await getLegacyProperty(smoobuId) : null
  // A Payload-only property has no onboarded owner → platform-owned.
  const isPlatform = legacy?.isPlatform !== false
  const platformFeeCents = isPlatform
    ? 0
    : calcFee(
        amountCents,
        legacy?.commissionPercent ?? DEFAULT_COMMISSION_PERCENT,
      )

  // Record the paid booking in the legacy bookings table — the same row
  // the old core webhook would have updated.
  let bookingId: number | null = null
  try {
    const ins = await legacyQuery(
      'INSERT INTO bookings '
        + '(property_id, guest_email, arrival_date, departure_date, status, '
        + 'source, amount_cents, platform_fee_cents, stripe_session_id, '
        + 'stripe_payment_intent, created_at, updated_at) '
        + "VALUES ($1,$2,$3,$4,'paid','direct',$5,$6,$7,$8,NOW(),NOW()) "
        + 'RETURNING id',
      [
        legacy?.id ?? null,
        guestEmail,
        arrival,
        departure,
        amountCents,
        platformFeeCents,
        session.id,
        paymentIntentId(session.payment_intent),
      ],
    )
    bookingId = ins?.rows?.[0]?.id ?? null
  } catch (err) {
    console.error('webhook: failed to record booking', err)
  }

  // Create the Smoobu reservation (payment-first flow, same as core).
  let smoobuBookingId: number | null = null
  try {
    if (!smoobuId) {
      throw new Error(`property '${propertySlug}' has no pmsPropertyId`)
    }
    smoobuBookingId = await createReservation({
      propertyId: smoobuId,
      arrivalDate: arrival,
      departureDate: departure,
      guestEmail,
      arrivalTime:
        typeof property?.checkInTime === 'string'
          ? property.checkInTime
          : '15:00',
    })
    if (bookingId) {
      await legacyQuery(
        'UPDATE bookings SET smoobu_booking_id = $1, updated_at = NOW() '
          + 'WHERE id = $2',
        [String(smoobuBookingId), bookingId],
      )
    }
    console.log(
      `webhook: Smoobu reservation ${smoobuBookingId} created for booking ${bookingId} (session ${session.id})`,
    )
    try {
      await markPaid(smoobuBookingId)
    } catch (err) {
      console.warn(
        `webhook: smoobu markPaid failed for ${smoobuBookingId} (non-critical)`,
        err,
      )
    }
  } catch (err) {
    // Payment succeeded but PMS rejected — flag for manual handling.
    if (bookingId) {
      await legacyQuery(
        "UPDATE bookings SET status = 'paid_no_pms', updated_at = NOW() "
          + 'WHERE id = $1',
        [bookingId],
      )
    }
    const reason = err instanceof Error ? err.message : String(err)
    console.error(
      `webhook: SMOOBU CREATE FAILED — paid but no PMS booking `
        + `(session ${session.id}, booking ${bookingId}, smoobu ${smoobuId}): ${reason}`,
    )
    const adminChat = process.env.TELEGRAM_ADMIN_CHAT_ID
    if (adminChat) {
      try {
        await sendTelegramMessage(
          adminChat,
          'ПРОБЛЕМА: оплата прошла, но Smoobu отказал.\n'
            + `Session: ${session.id}\n`
            + `Booking ID: ${bookingId ?? '-'}\n`
            + `Smoobu ID: ${smoobuId ?? '-'}\n`
            + `Даты: ${arrival} - ${departure}\n`
            + `Причина: ${reason}`,
        )
      } catch (tgErr) {
        console.error('webhook: admin telegram notify failed', tgErr)
      }
    }
  }

  // Confirmation emails (guest + owner). Failures are logged, not fatal —
  // Stripe must still see a 200 for a paid session.
  if (guestEmail || legacy?.ownerEmail) {
    try {
      await sendBookingPaidEmail({
        guestEmail,
        ownerEmail: legacy?.ownerEmail ?? null,
        propertyTitle,
        arrivalDate: arrival,
        departureDate: departure,
        amountCents,
        platformFeeCents,
      })
    } catch (err) {
      console.error(
        `webhook: booking email failed (session ${session.id})`,
        err,
      )
    }
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set')
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.warn(
      `webhook: signature verification failed: ${(err as Error).message}`,
    )
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  // Idempotency via the shared webhook_events table (same as core).
  try {
    const ins = await legacyQuery(
      'INSERT INTO webhook_events (id, type) VALUES ($1, $2) '
        + 'ON CONFLICT (id) DO NOTHING',
      [event.id, event.type],
    )
    if (ins && ins.rowCount === 0) {
      console.log(`webhook: duplicate event ${event.id}, skip`)
      return NextResponse.json({ received: true, duplicate: true })
    }
  } catch (err) {
    console.error('webhook: dedupe check failed, continuing anyway', err)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session,
      )
    } else if (event.type === 'checkout.session.expired') {
      const s = event.data.object as Stripe.Checkout.Session
      console.log(`webhook: checkout session expired: ${s.id}`)
      await legacyQuery(
        "UPDATE bookings SET status = 'cancelled', updated_at = NOW() "
          + "WHERE stripe_session_id = $1 AND status = 'pending'",
        [s.id],
      )
    } else if (event.type === 'charge.refunded') {
      const ch = event.data.object as Stripe.Charge
      console.log(
        `webhook: charge refunded ${ch.id} `
          + `(payment_intent=${paymentIntentId(ch.payment_intent)})`,
      )
      await legacyQuery(
        "UPDATE bookings SET status = 'refunded', updated_at = NOW() "
          + 'WHERE stripe_payment_intent = $1',
        [paymentIntentId(ch.payment_intent)],
      )
    } else {
      console.log(`webhook: unhandled event type ${event.type}`)
    }
  } catch (err) {
    console.error(`webhook: handler error for ${event.id} (${event.type})`, err)
    try {
      await legacyQuery('DELETE FROM webhook_events WHERE id = $1', [event.id])
    } catch {
      // best effort — allows Stripe retry on transient dedupe failures
    }
    return NextResponse.json({ error: 'handler_error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
