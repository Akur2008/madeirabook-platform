import crypto from 'crypto'
import { getPayload } from 'payload'

import config from '@payload-config'
import { PRICING_RULES, getScenario } from '@/lib/pricing-rules'

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
  adults?: number
  children?: number
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
    adults: p.adults || 2,
    children: p.children || 0,
  }
  const res = await smoobuRequest('POST', '/api/reservations', body)
  if (!res || !res.id) {
    throw new Error(`Smoobu did not return a booking id: ${JSON.stringify(res)}`)
  }
  return Number(res.id)
}

// Cancels a Smoobu reservation. Ported from madeirabook-core
// smoobu.js cancelReservation.
export async function cancelReservation(
  smoobuBookingId: number | string,
): Promise<Record<string, unknown>> {
  return smoobuRequest('DELETE', `/api/reservations/${smoobuBookingId}`, null)
}

// Sets daily price / min stay for a date range.
// dates entries are "YYYY-MM-DD:YYYY-MM-DD" per the Smoobu Post Rates API;
// a single day must be sent as a bare "YYYY-MM-DD" — Smoobu rejects
// zero-length "X:X" ranges with a 422.
// Ported from madeirabook-core smoobu.js setRates.
export async function setRates(
  apartmentIds: number[],
  arrivalDate: string,
  departureDate: string,
  price: number,
  minNights?: number | null,
): Promise<Record<string, unknown>> {
  const operation: Record<string, unknown> = {
    dates: [
      arrivalDate === departureDate
        ? arrivalDate
        : `${arrivalDate}:${departureDate}`,
    ],
    daily_price: price,
  }
  if (minNights && minNights > 0) {
    operation.min_length_of_stay = minNights
  }
  const body = {
    customerId: Number(process.env.SMOOBU_USER_ID),
    apartments: apartmentIds.map(Number),
    operations: [operation],
  }
  return smoobuRequest('POST', '/api/rates', body)
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
  // Cleaning fee inside the total price — read from the PMS price breakdown
  // (Smoobu priceElements) or, for Zeevou, the property's DB cleaningFee.
  cleaningFee?: number
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
    {
      price?: unknown
      currency?: string
      priceElements?: { type?: string; amount?: unknown }[]
    }
  >
  const errors = ((res && res.errorMessages) || {}) as Record<string, unknown>
  const result: Record<number, SmoobuAvailabilityEntry> = {}
  for (const id of ids) {
    const key = String(id)
    const entry = prices[key]
    if (entry && Number.isFinite(Number(entry.price))) {
      const cleaning = (entry.priceElements ?? []).find(
        (el) => el?.type === 'cleaningFee' && Number.isFinite(Number(el.amount)),
      )
      result[id] = {
        available: true,
        price: Number(entry.price),
        currency: entry.currency || 'EUR',
        ...(cleaning ? { cleaningFee: Number(cleaning.amount) } : {}),
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
  price: number | null
  currency: string
  coverImage: string | null
  // True when price comes from the DB pricePerNight rather than a live PMS
  // rate (no pmsPropertyId, or the PMS check failed).
  estimate?: boolean
  nights: number
  // Stay total minus the cleaning fee — the "n nights" part of the price.
  accommodation: number | null
  cleaningFee: number | null
}

interface ZeevouDocRef {
  pmsPropertyId?: string | number | null
  pmsMeta?: unknown
  cleaningFee?: number | null
}

// Zeevou has no bulk availability/quote endpoint — compose it from per-day
// rates (GET /apis/rates: price, stop_sell, min_stay) plus a booking-overlap
// check. A stay is unavailable when a night is stop-sell'd, overlaps an
// active booking, or falls under a min-stay rule. When some nights have no
// rate rows at all we return available-without-price and let the caller fall
// back to the DB estimate — a partial sum would be a wrong price.
async function checkZeevouStay(
  doc: ZeevouDocRef,
  arrivalDate: string,
  departureDate: string,
  nights: number,
): Promise<SmoobuAvailabilityEntry> {
  const zeevou = await import('@/services/pms/zeevou')
  const id = Number(doc.pmsPropertyId)
  const meta =
    doc.pmsMeta && typeof doc.pmsMeta === 'object' && !Array.isArray(doc.pmsMeta)
      ? (doc.pmsMeta as { ratePlanId?: number })
      : {}
  const [rates, bookings] = await Promise.all([
    zeevou.getRates(id, arrivalDate, departureDate, meta.ratePlanId ?? null),
    zeevou.getReservations(id, arrivalDate, departureDate),
  ])

  const overlap = bookings.some(
    (b) =>
      b.status !== 'cancelled' &&
      b.arrival < departureDate &&
      b.departure > arrivalDate,
  )
  if (overlap) return { available: false, reason: 'booked' }

  let total = 0
  let missing = false
  const day = new Date(`${arrivalDate}T00:00:00Z`)
  const last = new Date(`${departureDate}T00:00:00Z`)
  while (day < last) {
    const iso = day.toISOString().slice(0, 10)
    const r = rates[iso]
    if (r?.available === false) return { available: false, reason: 'stop_sell' }
    if (Number(r?.minStay) > nights) {
      return { available: false, reason: 'min_stay' }
    }
    if (Number.isFinite(Number(r?.price))) total += Number(r.price)
    else missing = true
    day.setUTCDate(day.getUTCDate() + 1)
  }
  if (missing) return { available: true }

  const cleaning = Number(doc.cleaningFee)
  const cleaningFee = Number.isFinite(cleaning) && cleaning > 0 ? cleaning : 0
  return {
    available: true,
    price: total + cleaningFee,
    currency: 'EUR',
    ...(cleaningFee ? { cleaningFee } : {}),
  }
}

// Availability search across all published, bookable properties. The
// pricingScenario manifest (src/lib/pricing-rules.ts) decides the price
// source per property: smoobu ids go to the batch checkApartmentAvailability
// call, zeevou properties get a per-property rates+bookings check, and
// manual prices come straight from the DB. Non-bookable scenarios
// (display_only, siteminder) are excluded — they are never sold. Properties
// whose PMS check fails or that have no pmsPropertyId fall back to the DB
// pricePerNight (marked `estimate: true`) instead of being dropped.
// Items without any price keep `price: null` — the UI renders those as
// "contact us" entries.
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
        { status: { equals: 'published' } },
        { brand: { not_equals: 'madeiraoasis' } },
      ],
    },
    limit: 100,
    depth: 1,
  })

  const nights = Math.max(
    1,
    Math.round(
      (Date.parse(departureDate) - Date.parse(arrivalDate)) / 86400000,
    ),
  )

  // Only bookable scenarios are sellable here — display_only / siteminder
  // stays are skipped entirely (no PMS calls, no search rows).
  const sellable = found.docs.filter(
    (doc) => PRICING_RULES[getScenario(doc)].isBookable,
  )

  // Split by the scenario's price source — sending a Zeevou id to Smoobu
  // fails the whole batch ("customer not owner for one or more apartments").
  const smoobuIds: number[] = []
  const zeevouDocs: typeof found.docs = []
  for (const doc of sellable) {
    const source = PRICING_RULES[getScenario(doc)].priceSource
    const id = Number(doc.pmsPropertyId)
    if (!Number.isFinite(id) || id <= 0) continue
    if (source === 'zeevou_api') zeevouDocs.push(doc)
    else if (source === 'smoobu_api') smoobuIds.push(id)
  }

  let avail: Record<number, SmoobuAvailabilityEntry> = {}
  if (smoobuIds.length) {
    try {
      avail = await checkApartmentAvailability(
        smoobuIds,
        arrivalDate,
        departureDate,
      )
    } catch (err) {
      console.warn(
        'checkAvailability: Smoobu check failed, falling back to DB prices',
        err,
      )
    }
  }

  const zeevouAvail = new Map<number, SmoobuAvailabilityEntry>()
  if (zeevouDocs.length) {
    await Promise.all(
      zeevouDocs.map(async (doc) => {
        try {
          zeevouAvail.set(
            doc.id,
            await checkZeevouStay(doc, arrivalDate, departureDate, nights),
          )
        } catch (err) {
          console.warn(
            `checkAvailability: Zeevou check failed for ${doc.slug}, falling back to DB price`,
            err,
          )
        }
      }),
    )
  }

  const items: AvailabilityItem[] = []
  for (const doc of sellable) {
    const source = PRICING_RULES[getScenario(doc)].priceSource
    const id = Number(doc.pmsPropertyId)
    const entry =
      source === 'zeevou_api'
        ? zeevouAvail.get(doc.id)
        : source === 'smoobu_api' && Number.isFinite(id)
          ? avail[id]
          : undefined
    if (entry && !entry.available) continue

    const livePrice =
      entry?.available && Number.isFinite(Number(entry.price))
        ? Number(entry.price)
        : null
    const perNight = Number(doc.pricePerNight)
    const cleaningDb = Number(doc.cleaningFee)
    const estimate = livePrice === null
    const accommodation =
      livePrice !== null
        ? livePrice - (entry?.cleaningFee ?? 0)
        : Number.isFinite(perNight) && perNight > 0
          ? perNight * nights
          : null
    const cleaningFee =
      livePrice !== null
        ? (entry?.cleaningFee ??
          (Number.isFinite(cleaningDb) && cleaningDb > 0 && cleaningDb < livePrice
            ? cleaningDb
            : null))
        : Number.isFinite(cleaningDb) && cleaningDb > 0
          ? cleaningDb
          : null
    const price =
      livePrice ??
      (accommodation !== null ? accommodation + (cleaningFee ?? 0) : null)

    const firstImage = doc.media?.[0]?.image
    const coverImage =
      firstImage && typeof firstImage === 'object' && firstImage.url
        ? firstImage.url
        : null
    items.push({
      slug: doc.slug,
      name: doc.title,
      price,
      currency:
        entry?.currency && entry.currency !== '€' ? entry.currency : 'EUR',
      coverImage,
      nights,
      accommodation,
      cleaningFee,
      ...(estimate ? { estimate: true } : {}),
    })
  }
  items.sort(
    (a, b) =>
      (a.price ?? Number.MAX_SAFE_INTEGER) -
      (b.price ?? Number.MAX_SAFE_INTEGER),
  )
  return items
}

