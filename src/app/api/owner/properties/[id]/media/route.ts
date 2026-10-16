import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { getCurrentOwner } from '@/lib/ownerAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 4 * 1024 * 1024
const MAX_FILES = 10

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const back = (query: string) =>
    NextResponse.redirect(
      new URL(`/owner/properties/${id}/media${query}`, req.url),
      303,
    )

  const owner = await getCurrentOwner()
  if (!owner) return NextResponse.redirect(new URL('/owner/login', req.url), 303)

  try {
    const payload = await getPayload({ config: await config })
    const numId = Number(id)
    if (!Number.isInteger(numId) || numId <= 0) return back('?err=Invalid+id')

    const { docs } = await payload.find({
      collection: 'properties',
      where: {
        and: [{ id: { equals: numId } }, { owner: { equals: owner.id } }],
      },
      limit: 1,
      depth: 0,
    })
    const property = docs[0]
    if (!property) return back('?err=Property+not+found')

    const form = await req.formData()
    const files = form
      .getAll('photos')
      .filter((f): f is File => f instanceof File && f.size > 0)
      .slice(0, MAX_FILES)
    if (!files.length) return back('?err=No+files+received')

    const existingMedia = (property.media ?? [])
      .map((m) => (typeof m.image === 'object' ? m.image?.id : m.image))
      .filter((x): x is number => typeof x === 'number')

    const newIds: number[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > MAX_FILE_SIZE) continue

      const buffer = Buffer.from(await file.arrayBuffer())
      const uploaded = await payload.create({
        collection: 'uploads',
        data: { alt: file.name },
        file: {
          data: buffer,
          mimetype: file.type,
          name: file.name,
          size: file.size,
        },
      })
      if (!uploaded.url) continue

      const mediaDoc = await payload.create({
        collection: 'media',
        data: {
          alt: file.name,
          url: uploaded.url,
          filename: uploaded.filename ?? file.name,
          mimeType: file.type,
          filesize: file.size,
          width: uploaded.width ?? null,
          height: uploaded.height ?? null,
        },
      })
      newIds.push(mediaDoc.id)
    }

    if (newIds.length) {
      await payload.update({
        collection: 'properties',
        id: property.id,
        data: {
          media: [...existingMedia, ...newIds].map((image) => ({ image })),
        },
      })
    }

    console.log(
      `owner ${owner.id} uploaded ${newIds.length} photo(s) to property ${property.id}`,
    )
    return back('?uploaded=1')
  } catch (e) {
    console.error('owner property media upload failed:', e)
    const message = e instanceof Error ? e.message : 'Upload failed'
    return back(`?err=${encodeURIComponent(message)}`)
  }
}
