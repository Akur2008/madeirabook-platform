import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import pg from 'pg'
import Stripe from 'stripe'

import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const APP_URL = process.env.APP_URL || 'https://madeirabook-platform.vercel.app'
const SEARCH_AVAILABILITY_URL =
  process.env.SEARCH_AVAILABILITY_URL ||
  'https://app.madeirabook.com/api/search-availability'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
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

interface SplitData {
  isPlatform: boolean
  commissionPercent: number | null
  stripeAccountId: string | null
  chargesEnabled: boolean
}

let legacyPool: pg.Pool | null = null

// Split data (is_platform, commission, owner Stripe account) still lives in
// the legacy core DB. Read-only lookup by Smoobu id until owners migrate
// to Payload.
async function getSplitData(smoobuId: string): Promise<SplitData | null> {
  const url = process.env.LEGACY_DATABASE_URL
  if (!url) return null
  if (!legacyPool) legacyPool = new pg.Pool({ connectionString: url })
  const res = await legacyPool.query(
    'SELECT p.is_platform, p.commission_percent, p.charges_enabled, '
      + 'o.stripe_account_id '
      + 'FROM properties p LEFT JOIN users o ON o.id = p.owner_id '
      + 'WHERE p.smoobu_id = $1 LIMIT 1',
    [smoobuId],
  )
  const row = res.rows[0]
  if (!row) return null
  return {
    isPlatform: row.is_platform === true,
    commissionPercent:
      row.commission_percent == null ? null : Number(row.commission_percent),
    stripeAccountId: row.stripe_account_id || null,
    chargesEnabled: row.charges_enabled === true,
  }
}

function calcFee(amountCents: number, percent: number): number {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error(`Invalid commission percent: ${percent}`)
  }
  return Math.round(amountCents * (percent / 100))
}

interface AvailabilityOffer {
  slug?: string
  price?: number
  currency?: string
}

export async function POST(req: Request) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    const { propertySlug, arrival, departure } = (body ?? {}) as Record<
      string,
      unknown
    >

    if (
      typeof propertySlug !== 'string' ||
      !propertySlug ||
      typeof arrival !== 'string' ||
      !DATE_RE.test(arrival) ||
      typeof departure !== 'string' ||
      !DATE_RE.test(departure) ||
      arrival >= departure
    ) {
      return NextResponse.json(
        { error: 'required: propertySlug, arrival, departure (YYYY-MM-DD)' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config: await config })
    const found = await payload.find({
      collection: 'properties',
      where: { slug: { equals: propertySlug } },
      limit: 1,
      depth: 2,
    })
    const property = found.docs[0]
    if (!property || property.status !== 'published') {
      return NextResponse.json({ error: 'property_not_found' }, { status: 404 })
    }

    // Availability + authoritative stay price via the existing core
    // endpoint. Smoobu remains the source of truth for the total.
    let offer: AvailabilityOffer | undefined
    try {
      const availRes = await fetch(SEARCH_AVAILABILITY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arrivalDate: arrival,
          departureDate: departure,
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (!availRes.ok) {
        return NextResponse.json(
          { error: 'availability_check_failed' },
          { status: 502 },
        )
      }
      const items = (await availRes.json()) as AvailabilityOffer[]
      offer = Array.isArray(items)
        ? items.find((item) => item.slug === propertySlug)
        : undefined
    } catch {
      return NextResponse.json(
        { error: 'availability_check_failed' },
        { status: 502 },
      )
    }
    if (!offer || !Number.isFinite(Number(offer.price))) {
      return NextResponse.json(
        { error: 'property_not_available' },
        { status: 409 },
      )
    }

    const amountCents = Math.round(Number(offer.price) * 100)
    if (amountCents <= 0) {
      return NextResponse.json(
        { error: 'property_not_available' },
        { status: 409 },
      )
    }

    const split = property.pmsPropertyId
      ? await getSplitData(String(property.pmsPropertyId))
      : null
    // A Payload-only property has no onboarded owner → platform-owned.
    const isPlatform = split?.isPlatform !== false
    if (!isPlatform && (!split?.stripeAccountId || !split.chargesEnabled)) {
      return NextResponse.json(
        { error: 'owner_stripe_not_verified' },
        { status: 400 },
      )
    }
    const platformFeeCents = isPlatform
      ? 0
      : calcFee(
          amountCents,
          split?.commissionPercent ?? DEFAULT_COMMISSION_PERCENT,
        )

    const nights = Math.round(
      (Date.parse(departure) - Date.parse(arrival)) / 86400000,
    )
    const currency =
      typeof offer.currency === 'string' && /^[a-z]{3}$/i.test(offer.currency)
        ? offer.currency.toLowerCase()
        : 'eur'
    const stayName = `${property.title} — ${nights} night${nights === 1 ? '' : 's'} (${arrival} → ${departure})`

    // Cleaning fee as a separate line when it fits inside the Smoobu total.
    const cleaningFeeCents = Math.round(Number(property.cleaningFee ?? 0) * 100)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    if (cleaningFeeCents > 0 && cleaningFeeCents < amountCents) {
      lineItems.push(
        {
          price_data: {
            currency,
            product_data: { name: stayName },
            unit_amount: amountCents - cleaningFeeCents,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency,
            product_data: { name: 'Cleaning fee' },
            unit_amount: cleaningFeeCents,
          },
          quantity: 1,
        },
      )
    } else {
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: stayName },
          unit_amount: amountCents,
        },
        quantity: 1,
      })
    }

    const metadata = { propertySlug, arrival, departure }
    const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData =
      { metadata }
    if (!isPlatform && split?.stripeAccountId) {
      paymentIntentData.transfer_data = { destination: split.stripeAccountId }
      paymentIntentData.on_behalf_of = split.stripeAccountId
      if (platformFeeCents > 0) {
        paymentIntentData.application_fee_amount = platformFeeCents
      }
    }

    let session: Stripe.Checkout.Session
    try {
      session = await getStripe().checkout.sessions.create({
        line_items: lineItems,
        mode: 'payment',
        payment_intent_data: paymentIntentData,
        metadata,
        success_url: `${APP_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/booking-cancel?slug=${propertySlug}`,
      })
    } catch (err) {
      console.error('checkout: stripe session failed', err)
      return NextResponse.json(
        { error: 'stripe_session_failed' },
        { status: 502 },
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('checkout: failed', err)
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 })
  }
}
