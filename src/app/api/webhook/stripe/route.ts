import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import Stripe from 'stripe'

import config from '@payload-config'
import { sendAdminAlert, sendBookingPaidEmail } from '@/lib/notify'
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

function calcFee(amountCents: number, percent: number): number {
  return Math.round(amountCents * (percent / 100))
}

function paymentIntentId(
  pi: string | Stripe.PaymentIntent | null,
): string | null {
  if (!pi) return null
  return typeof pi === 'string' ? pi : pi.id
}

function ownerEmailOf(property: { owner?: unknown } | undefined): string | null {
  const owner = property?.owner
  if (owner && typeof owner === 'object' && 'email' in owner) {
    const email = (owner as { email?: unknown }).email
    return typeof email === 'string' && email ? email : null
  }
  return null
}

function stripeIdOf(
  value: string | { id?: string } | null | undefined,
): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : (value.id ?? null)
}

// The PMS subscription carries metadata.ownerId (set in /api/owner/subscribe);
// the price id check covers subscriptions created outside this flow.
function isPmsSubscription(sub: Stripe.Subscription): boolean {
  const meta = sub.metadata || {}
  if (meta.kind === 'pms_subscription' || meta.ownerId) return true
  const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID
  if (!priceId) return false
  return (sub.items?.data ?? []).some((it) => it.price?.id === priceId)
}

// Invoice line items expose the price under different keys depending on the
// Stripe API version (price.id vs pricing.price_details.price).
function invoicePriceIds(invoice: Stripe.Invoice): string[] {
  return ((invoice.lines?.data ?? []) as unknown as Record<
    string,
    unknown
  >[])
    .map((line) => {
      const direct = (line.price as { id?: string } | undefined)?.id
      const nested = (
        (line.pricing as { price_details?: { price?: string } } | undefined)
          ?.price_details?.price
      )
      return direct ?? nested ?? null
    })
    .filter((id): id is string => Boolean(id))
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as unknown as Record<string, unknown>
  const legacy = inv.subscription
  const parent = (
    inv.parent as
      | { subscription_details?: { subscription?: unknown } }
      | undefined
  )?.subscription_details?.subscription
  return stripeIdOf(
    (legacy ?? parent) as string | { id?: string } | null | undefined,
  )
}

async function setOwnerSubscription(
  payload: Payload,
  opts: {
    ownerId?: string | null
    customerId?: string | null
    active: boolean
  },
): Promise<void> {
  let userId: number | null = null
  const ownerIdNum = Number(opts.ownerId)
  if (Number.isFinite(ownerIdNum) && ownerIdNum > 0) {
    userId = ownerIdNum
  }
  if (!userId && opts.customerId) {
    const found = await payload.find({
      collection: 'users',
      where: { stripeCustomerId: { equals: opts.customerId } },
      limit: 1,
      depth: 0,
    })
    userId = found.docs[0]?.id ?? null
  }
  if (!userId && opts.customerId) {
    // Last resort: match the Stripe customer email to a user.
    try {
      const customer = await getStripe().customers.retrieve(opts.customerId)
      const email =
        'email' in customer && typeof customer.email === 'string'
          ? customer.email
          : null
      if (email) {
        const found = await payload.find({
          collection: 'users',
          where: { email: { equals: email } },
          limit: 1,
          depth: 0,
        })
        userId = found.docs[0]?.id ?? null
      }
    } catch (err) {
      console.warn(
        `webhook: customer lookup failed (${opts.customerId})`,
        err,
      )
    }
  }
  if (!userId) {
    console.warn(
      `webhook: owner not resolved for subscription update `
        + `(customer=${opts.customerId}, ownerId=${opts.ownerId})`,
    )
    return
  }
  await payload.update({
    collection: 'users',
    id: userId,
    data: {
      hasActiveSubscription: opts.active,
      ...(opts.customerId ? { stripeCustomerId: opts.customerId } : {}),
    },
  })
  console.log(
    `webhook: user ${userId} hasActiveSubscription → ${opts.active}`,
  )
}

function subscriptionCustomerId(sub: Stripe.Subscription): string | null {
  return stripeIdOf(sub.customer)
}

