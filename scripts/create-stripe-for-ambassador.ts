import { getPayload } from 'payload'
import Stripe from 'stripe'

import config from '../src/payload.config.js'
import { sendResendEmail } from '../src/lib/notify'
import 'dotenv/config'

// Creates a Stripe Express account for an ambassador referral that was
// approved before Stripe onboarding succeeded (or for backfill).
//
// Usage:
//   npx tsx scripts/create-stripe-for-ambassador.ts merlin_visual
//   npx tsx scripts/create-stripe-for-ambassador.ts --backfill-active
//   npx tsx scripts/create-stripe-for-ambassador.ts --backfill-active --recreate
//
// Idempotent: skips referrals that already have stripeAccountId, unless
// --recreate is passed — then existing (e.g. test-mode) account ids are
// cleared first and fresh accounts are created under the current key.
// Never sends emails in --backfill-active mode.

const APP_URL = process.env.APP_URL || 'https://www.madeirabook.com'

function stripeError(e: unknown): Record<string, unknown> {
  const err = e as {
    code?: string
    message?: string
    type?: string
    requestId?: string
    request_id?: string
  }
  return {
    code: err?.code,
    message: err?.message,
    type: err?.type,
    requestId: err?.requestId ?? err?.request_id,
  }
}

async function createStripeForReferral(
  payload: Awaited<ReturnType<typeof getPayload>>,
  referral: {
    id: number
    code: string
    creatorEmail: string
    creatorName: string
    invitationToken?: string | null
    stripeAccountId?: string | null
    status?: string | null
  },
  opts: { sendEmail: boolean },
): Promise<{ accountId: string; onboardingUrl: string } | null> {
  if (referral.stripeAccountId) {
    console.log(`${referral.code}: already has ${referral.stripeAccountId} — skipped`)
    return null
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const welcomeUrl = referral.invitationToken
    ? `${APP_URL}/ambassadors/welcome/${referral.invitationToken}`
    : `${APP_URL}/m/${referral.code}`

  const account = await stripe.accounts.create({
    type: 'express',
    email: referral.creatorEmail,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    settings: {
      payouts: { schedule: { interval: 'monthly', monthly_anchor: 1 } },
    },
  })
  console.log(`${referral.code}: Stripe account created ${account.id}`)

  await payload.update({
    collection: 'referrals',
    id: referral.id,
    data: { stripeAccountId: account.id, payoutSchedule: 'monthly' },
  })

  const link = await stripe.accountLinks.create({
    account: account.id,
    type: 'account_onboarding',
    refresh_url: welcomeUrl,
    return_url: welcomeUrl,
  })

  // Approved ambassadors go live even before they claim the invite —
  // invitationUsedAt stays untouched so the welcome link still works.
  if (referral.status === 'paused') {
    await payload.update({
      collection: 'referrals',
      id: referral.id,
      data: { status: 'active' },
    })
    console.log(`${referral.code}: status paused -> active (map is live)`)
  }

  if (opts.sendEmail) {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.warn(`${referral.code}: email skipped — RESEND_API_KEY is not set`)
    } else {
      const mapUrl = `${APP_URL}/m/${referral.code}`
      const firstName =
        String(referral.creatorName || '').trim().split(/\s+/)[0] || 'there'
      const html =
        '<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1f2937;background:#fff;padding:20px;">' +
        '<h2 style="color:#064e3b;font-size:24px;margin:0 0 16px 0;">Set up payouts for your Madeirabook map</h2>' +
        `<p>Hi ${firstName},</p>` +
        `<p>Your Madeirabook map is ready: <a href="${mapUrl}" style="color:#064e3b;">${mapUrl}</a></p>` +
        '<p>One step left — connect your payout account with Stripe (takes ~5 minutes). Payouts land monthly, on the 1st.</p>' +
        `<p style="margin:24px 0;"><a href="${link.url}" style="display:inline-block;padding:14px 28px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Set up payouts (Stripe) &rarr;</a></p>` +
        `<p>Your ambassador page &amp; terms: <a href="${welcomeUrl}" style="color:#064e3b;">${welcomeUrl}</a></p>` +
        '<p>Welcome aboard,<br>Andrei<br>Madeirabook</p>' +
        '<p style="color:#9ca3af;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;">' +
        'Madeirabook · <a href="https://www.madeirabook.com" style="color:#9ca3af;">madeirabook.com</a><br>' +
        'You are receiving this because you were approved as a Madeirabook ambassador.' +
        '</p>' +
        '</div>'
      const text =
        `Hi ${firstName},\n\n` +
        `Your Madeirabook map is ready: ${mapUrl}\n\n` +
        'One step left — connect your payout account with Stripe (~5 min). Payouts land monthly, on the 1st.\n' +
        `Set up payouts: ${link.url}\n\n` +
        `Your ambassador page & terms: ${welcomeUrl}\n\n` +
        'Welcome aboard,\nAndrei\nMadeirabook'
      await sendResendEmail(resendKey, {
        to: referral.creatorEmail,
        cc: process.env.ADMIN_EMAIL,
        subject: 'Set up payouts for your Madeirabook map',
        html,
        text,
      })
      console.log(`${referral.code}: onboarding email sent to ${referral.creatorEmail}`)
    }
  }

  return { accountId: account.id, onboardingUrl: link.url }
}

