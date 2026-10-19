import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import CollectionsGallery, { type GalleryVideo } from './CollectionsGallery'

export const dynamic = 'force-dynamic'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const CATEGORIES = {
  mountains: { title: 'Mountains & Viewpoints' },
  forest: { title: 'Forest & Levadas' },
  ocean: { title: 'Ocean & Sunsets' },
} as const

type Category = keyof typeof CATEGORIES

const isCategory = (value: string): value is Category =>
  Object.prototype.hasOwnProperty.call(CATEGORIES, value)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  if (!isCategory(category)) return { title: 'Not found' }
  const { title } = CATEGORIES[category]
  return {
    title: `${title} — Video collection | Madeirabook`,
    description: `All Madeira clips in the ${title} collection.`,
    alternates: {
      canonical: `https://www.madeirabook.com/collections/${category}`,
    },
  }
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  if (!isCategory(category)) notFound()

  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'homepage-videos',
    where: {
      and: [{ category: { equals: category } }, { isActive: { equals: true } }],
    },
    limit: 50,
    depth: 0,
    sort: 'order',
  })

  const videos: GalleryVideo[] = docs.map((v) => ({
    id: v.id,
    title: v.title ?? CATEGORIES[category].title,
    videoUrl: v.videoUrl,
    posterUrl: v.posterUrl,
  }))

  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a1420]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="whitespace-nowrap text-sm text-white/60 transition-colors hover:text-white"
          >
            ← Back to home
          </Link>
          <h1
            className="flex-1 text-center text-xl font-light text-white/95 sm:text-2xl"
            style={SERIF}
          >
            {CATEGORIES[category].title}
          </h1>
          <span className="w-[110px] shrink-0 max-sm:hidden" aria-hidden />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        {videos.length === 0 ? (
          <p className="text-center text-white/50">No videos in this collection yet.</p>
        ) : (
          <CollectionsGallery videos={videos} />
        )}
      </main>
    </div>
  )
}
