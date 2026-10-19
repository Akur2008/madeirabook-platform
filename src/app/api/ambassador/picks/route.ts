import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_RE = /^[a-f0-9]{32}$/
const MAX_PICKS = 5

function asIdList(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null
  const ids = value
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0)
  return ids.length === value.length ? [...new Set(ids)] : null
}

export async function PATCH(req: Request) {
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
  const token = raw.token
  if (typeof token !== 'string' || !TOKEN_RE.test(token)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid invitation' },
      { status: 404 },
    )
  }

  const selectedBeaches = asIdList(raw.selectedBeaches)
  const selectedRestaurants = asIdList(raw.selectedRestaurants)
  if (
    !selectedBeaches ||
    !selectedRestaurants ||
    selectedBeaches.length > MAX_PICKS ||
    selectedRestaurants.length > MAX_PICKS
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: `Pick up to ${MAX_PICKS} beaches and up to ${MAX_PICKS} restaurants`,
      },
      { status: 400 },
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

  // Reject ids that aren't published madeirabook spots — beaches and
  // restaurants hold no Oasis inventory (brand='madeiraoasis' lives on
  // properties), so a published-status check is the full exclusion.
  const [beachDocs, restaurantDocs] = await Promise.all([
    payload.find({
      collection: 'beaches',
      where: {
        and: [
          { id: { in: selectedBeaches } },
          { status: { equals: 'published' } },
        ],
      },
      limit: MAX_PICKS,
      depth: 0,
    }),
    payload.find({
      collection: 'restaurants',
      where: {
        and: [
          { id: { in: selectedRestaurants } },
          { status: { equals: 'published' } },
        ],
      },
      limit: MAX_PICKS,
      depth: 0,
    }),
  ])
  if (
    beachDocs.docs.length !== selectedBeaches.length ||
    restaurantDocs.docs.length !== selectedRestaurants.length
  ) {
    return NextResponse.json(
      { ok: false, error: 'Unknown beach or restaurant selection' },
      { status: 400 },
    )
  }

  await payload.update({
    collection: 'referrals',
    id: referral.id,
    overrideAccess: true,
    data: {
      selectedBeaches,
      selectedRestaurants,
    },
  })

  // Personal map is ISR (revalidate = 60) — refresh it now so new pins
  // show up immediately after save.
  revalidatePath(`/m/${referral.code}`)

  const res = NextResponse.json({ ok: true })
  res.cookies.set('ambassador_token', token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: 'lax',
  })
  return res
}
