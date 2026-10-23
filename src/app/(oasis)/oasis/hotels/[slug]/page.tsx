import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import type { Amenity, Media } from '@/payload-types'
import GetDirectionsSheet from '@/components/GetDirectionsSheet'
import WatchVideoButton from '@/components/WatchVideoButton'
import { isVideoMedia } from '@/lib/media'
import MutedAutoplayVideo from '../../../../(frontend)/components/MutedAutoplayVideo'
import SaveAsAppSheet from '@/components/SaveAsAppSheet'
import OasisInquiryForm from '../../../../(frontend)/components/OasisInquiryForm'
import OasisLink from '../../../../(frontend)/components/OasisLink'

export const revalidate = 60

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Lightweight renderer for the curated descriptions: **bold**, *italic*,
// lines starting with "* " become list items, full-line bold becomes a heading.
const renderInline = (line: string) =>
  escapeHtml(line)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>')

function renderDescription(text: string) {
  const blocks: React.ReactNode[] = []
  let list: string[] = []
  let key = 0

  const flushList = () => {
    if (!list.length) return
    blocks.push(
      <ul key={key++} className="mt-4 space-y-3">
        {list.map((item, i) => (
          <li key={i} className="flex gap-3 text-[#1c1a16]/75">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4af37]" />
            <span dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
          </li>
        ))}
      </ul>,
    )
    list = []
  }

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) {
      flushList()
      continue
    }
    if (line.startsWith('* ')) {
      list.push(line.slice(2))
      continue
    }
    flushList()
    const heading = line.match(/^\*\*(.+)\*\*$/)
    if (heading) {
      blocks.push(
        <h2
          key={key++}
          className="font-serif mt-10 text-2xl font-medium text-[#1c1a16] first:mt-0 md:text-3xl"
        >
          {heading[1]}
        </h2>,
      )
    } else {
      blocks.push(
        <p
          key={key++}
          className="mt-5 text-lg leading-relaxed text-[#1c1a16]/75"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }}
        />,
      )
    }
  }
  flushList()
  return blocks
}

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
        { brand: { in: ['madeiraoasis', 'both'] } },
      ],
    },
    limit: 1,
    depth: 2,
  })
  if (!docs.length) return { title: 'Not found — Madeira Oasis' }
  const p = docs[0]
  const cover = p.media?.[0]?.image
  const image = cover && typeof cover === 'object' ? cover.url : undefined
  const desc = p.shortDescription || `Discover ${p.title} — Madeira Oasis.`
  return {
    title: `${p.title} — Madeira Oasis`,
    description: desc,
    openGraph: {
      title: p.title,
      description: desc,
      images: image ? [{ url: image }] : [],
      type: 'website',
      url: `/hotels/${p.slug}`,
    },
    alternates: { canonical: `/hotels/${p.slug}` },
  }
}

