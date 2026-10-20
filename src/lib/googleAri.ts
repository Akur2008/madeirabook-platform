// Internal ARI (Availability, Rates, Inventory) engine for Google Hotel
// Prices / Free Booking Links. Serves Google's Transaction response format
// for live pricing queries and builds OTA push messages for ARI mode.
//
// Data flow: Google live query -> GET /api/google/rates -> per-day rates via
// src/lib/pms (Smoobu/Zeevou router) -> Transaction XML/JSON.
// Push mode: OTA_HotelRateAmountNotifRQ / OTA_HotelAvailNotifRQ POSTed to
// Google uploads endpoint with OAuth 2.0 service-account bearer.

import crypto from 'crypto'
import { getPayload } from 'payload'
import type { Where } from 'payload'

import config from '@payload-config'
import { getRates } from '@/lib/pms'

export const GOOGLE_UPLOADS_BASE = 'https://www.google.com/travel/hotels/uploads'
export const GOOGLE_PUSH_ENDPOINT = `${GOOGLE_UPLOADS_BASE}/property_data`
export const GOOGLE_TAX_ENDPOINT = `${GOOGLE_UPLOADS_BASE}/taxes`
export const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
export const OAUTH_SCOPE = 'https://www.googleapis.com/auth/travelpartner'

export const SUPPORTED_CURRENCIES = ['EUR'] as const
export const BASE_CURRENCY = 'EUR'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DEFAULT_CACHE_TTL_MS = 60_000

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface GoogleHotelsConfig {
  partnerKey: string | null
  accountId: string | null
  landingPageId: string
  serviceAccountJson: string | null
  pushEndpoint: string
  cacheTtlMs: number
  configured: boolean
}

export function googleHotelsConfig(): GoogleHotelsConfig {
  const partnerKey = process.env.GOOGLE_HOTEL_PARTNER_KEY || null
  const accountId = process.env.GOOGLE_HOTEL_ACCOUNT_ID || null
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || null
  const ttl = Number(process.env.GOOGLE_RATES_CACHE_TTL_MS)
  return {
    partnerKey,
    accountId,
    landingPageId: process.env.GOOGLE_HOTEL_LANDING_PAGE_ID || 'direct',
    serviceAccountJson,
    pushEndpoint: process.env.GOOGLE_HOTEL_PUSH_ENDPOINT || GOOGLE_PUSH_ENDPOINT,
    cacheTtlMs:
      Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_CACHE_TTL_MS,
    configured: Boolean(partnerKey && serviceAccountJson),
  }
}

// ---------------------------------------------------------------------------
// In-memory response cache (same pattern as ownerCalendarCache)
// ---------------------------------------------------------------------------

interface AriCacheEntry {
  at: number
  result: AriResult
}

const globalForCache = globalThis as unknown as {
  __googleAriCache?: Map<string, AriCacheEntry>
}

const ariCache = (globalForCache.__googleAriCache ??= new Map<string, AriCacheEntry>())

