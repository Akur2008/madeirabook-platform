// PMS router — dispatches calendar/rate/booking calls to the right backend
// based on property.pms: 'smoobu' (Gold, direct API) or 'zeevou' (Silver,
// free API, single organization). Empty pms = legacy Smoobu.
// Adapters are loaded via dynamic import so a broken/unconfigured backend
// never breaks the other one.

export type PmsName = 'smoobu' | 'zeevou'

export type PmsMeta = {
  unitTypeId?: number
  unitId?: number
  ratePlanId?: number
}

export interface PmsPropertyRef {
  pms?: string | null
  pmsPropertyId?: string | number | null
  pmsMeta?: unknown
}

export function resolvePms(property: PmsPropertyRef | null | undefined): PmsName {
  return property?.pms === 'zeevou' ? 'zeevou' : 'smoobu'
}

// Narrows the loosely-typed Payload json field to our meta shape.
function pmsMetaOf(property: PmsPropertyRef): PmsMeta {
  const m = property.pmsMeta
  return m && typeof m === 'object' && !Array.isArray(m) ? (m as PmsMeta) : {}
}

function pmsId(property: PmsPropertyRef): number {
  const id = Number(property.pmsPropertyId)
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Property has no pmsPropertyId')
  }
  return id
}

// Unified per-day rate shape: { [YYYY-MM-DD]: { price, minStay, available } }
export type PmsRatesMap = Record<
  string,
  { price?: number; minStay?: number; available?: boolean }
>

export async function getRates(
  property: PmsPropertyRef,
  startDate: string,
  endDate: string,
): Promise<PmsRatesMap> {
  const id = pmsId(property)
  if (resolvePms(property) === 'zeevou') {
    const zeevou = await import('@/services/pms/zeevou')
    return zeevou.getRates(id, startDate, endDate, pmsMetaOf(property).ratePlanId ?? null)
  }
  const smoobu = await import('@/lib/smoobu')
  const map = await smoobu.getRates([id], startDate, endDate)
  const days = map[String(id)] ?? {}
  const out: PmsRatesMap = {}
  for (const [date, d] of Object.entries(days)) {
    out[date] = {
      price: d.price,
      minStay: d.min_length_of_stay,
      available:
        typeof d.available === 'number' ? d.available === 1 : d.available,
    }
  }
  return out
}

export interface SetRatesInput {
  startDate: string
  endDate: string
  price: number
  minNights?: number | null
}

function eachDay(startDate: string, endDate: string): string[] {
  const days: string[] = []
  const cur = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return days
}

export async function setRates(
  property: PmsPropertyRef,
  input: SetRatesInput,
): Promise<unknown> {
  const id = pmsId(property)
  if (resolvePms(property) === 'zeevou') {
    const zeevou = await import('@/services/pms/zeevou')
    const items = eachDay(input.startDate, input.endDate).map((date) => ({
      date,
      rate: input.price,
    }))
    return zeevou.setRates(id, items, pmsMetaOf(property).ratePlanId ?? null)
  }
  const smoobu = await import('@/lib/smoobu')
  return smoobu.setRates(
    [id],
    input.startDate,
    input.endDate,
    input.price,
    input.minNights,
  )
}

// Unified booking shape returned by getReservations regardless of backend.
export interface PmsBooking {
  id: number
  propertyId: number // PMS-side property id (pmsPropertyId)
  arrival: string
  departure: string
  channel: string
  guestName: string
  guestEmail: string
  guestPhone: string
  price: number
  adults: number
  children: number
  checkIn: string
  checkOut: string
  cancelled: boolean
  blocked: boolean
}

