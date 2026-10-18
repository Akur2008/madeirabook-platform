import { randomBytes } from 'node:crypto'
import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import Stripe from 'stripe'

import { ambassadorAccepted } from '@/lib/emails/templates'
import { sendAdminAlert, sendResendEmail } from '@/lib/notify'

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const APP_URL = process.env.APP_URL || 'https://www.madeirabook.com'

let stripeClient: Stripe | null = null

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (!stripeClient) stripeClient = new Stripe(key)
  return stripeClient
}

// Relationship fields arrive as ids or populated docs — normalize to ids.
function relIds(list: unknown): number[] {
  if (!Array.isArray(list)) return []
  return list
    .map((item) =>
      typeof item === 'object' && item !== null
        ? (item as { id?: unknown }).id
        : item,
    )
    .filter((v): v is number => typeof v === 'number')
}

// Stripe Express account for ambassador payouts: transfers capability,
// monthly payout schedule (1st of the month) and a fresh onboarding link.
async function createStripeExpressAccount(
  email: string,
  welcomeUrl: string,
): Promise<{ accountId: string; onboardingUrl: string } | null> {
  const stripe = getStripe()
  if (!stripe) {
    console.warn('Stripe account skipped: STRIPE_SECRET_KEY is not set')
    return null
  }
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    // Stripe requires card_payments alongside transfers on this platform
    // (transfers-only capability needs manual Stripe approval).
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
  })
  await stripe.accounts.update(account.id, {
    settings: {
      payouts: { schedule: { interval: 'monthly', monthly_anchor: 1 } },
    },
  })
  const link = await stripe.accountLinks.create({
    account: account.id,
    type: 'account_onboarding',
    refresh_url: welcomeUrl,
    return_url: welcomeUrl,
  })
  return { accountId: account.id, onboardingUrl: link.url }
}

// Referral code from the Instagram handle: "@Alex.Traveler!" -> "alex_traveler".
function makeCodeBase(handle: string): string {
  const base = handle
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return (base || 'ambassador').slice(0, 46)
}

// On approval: create the ambassador referral with a one-time invitation
// token and email the private welcome link. Runs once per application.
const createAmbassadorInvitation: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (doc.status !== 'approved') return doc
  if (previousDoc?.status === 'approved') return doc

  const existing = await req.payload.find({
    collection: 'referrals',
    where: { sourceApplication: { equals: doc.id } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length > 0) return doc

  const codeBase = makeCodeBase(doc.instagramHandle)
  let code = codeBase
  for (let attempt = 2; ; attempt += 1) {
    const clash = await req.payload.find({
      collection: 'referrals',
      where: { code: { equals: code } },
      limit: 1,
      depth: 0,
    })
    if (clash.docs.length === 0) break
    code = `${codeBase}-${attempt}`
  }

  const firstName = String(doc.name || '').trim().split(/\s+/)[0] || 'Ambassador'
  const invitationToken = randomBytes(16).toString('hex')
  const displayName = `${firstName}'s Madeira Guide`

  const referral = await req.payload.create({
    collection: 'referrals',
    data: {
      code,
      creatorName: doc.name,
      creatorEmail: doc.email,
      commissionRate: 2,
      status: 'paused',
      invitationToken,
      invitationExpiresAt: new Date(Date.now() + INVITATION_TTL_MS).toISOString(),
      displayName,
      sourceApplication: doc.id,
      selectedBeaches: relIds(doc.selectedBeaches),
      selectedRestaurants: relIds(doc.selectedRestaurants),
    },
  })

  const welcomeUrl = `${APP_URL}/ambassadors/welcome/${invitationToken}`

  let stripeResult: { accountId: string; onboardingUrl: string } | null = null
  try {
    stripeResult = await createStripeExpressAccount(doc.email, welcomeUrl)
    if (stripeResult) {
      await req.payload.update({
        collection: 'referrals',
        id: referral.id,
        data: {
          stripeAccountId: stripeResult.accountId,
          payoutSchedule: 'monthly',
        },
      })
    }
  } catch (e) {
    console.error('Stripe Express account creation failed:', e)
    await sendAdminAlert(
      'Stripe account creation failed for ambassador',
      [
        `Handle: ${doc.instagramHandle}`,
        `Email: ${doc.email}`,
        `Referral: ${code}`,
        `Error: ${e}`,
      ].join('\n'),
    )
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('Ambassador acceptance email skipped: RESEND_API_KEY is not set')
    } else {
      const rendered = ambassadorAccepted({
        displayName,
        code,
        stripeOnboardingUrl: stripeResult?.onboardingUrl ?? null,
        inviteUrl: welcomeUrl,
      })
      await sendResendEmail(process.env.RESEND_API_KEY, {
        to: doc.email,
        cc: process.env.ADMIN_EMAIL,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      })
    }
  } catch (e) {
    console.error('Ambassador acceptance email failed:', e)
    await sendAdminAlert(
      'Ambassador acceptance email failed',
      [`Handle: ${doc.instagramHandle}`, `Email: ${doc.email}`, `Error: ${e}`].join('\n'),
    )
  }

  console.log(`Ambassador invitation created for ${doc.instagramHandle}`)
  return doc
}

export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    useAsTitle: 'instagramHandle',
    defaultColumns: ['instagramHandle', 'email', 'audienceSize', 'status', 'createdAt'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [createAmbassadorInvitation],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'instagramHandle',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'audienceSize',
      type: 'select',
      required: true,
      options: [
        { label: '5k-10k', value: '5k-10k' },
        { label: '10k-30k', value: '10k-30k' },
        { label: '30k-100k', value: '30k-100k' },
        { label: '100k+', value: '100k+' },
      ],
    },
    {
      name: 'niche',
      type: 'select',
      required: true,
      options: [
        { label: 'Travel', value: 'travel' },
        { label: 'Lifestyle', value: 'lifestyle' },
        { label: 'Portugal & Madeira', value: 'portugal-madeira' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'mainCity',
      type: 'text',
      admin: {
        description: 'Main audience city, for targeting.',
      },
    },
    {
      name: 'sampleReelUrl',
      type: 'text',
      admin: {
        description: 'Link to one Reel the creator is proud of.',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      admin: {
        description: 'Comment from the creator.',
      },
    },
    {
      name: 'selectedBeaches',
      type: 'relationship',
      relationTo: 'beaches',
      hasMany: true,
      admin: {
        description: 'Beaches the applicant picked for their map (3-5).',
      },
    },
    {
      name: 'selectedRestaurants',
      type: 'relationship',
      relationTo: 'restaurants',
      hasMany: true,
      admin: {
        description: 'Restaurants the applicant picked for their map (3-5).',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'reviewNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes — never shown to the applicant.',
      },
    },
  ],
}