async function main() {
  const arg = process.argv[2] || 'merlin_visual'
  const recreate = process.argv.includes('--recreate')
  const payload = await getPayload({ config })

  if (arg === '--backfill-active') {
    const { docs } = await payload.find({
      collection: 'referrals',
      where: recreate
        ? { status: { equals: 'active' } }
        : {
            and: [
              { status: { equals: 'active' } },
              {
                or: [
                  { stripeAccountId: { exists: false } },
                  { stripeAccountId: { equals: null } },
                ],
              },
            ],
      },
      limit: 100,
      depth: 0,
    })
    console.log(
      `Backfill${recreate ? ' (recreate)' : ''}: ${docs.length} active referral(s)` +
        (recreate ? '' : ' without stripeAccountId'),
    )
    let created = 0
    for (const referral of docs) {
      try {
        if (recreate && referral.stripeAccountId) {
          console.log(
            `${referral.code}: clearing existing ${referral.stripeAccountId} before recreate`,
          )
          await payload.update({
            collection: 'referrals',
            id: referral.id,
            data: { stripeAccountId: null },
          })
          referral.stripeAccountId = null
        }
        const r = await createStripeForReferral(payload, referral as never, {
          sendEmail: false,
        })
        if (r) {
          created++
          console.log(`${referral.code}: ${r.accountId} — onboarding link ${r.onboardingUrl}`)
        }
      } catch (e) {
        console.error(`${referral.code}: Stripe create failed:`, stripeError(e))
      }
    }
    console.log(`Backfill done. Created: ${created}/${docs.length}`)
    return
  }

  const { docs } = await payload.find({
    collection: 'referrals',
    where: { code: { equals: arg } },
    limit: 1,
    depth: 0,
  })
  const referral = docs[0]
  if (!referral) {
    console.error(`No referral found with code '${arg}'`)
    process.exit(1)
  }

  try {
    const result = await createStripeForReferral(payload, referral as never, {
      sendEmail: true,
    })
    if (result) {
      console.log('--- RESULT ---')
      console.log(`accountId:      ${result.accountId}`)
      console.log(`onboardingUrl:  ${result.onboardingUrl}`)
      console.log(`email:          sent to ${referral.creatorEmail}`)
    }
  } catch (e) {
    console.error('Stripe create failed:', stripeError(e))
    const code = (e as { code?: string })?.code
    if (code === 'platform_capabilities_incomplete') {
      console.error(
        'Action required: enable Card Payments (and Transfers) for Express ' +
          'connected accounts in Stripe Dashboard -> Settings -> Connect.',
      )
    }
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