export function invalidateGoogleAri(propertyId: number | string): void {
  const id = Number(propertyId)
  for (const [key, entry] of [...ariCache.entries()]) {
    if (entry.result.propertyId === id) ariCache.delete(key)
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AriQuery {
  hotelId: string
  checkin: string
  checkout: string
  currency: string
}

export interface AriNight {
  date: string
  price: number
  minStay: number | null
  available: boolean
}

export interface AriResult {
  hotelId: string
  propertySlug: string
  propertyId: number
  title: string
  checkin: string
  checkout: string
  nights: number
  currency: string
  available: boolean
  unavailableReason: string | null
  baserate: number
  tax: number
  otherFees: number
  nights_detail: AriNight[]
  landingUrl: string
}

export interface AriResponse {
  result: AriResult
  cached: boolean
  durationMs: number
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export function isValidDate(s: string): boolean {
  return DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`))
}

export function nightsBetween(checkin: string, checkout: string): string[] {
  const days: string[] = []
  const cur = new Date(`${checkin}T00:00:00Z`)
  const end = new Date(`${checkout}T00:00:00Z`)
  while (cur < end) {
    days.push(cur.toISOString().slice(0, 10))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return days
}

// ---------------------------------------------------------------------------
// Property lookup: hotel_id may be a Payload slug, pmsPropertyId or numeric id
// ---------------------------------------------------------------------------

interface PropertyDoc {
  id: number
  slug: string
  title: string
  status: string
  pms?: string | null
  pmsPropertyId?: string | number | null
  pmsMeta?: unknown
  pricePerNight?: number | null
  cleaningFee?: number | null
}

async function findProperty(hotelId: string): Promise<PropertyDoc | null> {
  const payload = await getPayload({ config: await config })
  const or: Where[] = [
    { slug: { equals: hotelId } },
    { pmsPropertyId: { equals: hotelId } },
  ]
  if (/^\d+$/.test(hotelId)) or.push({ id: { equals: Number(hotelId) } })
  const found = await payload.find({
    collection: 'properties',
    where: { and: [{ status: { equals: 'published' } }, { or }] },
    limit: 1,
    depth: 0,
  })
  return (found.docs[0] as PropertyDoc | undefined) ?? null
}

// ---------------------------------------------------------------------------
// Core ARI computation
// ---------------------------------------------------------------------------

export function buildLandingUrl(
  slug: string,
  checkin: string,
  checkout: string,
  guests = 2,
): string {
  const base = process.env.APP_URL || 'https://madeirabook-platform.vercel.app'
  const params = new URLSearchParams({
    checkin,
    checkout,
    guests: String(guests),
    utm_source: 'google',
    utm_medium: 'free_booking_link',
  })
  return `${base}/p/${slug}?${params.toString()}`
}

// Fetches per-day ARI from the PMS router and folds it into a Google-style
// result. Missing days fall back to property.pricePerNight and are treated as
// sellable — our own checkout re-validates availability before payment.
// Properties without a PMS link, or a failed PMS call, are reported as
// unavailable (Baserate -1) rather than guessed prices: Google penalizes
// inaccurate pricing.
export async function computeAri(
  property: PropertyDoc,
  q: AriQuery,
): Promise<AriResult> {
  const dates = nightsBetween(q.checkin, q.checkout)

  const hasPms = Number.isFinite(Number(property.pmsPropertyId))
  let pmsError = false
  let rates: Awaited<ReturnType<typeof getRates>> = {}
  if (hasPms) {
    try {
      rates = await getRates(property, q.checkin, q.checkout)
    } catch (e) {
      pmsError = true
      console.warn(
        `googleAri: PMS rates failed for property ${property.id}:`,
        e instanceof Error ? e.message : e,
      )
    }
  }

  const fallbackPrice = Number(property.pricePerNight) || 0
  const detail: AriNight[] = dates.map((date) => {
    const day = rates[date]
    const price = Number.isFinite(day?.price) ? Number(day!.price) : fallbackPrice
    const available = day ? day.available !== false : fallbackPrice > 0
    return {
      date,
      price,
      minStay: day?.minStay ?? null,
      available: available && price > 0,
    }
  })

  const minStayAtCheckin = detail[0]?.minStay ?? null
  let reason: string | null = null
  if (!detail.length) reason = 'no_nights'
  else if (!hasPms) reason = 'no_pms_link'
  else if (pmsError) reason = 'pms_unavailable'
  else if (detail.some((d) => !d.available)) reason = 'closed_or_unpriced_night'
  else if (minStayAtCheckin && detail.length < minStayAtCheckin)
    reason = 'min_stay'

  const baserate = detail.reduce((sum, d) => sum + d.price, 0)
  const otherFees = Number(property.cleaningFee) || 0

  return {
    hotelId: q.hotelId,
    propertySlug: property.slug,
    propertyId: property.id,
    title: property.title,
    checkin: q.checkin,
    checkout: q.checkout,
    nights: detail.length,
    currency: BASE_CURRENCY,
    available: reason === null,
    unavailableReason: reason,
    baserate: reason === null ? round2(baserate) : -1,
    tax: 0,
    otherFees: round2(otherFees),
    nights_detail: detail,
    landingUrl: buildLandingUrl(property.slug, q.checkin, q.checkout),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// Cached entry point used by the route handler. The cache is keyed on the
// raw query params so a warm hit never touches Postgres or the PMS — this is
// what keeps Google live-query responses under the ~300ms budget.
export async function serveAriQuery(q: AriQuery): Promise<AriResponse | null> {
  const started = Date.now()
  const cacheKey = `${q.hotelId}|${q.checkin}|${q.checkout}|${q.currency}`
  const cached = ariCache.get(cacheKey)
  const ttl = googleHotelsConfig().cacheTtlMs
  if (cached && Date.now() - cached.at < ttl) {
    return { result: cached.result, cached: true, durationMs: Date.now() - started }
  }

  const property = await findProperty(q.hotelId)
  if (!property) return null
  const result = await computeAri(property, q)
  ariCache.set(cacheKey, { at: Date.now(), result })
  return { result, cached: false, durationMs: Date.now() - started }
}

// ---------------------------------------------------------------------------
// Google Transaction response (live query / pull pricing)
// ---------------------------------------------------------------------------

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function money(n: number): string {
  return n.toFixed(2)
}

// Google Transaction message. Unavailable itineraries are still a valid
// Result — Google expects Baserate -1 rather than an HTTP error.
export function toTransactionXml(r: AriResult): string {
  const ts = new Date().toISOString()
  const id = crypto.randomUUID()
  const pos = googleHotelsConfig().landingPageId
  const baserate = r.available ? money(r.baserate) : '-1'
  const tax = r.available ? money(r.tax) : '0'
  const fees = r.available ? money(r.otherFees) : '0'
  return `<?xml version="1.0" encoding="UTF-8"?>
<Transaction timestamp="${ts}" id="${id}">
  <Result>
    <Property>${xmlEscape(r.hotelId)}</Property>
    <Checkin>${r.checkin}</Checkin>
    <Nights>${r.nights}</Nights>
    <Baserate currency="${r.currency}">${baserate}</Baserate>
    <Tax currency="${r.currency}">${tax}</Tax>
    <OtherFees currency="${r.currency}">${fees}</OtherFees>
    <AllowablePointsOfSale>
      <PointOfSale id="${xmlEscape(pos)}">
        <URL>${xmlEscape(r.landingUrl)}</URL>
      </PointOfSale>
    </AllowablePointsOfSale>
  </Result>
</Transaction>`
}

export function toTransactionJson(r: AriResult) {
  return {
    transaction: {
      timestamp: new Date().toISOString(),
      result: {
        property: r.hotelId,
        slug: r.propertySlug,
        checkin: r.checkin,
        checkout: r.checkout,
        nights: r.nights,
        baserate: r.available ? r.baserate : -1,
        tax: r.available ? r.tax : 0,
        otherFees: r.available ? r.otherFees : 0,
        currency: r.currency,
        available: r.available,
        unavailableReason: r.unavailableReason,
        nightlyRates: r.nights_detail,
        pointsOfSale: [
          { id: googleHotelsConfig().landingPageId, url: r.landingUrl },
        ],
      },
    },
  }
}

// ---------------------------------------------------------------------------
// OTA push messages (ARI delivery mode)
// ---------------------------------------------------------------------------

export function toRateAmountNotifXml(r: AriResult): string {
  const cfg = googleHotelsConfig()
  const roomId = `${r.propertySlug}-room`
  const ratePlan = `${r.propertySlug}-std`
  const rates = r.nights_detail
    .map(
      (d) => `        <Rate>
          <StatusApplicationControl Start="${d.date}" End="${d.date}"
            InvTypeCode="${xmlEscape(roomId)}" RatePlanCode="${xmlEscape(ratePlan)}"/>
          <BaseByGuestAmts>
            <BaseByGuestAmt AmountBeforeTax="${money(d.price)}"
              CurrencyCode="${r.currency}" NumberOfGuests="2"/>
          </BaseByGuestAmts>
        </Rate>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelRateAmountNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05"
                            EchoToken="${crypto.randomUUID()}"
                            TimeStamp="${new Date().toISOString()}"
                            Version="3.0"
                            NotifType="Delta"
                            NotifScopeType="ProductRate">
  <POS><Source><RequestorID ID="${xmlEscape(cfg.partnerKey || 'PARTNER_KEY')}"/></Source></POS>
  <RateAmountMessages HotelCode="${xmlEscape(r.hotelId)}">
    <RateAmountMessage>
${rates}
    </RateAmountMessage>
  </RateAmountMessages>
</OTA_HotelRateAmountNotifRQ>`
}

export function toAvailNotifXml(r: AriResult): string {
  const cfg = googleHotelsConfig()
  const roomId = `${r.propertySlug}-room`
  const ratePlan = `${r.propertySlug}-std`
  const lastNight = r.nights_detail[r.nights_detail.length - 1]
  const status = r.available ? 'Open' : 'Close'
  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelAvailNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05"
                       EchoToken="${crypto.randomUUID()}"
                       TimeStamp="${new Date().toISOString()}"
                       Version="3.0">
  <POS><Source><RequestorID ID="${xmlEscape(cfg.partnerKey || 'PARTNER_KEY')}"/></Source></POS>
  <AvailStatusMessages HotelCode="${xmlEscape(r.hotelId)}">
    <AvailStatusMessage>
      <StatusApplicationControl Start="${r.checkin}" End="${lastNight?.date ?? r.checkin}"
        InvTypeCode="${xmlEscape(roomId)}" RatePlanCode="${xmlEscape(ratePlan)}"/>
      <LengthsOfStay>
        <LengthOfStay Time="${r.nights}" TimeUnit="Day"/>
      </LengthsOfStay>
      <RestrictionStatus Restriction="Master" Status="${status}"/>
    </AvailStatusMessage>
  </AvailStatusMessages>
</OTA_HotelAvailNotifRQ>`
}

// ---------------------------------------------------------------------------
// OAuth 2.0 service-account token + ARI push
// ---------------------------------------------------------------------------

interface ServiceAccount {
  client_email?: string
  private_key?: string
}

function parseServiceAccount(raw: string): ServiceAccount | null {
  try {
    const sa = JSON.parse(raw) as ServiceAccount
    return sa.client_email && sa.private_key ? sa : null
  } catch {
    return null
  }
}

// Exchanges a signed JWT for an access token at oauth2.googleapis.com.
async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const { SignJWT, importPKCS8 } = await import('jose')
  const key = await importPKCS8(sa.private_key!, 'RS256')
  const now = Math.floor(Date.now() / 1000)
  const assertion = await new SignJWT({ scope: OAUTH_SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email!)
    .setAudience(OAUTH_TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key)

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
    signal: AbortSignal.timeout(10000),
  })
  const data = (await res.json()) as { access_token?: string }
  if (!res.ok || !data.access_token) {
    throw new Error(`oauth token failed: ${res.status} ${JSON.stringify(data).slice(0, 200)}`)
  }
  return data.access_token
}

// Exact HTTP request dump shown in sandbox mode — this is literally what the
// live path sends once GOOGLE_* credentials are configured.
export function mockPushLog(xml: string, endpoint: string): string {
  return [
    '=== SANDBOX: Google credentials not configured, nothing was sent ===',
    '',
    '--- Step 1: OAuth 2.0 token request (service account JWT) ---',
    `POST ${OAUTH_TOKEN_URL} HTTP/1.1`,
    'Host: oauth2.googleapis.com',
    'Content-Type: application/x-www-form-urlencoded',
    '',
    'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer',
    'assertion=<RS256-signed JWT: iss=client_email, scope=' + OAUTH_SCOPE + '>',
    '',
    '--- Step 2: ARI push ---',
    `POST ${new URL(endpoint).pathname} HTTP/1.1`,
    `Host: ${new URL(endpoint).host}`,
    'Authorization: Bearer <access_token>',
    'Content-Type: application/xml; charset=utf-8',
    '',
    xml,
  ].join('\n')
}

export interface PushOutcome {
  mode: 'pushed' | 'mock'
  endpoint: string
  status: number | null
  detail: string
}

// Pushes the ARI messages to Google. Without credentials returns the exact
// request that would have been sent (mock mode).
export async function pushAri(r: AriResult): Promise<PushOutcome> {
  const cfg = googleHotelsConfig()
  const xml = [toRateAmountNotifXml(r), toAvailNotifXml(r)].join('\n')
  if (!cfg.configured) {
    return {
      mode: 'mock',
      endpoint: cfg.pushEndpoint,
      status: null,
      detail: mockPushLog(xml, cfg.pushEndpoint),
    }
  }
  const sa = parseServiceAccount(cfg.serviceAccountJson!)
  if (!sa) {
    return {
      mode: 'mock',
      endpoint: cfg.pushEndpoint,
      status: null,
      detail: 'GOOGLE_SERVICE_ACCOUNT_JSON is not valid service-account JSON\n\n' + mockPushLog(xml, cfg.pushEndpoint),
    }
  }
  const token = await getAccessToken(sa)
  const res = await fetch(cfg.pushEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/xml; charset=utf-8',
    },
    body: xml,
    signal: AbortSignal.timeout(15000),
  })
  return {
    mode: 'pushed',
    endpoint: cfg.pushEndpoint,
    status: res.status,
    detail: (await res.text()).slice(0, 2000),
  }
}
