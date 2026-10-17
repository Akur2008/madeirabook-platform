import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import type { Upload } from '@/payload-types'
import PropertyMap from '../../components/PropertyMapLoader'
import VideoOnDemand from '../../components/VideoOnDemand'

export const revalidate = 60

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const uploadUrl = (u: unknown): string | null =>
  typeof u === 'object' && u !== null && 'url' in u && typeof (u as Upload).url === 'string'
    ? ((u as Upload).url as string)
    : null

async function getRestaurant(slug: string) {
  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'restaurants',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const restaurant = await getRestaurant(slug)
  if (!restaurant) return { title: 'Not found' }
  const ogImage =
    uploadUrl(restaurant.media?.[0]?.image) ?? restaurant.heroImage ?? undefined
  return {
    title: `${restaurant.name} — Madeira Restaurant | Madeirabook`,
    description: restaurant.shortDescription ?? undefined,
    openGraph: {
      title: restaurant.name,
      description: restaurant.shortDescription ?? undefined,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    alternates: {
      canonical: `https://www.madeirabook.com/restaurants/${restaurant.slug}`,
    },
  }
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayload({ config: await config })
  const restaurant = await getRestaurant(slug)
  if (!restaurant) notFound()

  const { docs: properties } = await payload.find({
    collection: 'properties',
    where: { status: { equals: 'published' } },
    limit: 3,
    depth: 2,
  })

  const video = restaurant.videoFile
  const videoUrl =
    typeof video === 'object' && video?.mimeType?.startsWith('video/')
      ? uploadUrl(video)
      : null
  const photoUrl =
    uploadUrl(restaurant.media?.[0]?.image) ?? restaurant.heroImage ?? null
  const locationName =
    restaurant.location && typeof restaurant.location === 'object'
      ? restaurant.location.name
      : null

  const specs = [
    restaurant.cuisine ? { label: 'Cuisine', value: restaurant.cuisine } : null,
    restaurant.averagePrice
      ? { label: 'Average price', value: `€${restaurant.averagePrice}` }
      : null,
    restaurant.googleRating
      ? { label: 'Rating', value: `${restaurant.googleRating}★` }
      : null,
    restaurant.michelinStars && restaurant.michelinStars > 0
      ? { label: 'Michelin', value: `${restaurant.michelinStars}★` }
      : null,
  ].filter((s): s is { label: string; value: string } => Boolean(s))

  const paragraphs = (restaurant.description ?? '')
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean)

  const gallery = (restaurant.media ?? [])
    .map((m) => uploadUrl(m.image))
    .filter((u): u is string => Boolean(u))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    ...(restaurant.cuisine && { servesCuisine: restaurant.cuisine }),
    ...(restaurant.averagePrice && {
      priceRange: `€${restaurant.averagePrice}`,
    }),
    image: gallery.length ? gallery : restaurant.heroImage ? [restaurant.heroImage] : [],
    address: {
      '@type': 'PostalAddress',
      ...(restaurant.address && { streetAddress: restaurant.address }),
      addressLocality: locationName ?? 'Funchal',
      addressCountry: 'PT',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: restaurant.geoCoordinates.lat,
      longitude: restaurant.geoCoordinates.lng,
    },
    ...(restaurant.michelinStars &&
      restaurant.michelinStars > 0 && {
        award: `${restaurant.michelinStars} Michelin Star${restaurant.michelinStars > 1 ? 's' : ''}`,
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

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <nav className="text-sm text-white/50">
          <Link href="/" className="transition-colors hover:text-white/80">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span>Restaurants</span>
          <span className="mx-2">/</span>
          <span className="text-white/80">{restaurant.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,400px)] md:items-start">
          <div className="order-2 md:order-1">
            <h1 className="text-4xl font-light text-white/95 md:text-5xl" style={SERIF}>
              {restaurant.name}
            </h1>
            {restaurant.shortDescription && (
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
                {restaurant.shortDescription}
              </p>
            )}

            {specs.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {specs.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="text-xs uppercase tracking-wider text-white/40">
                      {s.label}
                    </p>
                    <p className="mt-1 text-sm text-white/85">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {restaurant.bookingUrl && (
              <a
                href={restaurant.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center justify-center rounded-lg border border-emerald-600 bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                Book a table →
              </a>
            )}
          </div>

          <div className="order-1 md:order-2">
            <div className="mx-auto aspect-[9/16] w-full max-w-[400px] overflow-hidden rounded-xl border border-white/10 bg-[#0f1d2e]">
              {videoUrl || photoUrl ? (
                <VideoOnDemand
                  videoUrl={videoUrl}
                  posterUrl={restaurant.posterUrl ?? photoUrl}
                  alt={restaurant.name}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl">
                  🌊
                </div>
              )}
            </div>
            {!videoUrl && restaurant.heroImage && restaurant.imageAttribution && (
              <p className="mx-auto mt-2 max-w-[400px] text-[11px] text-white/35">
                {restaurant.imageAttribution}
              </p>
            )}
          </div>
        </div>

        {paragraphs.length > 0 && (
          <section className="mt-14 max-w-3xl">
            <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
              About {restaurant.name}
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-white/75">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        )}

        {restaurant.highlights && restaurant.highlights.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
              Highlights
            </h2>
            <ul className="mt-4 grid max-w-3xl grid-cols-1 gap-x-6 gap-y-2 text-sm text-white/75 sm:grid-cols-2">
              {restaurant.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
            Location
          </h2>
          <div className="mt-4">
            <PropertyMap
              latitude={restaurant.geoCoordinates.lat}
              longitude={restaurant.geoCoordinates.lng}
              title={restaurant.name}
              imageUrl={photoUrl ?? undefined}
            />
          </div>
        </section>

        {properties.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
              Stay nearby
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              {properties.map((p) => {
                const cover = p.media?.[0]?.image
                const coverUrl =
                  cover && typeof cover === 'object' ? cover.url : null
                return (
                  <Link
                    key={p.id}
                    href={`/p/${p.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-white/25"
                  >
                    {coverUrl && (
                      <Image
                        src={coverUrl}
                        alt={p.title}
                        width={800}
                        height={600}
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="p-5">
                      <h3
                        className="text-xl font-light leading-tight text-white/95"
                        style={SERIF}
                      >
                        {p.title}
                      </h3>
                      {p.pricePerNight && (
                        <p className="mb-0 mt-2 text-sm text-white/60">
                          From €{p.pricePerNight} / night
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/#map"
            className="inline-flex items-center justify-center rounded-lg border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            ← Back to map
          </Link>
          <Link
            href="/#search"
            className="inline-flex items-center justify-center rounded-lg border border-emerald-600 bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Find your dates →
          </Link>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
