// Google Hotel Center feed for the Madeirabook pilot hotels.
// Builds a multi-hotel price + availability feed (XML or JSON) that can be
// submitted to Google Hotel Center while the Connectivity Partner
// application is pending. Complements the live-query ARI engine in
// src/lib/googleAri.ts.
//
// Prices come from the PMS router (Smoobu/Zeevou) when the property has a
// pmsPropertyId; otherwise the DB rate (rate plan basePrice, falling back
// to property.pricePerNight) is used. Availability is reported per night
// for the requested window — by default the next 30 days.

import { getPayload } from 'payload'

import config from '@payload-config'
import { getRates } from '@/lib/pms'
import { BASE_CURRENCY, isValidDate, nightsBetween } from '@/lib/googleAri'
import { PRICING_RULES, getScenario } from '@/lib/pricing-rules'

// Hotels published to the Google feed — must be showInGoogle scenarios per
// the pricing manifest (the bookable Smoobu apartments by default).
// Overridable per request via the `hotels` query param, or globally via
// GOOGLE_HOTEL_FEED_SLUGS.
export const FEED_HOTEL_SLUGS = [
  'apartamentos-do-mar-303',
  'apartamentos-do-mar-607',
  'penthouse-on-the-beach-madeira',
]

export const HOTEL_CENTER_ROOM_ID = 'standard-room'
export const HOTEL_CENTER_OCCUPANCY = 2
export const FEED_MAX_NIGHTS = 62

export function feedHotelSlugs(): string[] {
  const raw = process.env.GOOGLE_HOTEL_FEED_SLUGS
  if (raw && raw.trim()) {
    const slugs = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (slugs.length) return slugs
  }
  return [...FEED_HOTEL_SLUGS]
}

export interface HotelCenterQuery {
  checkin: string
  checkout: string
  guests?: number
  hotels?: string[]
}

export interface HotelCenterAddress {
  street: string
  city: string
  postal: string
  country: string
}

export interface HotelCenterProperty {
  propertyId: string
  name: string
  description: string | null
  address: HotelCenterAddress
  latitude: number | null
  longitude: number | null
  landingPageUrl: string
  imageUrl: string | null
  maxGuests: number | null
  bedrooms: number | null
  bathrooms: number | null
}

export interface HotelCenterNight {
  date: string
  price: number
  available: boolean
}

export interface HotelCenterRoom {
  roomId: string
  occupancy: number
  checkinDate: string
  checkoutDate: string
  nights: number
  pricePerNight: number
  baserate: number
  tax: number
  otherFees: number
  total: number
  currency: string
  available: boolean
  unavailableReason: string | null
  nightly: HotelCenterNight[]
}

export interface HotelCenterHotel {
  property: HotelCenterProperty
  rooms: HotelCenterRoom[]
}

export interface HotelCenterFeed {
  generatedAt: string
  hotels: HotelCenterHotel[]
}

interface FeedUnitTypeDoc {
  id: number
  name: string
  capacity?: number | null
  status?: string | null
}

interface FeedRatePlanDoc {
  id: number
  name: string
  unitType: number | { id: number }
  basePrice?: number | null
  minNights?: number | null
  status?: string | null
}

interface FeedPropertyDoc {
  id: number
  slug: string
  title: string
  status: string
  pms?: string | null
  pmsPropertyId?: string | number | null
  pmsMeta?: unknown
  pricingScenario?: string | null
  shortDescription?: string | null
  geoCoordinates?: { lat?: number | null; lng?: number | null } | null
  address?: {
    street?: string | null
    city?: string | null
    postal?: string | null
    country?: string | null
  } | null
  pricePerNight?: number | null
  cleaningFee?: number | null
  maxGuests?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  media?: { image?: number | { url?: string | null } | null }[] | null
}

function siteBase(): string {
  return (process.env.APP_URL || 'https://www.madeirabook.com').replace(/\/$/, '')
}

export function hotelCenterLandingUrl(slug: string): string {
  return `${siteBase()}/p/${slug}`
}

// Published properties matching the requested slugs, in slug-list order.
// Non-Google scenarios (display_only, siteminder) are filtered out — the
// manifest forbids them from the ARI surface.
async function findFeedProperties(slugs: string[]): Promise<FeedPropertyDoc[]> {
  const payload = await getPayload({ config: await config })
  const found = await payload.find({
    collection: 'properties',
    where: {
      and: [{ status: { equals: 'published' } }, { slug: { in: slugs } }],
    },
    limit: slugs.length,
    depth: 2,
  })
  const docs = (found.docs as unknown as FeedPropertyDoc[]).filter(
    (doc) => PRICING_RULES[getScenario(doc)].showInGoogle,
  )
  const order = new Map(slugs.map((slug, i) => [slug, i]))
  return docs.sort(
    (a, b) => (order.get(a.slug) ?? slugs.length) - (order.get(b.slug) ?? slugs.length),
  )
}

