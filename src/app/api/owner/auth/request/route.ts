import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { sendResendEmail } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_TTL_MINUTES = 15
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function appBaseUrl(): string {
  return (process.env.APP_URL || 'https://www.madeirabook.com').replace(/\/$/, '')
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const email =
    typeof (body as Record<string, unknown>)?.email === 'string'
      ? ((body as Record<string, unknown>).email as string).trim().toLowerCase()
      : ''

  // Always respond ok — never reveal whether the email exists.
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ ok: true })
  }

  try {
    const payload = await getPayload({ config: await config })
    const { docs } = await payload.find({
      collection: 'users',
      where: {
        and: [{ email: { equals: email } }, { role: { equals: 'owner' } }],
      },
      limit: 1,
      depth: 0,
    })

    const user = docs[0]
    if (!user) {
      console.log(`owner magic link requested for unknown email: ${email}`)
      return NextResponse.json({ ok: true })
    }

    const token = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000)

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        magicToken: token,
        magicTokenExpiresAt: expiresAt.toISOString(),
      },
    })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('RESEND_API_KEY not set, owner magic link not sent')
      return NextResponse.json({ ok: true })
    }

    const link = `${appBaseUrl()}/owner/auth/${token}`
    try {
      await sendResendEmail(apiKey, {
        to: email,
        subject: 'Your Madeirabook login link',
        text: `Sign in to your owner cabinet:\n\n${link}\n\nThis link expires in ${TOKEN_TTL_MINUTES} minutes.`,
        html:
          '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">' +
          '<h2 style="color:#064e3b;">Sign in to Madeirabook</h2>' +
          `<p>Click the button below to enter your owner cabinet. This link expires in ${TOKEN_TTL_MINUTES} minutes.</p>` +
          `<p style="margin:24px 0;"><a href="${link}" style="display:inline-block;padding:14px 28px;background:#10b981;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">Open owner cabinet</a></p>` +
          '<p style="color:#6b7280;font-size:14px;">If you did not request this link, you can safely ignore this email.</p>' +
          '</div>',
      })
      console.log(`owner magic link sent to user ${user.id}`)
    } catch (mailErr) {
      console.error('owner magic link send failed:', mailErr)
    }
  } catch (e) {
    console.error('owner auth request failed:', e)
  }

  return NextResponse.json({ ok: true })
}
