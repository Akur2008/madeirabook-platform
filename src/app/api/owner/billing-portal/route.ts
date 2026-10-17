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

// POST /api/owner/billing-portal
// Opens the Stripe Customer Portal for the owner's PMS subscription.
export async function POST() {
  const owner = await getCurrentOwner()
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!owner.stripeCustomerId) {
    return NextResponse.json(
      { error: 'no_stripe_customer' },
      { status: 400 },
    )
  }

  try {
    const portal = await getStripe().billingPortal.sessions.create({
      customer: owner.stripeCustomerId,
      return_url: `${APP_URL}/owner`,
    })
    return NextResponse.json({ url: portal.url })
  } catch (err) {
    console.error('owner billing-portal: stripe session failed', err)
    return NextResponse.json(
      { error: 'stripe_portal_failed' },
      { status: 502 },
    )
  }
}
