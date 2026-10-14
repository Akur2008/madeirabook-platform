import crypto from 'crypto'
import { getPayload } from 'payload'

import config from '@payload-config'

// Direct Smoobu API client, ported from madeirabook-core
// (src/services/pms/smoobu.js). Requests are signed with HMAC-SHA256:
// canonical string = METHOD, PATH, QUERY, TIMESTAMP, NONCE, SHA256(BODY), API key.

const HOST = 'login.smoobu.com'
const EMPTY_BODY_HASH =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

function getCredentials(): { apiKey: string; apiSecret: string } {
  const apiKey = process.env.SMOOBU_API_KEY
  const apiSecret = process.env.SMOOBU_API_SECRET
  if (!apiKey || !apiSecret) {
    throw new Error('SMOOBU_API_KEY / SMOOBU_API_SECRET are not set')
  }
  return { apiKey, apiSecret }
}

async function smoobuRequest(
  method: string,
  path: string,
  bodyObj?: Record<string, unknown> | null,
  queryObj?: Record<string, string | number | null | undefined>,
): Promise<Record<string, unknown>> {
  const { apiKey, apiSecret } = getCredentials()
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const nonce = crypto.randomUUID()
  const bodyStr = bodyObj ? JSON.stringify(bodyObj) : ''
  const bodyHash = bodyStr
    ? crypto.createHash('sha256').update(bodyStr, 'utf8').digest('hex')
    : EMPTY_BODY_HASH

  let query = ''
  if (queryObj && Object.keys(queryObj).length) {
    const params = new URLSearchParams()
    for (const key of Object.keys(queryObj).sort()) {
      const value = queryObj[key]
      if (value !== undefined && value !== null) params.append(key, String(value))
    }
    query = params.toString()
  }

  const canonical = [method, path, query, timestamp, nonce, bodyHash, apiKey].join('\n')
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(canonical, 'utf8')
    .digest('base64')

  const res = await fetch(
    `https://${HOST}${path}${query ? `?${query}` : ''}`,
    {
      method,
      headers: {
        'X-API-Key': apiKey,
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-Signature': signature,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: bodyStr || undefined,
      signal: AbortSignal.timeout(15000),
    },
  )

  const text = await res.text()
  let parsed: Record<string, unknown>
  try {
    parsed = text ? JSON.parse(text) : {}
  } catch {
    parsed = { raw: text }
  }
  if (!res.ok) {
    throw new Error(
      `Smoobu ${res.status}: ${JSON.stringify(parsed).slice(0, 300)}`,
    )
  }
  return parsed
}

export interface CreateReservationParams {
  propertyId: string | number
  arrivalDate: string
  departureDate: string
  guestName?: string
  lastName?: string
  guestEmail?: string | null
  phone?: string
  country?: string
  street?: string
  postalCode?: string
  location?: string
  arrivalTime?: string
}

// Creates a reservation in Smoobu, returns the Smoobu booking id.
export async function createReservation(
  p: CreateReservationParams,
): Promise<number> {
  const body = {
    apartmentId: Number(p.propertyId),
    arrivalDate: p.arrivalDate,
    departureDate: p.departureDate,
    firstName: p.guestName || 'Guest',
    lastName: p.lastName || '-',
    email: p.guestEmail,
    phone: p.phone || '-',
    country: p.country || 'PT',
    address: {
      street: p.street || '-',
      postalCode: p.postalCode || '-',
      location: p.location || '-',
    },
    arrivalTime: p.arrivalTime || '15:00',
    adults: 2,
  }
  const res = await smoobuRequest('POST', '/api/reservations', body)
  if (!res || !res.id) {
    throw new Error(`Smoobu did not return a booking id: ${JSON.stringify(res)}`)
  }
  return Number(res.id)
}

// Marks a Smoobu reservation as paid.
export async function markPaid(
  smoobuBookingId: number | string,
): Promise<Record<string, unknown>> {
  return smoobuRequest('PUT', `/api/reservations/${smoobuBookingId}`, {
    paid: true,
  })
}

interface SmoobuAvailabilityEntry {
  available: boolean
  price?: number
  currency?: string
  reason?: unknown
}

// Bulk availability + prices for a list of apartments, ported 1:1 from
// madeirabook-core smoobu.js checkAvailability.
// Returns { [apartmentId]: { available, price?, currency? } }.
async function checkApartmentAvailability(
  apartmentIds: number[],
  arrivalDate: string,
  departureDate: string,
): Promise<Record<number, SmoobuAvailabilityEntry>> {
  const customerId = Number(process.env.SMOOBU_USER_ID)
  const ids = (apartmentIds || []).map(Number).filter(Number.isFinite)
  if (!ids.length) return {}
  const body = { arrivalDate, departureDate, apartments: ids, customerId }
  const res = await smoobuRequest(
    'POST',
    '/booking/checkApartmentAvailability',
    body,
  )
  const prices = ((res && res.prices) || {}) as Record<
    string,
    { price?: unknown; currency?: string }
  >
  const errors = ((res && res.errorMessages) || {}) as Record<string, unknown>
  const result: Record<number, SmoobuAvailabilityEntry> = {}
  for (const id of ids) {
    const key = String(id)
    const entry = prices[key]
    if (entry && Number.isFinite(Number(entry.price))) {
      result[id] = {
        available: true,
        price: Number(entry.price),
        currency: entry.currency || 'EUR',
      }
    } else {
      result[id] = { available: false, reason: errors[key] ?? null }
    }
  }
  return result
}

export interface AvailabilityItem {
  slug: string
  name: string
  price: number
  currency: string
  coverImage: string | null
}

// Availability search across all published properties that have a Smoobu id
// (pmsPropertyId). Ported from core routes/search.js: Smoobu ids are joined
// with Payload properties, first media image becomes coverImage, result is
// sorted by price asc.
export async function checkAvailability({
  arrivalDate,
  departureDate,
}: {
  arrivalDate: string
  departureDate: string
}): Promise<AvailabilityItem[]> {
  const payload = await getPayload({ config: await config })
  const found = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { pmsPropertyId: { exists: true } },
        { status: { equals: 'published' } },
      ],
    },
    limit: 100,
    depth: 1,
  })

  const ids = found.docs
    .map((doc) => Number(doc.pmsPropertyId))
    .filter(Number.isFinite)
  if (!ids.length) return []

  const avail = await checkApartmentAvailability(ids, arrivalDate, departureDate)

  const items: AvailabilityItem[] = []
  for (const doc of found.docs) {
    const id = Number(doc.pmsPropertyId)
    const entry = avail[id]
    if (!entry || !entry.available) continue
    const firstImage = doc.media?.[0]?.image
    const coverImage =
      firstImage && typeof firstImage === 'object' && firstImage.url
        ? firstImage.url
        : null
    items.push({
      slug: doc.slug,
      name: doc.title,
      price: Number(entry.price),
      currency: entry.currency === '€' ? 'EUR' : entry.currency || 'EUR',
      coverImage,
    })
  }
  items.sort((a, b) => a.price - b.price)
  return items
}
