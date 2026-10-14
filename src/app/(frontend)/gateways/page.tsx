import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import type { SluicePage } from '@/payload-types'

export const dynamic = 'force-dynamic'

const ELEMENT_ORDER = ['ocean', 'terra', 'forest', 'sun', 'wild', 'other'] as const

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default async function GatewaysPage() {
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'sluice-pages',
    where: { status: { equals: 'published' } },
    limit: 200,
    depth: 0,
  })

  const groups = new Map<string, SluicePage[]>()
  for (const page of docs) {
    const key = page.element && ELEMENT_ORDER.includes(page.element as (typeof ELEMENT_ORDER)[number])
      ? page.element
      : 'other'
    const list = groups.get(key) ?? []
    list.push(page)
    groups.set(key, list)
  }

  const orderedGroups = ELEMENT_ORDER.map((element) => ({
    element,
    pages: (groups.get(element) ?? []).sort((a, b) => a.title.localeCompare(b.title)),
  })).filter((group) => group.pages.length > 0)

  return (
    <div className="min-h-dvh bg-[#0a1420] px-5 py-6 text-white sm:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        aria-label="Back"
      >
        ←
      </Link>

      <h1 className="mb-12 font-serif text-4xl font-medium tracking-wide sm:text-5xl">
        Emotional Gateways
      </h1>

      {orderedGroups.map((group) => (
        <section key={group.element} className="mb-14">
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            {capitalize(group.element)}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.pages.map((page) => (
              <Link
                key={page.id}
                href={`/gateway/${page.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-lg bg-white/5"
              >
                {page.posterUrl && (
                  <Image
                    src={page.posterUrl}
                    alt={page.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 pt-16">
                  <h3 className="mb-1 text-xl font-semibold leading-tight">
                    {page.title}
                  </h3>
                  {page.shortDescription && (
                    <p className="text-sm leading-snug text-white/70">
                      {page.shortDescription}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
