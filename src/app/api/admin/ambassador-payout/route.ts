import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import Stripe from 'stripe'

import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/admin/ambassador-payout
// Body: { referralId }
// Transfers the ambassador's pendingBalance to his Stripe Express account
// (accumulate-and-pay-manually model: the webhook only records what we owe,
// the actual payout is triggered here by an admin).
export async function POST(req: Request) {
  const payload = await getPayload({ config: await config })

  const { user } = await payload.auth({ headers: await headers() })
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { referralId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const referralId = Number(body.referralId)
  if (!Number.isFinite(referralId) || referralId <= 0) {
    return NextResponse.json({ error: 'Invalid referralId' }, { status: 400 })
  }

  let referral
  try {
    referral = await payload.findByID({
      collection: 'referrals',
      id: referralId,
      depth: 0,
    })
  } catch {
    return NextResponse.json({ error: 'Referral not found' }, { status: 404 })
  }

  const amountCents = referral.pendingBalance ?? 0
  if (amountCents <= 0) {
    return NextResponse.json({ error: 'Nothing to pay out' }, { status: 409 })
  }
  if (!referral.stripeAccountId) {
    return NextResponse.json(
      { error: 'Ambassador has no Stripe account' },
      { status: 409 },
    )
  }

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 },
    )
  }
  const stripe = new Stripe(key)

  // KYC gate: transfers only reach accounts Stripe allows to pay out.
  try {
    const account = await stripe.accounts.retrieve(referral.stripeAccountId)
    if (!account.payouts_enabled) {
      return NextResponse.json(
        { error: 'Stripe account not fully onboarded (KYC incomplete)' },
        { status: 409 },
      )
    }
  } catch (e) {
    console.error('ambassador-payout: account retrieve failed:', e)
    return NextResponse.json(
      { error: 'Could not verify the Stripe account' },
      { status: 502 },
    )
  }

  let transfer: Stripe.Transfer
  try {
    transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'eur',
      destination: referral.stripeAccountId,
      metadata: {
        kind: 'ambassador_payout',
        referralId: String(referralId),
      },
    })
  } catch (e) {
    console.error('ambassador-payout: transfer failed:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Stripe transfer failed' },
      { status: 502 },
    )
  }

  // Money already moved — surface the transfer id even if the wallet
  // update fails, so an admin can reconcile instead of paying twice.
  try {
    await payload.update({
      collection: 'referrals',
      id: referralId,
      data: {
        pendingBalance: 0,
        totalPaid: (referral.totalPaid ?? 0) + amountCents,
      },
    })
    await payload.update({
      collection: 'affiliate-payouts',
      where: {
        and: [
          { referral: { equals: referralId } },
          { status: { equals: 'pending' } },
        ],
      },
      data: {
        status: 'paid',
        paidAt: new Date().toISOString(),
      },
    })
  } catch (e) {
    console.error(
      `ambassador-payout: wallet update failed after transfer ${transfer.id}`,
      e,
    )
    return NextResponse.json(
      { error: 'Transfer created but wallet update failed', transferId: transfer.id },
      { status: 500 },
    )
  }

  console.log(
    `ambassador-payout: transfer ${transfer.id} — ${amountCents} cents to ${referral.stripeAccountId} (referral ${referralId})`,
  )
  return NextResponse.json({
    ok: true,
    transferId: transfer.id,
    amountCents,
  })
}
