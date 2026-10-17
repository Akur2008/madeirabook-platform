import type { Payload } from 'payload'

export const OWNER_TERMS_VERSION = 'v1.0'
export const AMBASSADOR_TERMS_VERSION = 'v1.0'

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

export async function hasSignedOwnerTerms(
  payload: Payload,
  userId: number | string,
): Promise<boolean> {
  const { docs } = await payload.find({
    collection: 'agreements',
    where: {
      and: [
        { user: { equals: userId } },
        { documentType: { equals: 'owner_terms' } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  return docs.length > 0
}

export async function hasSignedAmbassadorTerms(
  payload: Payload,
  referralId: number | string,
): Promise<boolean> {
  const { docs } = await payload.find({
    collection: 'agreements',
    where: {
      and: [
        { referral: { equals: referralId } },
        { documentType: { equals: 'ambassador_terms' } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  return docs.length > 0
}
