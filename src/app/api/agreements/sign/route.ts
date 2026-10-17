import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import {
  AMBASSADOR_TERMS_VERSION,
  OWNER_TERMS_VERSION,
  clientIp,
  hasSignedAmbassadorTerms,
  hasSignedOwnerTerms,
} from '@/lib/agreements'
import { getCurrentOwner } from '@/lib/ownerAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_RE = /^[a-f0-9]{32}$/
const DOCUMENT_TYPES = new Set(['owner_terms', 'ambassador_terms'])

function asStr(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

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

  const raw = (body ?? {}) as Record<string, unknown>
  const documentType = asStr(raw.documentType, 50)
  const signedName = asStr(raw.signedName)

  if (!documentType || !DOCUMENT_TYPES.has(documentType)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid document type' },
      { status: 400 },
    )
  }
  if (!signedName || signedName.length < 2) {
    return NextResponse.json(
      { ok: false, error: 'Full name is required to sign' },
      { status: 400 },
    )
  }
  if (raw.agreed !== true) {
    return NextResponse.json(
      { ok: false, error: 'You must agree to the terms to sign' },
      { status: 400 },
    )
  }

  const payload = await getPayload({ config: await config })
  const ipAddress = clientIp(req)
  const signedAt = new Date().toISOString()

  if (documentType === 'owner_terms') {
    const owner = await getCurrentOwner()
    if (!owner) {
      return NextResponse.json(
        { ok: false, error: 'Owner session required' },
        { status: 401 },
      )
    }
    if (await hasSignedOwnerTerms(payload, owner.id)) {
      return NextResponse.json({ ok: true, alreadySigned: true })
    }
    await payload.create({
      collection: 'agreements',
      data: {
        user: owner.id,
        role: 'owner',
        documentType: 'owner_terms',
        documentVersion: OWNER_TERMS_VERSION,
        signedName,
        ipAddress,
        signedAt,
      },
    })
    return NextResponse.json({ ok: true })
  }

  // ambassador_terms: signer proves identity with the one-time invitation token.
  const token = asStr(raw.token, 100)
  if (!token || !TOKEN_RE.test(token)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid invitation' },
      { status: 404 },
    )
  }

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
  if (
    referral.invitationExpiresAt &&
    new Date(referral.invitationExpiresAt).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { ok: false, error: 'Invitation expired' },
      { status: 410 },
    )
  }
  if (await hasSignedAmbassadorTerms(payload, referral.id)) {
    return NextResponse.json({ ok: true, alreadySigned: true })
  }

  await payload.create({
    collection: 'agreements',
    data: {
      referral: referral.id,
      role: 'ambassador',
      documentType: 'ambassador_terms',
      documentVersion: AMBASSADOR_TERMS_VERSION,
      signedName,
      ipAddress,
      signedAt,
    },
  })
  return NextResponse.json({ ok: true })
}
