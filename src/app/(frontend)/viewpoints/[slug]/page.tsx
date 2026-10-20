import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import type { Upload } from '@/payload-types'
import GetDirectionsSheet from '@/components/GetDirectionsSheet'

import PropertyMap from '../../components/PropertyMapLoader'
import VideoOnDemand from '../../components/VideoOnDemand'

export const revalidate = 60

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const uploadUrl = (u: unknown): string | null =>
  typeof u === 'object' && u !== null && 'url' in u && typeof (u as Upload).url === 'string'
    ? ((u as Upload).url as string)
    : null

const TYPE_LABELS: Record<string, string> = {
  cliff: 'Cliff edge',
  peak: 'Mountain peak',
  miradouro: 'Miradouro',
  tower: 'Tower',
  coastal: 'Coastal',
  valley: 'Valley',
}

const ACCESS_LABELS: Record<string, string> = {
  car: 'Drive-up',
  walk_short: 'Short walk',
  walk_long: 'Hike required',
}

async function getViewpoint(slug: string) {
  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'viewpoints',
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
  const viewpoint = await getViewpoint(slug)
  if (!viewpoint) return { title: 'Not found' }
  const ogImage =
    uploadUrl(viewpoint.media?.[0]?.image) ?? viewpoint.heroImage ?? undefined
  return {
    title: `${viewpoint.name} — Madeira Viewpoint | Madeirabook`,
    description: viewpoint.shortDescription ?? undefined,
    openGraph: {
      title: viewpoint.name,
      description: viewpoint.shortDescription ?? undefined,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    alternates: {
      canonical: `https://www.madeirabook.com/viewpoints/${viewpoint.slug}`,
    },
  }
}

export default async function ViewpointPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayload({ config: await config })
  const viewpoint = await getViewpoint(slug)
  if (!viewpoint) notFound()

  const { docs: properties } = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { status: { equals: 'published' } },
        { brand: { not_equals: 'madeiraoasis' } },
      ],
    },
    limit: 3,
    depth: 2,
  })

  const video = viewpoint.videoFile
  const videoUrl =
    typeof video === 'object' && video?.mimeType?.startsWith('video/')
      ? uploadUrl(video)
      : null
  const photoUrl =
    uploadUrl(viewpoint.media?.[0]?.image) ?? viewpoint.heroImage ?? null
  const locationName =
    viewpoint.location && typeof viewpoint.location === 'object'
      ? viewpoint.location.name
      : null

  const specs = [
    viewpoint.elevationM != null
      ? { label: 'Elevation', value: `${viewpoint.elevationM} m` }
      : null,
    viewpoint.type
      ? { label: 'Type', value: TYPE_LABELS[viewpoint.type] ?? viewpoint.type }
      : null,
    viewpoint.bestTime ? { label: 'Best time', value: viewpoint.bestTime } : null,
    viewpoint.access
      ? { label: 'Access', value: ACCESS_LABELS[viewpoint.access] ?? viewpoint.access }
      : null,
  ].filter((s): s is { label: string; value: string } => Boolean(s))

  const paragraphs = (viewpoint.description ?? '')
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean)

  const gallery = (viewpoint.media ?? [])
    .map((m) => uploadUrl(m.image))
    .filter((u): u is string => Boolean(u))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: viewpoint.name,
    description: viewpoint.description || viewpoint.shortDescription || '',
    image: gallery.length
      ? gallery
      : viewpoint.heroImage
        ? [viewpoint.heroImage]
        : [],
    address: {
      '@type': 'PostalAddress',
      addressLocality: locationName ?? 'Madeira',
      addressCountry: 'PT',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: viewpoint.geoCoordinates.lat,
      longitude: viewpoint.geoCoordinates.lng,
      ...(viewpoint.elevationM != null ? { elevation: viewpoint.elevationM } : {}),
    },
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
          <span>Viewpoints</span>
          <span className="mx-2">/</span>
          <span className="text-white/80">{viewpoint.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,400px)] md:items-start">
          <div className="order-2 md:order-1">
            <h1 className="text-4xl font-light text-white/95 md:text-5xl" style={SERIF}>
              {viewpoint.name}
              {viewpoint.glassPlatform && (
                <span className="ml-3 inline-block rounded-full border border-purple-400/40 px-3 py-1 align-middle text-xs font-normal uppercase tracking-wider text-purple-300">
                  glass platform
                </span>
              )}
            </h1>
            {viewpoint.shortDescription && (
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
                {viewpoint.shortDescription}
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
          </div>

          <div className="order-1 md:order-2">
            <div className="mx-auto aspect-[9/16] w-full max-w-[400px] overflow-hidden rounded-xl border border-white/10 bg-[#0f1d2e]">
              {videoUrl || photoUrl ? (
                <VideoOnDemand
                  videoUrl={videoUrl}
                  posterUrl={viewpoint.posterUrl ?? photoUrl}
                  alt={viewpoint.name}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl">
                  👁️
                </div>
              )}
            </div>
            {!videoUrl && viewpoint.heroImage && viewpoint.imageAttribution && (
              <p className="mx-auto mt-2 max-w-[400px] text-[11px] text-white/35">
                {viewpoint.imageAttribution}
              </p>
            )}
          </div>
        </div>

        {paragraphs.length > 0 && (
          <section className="mt-14 max-w-3xl">
            <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
              About {viewpoint.name}
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-white/75">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        )}

        {viewpoint.highlights && viewpoint.highlights.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
              Highlights
            </h2>
            <ul className="mt-4 grid max-w-3xl grid-cols-1 gap-x-6 gap-y-2 text-sm text-white/75 sm:grid-cols-2">
              {viewpoint.highlights.map((h) => (
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
              latitude={viewpoint.geoCoordinates.lat}
              longitude={viewpoint.geoCoordinates.lng}
              title={viewpoint.name}
              address={locationName ?? undefined}
              imageUrl={photoUrl ?? undefined}
            />
          </div>
          <div className="mt-4">
            <GetDirectionsSheet
              lat={viewpoint.geoCoordinates.lat}
              lng={viewpoint.geoCoordinates.lng}
              name={viewpoint.name}
              address={locationName}
              theme="dark"
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
