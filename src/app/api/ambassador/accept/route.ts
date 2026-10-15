import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { sendAdminAlert } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_RE = /^[a-f0-9]{32}$/

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const token = (body as Record<string, unknown>)?.token
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

  if (referral.invitationUsedAt) {
    return NextResponse.json(
      { ok: false, error: 'Invitation already accepted' },
      { status: 409 },
    )
  }

  if (
    referral.invitationExpiresAt &&
    new Date(referral.invitationExpiresAt).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { ok: false, error: 'Invitation expired' },
      { status: 410 },
    )
  }

  await payload.update({
    collection: 'referrals',
    id: referral.id,
    data: {
      invitationUsedAt: new Date().toISOString(),
      status: 'active',
    },
  })

  await sendAdminAlert(
    `Ambassador ${referral.code} accepted`,
    [
      `Code: ${referral.code}`,
      `Name: ${referral.creatorName}`,
      `Email: ${referral.creatorEmail}`,
      `Accepted: ${new Date().toISOString()}`,
      '',
      'Next step: create a Stripe Express account manually and send the onboarding link.',
    ].join('\n'),
  )

  console.log(`Ambassador invitation accepted: ${referral.code}`)
  return NextResponse.json({ ok: true })
}
