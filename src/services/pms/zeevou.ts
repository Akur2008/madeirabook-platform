// Zeevou PMS adapter (Silver tier — free API, single organization account).
// Ported from madeirabook-core src/services/pms/zeevou.js, adapted to fetch().
// Auth: OAuth2 client_credentials Bearer (see zeevou-oauth.ts).
// API is API Platform style: /apis/<resource>, hydra:member collections,
// IRIs ("/apis/properties/123") as relation values.

import { getAccessToken } from './zeevou-oauth'

const BASE =
  process.env.ZEEVOU_BASE_URL ||
  process.env.ZEEVOU_SANDBOX_URL ||
  'https://sandbox.zeevou.com'

// Request/response trace buffer — lets sync tooling build a precise error
// report for Zeevou support (exact JSON payload sent + response received).
export interface ZeevouRequestLogEntry {
  method: string
  url: string
  requestBody: unknown
  status: number
  responseBody: unknown
  at: string
}

const globalForLog = globalThis as unknown as {
  __zeevouRequestLog?: ZeevouRequestLogEntry[]
}

export function getZeevouRequestLog(): ZeevouRequestLogEntry[] {
  return globalForLog.__zeevouRequestLog ?? []
}

export function clearZeevouRequestLog(): void {
  globalForLog.__zeevouRequestLog = []
}

async function zeevouRequest(
  method: string,
  path: string,
  bodyObj?: Record<string, unknown> | Record<string, unknown>[] | null,
  queryObj?: Record<string, string | number | null | undefined>,
): Promise<unknown> {
  const token = await getAccessToken()
  let url = `${BASE}${path}`
  if (queryObj && Object.keys(queryObj).length) {
    const params = new URLSearchParams()
    for (const key of Object.keys(queryObj).sort()) {
      const value = queryObj[key]
      if (value !== undefined && value !== null) params.append(key, String(value))
    }
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(bodyObj ? { 'Content-Type': 'application/json' } : {}),
    },
    body: bodyObj ? JSON.stringify(bodyObj) : undefined,
    signal: AbortSignal.timeout(15000),
  })
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : {}
  } catch {
    parsed = { raw: text }
  }
  const log = (globalForLog.__zeevouRequestLog ??= [])
  log.push({
    method,
    url,
    requestBody: bodyObj ?? null,
    status: res.status,
    responseBody: parsed,
    at: new Date().toISOString(),
  })
  if (log.length > 200) log.splice(0, log.length - 200)
  if (!res.ok) {
    throw new Error(
      `Zeevou ${method} ${path} ${res.status}: ${JSON.stringify(parsed).slice(0, 400)}`,
    )
  }
  return parsed
}

const apiGet = (path: string, query?: Record<string, string | number>) =>
  zeevouRequest('GET', path, null, query)
const apiPost = (path: string, body: Record<string, unknown> | Record<string, unknown>[]) =>
  zeevouRequest('POST', path, body)
const apiDelete = (path: string) => zeevouRequest('DELETE', path)

function hydraMembers(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  const obj = (data ?? {}) as Record<string, unknown>
  const members = obj['hydra:member'] ?? obj.data
  return Array.isArray(members) ? (members as Record<string, unknown>[]) : []
}

// Numeric id out of an API Platform value: 12, "/apis/x/12" or {id:12}.
function toId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const tail = value.split('/').filter(Boolean).pop()
    if (tail && /^\d+$/.test(tail)) return Number(tail)
  }
  if (value && typeof value === 'object') {
    return toId((value as Record<string, unknown>).id)
  }
  return null
}

// ---------------------------------------------------------------------------
// getZeevouIds — account-level ids needed to create a property.
// Fetches the EUR currency IRI and the "Madeira" area IRI; the area is
// auto-created via POST /apis/areas when the account has none (sandbox).
// Cached on globalThis for the process lifetime.

