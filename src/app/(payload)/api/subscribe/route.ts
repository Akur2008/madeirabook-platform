import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, source, agreed } = (body ?? {}) as Record<string, unknown>

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ ok: false, error: 'Invalid email' }, { status: 400 })
  }

  if (agreed !== true) {
    return NextResponse.json({ ok: false, error: 'Consent required' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedSource = typeof source === 'string' ? source.slice(0, 200) : null

  const payload = await getPayload({ config: await config })

  const existing = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: normalizedEmail } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length > 0) {
    return NextResponse.json({ ok: true, existed: true })
  }

  try {
    await payload.create({
      collection: 'subscribers',
      data: { email: normalizedEmail, source: normalizedSource },
    })
  } catch (err) {
    // Race-safe: unique constraint on email -> treat as already subscribed
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('duplicate key') || message.includes('unique')) {
      return NextResponse.json({ ok: true, existed: true })
    }
    throw err
  }

  return NextResponse.json({ ok: true })
}
