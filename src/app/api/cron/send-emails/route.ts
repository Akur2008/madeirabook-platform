import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import type { Payload } from 'payload'

import config from '@payload-config'
import { sendResendEmail } from '@/lib/notify'
import { templates, unsubscribeUrl } from '@/lib/emails/templates'
import type { EmailQueue, Subscriber } from '@/payload-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Vercel Cron sends `authorization: Bearer <CRON_SECRET>`. If the secret is
// not configured the check is skipped (same dev behavior as core cron.js).
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  if (req.headers.get('authorization') === `Bearer ${secret}`) return true
  return new URL(req.url).searchParams.get('secret') === secret
}

function isSubscriber(value: EmailQueue['subscriber']): value is Subscriber {
  return typeof value === 'object' && value !== null
}

async function markError(
  payload: Payload,
  id: number,
  error: string,
): Promise<void> {
  await payload.update({
    collection: 'email-queue',
    id,
    data: { error },
  })
}

export async function GET(req: Request) {
  const startedAt = Date.now()

  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY not set' },
      { status: 503 },
    )
  }

  try {
    const payload = await getPayload({ config: await config })
    const url = new URL(req.url)
    const limit = Math.min(
      Number.parseInt(url.searchParams.get('limit') || '', 10) || 50,
      200,
    )
    const now = new Date().toISOString()
    const results = { total: 0, sent: 0, failed: 0, skipped: 0 }

    // Queue rows for unsubscribed subscribers are marked as skipped so they
    // don't pile up (core cron.js: sent_at = NOW(), error = 'unsubscribed').
    const unsubscribed = await payload.find({
      collection: 'email-queue',
      where: {
        and: [
          { sentAt: { exists: false } },
          { 'subscriber.unsubscribedAt': { exists: true } },
        ],
      },
      limit: 0,
      depth: 0,
    })
    for (const job of unsubscribed.docs) {
      await payload.update({
        collection: 'email-queue',
        id: job.id,
        data: { sentAt: now, error: 'unsubscribed' },
      })
      results.skipped++
    }

    // Pending jobs ready to send. sentAt is set first (claim) so reruns
    // don't pick the same rows — mirrors the core claim-before-send update.
    const pending = await payload.find({
      collection: 'email-queue',
      where: {
        and: [
          { sentAt: { exists: false } },
          { sendAt: { less_than_equal: now } },
          { 'subscriber.unsubscribedAt': { exists: false } },
        ],
      },
      sort: 'sendAt',
      limit,
      depth: 1,
    })
    const jobs = pending.docs
    results.total = jobs.length

    for (const job of jobs) {
      await payload.update({
        collection: 'email-queue',
        id: job.id,
        data: { sentAt: now },
      })
      try {
        if (!isSubscriber(job.subscriber)) {
          await markError(payload, job.id, 'subscriber not found')
          results.failed++
          continue
        }
        const subscriber = job.subscriber
        if (subscriber.unsubscribedAt) {
          await markError(payload, job.id, 'unsubscribed')
          results.skipped++
          continue
        }
        const tpl = templates[job.template]
        if (!tpl) {
          await markError(
            payload,
            job.id,
            `template not found: ${job.template}`,
          )
          results.failed++
          continue
        }
        const rendered = tpl(subscriber)

        await sendResendEmail(apiKey, {
          to: subscriber.email,
          replyTo: 'akur2013@gmail.com',
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl(subscriber.unsubscribeToken)}>, <mailto:hello@madeirabook.com?subject=unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })

        results.sent++
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        await markError(payload, job.id, message)
        results.failed++
      }
    }

    return NextResponse.json({ ok: true, ...results, ms: Date.now() - startedAt })
  } catch (err) {
    console.error('cron send-emails: failed', err)
    return NextResponse.json({ error: 'cron_failed' }, { status: 500 })
  }
}
