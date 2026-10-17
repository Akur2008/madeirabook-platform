import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAP_URL = 'https://www.madeirabook.com/m/default-code'
const WHATSAPP_URL = 'https://wa.me/79626854685'

const DM_TEXT = `Here is the secret map of Madeira! 🗺️\n\nLink: ${MAP_URL}\n\nWant to book a stay? Chat with us on WhatsApp: ${WHATSAPP_URL}`

const DM_KEYWORDS = /\b(map|link|send|escape)\b/i

interface IgComment {
  commentId?: string
  senderId: string
  text: string
  mediaId?: string
  username?: string
}

// Accepts the Meta Instagram webhook envelope (entry[].changes[]) plus a
// plain { senderId, text } shape for manual testing.
function extractComments(body: unknown): IgComment[] {
  if (!body || typeof body !== 'object') return []

  const direct = body as { senderId?: unknown; text?: unknown }
  if (typeof direct.senderId === 'string' && typeof direct.text === 'string') {
    return [{ senderId: direct.senderId, text: direct.text }]
  }

  const out: IgComment[] = []
  const entries = (body as { entry?: unknown }).entry
  if (!Array.isArray(entries)) return out
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown })?.changes
    if (!Array.isArray(changes)) continue
    for (const change of changes) {
      const c = change as { field?: unknown; value?: unknown }
      if (c?.field !== 'comments' || !c.value || typeof c.value !== 'object')
        continue
      const v = c.value as {
        id?: unknown
        text?: unknown
        from?: { id?: unknown; username?: unknown }
        media?: { id?: unknown }
      }
      if (typeof v.from?.id !== 'string') continue
      out.push({
        senderId: v.from.id,
        text: typeof v.text === 'string' ? v.text : '',
        ...(typeof v.id === 'string' ? { commentId: v.id } : {}),
        ...(typeof v.media?.id === 'string' ? { mediaId: v.media.id } : {}),
        ...(typeof v.from.username === 'string'
          ? { username: v.from.username }
          : {}),
      })
    }
  }
  return out
}

async function sendInstagramDM(senderId: string): Promise<boolean> {
  const token = process.env.META_ACCESS_TOKEN
  const igUserId = process.env.IG_USER_ID
  if (!token || !igUserId) return false
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: { text: DM_TEXT },
        }),
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!res.ok) {
      console.warn(
        `instagram webhook: DM send failed (${res.status})`,
        await res.text(),
      )
    }
    return res.ok
  } catch (e) {
    console.warn('instagram webhook: DM send failed', e)
    return false
  }
}

// Meta webhook verification handshake.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')
  if (
    token &&
    challenge &&
    process.env.META_VERIFY_TOKEN &&
    token === process.env.META_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ ok: false }, { status: 403 })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON' },
      { status: 400 },
    )
  }

  const comments = extractComments(body)
  if (comments.length === 0) {
    return NextResponse.json({ ok: true, received: 0 })
  }

  const payload = await getPayload({ config: await config })

  for (const c of comments) {
    console.log(
      `instagram webhook: comment="${c.text}" sender=${c.senderId} media=${c.mediaId ?? 'unknown'}`,
    )

    // Meta retries webhook deliveries — skip comments already stored.
    if (c.commentId) {
      const existing = await payload.find({
        collection: 'leads',
        where: { commentId: { equals: c.commentId } },
        limit: 1,
      })
      if (existing.docs.length > 0) continue
    }

    await payload.create({
      collection: 'leads',
      data: {
        source: 'instagram',
        contactIdentifier: c.senderId,
        page: 'instagram',
        status: 'new',
        ...(c.commentId ? { commentId: c.commentId } : {}),
      },
    })

    if (DM_KEYWORDS.test(c.text)) {
      const dmSent = await sendInstagramDM(c.senderId)
      console.log(
        `instagram webhook: auto-DM to ${c.senderId} — ${dmSent ? 'sent' : 'not sent (token/user id missing or API error)'}`,
      )
    }
  }

  return NextResponse.json({ ok: true, received: comments.length })
}