export interface ZeevouIds {
  /** "/apis/currencies/NN" IRI, or the bare "EUR" code (accepted per support). */
  currency: string | number
  /** "/apis/areas/NN" IRI or numeric id. */
  area: string | number
}

const globalForIds = globalThis as unknown as {
  __zeevouIds?: Promise<ZeevouIds>
}

export async function getZeevouIds(): Promise<ZeevouIds> {
  return (globalForIds.__zeevouIds ??= resolveZeevouIds())
}

async function resolveZeevouIds(): Promise<ZeevouIds> {
  const [currencies, areas] = await Promise.all([
    apiGet('/apis/currencies'),
    apiGet('/apis/areas', { area_name: 'Madeira' }),
  ])

  const eur = hydraMembers(currencies).find(
    (c) => String(c.code || '').toUpperCase() === 'EUR',
  )
  const currency: string | number =
    (typeof eur?.['@id'] === 'string' && (eur['@id'] as string)) ||
    toId(eur?.id) ||
    'EUR'

  let area: string | number | null = null
  const madeira = hydraMembers(areas)[0]
  if (madeira) {
    area =
      (typeof madeira['@id'] === 'string' && (madeira['@id'] as string)) ||
      toId(madeira.id)
  }
  if (area === null) {
    area = await createMadeiraArea()
  }

  return { currency, area }
}

// POST /apis/areas requires a City entity id, not a name — so we first
// resolve-or-create the "Funchal" city, then the "Madeira" area.
async function createMadeiraArea(): Promise<string | number> {
  let cityId = toId(
    hydraMembers(await apiGet('/apis/cities', { name: 'Funchal' }))[0]?.id,
  )
  if (cityId === null) {
    const city = (await apiPost('/apis/cities', {
      name: 'Funchal',
      country: 'PT',
    })) as Record<string, unknown>
    cityId = toId(city.id)
  }
  if (cityId === null) {
    throw new Error('Zeevou city "Funchal" could not be resolved or created')
  }

  const created = (await apiPost('/apis/areas', {
    area_name: 'Madeira',
    city: cityId,
  })) as Record<string, unknown>
  const area =
    (typeof created['@id'] === 'string' && (created['@id'] as string)) ||
    toId(created.id)
  if (area === null) {
    throw new Error(
      `Zeevou area "Madeira" could not be created: ${JSON.stringify(created).slice(0, 300)}`,
    )
  }
  return area
}

// ---------------------------------------------------------------------------
// createProperty — provisioning chain verified against the sandbox OpenAPI
// spec (Property write schema embeds unit_type/unit/rate_plan contexts):
//   POST /apis/properties
//   POST /apis/unit_types   (embedded default rate_plan — Zeevou requires
//                            "Select a default rate plan" at creation time)
//   POST /apis/units
// Returns all created ids so the caller can persist them (pmsMeta).

export interface ZeevouPropertyInput {
  name: string
  shortName?: string
  description?: string
  address?: {
    street?: string
    postalCode?: string
    city?: string
    country?: string
    lat?: number
    lng?: number
  }
  maxGuests?: number
  bedrooms?: number
  basePrice?: number
}

export interface ZeevouCreatedIds {
  propertyId: number
  unitTypeId: number | null
  unitId: number | null
  ratePlanId: number | null
}

// Zeevou address write shape — latitude/longitude are strings per OpenAPI.
// first_line must be non-blank ("First line of address should not be blank").
// postal_code must match [A-Za-z0-9] — a bare "-" fails validation, so it is
// omitted rather than sent as a placeholder.
function writeAddress(a: ZeevouPropertyInput['address']) {
  return {
    first_line: a?.street || '-',
    ...(a?.postalCode ? { postal_code: a.postalCode } : {}),
    city: a?.city || 'Funchal',
    country: a?.country || 'PT',
    ...(typeof a?.lat === 'number' ? { latitude: String(a.lat) } : {}),
    ...(typeof a?.lng === 'number' ? { longitude: String(a.lng) } : {}),
  }
}

