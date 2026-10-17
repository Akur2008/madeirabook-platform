import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { sendAdminAlert } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAP_URL = 'https://www.madeirabook.com/explore'
const ESCAPE_URL = 'https://www.madeirabook.com/'

const MAP_REPLY = `Here is your interactive Madeira map: ${MAP_URL} 🗺️`
const ESCAPE_REPLY = `Let's plan your escape to Madeira: ${ESCAPE_URL} ✈️`

interface IncomingMessage {
  from: string
  text: string
}

// Accepts the Meta WhatsApp Cloud API envelope plus a plain
// { from, text } shape for manual testing.
function extractMessages(body: unknown): IncomingMessage[] {
  if (!body || typeof body !== 'object') return []

  const direct = body as { from?: unknown; text?: unknown }
  if (typeof direct.from === 'string' && typeof direct.text === 'string') {
    return [{ from: direct.from, text: direct.text }]
  }

  const out: IncomingMessage[] = []
  const entries = (body as { entry?: unknown }).entry
  if (!Array.isArray(entries)) return out
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown })?.changes
    if (!Array.isArray(changes)) continue
    for (const change of changes) {
      const messages = (change as { value?: { messages?: unknown } })?.value
        ?.messages
      if (!Array.isArray(messages)) continue
      for (const m of messages) {
        const msg = m as {
          from?: unknown
          text?: { body?: unknown }
          type?: unknown
        }
        if (typeof msg.from === 'string' && typeof msg.text?.body === 'string') {
          out.push({ from: msg.from, text: msg.text.body })
        }
      }
    }
  }
  return out
}

async function translateToEnglish(text: string): Promise<string | null> {
  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) return null
  // DeepL free-tier keys end in ":fx" and use a different host.
  const host = apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com'
    : 'https://api.deepl.com'
  try {
    const res = await fetch(`${host}/v2/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: [text], target_lang: 'EN' }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      translations?: { text?: string }[]
    }
    return data.translations?.[0]?.text ?? null
  } catch (e) {
    console.warn('whatsapp webhook: DeepL translate failed', e)
    return null
  }
}

function autoReplyFor(text: string): string | null {
  const t = text.toLowerCase()
  if (/(карта|map|мап)/.test(t)) return MAP_REPLY
  if (/(escape|побег|сбеж|flight|book|stay)/.test(t)) return ESCAPE_REPLY
  return null
}

async function sendWhatsAppReply(to: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_API_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneId) return false
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
        signal: AbortSignal.timeout(8000),
      },
    )
    return res.ok
  } catch (e) {
    console.warn('whatsapp webhook: reply send failed', e)
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
    process.env.WHATSAPP_VERIFY_TOKEN &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
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
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const messages = extractMessages(body)
  for (const msg of messages) {
    const translated = await translateToEnglish(msg.text)
    const reply = autoReplyFor(translated ?? msg.text)
    const replied = reply ? await sendWhatsAppReply(msg.from, reply) : false

    await sendAdminAlert(
      'WhatsApp concierge message',
      [
        `From: ${msg.from}`,
        `Text: ${msg.text}`,
        translated ? `EN: ${translated}` : 'EN: (translation unavailable)',
        reply ? `Auto-reply: ${reply}` : 'Auto-reply: none',
        `Reply sent: ${replied ? 'yes' : 'no (WhatsApp API not configured)'}`,
      ].join('\n'),
    )
  }

  return NextResponse.json({ ok: true, received: messages.length })
}
