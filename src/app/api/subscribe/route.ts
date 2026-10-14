import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { sendResendEmail, sendTelegramMessage } from '@/lib/notify'
import { templates, unsubscribeUrl } from '@/lib/emails/templates'
import type { Subscriber } from '@/payload-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Welcome sequence after signup — 1:1 port of core routes/subscribe.js.
const WELCOME_SEQUENCE = [
  { template: 'gateway_ocean', days: 1 },
  { template: 'restaurants_funchal', days: 7 },
  { template: 'madeira_winter', days: 21 },
  { template: 'return_offer', days: 45 },
]

function newUnsubscribeToken(): string {
  return randomBytes(24).toString('hex')
}

// The guide PDF ships in public/. The filesystem read works in dev and on
// self-hosted; fall back to the public URL (the source core used) when it
// is missing. Never blocks the subscription — worst case the welcome email
// goes out without the attachment.
async function loadGuidePdf(): Promise<string | null> {
  try {
    const buf = await readFile(
      path.join(process.cwd(), 'public', 'madeira-guide.pdf'),
    )
    return buf.toString('base64')
  } catch {
    // not on disk — try the live URL below
  }
  try {
    const res = await fetch('https://www.madeirabook.com/madeira-guide.pdf', {
      signal: AbortSignal.timeout(15000),
    })
    if (res.ok) return Buffer.from(await res.arrayBuffer()).toString('base64')
  } catch {
    // fall through
  }
  return null
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

  const { email, source, agreed, consent } = (body ?? {}) as Record<
    string,
    unknown
  >

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json(
      { ok: false, error: 'Invalid email' },
      { status: 400 },
    )
  }

  // GDPR consent is required; the site form sends `agreed`, other callers
  // may send `consent`.
  if (agreed !== true && consent !== true) {
    return NextResponse.json(
      { ok: false, error: 'Consent required' },
      { status: 400 },
    )
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Email service not configured' },
      { status: 503 },
    )
  }

  const payload = await getPayload({ config: await config })
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedSource =
    typeof source === 'string' ? source.slice(0, 200) : null

  const existing = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: normalizedEmail } },
    limit: 1,
    depth: 0,
  })

  let subscriber: Subscriber | undefined = existing.docs[0]
  let isNew = false

  // Existing subscriber — never overwrite the token; only fill it in when
  // the row predates the field (core: COALESCE on conflict).
  if (subscriber && !subscriber.unsubscribeToken) {
    subscriber = await payload.update({
      collection: 'subscribers',
      id: subscriber.id,
      data: { unsubscribeToken: newUnsubscribeToken() },
    })
  }

  if (!subscriber) {
    try {
      subscriber = await payload.create({
        collection: 'subscribers',
        data: {
          email: normalizedEmail,
          source: normalizedSource,
          unsubscribeToken: newUnsubscribeToken(),
        },
      })
      isNew = true
    } catch (err) {
      // Race-safe: unique constraint on email -> treat as already subscribed
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('duplicate key') || message.includes('unique')) {
        const retry = await payload.find({
          collection: 'subscribers',
          where: { email: { equals: normalizedEmail } },
          limit: 1,
          depth: 0,
        })
        subscriber = retry.docs[0]
      }
      if (!subscriber) throw err
    }
  }

  if (isNew) {
    const now = Date.now()
    for (const step of WELCOME_SEQUENCE) {
      await payload.create({
        collection: 'email-queue',
        data: {
          subscriber: subscriber.id,
          template: step.template,
          sendAt: new Date(
            now + step.days * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      })
    }
  }

  // Core sends the welcome email on every subscribe call, including repeats.
  const rendered = templates.welcome(subscriber)
  const pdf = await loadGuidePdf()
  try {
    await sendResendEmail(apiKey, {
      to: normalizedEmail,
      replyTo: 'akur2013@gmail.com',
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl(subscriber.unsubscribeToken)}>, <mailto:hello@madeirabook.com?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      ...(pdf
        ? { attachments: [{ filename: 'madeira-guide.pdf', content: pdf }] }
        : {}),
    })
    console.log(
      `subscribe: welcome email sent to ${normalizedEmail}${pdf ? '' : ' (no pdf attachment)'}`,
    )
  } catch (e) {
    console.error('subscribe: welcome email failed', e)
  }

  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (adminChatId) {
    try {
      await sendTelegramMessage(
        adminChatId,
        `New subscriber: ${normalizedEmail}${normalizedSource ? ` (${normalizedSource})` : ''}`,
      )
    } catch (e) {
      console.error('subscribe: telegram notify failed', e)
    }
  }

  return NextResponse.json({ ok: true, existed: !isNew })
}
