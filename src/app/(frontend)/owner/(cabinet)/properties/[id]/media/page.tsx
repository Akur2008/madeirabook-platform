import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import { getCurrentOwner } from '@/lib/ownerAuth'
import type { Media } from '@/payload-types'

export const dynamic = 'force-dynamic'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export default async function PropertyMediaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ uploaded?: string; err?: string }>
}) {
  const owner = await getCurrentOwner()
  if (!owner) redirect('/owner/login')

  const { id } = await params
  const query = await searchParams
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'properties',
    where: {
      and: [{ id: { equals: Number(id) } }, { owner: { equals: owner.id } }],
    },
    limit: 1,
    depth: 1,
  })
  const p = docs[0]
  if (!p) notFound()

  const images = (p.media ?? [])
    .map((m) => m.image)
    .filter((img): img is Media => typeof img === 'object' && img !== null)

  return (
    <div className="max-w-4xl">
      <Link
        href="/owner/properties"
        className="text-sm text-white/50 transition-colors hover:text-white"
      >
        &larr; Properties
      </Link>
      <h1 className="mt-4 text-3xl font-medium" style={SERIF}>
        Photos
      </h1>
      <p className="mb-6 mt-2 text-sm text-white/50">{p.title}</p>

      {query.uploaded === '1' ? (
        <div className="mb-4 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Photos uploaded.
        </div>
      ) : null}
      {query.err ? (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {query.err}
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <form
          method="POST"
          action={`/api/owner/properties/${p.id}/media`}
          encType="multipart/form-data"
        >
          <label className="mb-2 block text-xs uppercase tracking-wide text-white/50">
            Add photos (max 10, up to 4 MB each)
          </label>
          <input
            type="file"
            name="photos"
            accept="image/*"
            multiple
            required
            className="mb-4 block w-full text-sm text-white/70 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Upload
          </button>
        </form>
      </div>

      <h2 className="mb-2 text-xs uppercase tracking-wide text-white/50">
        Current photos
      </h2>
      {images.length === 0 ? (
        <p className="text-sm text-white/40">No photos yet</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {images.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-white/10 bg-white/5 p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.alt ?? ''}
                className="h-40 w-full rounded-lg object-cover"
              />
              <p className="mt-2 truncate text-xs text-white/40">
                {m.filename ?? ''}
              </p>
              <form
                method="POST"
                action={`/api/owner/properties/${p.id}/media/${m.id}/delete`}
                className="mt-2"
              >
                <button
                  type="submit"
                  className="text-xs text-red-300 transition-colors hover:text-red-200 hover:underline"
                >
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link
          href={`/p/${p.slug}`}
          className="text-sm text-emerald-300 transition-colors hover:text-emerald-200"
        >
          View public page &rarr;
        </Link>
      </div>
    </div>
  )
}
