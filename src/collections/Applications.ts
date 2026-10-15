import { randomBytes } from 'node:crypto'
import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { ambassadorInvitation } from '@/lib/emails/templates'
import { sendAdminAlert, sendResendEmail } from '@/lib/notify'

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000

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

  await req.payload.create({
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
    },
  })

  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('Ambassador invitation email skipped: RESEND_API_KEY is not set')
    } else {
      const rendered = ambassadorInvitation({ displayName, token: invitationToken })
      await sendResendEmail(process.env.RESEND_API_KEY, {
        to: doc.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      })
    }
  } catch (e) {
    console.error('Ambassador invitation email failed:', e)
    await sendAdminAlert(
      'Ambassador invitation email failed',
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
