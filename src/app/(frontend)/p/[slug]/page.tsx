import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import type { Amenity, HouseRule, Media } from '@/payload-types'
import GetDirectionsSheet from '@/components/GetDirectionsSheet'

import BookingDrawer from '../../components/BookingDrawer'
import PropertyMap from '../../components/PropertyMapLoader'

export const revalidate = 60

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'published' } },
        { brand: { not_equals: 'madeiraoasis' } },
      ],
    },
    limit: 1,
    depth: 2,
  })
  if (!docs.length) return { title: 'Not found' }
  const p = docs[0]
  const cover = p.media?.[0]?.image
  const image = cover && typeof cover === 'object' ? cover.url : undefined
  const desc =
    p.shortDescription || p.description || `Stay at ${p.title} in Madeira.`
  return {
    title: `${p.title} — Madeirabook`,
    description: desc,
    openGraph: {
      title: p.title,
      description: desc,
      images: image ? [{ url: image }] : [],
      type: 'website',
      url: `https://www.madeirabook.com/p/${p.slug}`,
    },
    alternates: {
      canonical: `https://www.madeirabook.com/p/${p.slug}`,
    },
  }
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'published' } },
        { brand: { not_equals: 'madeiraoasis' } },
      ],
    },
    limit: 1,
    depth: 2,
  })
  if (!docs.length) notFound()
  const p = docs[0]

  const images = (p.media ?? [])
    .map((m) => m.image)
    .filter((img): img is Media => typeof img === 'object' && img !== null)

  const amenities = (p.amenities ?? []).filter(
    (a): a is Amenity => typeof a === 'object' && a !== null,
  )
  const houseRules = (p.houseRules ?? []).filter(
    (r): r is HouseRule => typeof r === 'object' && r !== null,
  )
  const locationName =
    p.location && typeof p.location === 'object' ? p.location.name : null

  const specs = [
    p.pricePerNight ? `From €${p.pricePerNight} / night` : null,
    p.cleaningFee ? `Cleaning fee €${p.cleaningFee}` : null,
    p.sizeM2 ? `${p.sizeM2} m²` : null,
    p.bedrooms ? `${p.bedrooms} bedrooms` : null,
    p.bathrooms ? `${p.bathrooms} bathrooms` : null,
    p.maxGuests ? `up to ${p.maxGuests} guests` : null,
    p.checkInTime ? `Check-in after ${p.checkInTime}` : null,
    p.checkOutTime ? `Check-out before ${p.checkOutTime}` : null,
  ].filter((s): s is string => Boolean(s))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VacationRental',
    name: p.title,
    description: p.description || p.shortDescription || '',
    image: images.map((img) => img.url),
    identifier: p.slug,
    ...(p.pricePerNight && {
      priceRange: `From €${p.pricePerNight} per night`,
    }),
    ...(p.sizeM2 && {
      floorSize: {
        '@type': 'QuantitativeValue',
        value: p.sizeM2,
        unitCode: 'MTK',
      },
    }),
    ...(p.bedrooms && { numberOfBedrooms: p.bedrooms }),
    ...(p.bathrooms && { numberOfBathroomsTotal: p.bathrooms }),
    ...(p.maxGuests && {
      occupancy: { '@type': 'QuantitativeValue', maxValue: p.maxGuests },
    }),
    ...(p.location &&
      typeof p.location === 'object' && {
        address: {
          '@type': 'PostalAddress',
          addressLocality: p.location.name,
          addressCountry: 'PT',
        },
        ...(p.location.geoCoordinates && {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: p.location.geoCoordinates.lat,
            longitude: p.location.geoCoordinates.lng,
          },
        }),
      }),
    ...(amenities.length > 0 && {
      amenityFeature: amenities.map((a) => ({
        '@type': 'LocationFeatureSpecification',
        name: a.name,
      })),
    }),
    ...(p.pricePerNight && {
      offers: {
        '@type': 'Offer',
        price: p.pricePerNight,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: `https://www.madeirabook.com/p/${p.slug}`,
      },
    }),
  }

  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* Cormorant Garamond for headings; falls back to serif if the CDN is unreachable */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />

      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <h1 className="text-4xl font-light text-white/95 md:text-5xl" style={SERIF}>
          {p.title}
        </h1>
        {locationName && (
          <p className="mt-3 text-base text-white/60">Located in {locationName}</p>
        )}

        {images.length > 0 && (
          <div className="mt-10">
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[400px] overflow-hidden rounded-2xl">
              <Image
                src={images[0].url}
                alt={p.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover object-center"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                {images.slice(1).map((img) => (
                  <div
                    key={img.id}
                    className="relative h-48 w-full overflow-hidden rounded-xl"
                  >
                    <Image
                      src={img.url}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {specs.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-3">
            {specs.map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {p.description && (
          <p className="mt-8 max-w-3xl leading-relaxed text-white/75">
            {p.description}
          </p>
        )}

        {amenities.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-light text-white/90" style={SERIF}>
              Amenities
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-white/70 md:grid-cols-3">
              {amenities.map((a) => (
                <li key={a.id}>{a.name}</li>
              ))}
            </ul>
          </section>
        )}

        {houseRules.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-light text-white/90" style={SERIF}>
              House rules
            </h2>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-white/70">
              {houseRules.map((r) => (
                <li key={r.id}>{r.name}</li>
              ))}
            </ul>
          </section>
        )}

        {typeof p.location === 'object' &&
          p.location?.geoCoordinates?.lat &&
          p.location?.geoCoordinates?.lng && (
            <section className="mt-12">
              <h2 className="text-2xl font-light text-white/90" style={SERIF}>
                Location
              </h2>
              <div className="mt-4">
                <PropertyMap
                  latitude={p.location.geoCoordinates.lat}
                  longitude={p.location.geoCoordinates.lng}
                  title={p.title}
                  address={locationName ?? undefined}
                  imageUrl={
                    Array.isArray(p.media) && p.media[0]?.image &&
                    typeof p.media[0].image === 'object'
                      ? (p.media[0].image as { url: string }).url
                      : undefined
                  }
                />
              </div>
              <div className="mt-4">
                <GetDirectionsSheet
                  lat={p.location.geoCoordinates.lat}
                  lng={p.location.geoCoordinates.lng}
                  name={p.title}
                  address={locationName}
                  theme="dark"
                />
              </div>
            </section>
          )}

        <div className="mt-14 flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            ← Back to all stays
          </Link>
          <BookingDrawer
            propertySlug={p.slug}
            propertyTitle={p.title}
            trigger={
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-emerald-600 bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                Book this stay →
              </button>
            }
          />
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