export async function createProperty(
  input: ZeevouPropertyInput,
): Promise<ZeevouCreatedIds> {
  const ids = await getZeevouIds()

  const property = (await apiPost('/apis/properties', {
    name: input.name,
    short_name: (input.shortName || input.name || '').slice(0, 50),
    description: input.description || '',
    address: writeAddress(input.address),
    area: ids.area,
    default_currency: ids.currency,
    is_active: true,
    allow_direct_booking: true,
  })) as Record<string, unknown>
  const propertyId = toId(property.id)
  if (!propertyId) {
    throw new Error(
      `Zeevou did not return a property id: ${JSON.stringify(property).slice(0, 300)}`,
    )
  }
  const propertyIri = `/apis/properties/${propertyId}`

  const price = input.basePrice || 100
  const unitType = (await apiPost('/apis/unit_types', {
    property: propertyIri,
    // Unit-type names must be unique org-wide — derive from the property name.
    name: input.name.slice(0, 50),
    maximum_capacity: input.maxGuests || 2,
    rate_plans: [
      {
        name: 'Standard',
        type: 'Nightly',
        is_default: true,
        weekday_price: price,
        weekend_price: price,
      },
    ],
  })) as Record<string, unknown>
  const unitTypeId = toId(unitType.id)
  const ratePlans = Array.isArray(unitType.rate_plans)
    ? (unitType.rate_plans as Record<string, unknown>[])
    : []
  const ratePlanId = toId(
    (ratePlans.find((rp) => rp.is_default === true) ?? ratePlans[0])?.id,
  )
  const unitTypeIri = unitTypeId
    ? `/apis/unit_types/${unitTypeId}`
    : (unitType['@id'] as string)

  const unit = (await apiPost('/apis/units', {
    unit_type: unitTypeIri,
    name: `${input.name} — unit`,
  })) as Record<string, unknown>
  const unitId = toId(unit.id)

  return { propertyId, unitTypeId, unitId, ratePlanId }
}

// ---------------------------------------------------------------------------
// createComplex — Zeevou "Complex" (hotel-style) provisioning:
//   POST /apis/properties        (is_single_unit: false)
//   POST /apis/unit_types        (one per UnitType; embeds the default
//                                 rate plan — required at creation time)
//   POST /apis/rate_plans        (additional, non-default plans)
//   POST /apis/units             (one per physical room of the UnitType)
// Mirrors our Payload structure Property -> UnitType -> Unit -> RatePlan.

export interface ZeevouRatePlanInput {
  name: string
  basePrice: number
  minNights?: number
  isDefault?: boolean
}

export interface ZeevouUnitTypeInput {
  name: string
  capacity?: number
  description?: string
  ratePlans?: ZeevouRatePlanInput[]
  units?: { name: string }[]
}

export interface ZeevouComplexUnitTypeResult {
  unitTypeId: number | null
  unitIds: number[]
  ratePlanIds: number[]
  defaultRatePlanId: number | null
}

export interface ZeevouComplexResult {
  propertyId: number
  unitTypes: ZeevouComplexUnitTypeResult[]
}

