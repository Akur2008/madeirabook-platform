// Google Hotel Center pilot feed for Hotel Orquídea.
// Builds a static <Hotel>/<Room> price feed (XML or JSON) that can be
// submitted to Google Hotel Center while the Connectivity Partner
// application is pending. Complements the live-query ARI engine in
// src/lib/googleAri.ts.
//
import { getPayload } from 'payload'

import config from '@payload-config'
import { BASE_CURRENCY, isValidDate, nightsBetween } from '@/lib/googleAri'

export const HOTEL_CENTER_PILOT_SLUG = 'hotel-orquidea'
export const HOTEL_CENTER_ROOM_ID = 'standard-room'
export const HOTEL_CENTER_OCCUPANCY = 2

export const PILOT_HOTEL = {
  slug: HOTEL_CENTER_PILOT_SLUG,
  roomId: HOTEL_CENTER_ROOM_ID,
  occupancy: HOTEL_CENTER_OCCUPANCY,
} as const

export interface HotelCenterQuery {
  checkin: string
  checkout: string
  guests?: number
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
}

export interface HotelCenterFeed {
  generatedAt: string
  hotel: {
    property: HotelCenterProperty
    rooms: HotelCenterRoom[]
  }
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

async function findPilotProperty(slug: string): Promise<FeedPropertyDoc | null> {
  const payload = await getPayload({ config: await config })
  const found = await payload.find({
    collection: 'properties',
    where: { and: [{ status: { equals: 'published' } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 2,
  })
  return (found.docs[0] as FeedPropertyDoc | undefined) ?? null
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

// Builds the pilot feed for a single stay window. Returns null when the
// property is missing/unpublished or the date window is invalid.
// Emits one <Room> per active UnitType (price from its RatePlan). Falls back
// to a single room priced at property.pricePerNight when the property has
// no unit types yet.
export async function generateHotelCenterFeed(
  q: HotelCenterQuery,
): Promise<HotelCenterFeed | null> {
  if (!isValidDate(q.checkin) || !isValidDate(q.checkout) || q.checkin >= q.checkout) {
    return null
  }
  const nights = nightsBetween(q.checkin, q.checkout).length
  if (!nights) return null

  const doc = await findPilotProperty(PILOT_HOTEL.slug)
  if (!doc) return null

  const fallbackPrice = Number(doc.pricePerNight) || 0
  const tax = 0 // pilot rates are tax-inclusive, same convention as googleAri
  const otherFees = Number(doc.cleaningFee) || 0

  const property: HotelCenterProperty = {
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

  const roomSpecs = (await findRooms(doc)).map(({ unitType, ratePlan }) => ({
    roomId: `unit-type-${unitType.id}`,
    occupancy: unitType.capacity ?? PILOT_HOTEL.occupancy,
    pricePerNight: Number(ratePlan?.basePrice) || fallbackPrice,
  }))
  if (!roomSpecs.length) {
    roomSpecs.push({
      roomId: PILOT_HOTEL.roomId,
      occupancy: q.guests ?? PILOT_HOTEL.occupancy,
      pricePerNight: fallbackPrice,
    })
  }

  const rooms: HotelCenterRoom[] = roomSpecs.map((spec) => {
    const baserate = spec.pricePerNight * nights
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
      total: baserate + tax + otherFees,
      currency: BASE_CURRENCY,
    }
  })

  return { generatedAt: new Date().toISOString(), hotel: { property, rooms } }
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

export function toHotelCenterXml(feed: HotelCenterFeed): string {
  const p = feed.hotel.property
  const opt = (v: string | number | null, tag: string) =>
    v === null || v === undefined || v === ''
      ? ''
      : `      <${tag}>${xmlEscape(String(v))}</${tag}>\n`
  const roomsXml = feed.hotel.rooms
    .map(
      (r) => `    <Room>
      <RoomID>${xmlEscape(r.roomId)}</RoomID>
      <Occupancy>${r.occupancy}</Occupancy>
      <CheckinDate>${r.checkinDate}</CheckinDate>
      <CheckoutDate>${r.checkoutDate}</CheckoutDate>
      <Nights>${r.nights}</Nights>
      <Price currency="${r.currency}">
        <Baserate>${money(r.baserate)}</Baserate>
        <Tax>${money(r.tax)}</Tax>
        <OtherFees>${money(r.otherFees)}</OtherFees>
        <Total>${money(r.total)}</Total>
      </Price>
    </Room>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<HotelCenterFeed timestamp="${feed.generatedAt}" partner="madeirabook">
  <Hotel>
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
  </Hotel>
</HotelCenterFeed>`
}

export function toHotelCenterJson(feed: HotelCenterFeed) {
  return { hotelCenterFeed: feed }
}
