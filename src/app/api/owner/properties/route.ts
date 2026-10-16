import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { getCurrentOwner } from '@/lib/ownerAuth'
import { parsePropertyBody } from './shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function slugify(title: string): string {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function POST(req: NextRequest) {
  const owner = await getCurrentOwner()
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = parsePropertyBody(raw)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config: await config })

    let slug = slugify(parsed.data.slug || parsed.data.title)
    if (!slug) slug = 'property'
    const base = slug
    for (let attempt = 0; ; attempt++) {
      slug = attempt === 0 ? base : `${base}-${attempt}`
      const { totalDocs } = await payload.count({
        collection: 'properties',
        where: { slug: { equals: slug } },
      })
      if (!totalDocs) break
      if (attempt > 50) {
        slug = `${base}-${Date.now()}`
        break
      }
    }

    const doc = await payload.create({
      collection: 'properties',
      data: {
        ...parsed.data,
        slug,
        brand: 'madeirabook',
        owner: owner.id,
        isPlatform: false,
        status: 'draft',
      },
    })

    console.log(`owner ${owner.id} created property ${doc.id} (${slug})`)
    return NextResponse.json({ id: doc.id }, { status: 201 })
  } catch (e) {
    console.error('owner property create failed:', e)
    const message = e instanceof Error ? e.message : 'Create failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
