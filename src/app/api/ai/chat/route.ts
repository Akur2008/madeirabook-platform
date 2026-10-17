import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { z } from 'zod'

import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-4o-mini'
const CONTEXT_TTL_MS = 10 * 60 * 1000
const BLURB_MAX = 160

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
  page: z.string().max(300).optional(),
})

// Same per-IP sliding window as /api/leads/track: per-instance, blunts
// accidental bursts rather than a DDoS shield. Chat is costlier per call,
// so the budget is tighter.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 6
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

function blurb(text: unknown): string {
  if (typeof text !== 'string' || !text.trim()) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > BLURB_MAX ? `${clean.slice(0, BLURB_MAX)}…` : clean
}

type Doc = Record<string, unknown>

function line(parts: Array<string | null | undefined>): string {
  return `- ${parts.filter(Boolean).join(' | ')}`
}

let cachedContext: { text: string; expiresAt: number } | null = null

// Compact site index injected into the system prompt. Payload data changes
// rarely, so a 10-minute in-memory cache keeps every chat call cheap.
async function siteIndex(): Promise<string> {
  if (cachedContext && cachedContext.expiresAt > Date.now()) {
    return cachedContext.text
  }

  const payload = await getPayload({ config: await config })
  const base = {
    depth: 0,
    limit: 60,
    overrideAccess: true,
    where: { status: { equals: 'published' } },
  } as const

  const [properties, beaches, restaurants, trails, viewpoints, guides] =
    await Promise.all([
      payload.find({
        ...base,
        collection: 'properties',
        select: { title: true, slug: true, shortDescription: true, pricePerNight: true, bedrooms: true, maxGuests: true },
      }),
      payload.find({
        ...base,
        collection: 'beaches',
        select: { name: true, slug: true, shortDescription: true },
      }),
      payload.find({
        ...base,
        collection: 'restaurants',
        select: { name: true, slug: true, shortDescription: true, cuisine: true, averagePrice: true },
      }),
      payload.find({
        ...base,
        collection: 'trails',
        select: { name: true, slug: true, shortDescription: true },
      }),
      payload.find({
        ...base,
        collection: 'viewpoints',
        select: { name: true, slug: true, shortDescription: true },
      }),
      payload.find({
        ...base,
        collection: 'guides',
        select: { title: true, slug: true, excerpt: true },
      }),
    ])

  const sections = [
    [
      'Stays (URL /p/<slug>):',
      ...properties.docs.map((d: Doc) =>
        line([
          String(d.title ?? ''),
          `/p/${String(d.slug ?? '')}`,
          typeof d.pricePerNight === 'number' ? `€${d.pricePerNight}/night` : null,
          typeof d.bedrooms === 'number' ? `${d.bedrooms} bed` : null,
          blurb(d.shortDescription),
        ]),
      ),
    ],
    [
      'Beaches (URL /beaches/<slug>):',
      ...beaches.docs.map((d: Doc) =>
        line([String(d.name ?? ''), `/beaches/${String(d.slug ?? '')}`, blurb(d.shortDescription)]),
      ),
    ],
    [
      'Restaurants (URL /restaurants/<slug>):',
      ...restaurants.docs.map((d: Doc) =>
        line([
          String(d.name ?? ''),
          `/restaurants/${String(d.slug ?? '')}`,
          typeof d.cuisine === 'string' ? d.cuisine : null,
          blurb(d.shortDescription),
        ]),
      ),
    ],
    [
      'Trails (URL /trails/<slug>):',
      ...trails.docs.map((d: Doc) =>
        line([String(d.name ?? ''), `/trails/${String(d.slug ?? '')}`, blurb(d.shortDescription)]),
      ),
    ],
    [
      'Viewpoints (URL /viewpoints/<slug>):',
      ...viewpoints.docs.map((d: Doc) =>
        line([String(d.name ?? ''), `/viewpoints/${String(d.slug ?? '')}`, blurb(d.shortDescription)]),
      ),
    ],
    [
      'Guides (URL /guides/<slug>):',
      ...guides.docs.map((d: Doc) =>
        line([String(d.title ?? ''), `/guides/${String(d.slug ?? '')}`, blurb(d.excerpt)]),
      ),
    ],
  ]

  const text = sections
    .filter((s) => s.length > 1)
    .map((s) => s.join('\n'))
    .join('\n\n')

  cachedContext = { text, expiresAt: Date.now() + CONTEXT_TTL_MS }
  return text
}

function systemPrompt(index: string, page?: string): string {
  return [
    'You are the Madeirabook AI concierge — a warm, knowledgeable local expert for Madeira island.',
    'Madeirabook is a curated publisher of rare stays, beaches, restaurants, trails, viewpoints and guides.',
    '',
    'Rules:',
    '- Answer in the same language the guest writes in.',
    '- Keep answers short: 2-4 short paragraphs or a compact list.',
    '- When you mention a place from the SITE INDEX, always link it in Markdown, e.g. [Seixal Beach](/beaches/seixal-beach).',
    '- Only link to URLs that appear in the SITE INDEX (plus /explore for the map and /escape for curated escapes). Never invent slugs.',
    '- For prices and availability, send the guest to the stay page — do not invent rates.',
    '- If the question is not about Madeira travel, politely steer back to the island.',
    ...(page ? [`- The guest is currently browsing: ${page}`] : []),
    '',
    'SITE INDEX:',
    index || '(index unavailable — answer generally, without links)',
  ].join('\n')
}

// OpenAI SSE -> plain text delta stream for the widget.
async function streamChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  system: string,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      temperature: 0.6,
      max_tokens: 600,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  })

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '')
    throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 300)}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        controller.close()
        return
      }
      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''
      for (const event of events) {
        for (const lineText of event.split('\n')) {
          if (!lineText.startsWith('data:')) continue
          const data = lineText.slice(5).trim()
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta?.content
            if (typeof delta === 'string' && delta) {
              controller.enqueue(encoder.encode(delta))
            }
          } catch {
            // partial JSON chunk — ignore, next pull delivers the rest
          }
        }
      }
    },
    cancel() {
      void reader.cancel()
    },
  })
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'AI concierge is not configured' },
      { status: 503 },
    )
  }

  if (isRateLimited(clientIp(req))) {
    return NextResponse.json(
      { ok: false, error: 'Too many messages — try again in a minute' },
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

  const parsed = chatSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid payload' },
      { status: 400 },
    )
  }

  let index = ''
  try {
    index = await siteIndex()
  } catch {
    // Context lookup failed — chat still works without the index.
  }

  try {
    const stream = await streamChat(
      parsed.data.messages,
      systemPrompt(index, parsed.data.page),
    )
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'AI concierge is unavailable' },
      { status: 502 },
    )
  }
}
