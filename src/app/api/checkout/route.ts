import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import Stripe from 'stripe'

import config from '@payload-config'
import { PRICING_RULES, getScenario } from '@/lib/pricing-rules'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const APP_URL = process.env.APP_URL || 'https://madeirabook-platform.vercel.app'
const SEARCH_AVAILABILITY_PATH = '/api/search-availability'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DEFAULT_COMMISSION_PERCENT = 12
const REF_COOKIE = 'madeirabook_ref'
const REF_RE = /^[a-z0-9_-]{2,50}$/

let stripeClient: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    stripeClient = new Stripe(key)
  }
  return stripeClient
}

type OwnerUser = {
  stripeAccountId?: string | null
  chargesEnabled?: boolean | null
}

function resolveOwner(owner: unknown): OwnerUser | null {
  return owner && typeof owner === 'object' ? (owner as OwnerUser) : null
}

function calcFee(amountCents: number, percent: number): number {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error(`Invalid commission percent: ${percent}`)
  }
  return Math.round(amountCents * (percent / 100))
}

async function resolveRefCode(
  payload: Awaited<ReturnType<typeof getPayload>>,
  refCode: string | undefined,
): Promise<string | null> {
  if (!refCode || !REF_RE.test(refCode)) return null
  try {
    const found = await payload.find({
      collection: 'referrals',
      where: {
        and: [
          { status: { equals: 'active' } },
          {
            or: [
              { code: { equals: refCode } },
              { aliases: { contains: refCode } },
            ],
          },
        ],
      },
      limit: 1,
      depth: 0,
    })
    return found.docs[0]?.code ?? null
  } catch (err) {
    console.warn('checkout: referral lookup failed (non-fatal)', err)
    return null
  }
}

interface AvailabilityOffer {
  slug?: string
  price?: number
  currency?: string
}

export async function POST(req: NextRequest) {
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
      where: {
        and: [
          { slug: { equals: propertySlug } },
          { brand: { not_equals: 'madeiraoasis' } },
        ],
      },
      limit: 1,
      depth: 2,
    })
    const property = found.docs[0]
    if (!property || property.status !== 'published') {
      return NextResponse.json({ error: 'property_not_found' }, { status: 404 })
    }

    // The pricing manifest decides whether this stay is sellable at all —
    // display_only/siteminder properties can never open a checkout.
    const rule = PRICING_RULES[getScenario(property)]
    if (!rule.isBookable) {
      return NextResponse.json(
        { error: 'property_not_bookable' },
        { status: 409 },
      )
    }

    // Availability + authoritative stay price via the existing core
    // endpoint. Smoobu remains the source of truth for the total.
    let offer: AvailabilityOffer | undefined
    try {
      const origin = req.nextUrl.origin
      const availRes = await fetch(`${origin}${SEARCH_AVAILABILITY_PATH}`, {
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

    // Split fields live on the Payload property + its owner user.
    const isPlatform = property.isPlatform !== false
    const owner = resolveOwner(property.owner)
    if (!isPlatform && (!owner?.stripeAccountId || !owner.chargesEnabled)) {
      return NextResponse.json(
        { error: 'owner_stripe_not_verified' },
        { status: 400 },
      )
    }
    const platformFeeCents = isPlatform
      ? 0
      : calcFee(
          amountCents,
          property.commissionPercent ?? rule.commission ?? DEFAULT_COMMISSION_PERCENT,
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

    const refCode = await resolveRefCode(
      payload,
      req.cookies.get(REF_COOKIE)?.value,
    )
    const metadata: Record<string, string> = { propertySlug, arrival, departure }
    if (refCode) metadata.ref_code = refCode
    const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData =
      { metadata }
    if (!isPlatform && owner?.stripeAccountId) {
      paymentIntentData.transfer_data = { destination: owner.stripeAccountId }
      paymentIntentData.on_behalf_of = owner.stripeAccountId
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