// Unit names must be unique org-wide ("name: This value is already used").
// Scope them to property + unit type, slugified to stay within 50 chars.
function scopedUnitName(
  propertyShortName: string,
  unitTypeName: string,
  unitName: string,
): string {
  return `${propertyShortName}-${unitTypeName}-${unitName}`
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

// Best-effort rollback: deletes whatever createComplex already created so a
// failed sync leaves no orphan objects behind (units first, then types,
// then the property). Individual deletes never throw.
async function cleanupComplex(parts: {
  propertyIri?: string
  unitTypeIris: string[]
  unitIris: string[]
}): Promise<void> {
  for (const iri of parts.unitIris) {
    await apiDelete(iri).catch(() => {})
  }
  for (const iri of parts.unitTypeIris) {
    await apiDelete(iri).catch(() => {})
  }
  if (parts.propertyIri) {
    await apiDelete(parts.propertyIri).catch(() => {})
  }
}

export async function createComplex(
  property: ZeevouPropertyInput,
  unitTypes: ZeevouUnitTypeInput[],
): Promise<ZeevouComplexResult> {
  const ids = await getZeevouIds()

  // Zeevou enforces org-wide unique name/short_name — including against
  // soft-deleted properties (DELETE 204 does not free the name). Retry with
  // a numeric suffix when the violation is the unique-name constraint.
  const baseName = property.name
  const baseShort = (property.shortName || property.name || '').slice(0, 46)
  let zeevouName = baseName
  let zeevouShort = baseShort
  let created: Record<string, unknown> | null = null
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (attempt > 0) {
      zeevouName = `${baseName} ${attempt + 1}`
      zeevouShort = `${baseShort}-${attempt + 1}`.slice(0, 50)
    }
    try {
      created = (await apiPost('/apis/properties', {
        name: zeevouName,
        short_name: zeevouShort,
        description: property.description || '',
        address: writeAddress(property.address),
        area: ids.area,
        default_currency: ids.currency,
        is_single_unit: false,
        is_active: true,
        allow_direct_booking: true,
      })) as Record<string, unknown>
      break
    } catch (e) {
      if (attempt < 4 && /already used/i.test(String((e as Error)?.message))) {
        continue
      }
      throw e
    }
  }
  const propertyId = toId(created?.id)
  if (!propertyId) {
    throw new Error(
      `Zeevou did not return a property id: ${JSON.stringify(created).slice(0, 300)}`,
    )
  }
  const propertyIri = `/apis/properties/${propertyId}`

  const results: ZeevouComplexUnitTypeResult[] = []
  const createdUnitTypeIris: string[] = []
  const createdUnitIris: string[] = []
  try {
    for (const ut of unitTypes) {
      // Unit-type names must be unique org-wide — prefix with the property name.
      const utName = `${zeevouName} — ${ut.name}`.slice(0, 50)
      const defaultPlan =
        ut.ratePlans?.find((rp) => rp.isDefault) ?? ut.ratePlans?.[0]

      const unitType = (await apiPost('/apis/unit_types', {
        property: propertyIri,
        name: utName,
        description: ut.description || '',
        maximum_capacity: ut.capacity || 2,
        rate_plans: [
          {
            name: defaultPlan?.name || 'Standard',
            type: 'Nightly',
            is_default: true,
            min_stay: defaultPlan?.minNights || 1,
            weekday_price:
              defaultPlan?.basePrice || property.basePrice || 100,
            weekend_price:
              defaultPlan?.basePrice || property.basePrice || 100,
          },
        ],
      })) as Record<string, unknown>
      const unitTypeId = toId(unitType.id)
      const embedded = Array.isArray(unitType.rate_plans)
        ? (unitType.rate_plans as Record<string, unknown>[])
        : []
      const defaultRatePlanId = toId(
        (embedded.find((rp) => rp.is_default === true) ?? embedded[0])?.id,
      )
      const unitTypeIri = unitTypeId
        ? `/apis/unit_types/${unitTypeId}`
        : (unitType['@id'] as string)
      if (unitTypeIri) createdUnitTypeIris.push(unitTypeIri)

      const ratePlanIds: number[] = defaultRatePlanId ? [defaultRatePlanId] : []
      for (const rp of ut.ratePlans ?? []) {
        if (rp === defaultPlan) continue // already created embedded
        const plan = (await apiPost('/apis/rate_plans', {
          unit_type: unitTypeIri,
          name: rp.name,
          type: 'Nightly',
          is_default: false,
          min_stay: rp.minNights || 1,
          weekday_price: rp.basePrice,
          weekend_price: rp.basePrice,
        })) as Record<string, unknown>
        const rpId = toId(plan.id)
        if (rpId) ratePlanIds.push(rpId)
      }

      const unitIds: number[] = []
      for (const u of ut.units ?? []) {
        const unit = (await apiPost('/apis/units', {
          unit_type: unitTypeIri,
          name: scopedUnitName(zeevouShort, ut.name, u.name),
        })) as Record<string, unknown>
        const unitId = toId(unit.id)
        if (unitId) {
          unitIds.push(unitId)
          createdUnitIris.push(`/apis/units/${unitId}`)
        }
      }

      results.push({ unitTypeId, unitIds, ratePlanIds, defaultRatePlanId })
    }
  } catch (e) {
    await cleanupComplex({
      propertyIri,
      unitTypeIris: createdUnitTypeIris,
      unitIris: createdUnitIris,
    })
    throw e
  }

  return { propertyId, unitTypes: results }
}

