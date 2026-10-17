import { cache } from 'react'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import { SignJWT, jwtVerify } from 'jose'

import config from '@payload-config'
import type { User } from '@/payload-types'

export const OWNER_SESSION_COOKIE = 'owner_session'

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days
const SESSION_TTL_JWT = '30d'

function sessionSecret(): Uint8Array {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function createOwnerSessionToken(userId: number | string): Promise<string> {
  return new SignJWT({ role: 'owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL_JWT)
    .sign(sessionSecret())
}

export const ownerSessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
}

async function verifyOwnerSessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret())
    if (payload.role !== 'owner' || !payload.sub) return null
    return payload.sub
  } catch {
    return null
  }
}

export const getCurrentOwner = cache(async (): Promise<User | null> => {
  const store = await cookies()
  const token = store.get(OWNER_SESSION_COOKIE)?.value
  if (!token) return null

  const userId = await verifyOwnerSessionToken(token)
  if (!userId) return null

  const payload = await getPayload({ config: await config })
  try {
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
    })
    if (!user || user.role !== 'owner') return null
    return user
  } catch {
    return null
  }
})

// Numeric Smoobu apartment ids (properties.pmsPropertyId) linked to the
// owner. Mutation routes use this to scope writes to the owner's own units.
export async function getOwnerSmoobuIds(
  ownerId: number | string,
): Promise<number[]> {
  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'properties',
    where: { owner: { equals: ownerId } },
    limit: 100,
    depth: 0,
  })
  return docs
    .map((p) => Number(p.pmsPropertyId))
    .filter((id) => Number.isFinite(id))
}