async function handleInvoiceSubscriptionEvent(
  payload: Payload,
  invoice: Stripe.Invoice,
  active: boolean,
): Promise<void> {
  const customerId = stripeIdOf(invoice.customer)
  let ownerId: string | null = null
  let isPms = false

  const subId = invoiceSubscriptionId(invoice)
  if (subId) {
    try {
      const sub = await getStripe().subscriptions.retrieve(subId)
      isPms = isPmsSubscription(sub)
      ownerId = sub.metadata?.ownerId ?? null
    } catch (err) {
      console.warn(`webhook: subscription retrieve failed (${subId})`, err)
    }
  }
  if (!isPms) {
    const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID
    isPms = priceId ? invoicePriceIds(invoice).includes(priceId) : false
  }
  if (!isPms) {
    console.log(`webhook: invoice ${invoice.id} is not a PMS invoice, skip`)
    return
  }
  await setOwnerSubscription(payload, { ownerId, customerId, active })
}

async function handleCheckoutCompleted(
  payload: Payload,
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.mode === 'subscription') {
    console.log(
      `webhook: subscription checkout ${session.id} — handled by subscription events`,
    )
    return
  }
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

  const found = await payload.find({
    collection: 'properties',
    where: { slug: { equals: propertySlug } },
    limit: 1,
    depth: 1,
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

  // Split fields live on the Payload property; owner email via the
  // owner relationship (replaces the legacy properties/users JOIN).
  const isPlatform = property?.isPlatform !== false
  const platformFeeCents = isPlatform
    ? 0
    : calcFee(
        amountCents,
        property?.commissionPercent ?? DEFAULT_COMMISSION_PERCENT,
      )
  const ownerEmail = ownerEmailOf(property)

  // Record the paid booking.
  let bookingId: number | null = null
  try {
    const booking = await payload.create({
      collection: 'bookings',
      data: {
        stripeSessionId: session.id,
        stripePaymentIntent: paymentIntentId(session.payment_intent),
        property: property?.id ?? null,
        propertySlug,
        arrival,
        departure,
        guestEmail,
        guestName: session.customer_details?.name ?? null,
        amountTotal: amountCents,
        platformFeeCents,
        currency: session.currency ?? 'eur',
        status: 'paid',
        source: 'direct',
      },
    })
    bookingId = booking.id
  } catch (err) {
    console.error('webhook: failed to record booking', err)
  }

  // Affiliate accrual: paid out of the platform fee — the owner split
  // (88/12) is unchanged; this only records what we owe the creator.
  const refCode = meta.ref_code
  if (refCode && bookingId) {
    try {
      const foundRef = await payload.find({
        collection: 'referrals',
        where: { code: { equals: refCode } },
        limit: 1,
        depth: 0,
      })
      const referral = foundRef.docs[0]
      const isOasisStay =
        property?.brand === 'madeiraoasis' || property?.brand === 'both'
      if (referral && isOasisStay && !referral.oasisAccess) {
        console.log(
          `webhook: oasis booking ${propertySlug} — referral '${refCode}' has no oasisAccess, payout skipped`,
        )
      } else if (referral) {
        const payoutCents = calcFee(
          amountCents,
          referral.commissionRate ?? 0,
        )
        await payload.create({
          collection: 'affiliate-payouts',
          data: {
            referral: referral.id,
            booking: bookingId,
            amountCents: payoutCents,
            currency: (session.currency ?? 'eur').toUpperCase(),
            status: 'pending',
          },
        })
        // Accumulate-and-pay-manually: the commission sits in the wallet
        // until an admin triggers a Stripe transfer from the admin panel.
        await payload.update({
          collection: 'referrals',
          id: referral.id,
          data: {
            pendingBalance: (referral.pendingBalance ?? 0) + payoutCents,
          },
        })
        console.log(`webhook: affiliate payout: ${refCode} ${payoutCents} cents`)
      } else {
        console.warn(`webhook: referral '${refCode}' not found (session ${session.id})`)
      }
    } catch (err) {
      console.error('webhook: affiliate payout failed', err)
    }
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
      await payload.update({
        collection: 'bookings',
        id: bookingId,
        data: { smoobuBookingId: String(smoobuBookingId) },
      })
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
      await payload.update({
        collection: 'bookings',
        id: bookingId,
        data: { status: 'paid_no_pms' },
      })
    }
    const reason = err instanceof Error ? err.message : String(err)
    console.error(
      `webhook: SMOOBU CREATE FAILED — paid but no PMS booking `
        + `(session ${session.id}, booking ${bookingId}, smoobu ${smoobuId}): ${reason}`,
    )
    await sendAdminAlert(
      `Booking paid but PMS failed: ${propertySlug}`,
      `Session: ${session.id}\nAmount: ${session.amount_total} ${session.currency}\nArrival: ${arrival}\nDeparture: ${departure}\nGuest: ${session.customer_details?.email}\nReason: ${reason}\n\nNeed manual PMS booking.`,
    )
  }

  // Confirmation emails (guest + owner). Failures are logged, not fatal —
  // Stripe must still see a 200 for a paid session.
  if (guestEmail || ownerEmail) {
    try {
      await sendBookingPaidEmail({
        guestEmail,
        ownerEmail,
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

async function deleteWebhookEvent(
  payload: Payload,
  eventId: string,
): Promise<void> {
  const found = await payload.find({
    collection: 'webhook-events',
    where: { eventId: { equals: eventId } },
    limit: 1,
    depth: 0,
  })
  if (found.docs[0]) {
    await payload.delete({ collection: 'webhook-events', id: found.docs[0].id })
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

  const payload = await getPayload({ config: await config })

  // Idempotency via the webhook-events collection (replaces legacy table).
  try {
    const existing = await payload.find({
      collection: 'webhook-events',
      where: { eventId: { equals: event.id } },
      limit: 1,
      depth: 0,
    })
    if (existing.totalDocs > 0) {
      console.log(`webhook: duplicate event ${event.id}, skip`)
      return NextResponse.json({ received: true, duplicate: true })
    }
    await payload.create({
      collection: 'webhook-events',
      data: {
        eventId: event.id,
        eventType: event.type,
        payload: JSON.parse(JSON.stringify(event)) as Record<string, unknown>,
        processedAt: new Date().toISOString(),
        status: 'processed',
      },
    })
  } catch (err) {
    console.error('webhook: dedupe check failed, continuing anyway', err)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(
        payload,
        event.data.object as Stripe.Checkout.Session,
      )
    } else if (event.type === 'customer.subscription.created') {
      const sub = event.data.object as Stripe.Subscription
      if (isPmsSubscription(sub)) {
        await setOwnerSubscription(payload, {
          ownerId: sub.metadata?.ownerId ?? null,
          customerId: subscriptionCustomerId(sub),
          active: true,
        })
      } else {
        console.log(
          `webhook: subscription ${sub.id} is not a PMS subscription, skip`,
        )
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      if (isPmsSubscription(sub)) {
        await setOwnerSubscription(payload, {
          ownerId: sub.metadata?.ownerId ?? null,
          customerId: subscriptionCustomerId(sub),
          active: false,
        })
      } else {
        console.log(
          `webhook: subscription ${sub.id} is not a PMS subscription, skip`,
        )
      }
    } else if (event.type === 'invoice.paid') {
      await handleInvoiceSubscriptionEvent(
        payload,
        event.data.object as Stripe.Invoice,
        true,
      )
    } else if (event.type === 'invoice.payment_failed') {
      await handleInvoiceSubscriptionEvent(
        payload,
        event.data.object as Stripe.Invoice,
        false,
      )
    } else if (event.type === 'checkout.session.expired') {
      const s = event.data.object as Stripe.Checkout.Session
      console.log(`webhook: checkout session expired: ${s.id}`)
      await payload.update({
        collection: 'bookings',
        where: {
          and: [
            { stripeSessionId: { equals: s.id } },
            { status: { equals: 'pending' } },
          ],
        },
        data: { status: 'cancelled' },
      })
    } else if (event.type === 'charge.refunded') {
      const ch = event.data.object as Stripe.Charge
      const pi = paymentIntentId(ch.payment_intent)
      console.log(`webhook: charge refunded ${ch.id} (payment_intent=${pi})`)
      if (pi) {
        await payload.update({
          collection: 'bookings',
          where: { stripePaymentIntent: { equals: pi } },
          data: { status: 'refunded' },
        })
      }
    } else {
      console.log(`webhook: unhandled event type ${event.type}`)
    }
  } catch (err) {
    console.error(`webhook: handler error for ${event.id} (${event.type})`, err)
    try {
      await deleteWebhookEvent(payload, event.id)
    } catch {
      // best effort — allows Stripe retry on transient dedupe failures
    }
    return NextResponse.json({ error: 'handler_error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
