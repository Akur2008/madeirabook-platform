import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { z } from 'zod'

import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const leadSchema = z.object({
  source: z.enum(['whatsapp', 'instagram', 'direct_web']),
  page: z.string().min(1).max(500),
  refCode: z
    .string()
    .regex(/^[a-z0-9_-]{2,50}$/)
    .optional(),
  email: z.email().max(320).optional(),
  contactIdentifier: z.string().max(200).optional(),
  type: z.enum(['ambassador', 'owner']).optional(),
  whatsapp: z.string().max(50).optional(),
  instagramOrProperty: z.string().max(500).optional(),
})

// Basic in-memory rate limit: max 10 requests per IP per minute. Per-instance
// only — good enough to blunt accidental bursts, not a DDoS shield.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 10
const hits = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_PER_WINDOW
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(req: Request) {
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid payload' },
      { status: 400 },
    )
  }

  const userAgent = req.headers.get('user-agent')
  const payload = await getPayload({ config: await config })
  await payload.create({
    collection: 'leads',
    data: {
      source: parsed.data.source,
      page: parsed.data.page,
      status: 'new',
      ...(parsed.data.refCode ? { refCode: parsed.data.refCode } : {}),
      ...(parsed.data.email ? { email: parsed.data.email } : {}),
      ...(parsed.data.contactIdentifier
        ? { contactIdentifier: parsed.data.contactIdentifier }
        : {}),
      ...(parsed.data.type ? { type: parsed.data.type } : {}),
      ...(parsed.data.whatsapp ? { whatsapp: parsed.data.whatsapp } : {}),
      ...(parsed.data.instagramOrProperty
        ? { instagramOrProperty: parsed.data.instagramOrProperty }
        : {}),
      ...(userAgent ? { userAgent } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}
