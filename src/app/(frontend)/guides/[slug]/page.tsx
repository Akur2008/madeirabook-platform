import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import React from 'react'

import config from '@/payload.config'
import type { Beach, Property, Restaurant, Upload } from '@/payload-types'

export const revalidate = 60

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const uploadUrl = (u: unknown): string | null =>
  typeof u === 'object' && u !== null && 'url' in u && typeof (u as Upload).url === 'string'
    ? ((u as Upload).url as string)
    : null

const isDoc = <T extends { id: number }>(v: unknown): v is T =>
  typeof v === 'object' && v !== null && 'id' in v

const jsxConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  heading: ({ node, nodesToJSX }) => {
    const styles: Record<string, string> = {
      h1: 'mt-10 text-3xl font-light text-white/95 md:text-4xl',
      h2: 'mt-10 text-2xl font-light text-white/90 md:text-3xl',
      h3: 'mt-8 text-xl font-light text-white/90',
      h4: 'mt-6 text-lg font-semibold text-white/85',
      h5: 'mt-6 text-base font-semibold text-white/85',
      h6: 'mt-6 text-sm font-semibold uppercase tracking-wide text-white/70',
    }
    const Tag = node.tag as 'h2'
    return (
      <Tag style={SERIF} className={styles[node.tag] ?? 'mt-6 text-white/90'}>
        {nodesToJSX({ nodes: node.children })}
      </Tag>
    )
  },
  paragraph: ({ node, nodesToJSX }) => (
    <p className="leading-relaxed text-white/75">{nodesToJSX({ nodes: node.children })}</p>
  ),
  link: ({ node, nodesToJSX }) => (
    <a
      href={node.fields?.url ?? '#'}
      className="text-[#d4af37] underline decoration-white/30 underline-offset-2 transition-colors hover:text-white"
    >
      {nodesToJSX({ nodes: node.children })}
    </a>
  ),
})

async function getGuide(slug: string) {
  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'guides',
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
  const guide = await getGuide(slug)
  if (!guide) return { title: 'Not found' }
  const ogImage = uploadUrl(guide.seo?.image) ?? uploadUrl(guide.coverImage) ?? undefined
  return {
    title: guide.seo?.title ?? `${guide.title} — Madeirabook`,
    description: guide.seo?.description ?? guide.excerpt ?? undefined,
    openGraph: {
      title: guide.seo?.title ?? guide.title,
      description: guide.seo?.description ?? guide.excerpt ?? undefined,
      images: ogImage ? [{ url: ogImage }] : [],
      type: 'article',
    },
    alternates: {
      canonical: `https://www.madeirabook.com/guides/${guide.slug}`,
    },
  }
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const guide = await getGuide(slug)
  if (!guide) notFound()

  const coverUrl = uploadUrl(guide.coverImage)

  const featuredRestaurants = (guide.featuredRestaurants ?? [])
    .filter(isDoc<Restaurant>)
    .slice(0, 3)
  const featuredBeaches = (guide.featuredBeaches ?? [])
    .filter(isDoc<Beach>)
    .slice(0, 3)
  const featuredProperties = (guide.featuredProperties ?? [])
    .filter(isDoc<Property>)
    .slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.excerpt ?? '',
    image: coverUrl ? [coverUrl] : [],
    url: `https://www.madeirabook.com/guides/${guide.slug}`,
    datePublished: guide.publishedAt ?? guide.createdAt,
    dateModified: guide.updatedAt,
    publisher: {
      '@type': 'Organization',
      name: 'Madeirabook',
      url: 'https://www.madeirabook.com',
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
          <Link href="/guides" className="transition-colors hover:text-white/80">
            Guides
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/80">{guide.title}</span>
        </nav>

        {/* Hero */}
        <header className="mt-8">
          {guide.category && (
            <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
              {guide.category}
            </p>
          )}
          <h1
            className="mt-2 max-w-3xl text-4xl font-light text-white/95 md:text-5xl"
            style={SERIF}
          >
            {guide.title}
          </h1>
          {guide.excerpt && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
              {guide.excerpt}
            </p>
          )}
        </header>

        {coverUrl && (
          <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
            <Image
              src={coverUrl}
              alt={guide.title}
              width={1600}
              height={900}
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        {guide.content && (
          <article className="mt-10 max-w-3xl space-y-4 [&_li]:text-white/75 [&_ol]:ml-6 [&_ol]:list-decimal [&_ul]:ml-6 [&_ul]:list-disc [&_blockquote]:border-l-2 [&_blockquote]:border-[#d4af37]/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-white/70">
            <RichText data={guide.content} converters={jsxConverters} />
          </article>
        )}

        {/* Featured restaurants */}
        {featuredRestaurants.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
              Where to eat
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredRestaurants.map((r) => {
                const img = uploadUrl(r.media?.[0]?.image) ?? r.heroImage
                return (
                  <Link
                    key={r.id}
                    href={`/restaurants/${r.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-white/25"
                  >
                    {img && (
                      // heroImage may be an external URL outside next/image remotePatterns
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={r.name}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="p-5">
                      <h3
                        className="text-xl font-light leading-tight text-white/95"
                        style={SERIF}
                      >
                        {r.name}
                      </h3>
                      {(r.cuisine || r.averagePrice) && (
                        <p className="mb-0 mt-2 text-sm text-white/60">
                          {[r.cuisine, r.averagePrice && `€${r.averagePrice}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Featured beaches */}
        {featuredBeaches.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
              Beaches in this guide
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredBeaches.map((b) => {
                const img = uploadUrl(b.media?.[0]?.image) ?? b.heroImage
                return (
                  <Link
                    key={b.id}
                    href={`/beaches/${b.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-white/25"
                  >
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={b.name}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="p-5">
                      <h3
                        className="text-xl font-light leading-tight text-white/95"
                        style={SERIF}
                      >
                        {b.name}
                      </h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Featured properties */}
        {featuredProperties.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-light text-white/90 md:text-3xl" style={SERIF}>
              Stay nearby
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredProperties.map((p) => {
                const cover = p.media?.[0]?.image
                const coverUrl = cover && typeof cover === 'object' ? cover.url : null
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
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            ← Back to home
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
