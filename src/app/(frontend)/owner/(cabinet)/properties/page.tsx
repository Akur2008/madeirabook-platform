import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import { getCurrentOwner } from '@/lib/ownerAuth'
import type { Media } from '@/payload-types'

import DeletePropertyButton from './_components/DeletePropertyButton'

export const dynamic = 'force-dynamic'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const STATUS_STYLES: Record<string, string> = {
  published: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  draft: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  archived: 'border-white/20 bg-white/5 text-white/50',
}

export default async function OwnerPropertiesPage() {
  const owner = await getCurrentOwner()
  if (!owner) redirect('/owner/login')

  const payload = await getPayload({ config: await config })
  const { docs: properties } = await payload.find({
    collection: 'properties',
    where: { owner: { equals: owner.id } },
    limit: 100,
    depth: 1,
    sort: 'title',
  })

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-medium" style={SERIF}>
          Properties
        </h1>
        <Link
          href="/owner/properties/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          Add property
        </Link>
      </div>

      {properties.length === 0 ? (
        <p className="mt-8 text-sm text-white/50">
          No properties yet. Click &quot;Add property&quot; to create your first
          one.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => {
            const cover = p.media?.[0]?.image
            const imageUrl =
              cover && typeof cover === 'object'
                ? (cover as Media).url
                : undefined
            const status = p.status ?? 'draft'

            return (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5"
              >
                <div className="aspect-[16/10] w-full bg-white/5">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white/25">
                      No photo
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg leading-snug" style={SERIF}>
                      {p.title}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.draft}`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center gap-2">
                    <Link
                      href={`/owner/properties/${p.id}/edit`}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/70 transition-colors hover:border-white/40 hover:text-white"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/owner/properties/${p.id}/media`}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/70 transition-colors hover:border-white/40 hover:text-white"
                    >
                      Media
                    </Link>
                    <DeletePropertyButton id={p.id} title={p.title} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