export interface SmoobuRateDay {
  price?: number
  min_length_of_stay?: number
  available?: boolean | number
}

// { [apartmentId]: { [date YYYY-MM-DD]: SmoobuRateDay } }
export type SmoobuRatesMap = Record<string, Record<string, SmoobuRateDay>>

export interface SmoobuReservation {
  id: number
  arrival: string
  departure: string
  apartment?: { id?: number | string }
  channel?: { name?: string }
  'guest-name'?: string
  firstname?: string
  lastname?: string
  email?: string
  phone?: string
  price?: number
  adults?: number
  children?: number
  'check-in'?: string
  'check-out'?: string
  'is-blocked-booking'?: boolean
  status?: string
  type?: string
}

interface SmoobuReservationsPage {
  bookings?: SmoobuReservation[]
  page_count?: number
  total_items?: number
}

// Per-day rates for a list of apartments. Smoobu only returns the first
// apartment of apartments[] per request, so we issue one request per id
// with a 200ms pause between calls (rate limit), then merge.
// Ported from madeirabook-core smoobu.js getRates.
export async function getRates(
  apartmentIds: number[],
  startDate: string,
  endDate: string,
): Promise<SmoobuRatesMap> {
  const merged: SmoobuRatesMap = {}
  for (const aptId of apartmentIds) {
    try {
      const res = await smoobuRequest('GET', '/api/rates', null, {
        'apartments[]': String(aptId),
        end_date: endDate,
        start_date: startDate,
      })
      const data = res?.data as SmoobuRatesMap | undefined
      if (data) Object.assign(merged, data)
    } catch (e) {
      console.warn(
        `smoobu getRates failed for apartment ${aptId}:`,
        e instanceof Error ? e.message : e,
      )
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  return merged
}

// Reservations in [from, to]. Smoobu ignores the apartments[] filter on this
// endpoint, so callers must filter by apartment.id themselves. pageSize is
// capped at 100 by the API; we paginate via `page` when page_count > 1.
// Ported from madeirabook-core smoobu.js getReservations.
export async function getReservations(
  from: string,
  to: string,
): Promise<SmoobuReservation[]> {
  const bookings: SmoobuReservation[] = []
  let page = 1
  let pageCount = 1
  do {
    const res = (await smoobuRequest('GET', '/api/reservations', null, {
      from,
      page,
      pageSize: 100,
      to,
    })) as SmoobuReservationsPage
    if (Array.isArray(res.bookings)) bookings.push(...res.bookings)
    pageCount = Number(res.page_count) || 1
    page += 1
  } while (page <= pageCount && page <= 10)
  return bookings
}
