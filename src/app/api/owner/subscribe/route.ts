import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { getCurrentOwner } from '@/lib/ownerAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const APP_URL = process.env.APP_URL || 'https://madeirabook-platform.vercel.app'

let stripeClient: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    stripeClient = new Stripe(key)
  }
  return stripeClient
}

// POST /api/owner/subscribe
// Creates a Stripe Checkout Session for the owner PMS subscription (€30/mo).
export async function POST() {
  const owner = await getCurrentOwner()
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID
  if (!priceId) {
    console.error('owner subscribe: STRIPE_SUBSCRIPTION_PRICE_ID is not set')
    return NextResponse.json(
      { error: 'subscription_not_configured' },
      { status: 500 },
    )
  }

  try {
    // Reuse the stored Stripe customer when we have one — passing both
    // `customer` and `customer_email` is not allowed.
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      ...(owner.stripeCustomerId
        ? { customer: owner.stripeCustomerId }
        : { customer_email: owner.email }),
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: String(owner.id),
      metadata: { kind: 'pms_subscription', ownerId: String(owner.id) },
      subscription_data: {
        metadata: { kind: 'pms_subscription', ownerId: String(owner.id) },
      },
      success_url: `${APP_URL}/owner?subscribed=true`,
      cancel_url: `${APP_URL}/owner`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('owner subscribe: stripe session failed', err)
    return NextResponse.json(
      { error: 'stripe_session_failed' },
      { status: 502 },
    )
  }
}
