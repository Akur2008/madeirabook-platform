import 'dotenv/config'
import pg from 'pg'
import { getPayload } from 'payload'
import type { Payload, Where } from 'payload'
import config from '../src/payload.config.js'

const { Client } = pg

const stats = { ok: 0, skip: 0, fail: 0 }
const ok = (msg: string) => {
  stats.ok++
  console.log(`OK ${msg}`)
}
const skip = (msg: string) => {
  stats.skip++
  console.log(`SKIP ${msg}`)
}
const fail = (msg: string, err: unknown) => {
  stats.fail++
  console.log(`FAIL ${msg}: ${err instanceof Error ? err.message : String(err)}`)
}

const toNum = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

const toIso = (v: unknown): string | undefined => {
  if (v === null || v === undefined || v === '') return undefined
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

async function findByField(
  payload: Payload,
  collection: 'subscribers' | 'email-queue',
  field: string,
  value: string,
) {
  const res = await payload.find({
    collection,
    where: { [field]: { equals: value } } as Where,
    limit: 1,
    depth: 0,
  })
  return res.docs[0] ?? null
}

async function main() {
  const legacy = new Client({ connectionString: process.env.LEGACY_DATABASE_URL })
  await legacy.connect()
  const payload = await getPayload({ config })

  console.log('--- subscribers ---')
  const subscriberIdMap = new Map<number, number>()
  const subscribers = await legacy.query(
    `SELECT id, email, source, telegram_id, unsubscribe_token, unsubscribed_at, created_at
     FROM subscribers ORDER BY id`,
  )
  for (const row of subscribers.rows) {
    if (!row.email) {
      skip(`subscriber id=${row.id} (missing email)`)
      continue
    }
    const email = String(row.email).toLowerCase()
    try {
      const data = {
        email,
        source: row.source ?? undefined,
        status: (row.unsubscribed_at ? 'unsubscribed' : 'active') as
          | 'unsubscribed'
          | 'active',
        unsubscribeToken: row.unsubscribe_token ?? undefined,
        unsubscribedAt: toIso(row.unsubscribed_at),
        telegramId: toNum(row.telegram_id),
        createdAt: toIso(row.created_at),
      }
      const existing = await findByField(payload, 'subscribers', 'email', email)
      const doc = existing
        ? await payload.update({ collection: 'subscribers', id: existing.id, data })
        : await payload.create({ collection: 'subscribers', data })
      subscriberIdMap.set(row.id, doc.id)
      ok(`subscriber ${email}`)
    } catch (e) {
      fail(`subscriber ${email}`, e)
    }
  }

  console.log('--- email_queue ---')
  const queue = await legacy.query(
    `SELECT eq.id, eq.subscriber_id, eq.template, eq.send_at, eq.sent_at, eq.error, eq.created_at,
            s.email AS subscriber_email
     FROM email_queue eq LEFT JOIN subscribers s ON s.id = eq.subscriber_id
     ORDER BY eq.id`,
  )
  for (const row of queue.rows) {
    const label = `queue id=${row.id} (${row.template} -> ${row.subscriber_email ?? '?'})`
    const sendAt = toIso(row.send_at)
    if (!row.template || !sendAt) {
      skip(`${label} (missing template/send_at)`)
      continue
    }
    try {
      let subscriberId = subscriberIdMap.get(row.subscriber_id)
      if (!subscriberId && row.subscriber_email) {
        const sub = await findByField(
          payload,
          'subscribers',
          'email',
          String(row.subscriber_email).toLowerCase(),
        )
        subscriberId = sub?.id
      }
      if (!subscriberId) {
        skip(`${label} (subscriber not found)`)
        continue
      }

      const data = {
        subscriber: subscriberId,
        template: row.template,
        sendAt,
        sentAt: toIso(row.sent_at),
        error: row.error ?? undefined,
        createdAt: toIso(row.created_at),
      }

      // Idempotent upsert: (subscriber, template, sendAt) is a natural key.
      const existing = await payload.find({
        collection: 'email-queue',
        where: {
          and: [
            { subscriber: { equals: subscriberId } },
            { template: { equals: row.template } },
            { sendAt: { equals: data.sendAt } },
          ],
        },
        limit: 1,
        depth: 0,
      })
      const doc = existing.docs[0]
      if (doc) {
        await payload.update({ collection: 'email-queue', id: doc.id, data })
      } else {
        await payload.create({ collection: 'email-queue', data })
      }
      ok(label)
    } catch (e) {
      fail(label, e)
    }
  }

  console.log(`Done. OK: ${stats.ok}, SKIP: ${stats.skip}, FAIL: ${stats.fail}`)
  await legacy.end()
  process.exit(stats.fail > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
