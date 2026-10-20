// Google Hotel Center pilot feed for Hotel Orquídea.
// Builds a static <Hotel>/<Room> price feed (XML or JSON) that can be
// submitted to Google Hotel Center while the Connectivity Partner
// application is pending. Complements the live-query ARI engine in
// src/lib/googleAri.ts.
//
// The Properties collection has no address field yet (schema change
// requires approval), so the pilot address lives in PILOT_HOTEL below.
// Move it into the collection when the schema is extended.

import { getPayload } from 'payload'

import config from '@payload-config'
import { BASE_CURRENCY, isValidDate, nightsBetween } from '@/lib/googleAri'

export const HOTEL_CENTER_PILOT_SLUG = 'hotel-orquidea'
export const HOTEL_CENTER_ROOM_ID = 'standard-room'
export const HOTEL_CENTER_OCCUPANCY = 2

// Real-world address of Hotel Orquídea, Funchal (hotelorquidea.com).
export const PILOT_HOTEL = {
  slug: HOTEL_CENTER_PILOT_SLUG,
  roomId: HOTEL_CENTER_ROOM_ID,
  occupancy: HOTEL_CENTER_OCCUPANCY,
  address: {
    street: 'Rua dos Netos 69-71',
    city: 'Funchal',
    postal: '9000-084',
    country: 'PT',
  },
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
    room: HotelCenterRoom
  }
}

interface FeedPropertyDoc {
  id: number
  slug: string
  title: string
  status: string
  shortDescription?: string | null
  geoCoordinates?: { lat?: number | null; lng?: number | null } | null
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

// Builds the pilot feed for a single stay window. Returns null when the
// property is missing/unpublished or the date window is invalid.
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

  const pricePerNight = Number(doc.pricePerNight) || 0
  const baserate = pricePerNight * nights
  const tax = 0 // pilot rates are tax-inclusive, same convention as googleAri
  const otherFees = Number(doc.cleaningFee) || 0

  const property: HotelCenterProperty = {
    propertyId: doc.slug,
    name: doc.title,
    description: doc.shortDescription ?? null,
    address: { ...PILOT_HOTEL.address },
    latitude: doc.geoCoordinates?.lat ?? null,
    longitude: doc.geoCoordinates?.lng ?? null,
    landingPageUrl: hotelCenterLandingUrl(doc.slug),
    imageUrl: firstMediaUrl(doc),
    maxGuests: doc.maxGuests ?? null,
    bedrooms: doc.bedrooms ?? null,
    bathrooms: doc.bathrooms ?? null,
  }

  const room: HotelCenterRoom = {
    roomId: PILOT_HOTEL.roomId,
    occupancy: q.guests ?? PILOT_HOTEL.occupancy,
    checkinDate: q.checkin,
    checkoutDate: q.checkout,
    nights,
    pricePerNight,
    baserate,
    tax,
    otherFees,
    total: baserate + tax + otherFees,
    currency: BASE_CURRENCY,
  }

  return { generatedAt: new Date().toISOString(), hotel: { property, room } }
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
  const r = feed.hotel.room
  const opt = (v: string | number | null, tag: string) =>
    v === null || v === undefined || v === ''
      ? ''
      : `      <${tag}>${xmlEscape(String(v))}</${tag}>\n`
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
    <Room>
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
    </Room>
  </Hotel>
</HotelCenterFeed>`
}

export function toHotelCenterJson(feed: HotelCenterFeed) {
  return { hotelCenterFeed: feed }
}
