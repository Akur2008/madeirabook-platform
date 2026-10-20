import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import Stripe from 'stripe'

import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_RE = /^[a-f0-9]{32}$/
const APP_URL = (
  process.env.APP_URL || 'https://www.madeirabook.com'
).replace(/\/$/, '')

// Stripe onboarding links expire within minutes — this endpoint mints a
// fresh one on demand so the welcome page button always works.
export async function GET(req: NextRequest) {
  const queryToken = req.nextUrl.searchParams.get('token')
  const cookieToken = req.cookies.get('ambassador_token')?.value
  const token =
    typeof queryToken === 'string' && TOKEN_RE.test(queryToken)
      ? queryToken
      : cookieToken
  if (typeof token !== 'string' || !TOKEN_RE.test(token)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid invitation' },
      { status: 404 },
    )
  }

  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'referrals',
    where: { invitationToken: { equals: token } },
    limit: 1,
    depth: 0,
  })
  const referral = docs[0]
  if (!referral) {
    return NextResponse.json(
      { ok: false, error: 'Invalid invitation' },
      { status: 404 },
    )
  }

  if (!referral.stripeAccountId) {
    return NextResponse.json(
      { ok: false, error: 'Stripe account not created yet' },
      { status: 404 },
    )
  }

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return NextResponse.json(
      { ok: false, error: 'Stripe is not configured' },
      { status: 500 },
    )
  }

  try {
    const stripe = new Stripe(key)
    const link = await stripe.accountLinks.create({
      account: referral.stripeAccountId,
      type: 'account_onboarding',
      refresh_url: `${APP_URL}/ambassadors/welcome/${token}`,
      return_url: `${APP_URL}/ambassadors/welcome/${token}?stripe=done`,
    })
    return NextResponse.json({ ok: true, url: link.url })
  } catch (e) {
    console.error('onboarding-link: accountLinks.create failed:', e)
    return NextResponse.json(
      { ok: false, error: 'Could not create onboarding link' },
      { status: 502 },
    )
  }
}