function firstMediaUrl(doc: FeedPropertyDoc): string | null {
  for (const item of doc.media ?? []) {
    const image = item?.image
    if (image && typeof image === 'object' && image.url) return image.url
  }
  return null
}

// Active unit types of the property, each with the first active rate plan
// (lowest basePrice wins when several exist). Unit types without a rate
// plan fall back to property.pricePerNight.
async function findRooms(
  doc: FeedPropertyDoc,
): Promise<{ unitType: FeedUnitTypeDoc; ratePlan: FeedRatePlanDoc | null }[]> {
  const payload = await getPayload({ config: await config })
  const unitTypes = await payload.find({
    collection: 'unit-types',
    where: {
      and: [{ property: { equals: doc.id } }, { status: { equals: 'active' } }],
    },
    limit: 100,
    depth: 0,
  })
  const uts = unitTypes.docs as unknown as FeedUnitTypeDoc[]
  if (!uts.length) return []

  const ratePlans = await payload.find({
    collection: 'rate-plans',
    where: {
      and: [
        { unitType: { in: uts.map((u) => u.id) } },
        { status: { equals: 'active' } },
      ],
    },
    limit: 500,
    depth: 0,
    sort: 'basePrice',
  })
  const plans = ratePlans.docs as unknown as FeedRatePlanDoc[]

  return uts.map((unitType) => ({
    unitType,
    ratePlan:
      plans.find(
        (rp) =>
          (typeof rp.unitType === 'object' ? rp.unitType.id : rp.unitType) ===
          unitType.id,
      ) ?? null,
  }))
}