function mapSmoobuBooking(b: import('@/lib/smoobu').SmoobuReservation): PmsBooking {
  return {
    id: b.id,
    propertyId: Number(b.apartment?.id) || 0,
    arrival: b.arrival,
    departure: b.departure,
    channel: b.channel?.name || 'Direct',
    guestName: b['guest-name'] || `${b.firstname || ''} ${b.lastname || ''}`.trim(),
    guestEmail: b.email || '',
    guestPhone: b.phone || '',
    price: Number(b.price) || 0,
    adults: Number(b.adults) || 0,
    children: Number(b.children) || 0,
    checkIn: b['check-in'] || '',
    checkOut: b['check-out'] || '',
    cancelled: b.status === 'cancelled' || b.type === 'cancellation',
    blocked: Boolean(b['is-blocked-booking']),
  }
}

// Reservations touching [start, end] for a single property.
export async function getReservations(
  property: PmsPropertyRef,
  startDate: string,
  endDate: string,
): Promise<PmsBooking[]> {
  const id = pmsId(property)
  if (resolvePms(property) === 'zeevou') {
    const zeevou = await import('@/services/pms/zeevou')
    const rows = await zeevou.getReservations(id, startDate, endDate)
    return rows.map((b) => ({
      id: b.id,
      propertyId: b.propertyId ?? id,
      arrival: b.arrival,
      departure: b.departure,
      channel: b.channel,
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      guestPhone: b.guestPhone,
      price: b.price,
      adults: b.adults,
      children: b.children,
      checkIn: '',
      checkOut: '',
      cancelled: b.status === 'cancelled',
      blocked: false,
    }))
  }
  const smoobu = await import('@/lib/smoobu')
  const all = await smoobu.getReservations(startDate, endDate)
  return all
    .filter((b) => Number(b.apartment?.id) === id)
    .map(mapSmoobuBooking)
}

export interface CreateBookingInput {
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
  totalPrice?: number
}

// Creates a direct reservation in the property's PMS.
// Returns the PMS-side booking / booking-request id.
export async function createBooking(
  property: PmsPropertyRef,
  input: CreateBookingInput,
): Promise<number> {
  const id = pmsId(property)
  if (resolvePms(property) === 'zeevou') {
    const zeevou = await import('@/services/pms/zeevou')
    const created = await zeevou.createBooking({
      propertyId: id,
      ratePlanId: pmsMetaOf(property).ratePlanId ?? null,
      arrivalDate: input.arrivalDate,
      departureDate: input.departureDate,
      guestName: input.guestName,
      lastName: input.lastName,
      guestEmail: input.guestEmail,
      phone: input.phone,
      adults: input.adults,
      children: input.children,
      totalPrice: input.totalPrice,
    })
    const bookingId = Number(created.id)
    if (!Number.isFinite(bookingId)) {
      throw new Error(
        `Zeevou did not return a booking id: ${JSON.stringify(created).slice(0, 300)}`,
      )
    }
    return bookingId
  }
  const smoobu = await import('@/lib/smoobu')
  return smoobu.createReservation({
    propertyId: id,
    arrivalDate: input.arrivalDate,
    departureDate: input.departureDate,
    guestName: input.guestName,
    lastName: input.lastName,
    guestEmail: input.guestEmail,
    phone: input.phone,
    country: input.country,
    street: input.street,
    postalCode: input.postalCode,
    location: input.location,
    arrivalTime: input.arrivalTime,
    adults: input.adults,
    children: input.children,
  })
}

// Provisions the property inside Zeevou (Silver tier). Smoobu properties are
// created in the Smoobu dashboard — there is no creation API call here.
export async function createProperty(input: {
  name: string
  shortName?: string
  description?: string
  address?: { street?: string; postalCode?: string; city?: string; country?: string }
  maxGuests?: number
  bedrooms?: number
  basePrice?: number
}): Promise<{ propertyId: number; pmsMeta: PmsMeta }> {
  const zeevou = await import('@/services/pms/zeevou')
  const ids = await zeevou.createProperty(input)
  return {
    propertyId: ids.propertyId,
    pmsMeta: {
      unitTypeId: ids.unitTypeId ?? undefined,
      unitId: ids.unitId ?? undefined,
      ratePlanId: ids.ratePlanId ?? undefined,
    },
  }
}
