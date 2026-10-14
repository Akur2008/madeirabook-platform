import crypto from 'crypto'

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