function toFeedProperty(doc: FeedPropertyDoc): HotelCenterProperty {
  return {
    propertyId: doc.slug,
    name: doc.title,
    description: doc.shortDescription ?? null,
    address: {
      street: doc.address?.street ?? '',
      city: doc.address?.city ?? '',
      postal: doc.address?.postal ?? '',
      country: doc.address?.country ?? '',
    },
    latitude: doc.geoCoordinates?.lat ?? null,
    longitude: doc.geoCoordinates?.lng ?? null,
    landingPageUrl: hotelCenterLandingUrl(doc.slug),
    imageUrl: firstMediaUrl(doc),
    maxGuests: doc.maxGuests ?? null,
    bedrooms: doc.bedrooms ?? null,
    bathrooms: doc.bathrooms ?? null,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// Builds the feed entry for one property: a room per active unit type
// (single fallback room when none exist) with per-night price and
// availability across the stay window.
//
// Nightly prices come from the PMS when the property is linked
// (pmsPropertyId); days missing from the PMS response fall back to the DB
// rate and stay sellable — checkout re-validates before payment. A failed
// PMS call marks the room blocked instead of serving guessed prices
// (Google penalizes inaccurate pricing).
async function buildHotelEntry(
  doc: FeedPropertyDoc,
  q: HotelCenterQuery,
  dates: string[],
): Promise<HotelCenterHotel> {
  const property = toFeedProperty(doc)
  const fallbackPrice = Number(doc.pricePerNight) || 0
  const tax = 0 // rates are tax-inclusive, same convention as googleAri
  const otherFees = Number(doc.cleaningFee) || 0

  const roomSpecs = (await findRooms(doc)).map(({ unitType, ratePlan }) => ({
    roomId: `unit-type-${unitType.id}`,
    occupancy: unitType.capacity ?? HOTEL_CENTER_OCCUPANCY,
    pricePerNight: Number(ratePlan?.basePrice) || fallbackPrice,
  }))
  if (!roomSpecs.length) {
    roomSpecs.push({
      roomId: HOTEL_CENTER_ROOM_ID,
      occupancy: q.guests ?? HOTEL_CENTER_OCCUPANCY,
      pricePerNight: fallbackPrice,
    })
  }

  const rule = PRICING_RULES[getScenario(doc)]
  const pmsId = Number(doc.pmsPropertyId)
  const hasPms =
    (rule.priceSource === 'smoobu_api' || rule.priceSource === 'zeevou_api') &&
    Number.isFinite(pmsId) &&
    pmsId > 0
  let pmsError = false
  let rates: Awaited<ReturnType<typeof getRates>> = {}
  if (hasPms) {
    try {
      rates = await getRates(doc, q.checkin, q.checkout)
    } catch (e) {
      pmsError = true
      console.warn(
        `hotelCenterFeed: PMS rates failed for property ${doc.id}:`,
        e instanceof Error ? e.message : e,
      )
    }
  }

  const nights = dates.length
  const rooms: HotelCenterRoom[] = roomSpecs.map((spec) => {
    const nightly: HotelCenterNight[] = dates.map((date) => {
      const day = rates[date]
      const price = Number.isFinite(day?.price)
        ? Number(day!.price)
        : spec.pricePerNight
      const available = hasPms
        ? !pmsError && (day ? day.available !== false : price > 0)
        : price > 0
      return { date, price, available }
    })

    const available = nightly.every((n) => n.available)
    const reason = available
      ? null
      : pmsError
        ? 'pms_unavailable'
        : spec.pricePerNight <= 0
          ? 'no_price'
          : 'closed_or_unpriced_night'
    const baserate = round2(nightly.reduce((sum, n) => sum + n.price, 0))

    return {
      roomId: spec.roomId,
      occupancy: spec.occupancy,
      checkinDate: q.checkin,
      checkoutDate: q.checkout,
      nights,
      pricePerNight: spec.pricePerNight,
      baserate,
      tax,
      otherFees,
      total: round2(baserate + tax + otherFees),
      currency: BASE_CURRENCY,
      available,
      unavailableReason: reason,
      nightly,
    }
  })

  return { property, rooms }
}

// Builds the feed for a single stay window (default: the next 30 days).
// Returns null when the window is invalid or no feed property resolves.
export async function generateHotelCenterFeed(
  q: HotelCenterQuery,
): Promise<HotelCenterFeed | null> {
  if (!isValidDate(q.checkin) || !isValidDate(q.checkout) || q.checkin >= q.checkout) {
    return null
  }
  const dates = nightsBetween(q.checkin, q.checkout)
  if (!dates.length || dates.length > FEED_MAX_NIGHTS) return null

  const slugs = q.hotels?.length ? q.hotels : feedHotelSlugs()
  const docs = await findFeedProperties(slugs)
  if (!docs.length) return null

  // Sequential: each hotel may trigger one PMS rates call.
  const hotels: HotelCenterHotel[] = []
  for (const doc of docs) {
    hotels.push(await buildHotelEntry(doc, q, dates))
  }
  return { generatedAt: new Date().toISOString(), hotels }
}

// ---------------------------------------------------------------------------
// Serializers
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

function roomToXml(r: HotelCenterRoom): string {
  const unavailableNights = r.nightly.filter((n) => !n.available).length
  const reasonAttr = r.unavailableReason
    ? ` reason="${xmlEscape(r.unavailableReason)}"`
    : ''
  const nightlyXml = r.nightly
    .map(
      (n) =>
        `        <Night date="${n.date}" price="${money(n.price)}" available="${n.available}"/>`,
    )
    .join('\n')
  return `    <Room>
      <RoomID>${xmlEscape(r.roomId)}</RoomID>
      <Occupancy>${r.occupancy}</Occupancy>
      <CheckinDate>${r.checkinDate}</CheckinDate>
      <CheckoutDate>${r.checkoutDate}</CheckoutDate>
      <Nights>${r.nights}</Nights>
      <Availability status="${r.available ? 'available' : 'blocked'}" unavailableNights="${unavailableNights}"${reasonAttr}/>
      <Price currency="${r.currency}">
        <Baserate>${money(r.baserate)}</Baserate>
        <Tax>${money(r.tax)}</Tax>
        <OtherFees>${money(r.otherFees)}</OtherFees>
        <Total>${money(r.total)}</Total>
      </Price>
      <NightlyRates>
${nightlyXml}
      </NightlyRates>
    </Room>`
}

function hotelToXml(h: HotelCenterHotel): string {
  const p = h.property
  const opt = (v: string | number | null, tag: string) =>
    v === null || v === undefined || v === ''
      ? ''
      : `      <${tag}>${xmlEscape(String(v))}</${tag}>\n`
  const roomsXml = h.rooms.map(roomToXml).join('\n')
  return `  <Hotel>
    <Property>
      <PropertyID>${xmlEscape(p.propertyId)}</PropertyID>
      <Name>${xmlEscape(p.name)}</Name>
${opt(p.description, 'Description')}      <Address>
        <Street>${xmlEscape(p.address.street)}</Street>
        <City>${xmlEscape(p.address.city)}</City>
        <Postal>${xmlEscape(p.address.postal)}</Postal>
        <Country>${xmlEscape(p.address.country)}</Country>
      </Address>
      <Latitude>${p.latitude ?? ''}</Latitude>
      <Longitude>${p.longitude ?? ''}</Longitude>
      <LandingPageURL>${xmlEscape(p.landingPageUrl)}</LandingPageURL>
${opt(p.imageUrl, 'ImageURL')}${opt(p.maxGuests, 'MaxGuests')}${opt(p.bedrooms, 'Bedrooms')}${opt(p.bathrooms, 'Bathrooms')}    </Property>
${roomsXml}
  </Hotel>`
}

export function toHotelCenterXml(feed: HotelCenterFeed): string {
  const hotelsXml = feed.hotels.map(hotelToXml).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<HotelCenterFeed timestamp="${feed.generatedAt}" partner="madeirabook">
${hotelsXml}
</HotelCenterFeed>`
}

export function toHotelCenterJson(feed: HotelCenterFeed) {
  return { hotelCenterFeed: feed }
}
