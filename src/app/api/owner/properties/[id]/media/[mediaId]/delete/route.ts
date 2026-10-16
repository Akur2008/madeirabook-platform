import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { getCurrentOwner } from '@/lib/ownerAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; mediaId: string }> },
) {
  const { id, mediaId } = await ctx.params
  const back = () =>
    NextResponse.redirect(
      new URL(`/owner/properties/${id}/media`, req.url),
      303,
    )

  const owner = await getCurrentOwner()
  if (!owner) return NextResponse.redirect(new URL('/owner/login', req.url), 303)

  try {
    const payload = await getPayload({ config: await config })
    const numId = Number(id)
    const numMediaId = Number(mediaId)
    if (!Number.isInteger(numId) || numId <= 0 || !Number.isInteger(numMediaId)) {
      return back()
    }

    const { docs } = await payload.find({
      collection: 'properties',
      where: {
        and: [{ id: { equals: numId } }, { owner: { equals: owner.id } }],
      },
      limit: 1,
      depth: 1,
    })
    const property = docs[0]
    if (!property) return back()

    const remaining = (property.media ?? [])
      .map((m) => (typeof m.image === 'object' ? m.image : null))
      .filter((m): m is NonNullable<typeof m> => m !== null)
    const target = remaining.find((m) => m.id === numMediaId)
    if (!target) return back()

    await payload.update({
      collection: 'properties',
      id: property.id,
      data: {
        media: remaining
          .filter((m) => m.id !== numMediaId)
          .map((m) => ({ image: m.id })),
      },
    })

    if (target.url) {
      const { docs: uploadDocs } = await payload.find({
        collection: 'uploads',
        where: { url: { equals: target.url } },
        limit: 1,
        depth: 0,
      })
      if (uploadDocs[0]) {
        await payload.delete({ collection: 'uploads', id: uploadDocs[0].id })
      }
    }
    await payload.delete({ collection: 'media', id: numMediaId })

    console.log(
      `owner ${owner.id} deleted media ${numMediaId} from property ${property.id}`,
    )
    return back()
  } catch (e) {
    console.error('owner property media delete failed:', e)
    return back()
  }
}