// ---------------------------------------------------------------------------
// Rates

export interface ZeevouRateDay {
  price?: number
  available?: boolean
  minStay?: number
}

// { [date YYYY-MM-DD]: ZeevouRateDay } for one property.
export type ZeevouRatesMap = Record<string, ZeevouRateDay>

// Resolves the property's default rate plan via its unit types, for callers
// that only know the property id (pmsPropertyId) and have no pmsMeta.
async function resolveRatePlanId(
  propertyId: number | string,
): Promise<number | null> {
  const data = await apiGet('/apis/unit_types', {
    property: Number(propertyId),
  })
  for (const ut of hydraMembers(data)) {
    const plans = Array.isArray(ut.rate_plans)
      ? (ut.rate_plans as Record<string, unknown>[])
      : []
    const def = plans.find((rp) => rp.is_default === true) ?? plans[0]
    const id = toId(def?.id)
    if (id) return id
  }
  return null
}

// Per-day rates for one property. Reads GET /apis/rates (rows carry
// price.value, min_stay, stop_sell). ratePlanId narrows the read to the
// property's own plan — pass pmsMeta.ratePlanId when available.
export async function getRates(
  propertyId: number | string,
  startDate: string,
  endDate: string,
  ratePlanId?: number | string | null,
): Promise<ZeevouRatesMap> {
  const planId = ratePlanId ?? (await resolveRatePlanId(propertyId))
  const query: Record<string, string | number> = {
    'date[after]': startDate,
    'date[strictly_before]': endDate,
    limit: 500,
  }
  if (planId) query['rate_plan'] = planId
  else query['rate_plan.unit_type'] = Number(propertyId)

  const map: ZeevouRatesMap = {}
  let page = 1
  for (;;) {
    const data = await apiGet('/apis/rates', { ...query, page })
    const rows = hydraMembers(data)
    for (const row of rows) {
      const date = String(row.date || '').slice(0, 10)
      if (!date) continue
      const price = (row.price as Record<string, unknown>)?.value
      map[date] = {
        price: Number.isFinite(Number(price)) ? Number(price) : undefined,
        available: row.stop_sell === true ? false : true,
        minStay: Number.isFinite(Number(row.min_stay))
          ? Number(row.min_stay)
          : undefined,
      }
    }
    if (rows.length < 500) break
    page += 1
    if (page > 20) break
  }
  return map
}

export interface ZeevouRateInput {
  date: string // YYYY-MM-DD
  rate: number
}

