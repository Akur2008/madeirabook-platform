import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Same dark page style as /links and /booking-success (#0a1420, Cormorant
// Garamond) — 1:1 port of core routes/unsubscribe.js.
function page(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Madeirabook</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
           background: #0a1420; color: #e5e7eb; font-family: 'Cormorant Garamond', Georgia, serif; }
    .card { max-width: 480px; padding: 48px 32px; text-align: center; }
    h1 { font-weight: 500; font-size: 32px; margin: 0 0 16px; color: #f3f4f6; }
    p { font-size: 19px; line-height: 1.6; color: #9ca3af; margin: 0 0 24px; }
    a { color: #10b981; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <p><a href="/">Back to Madeirabook</a></p>
  </div>
</body>
</html>`
}

function html(body: string, status = 200): NextResponse {
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

type UnsubResult = 'done' | 'already' | 'not_found'

async function unsubscribeByToken(token: string): Promise<UnsubResult> {
  const payload = await getPayload({ config: await config })
  const found = await payload.find({
    collection: 'subscribers',
    where: { unsubscribeToken: { equals: token } },
    limit: 1,
    depth: 0,
  })
  const doc = found.docs[0]
  if (!doc) return 'not_found'
  if (doc.unsubscribedAt) return 'already'
  await payload.update({
    collection: 'subscribers',
    id: doc.id,
    data: {
      unsubscribedAt: new Date().toISOString(),
      status: 'unsubscribed',
    },
  })
  return 'done'
}

// GET — click on the link in an email.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  try {
    const result = await unsubscribeByToken(token)
    if (result === 'not_found') {
      return html(
        page('Not found', 'This unsubscribe link is invalid or has expired.'),
        404,
      )
    }
    if (result === 'already') {
      return html(
        page(
          'Already unsubscribed',
          "You're already unsubscribed from Madeirabook emails.",
        ),
      )
    }
    return html(
      page('Unsubscribed', "You've been unsubscribed from Madeirabook emails."),
    )
  } catch (e) {
    console.error('unsubscribe failed', e)
    return html(
      page('Error', 'Something went wrong. Please try again later.'),
      500,
    )
  }
}

// POST — one-click unsubscribe for Gmail/Apple Mail (List-Unsubscribe-Post).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  try {
    const result = await unsubscribeByToken(token)
    if (result === 'not_found') {
      return NextResponse.json(
        { ok: false, error: 'not_found' },
        { status: 404 },
      )
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('unsubscribe failed', e)
    return NextResponse.json({ ok: false, error: 'error' }, { status: 500 })
  }
}
