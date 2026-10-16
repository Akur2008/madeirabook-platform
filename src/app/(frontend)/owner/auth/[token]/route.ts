import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import {
  OWNER_SESSION_COOKIE,
  createOwnerSessionToken,
  getCurrentOwner,
  ownerSessionCookieOptions,
} from '@/lib/ownerAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params
  const loginUrl = new URL('/owner/login', req.url)
  const ownerUrl = new URL('/owner', req.url)

  async function redirectExpired() {
    // Browsers may replay the navigation request after a redirect; if the
    // session cookie is already present, this is a duplicate — go to /owner.
    const owner = await getCurrentOwner()
    if (owner) return NextResponse.redirect(ownerUrl, 303)
    loginUrl.searchParams.set('expired', '1')
    return NextResponse.redirect(loginUrl, 303)
  }

  if (!token || token.length < 32) {
    return redirectExpired()
  }

  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'users',
    where: {
      and: [
        { magicToken: { equals: token } },
        { magicTokenExpiresAt: { greater_than: new Date().toISOString() } },
        { role: { equals: 'owner' } },
      ],
    },
    limit: 1,
    depth: 0,
  })

  const user = docs[0]
  if (!user) {
    return redirectExpired()
  }

  // One-time use: clear the token before issuing the session.
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { magicToken: null, magicTokenExpiresAt: null },
  })

  const session = await createOwnerSessionToken(user.id)
  const res = NextResponse.redirect(ownerUrl, 303)
  res.cookies.set(OWNER_SESSION_COOKIE, session, ownerSessionCookieOptions)
  return res
}