// Writes nightly prices via POST /apis/rates (RateLog — the real write
// endpoint; rates_batch accepts but ignores unknown fields). Consecutive
// days with the same rate are merged into one {from, to} call.
export async function setRates(
  propertyId: number | string,
  rates: ZeevouRateInput[],
  ratePlanId?: number | string | null,
): Promise<unknown> {
  const planId = ratePlanId ?? (await resolveRatePlanId(propertyId))
  if (!planId) {
    throw new Error(`Zeevou: no rate plan found for property ${propertyId}`)
  }

  const sorted = [...(rates || [])].sort((a, b) => a.date.localeCompare(b.date))
  const results: unknown[] = []
  for (let i = 0; i < sorted.length; ) {
    const rate = sorted[i].rate
    const from = sorted[i].date
    let to = from
    while (
      i + 1 < sorted.length &&
      sorted[i + 1].rate === rate &&
      nextDay(to) === sorted[i + 1].date
    ) {
      i += 1
      to = sorted[i].date
    }
    results.push(
      await apiPost('/apis/rates', {
        rate_plan: planId,
        from,
        to,
        nightly_price: { value: rate, currency: 'EUR' },
      }),
    )
    i += 1
  }
  return results
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Reservations

export interface ZeevouBooking {
  id: number
  propertyId: number | null
  arrival: string
  departure: string
  channel: string
  guestName: string
  guestEmail: string
  guestPhone: string
  price: number
  adults: number
  children: number
  status: string
}

// Bookings touching [start, end] for one property. /apis/bookings supports
// the `property` filter plus arrival/departure date ranges (per OpenAPI).
export async function getReservations(
  propertyId: number | string,
  startDate: string,
  endDate: string,
): Promise<ZeevouBooking[]> {
  const data = await apiGet('/apis/bookings', {
    property: Number(propertyId),
    'arrival_date[before]': endDate,
    'departure_date[after]': startDate,
    limit: 200,
  })
  const wanted = Number(propertyId)
  const out: ZeevouBooking[] = []
  for (const b of hydraMembers(data)) {
    const bPropertyId = toId(b.property)
    if (wanted && bPropertyId !== null && bPropertyId !== wanted) continue
    const id = toId(b.id)
    if (!id) continue
    const leadGuest = (b.lead_guest ?? b.guest ?? {}) as Record<
      string,
      unknown
    >
    out.push({
      id,
      propertyId: bPropertyId ?? wanted,
      arrival: String(b.arrival_date || b.arrival || '').slice(0, 10),
      departure: String(b.departure_date || b.departure || '').slice(0, 10),
      channel: String(
        (b.channel as Record<string, unknown>)?.name || b.channel || 'Direct',
      ),
      guestName:
        `${leadGuest.first_name || b.first_name || ''} ${leadGuest.last_name || b.last_name || ''}`.trim(),
      guestEmail: String(leadGuest.email || b.email || ''),
      guestPhone: String(leadGuest.mobile_number || b.phone || ''),
      price: Number(b.total_price ?? b.price) || 0,
      adults: Number(b.number_of_adult_guests ?? b.adults) || 0,
      children: Number(b.number_of_child_guests ?? b.children) || 0,
      status: String(b.booking_status || b.status || ''),
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Booking creation (direct booking -> Zeevou BookingRequest).

export interface ZeevouBookingInput {
  propertyId: number
  ratePlanId?: number | null
  arrivalDate: string
  departureDate: string
  guestName?: string
  lastName?: string
  guestEmail?: string | null
  phone?: string
  adults?: number
  children?: number
  totalPrice?: number
}

// Creates a BookingRequest in Zeevou. Convert to a confirmed booking after
// payment via convertBookingRequest.
export async function createBooking(
  p: ZeevouBookingInput,
): Promise<Record<string, unknown>> {
  return (await apiPost('/apis/booking_requests', {
    lead_guest: {
      first_name: p.guestName || 'Guest',
      last_name: p.lastName || '-',
      email: p.guestEmail,
      mobile_number: p.phone,
    },
    guests: [],
    property: p.propertyId,
    ...(p.ratePlanId ? { rate_plan: p.ratePlanId } : {}),
    arrival_date: p.arrivalDate,
    departure_date: p.departureDate,
    number_of_adult_guests: p.adults || 2,
    number_of_child_guests: p.children || 0,
    ...(p.totalPrice ? { total_price: p.totalPrice } : {}),
  })) as Record<string, unknown>
}

export async function convertBookingRequest(
  bookingRequestId: number | string,
  paymentId: number | string,
): Promise<Record<string, unknown>> {
  return (await apiPost('/apis/booking_request/convert', {
    booking_request_id: Number(bookingRequestId),
    payment_id: Number(paymentId),
  })) as Record<string, unknown>
}