export default async function OasisHotelPage({
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
        { brand: { in: ['madeiraoasis', 'both'] } },
      ],
    },
    limit: 1,
    depth: 2,
  })
  if (!docs.length) notFound()
  const p = docs[0]

  const media = (p.media ?? [])
    .map((m) => m.image)
    .filter((img): img is Media => typeof img === 'object' && img !== null)
  const video = media.find(isVideoMedia)
  const images = media.filter((img) => !isVideoMedia(img))
  const [hero, ...gallery] = images

  const amenities = (p.amenities ?? []).filter(
    (a): a is Amenity => typeof a === 'object' && a !== null,
  )
  const locationName =
    p.location && typeof p.location === 'object' ? p.location.name : null
  const geo =
    p.geoCoordinates?.lat != null && p.geoCoordinates?.lng != null
      ? p.geoCoordinates
      : typeof p.location === 'object'
        ? p.location?.geoCoordinates
        : null
  const streetAddress = [
    p.address?.street,
    [p.address?.postal, p.address?.city].filter(Boolean).join(' ') || null,
  ]
    .filter(Boolean)
    .join(', ')
  const contactMailto = `mailto:hello@madeiraoasis.com?subject=${encodeURIComponent(
    `Inquiry about ${p.title}`,
  )}`

  return (
    <div className="min-h-dvh bg-[#fdfbf7] pt-16 text-[#1c1a16]">
      {/* Hero */}
      <section className="relative h-[70dvh] min-h-[420px] w-full overflow-hidden">
        {hero ? (
          <Image
            src={hero.url}
            alt={hero.alt || p.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[#e8e2d5]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1a16]/70 via-[#1c1a16]/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-6 pb-12">
          {p.category && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
              {p.category}
            </p>
          )}
          <h1 className="font-serif mt-3 text-4xl font-medium text-white md:text-6xl">
            {p.title}
          </h1>
          {locationName && (
            <p className="mt-3 text-sm tracking-wide text-white/80">
              {locationName}, Madeira
            </p>
          )}
          {(geo?.lat != null && geo?.lng != null) || video?.url ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {geo?.lat != null && geo?.lng != null && (
                <GetDirectionsSheet
                  lat={geo.lat}
                  lng={geo.lng}
                  name={p.title}
                  address={
                    streetAddress ||
                    (locationName ? `${locationName}, Madeira` : null)
                  }
                  theme="gold"
                />
              )}
              {video?.url && (
                <WatchVideoButton
                  videoUrl={video.url}
                  title={p.title}
                  cta={{ label: 'Request a stay', href: '#inquiry' }}
                  theme="hero"
                />
              )}
            </div>
          ) : null}
        </div>
      </section>

      {/* Media — muted-autoplay video (or the cover photo) right under the title */}
      {(video || hero) && (
        <section className="mx-auto max-w-5xl px-6 pt-10 md:pt-14">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#e8e2d5]">
            {video ? (
              <MutedAutoplayVideo
                src={video.url}
                poster={hero?.url ?? null}
                alt={`${p.title} — video`}
              />
            ) : hero ? (
              <Image
                src={hero.url}
                alt={hero.alt || p.title}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            ) : null}
          </div>
        </section>
      )}

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        {p.shortDescription && (
          <p
            className="font-serif text-xl italic leading-relaxed text-[#1c1a16]/85 md:text-2xl"
            dangerouslySetInnerHTML={{ __html: renderInline(p.shortDescription) }}
          />
        )}
        {p.description && (
          <div className="mt-8">{renderDescription(p.description)}</div>
        )}
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="font-serif text-3xl font-medium">Gallery</h2>
          <div className="oasis-masonry mt-8 columns-2 md:columns-3">
            {gallery.map((img) => (
              <figure key={img.id} className="overflow-hidden rounded-xl">
                <Image
                  src={img.url}
                  alt={img.alt || p.title}
                  width={img.width || 800}
                  height={img.height || 600}
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="h-auto w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <section className="border-y border-[#1c1a16]/10 bg-white/60">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="font-serif text-3xl font-medium">Amenities</h2>
            <ul className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {amenities.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d4af37]/50 text-lg text-[#b8952e]">
                    {a.icon || '◆'}
                  </span>
                  <span className="text-sm text-[#1c1a16]/80">{a.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Inquiry */}
      <section id="inquiry" className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#b8952e]">
          Madeira Oasis Concierge
        </p>
        <h2 className="font-serif mt-3 text-center text-3xl font-medium md:text-4xl">
          Request a stay at {p.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-[#1c1a16]/60">
          Share your dates and wishes — the concierge will confirm availability
          and tailor the stay.
        </p>
        <div className="mt-10">
          <OasisInquiryForm hotelTitle={p.title} />
        </div>
        <div className="mt-6 text-center">
          <a
            href={contactMailto}
            className="inline-flex items-center justify-center rounded-full border border-[#d4af37] px-6 py-3 text-sm font-semibold tracking-wide text-[#8a7020] transition-colors hover:bg-[#d4af37] hover:text-[#1c1a16]"
          >
            Contact via Email
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1c1a16]/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[#1c1a16]/50 sm:flex-row">
          <OasisLink
            href="/"
            className="transition-colors hover:text-[#1c1a16]"
          >
            ← Back to the collection
          </OasisLink>
          <a
            href="https://www.madeirabook.com"
            className="transition-colors hover:text-[#1c1a16]"
          >
            Powered by Madeirabook
          </a>
          <SaveAsAppSheet variant="light" />
        </div>
      </footer>
    </div>
  )
}
