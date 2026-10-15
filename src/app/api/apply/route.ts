import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { sendAdminAlert } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const AUDIENCE_SIZES = new Set(['5k-10k', '10k-30k', '30k-100k', '100k+'])
const NICHES = new Set(['travel', 'lifestyle', 'portugal-madeira', 'other'])
const DEDUP_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

function asStr(value: unknown, max = 500): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const raw = (body ?? {}) as Record<string, unknown>

  const name = asStr(raw.name, 200)
  const email = asStr(raw.email)?.toLowerCase()
  const audienceSize = asStr(raw.audienceSize, 50)
  const niche = asStr(raw.niche, 50)
  const mainCity = asStr(raw.mainCity, 200)
  const sampleReelUrl = asStr(raw.sampleReelUrl, 500)
  const message = asStr(raw.message, 300)

  let instagramHandle = asStr(raw.instagramHandle, 100)
  if (instagramHandle && !instagramHandle.startsWith('@')) {
    instagramHandle = `@${instagramHandle}`
  }

  if (!name || !instagramHandle || !email || !audienceSize || !niche) {
    return NextResponse.json(
      { ok: false, error: 'Missing required fields' },
      { status: 400 },
    )
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid email' },
      { status: 400 },
    )
  }

  if (!AUDIENCE_SIZES.has(audienceSize) || !NICHES.has(niche)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid select value' },
      { status: 400 },
    )
  }

  const payload = await getPayload({ config: await config })

  // Max one application per email per 30 days.
  const recent = await payload.find({
    collection: 'applications',
    where: {
      email: { equals: email },
      createdAt: {
        greater_than: new Date(Date.now() - DEDUP_WINDOW_MS).toISOString(),
      },
    },
    limit: 1,
    depth: 0,
  })

  if (recent.docs.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'You have already applied recently. We reply within 48 hours.',
      },
      { status: 409 },
    )
  }

  await payload.create({
    collection: 'applications',
    data: {
      name,
      instagramHandle,
      email,
      audienceSize: audienceSize as '5k-10k' | '10k-30k' | '30k-100k' | '100k+',
      niche: niche as 'travel' | 'lifestyle' | 'portugal-madeira' | 'other',
      mainCity,
      sampleReelUrl,
      message,
      status: 'new',
    },
  })

  await sendAdminAlert(
    'New ambassador application',
    [
      `Handle: ${instagramHandle}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Audience: ${audienceSize}`,
      `Niche: ${niche}`,
      `Main city: ${mainCity || '-'}`,
      `Reel: ${sampleReelUrl || '-'}`,
      `Message: ${message || '-'}`,
      `Date: ${new Date().toISOString()}`,
    ].join('\n'),
  )

  return NextResponse.json({ ok: true })
}
