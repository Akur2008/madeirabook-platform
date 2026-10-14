// Notifications for the Stripe webhook and subscribe flow via Resend.
// Plain fetch — no extra dependencies. Missing env vars degrade to a
// skipped send, never to a thrown error in the caller path.

function escHtml(s: unknown): string {
  if (s == null) return ''
  return String(s).replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return map[c] ?? c
  })
}

function fmtEuro(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(Number(cents))) return '-'
  return `${(Number(cents) / 100).toFixed(2)} EUR`
}

export interface BookingPaidEmailOptions {
  guestEmail?: string | null
  ownerEmail?: string | null
  propertyTitle?: string
  arrivalDate?: string
  departureDate?: string
  amountCents?: number
  platformFeeCents?: number
}

export interface ResendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  headers?: Record<string, string>
  attachments?: { filename: string; content: string }[]
}

export async function sendResendEmail(
  apiKey: string,
  opts: ResendEmailOptions,
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Madeirabook <hello@madeirabook.com>',
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.text ? { text: opts.text } : {}),
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      ...(opts.headers ? { headers: opts.headers } : {}),
      ...(opts.attachments?.length ? { attachments: opts.attachments } : {}),
    }),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }
}

// Admin alert over email (replaces the Telegram admin channel, dropped
// 14.10.2026). Never throws — failures are logged only.
export async function sendAdminAlert(
  subject: string,
  body: string,
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || !process.env.RESEND_API_KEY) return
  try {
    await sendResendEmail(process.env.RESEND_API_KEY, {
      to: adminEmail,
      subject: `[Madeirabook Admin] ${subject}`,
      html: `<pre style="font-family: monospace; white-space: pre-wrap;">${body}</pre>`,
    })
    console.log(`sendAdminAlert: sent to ${adminEmail} — ${subject}`)
  } catch (e) {
    console.error('sendAdminAlert failed:', e)
  }
}

// Payment confirmation to the guest (plus a notification to the property
// owner when known). Simplified port of core emailNotify.sendBookingPaid.
export async function sendBookingPaidEmail(
  opts: BookingPaidEmailOptions,
): Promise<{ guest: boolean; owner: boolean }> {
  const apiKey = process.env.RESEND_API_KEY
  const results = { guest: false, owner: false }
  if (!apiKey) return results

  const title = opts.propertyTitle || 'the property'
  const dates = `${escHtml(opts.arrivalDate || '-')} &rarr; ${escHtml(opts.departureDate || '-')}`

  if (opts.guestEmail) {
    const guestHtml =
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">' +
      '<h2 style="color:#064e3b;">Booking confirmed</h2>' +
      '<p>Hi,</p>' +
      `<p>Your booking for <b>${escHtml(title)}</b> is confirmed.</p>` +
      `<p><b>Dates:</b> ${dates}<br>` +
      `<b>Amount paid:</b> ${fmtEuro(opts.amountCents)}</p>` +
      '<p>If you have questions, reply to this email.</p>' +
      '<p style="color:#6b7280;font-size:14px;">- The Madeirabook team</p>' +
      '</div>'
    await sendResendEmail(apiKey, {
      to: opts.guestEmail,
      subject: `Booking confirmed - ${title}`,
      html: guestHtml,
    })
    results.guest = true
  }

  if (opts.ownerEmail) {
    const netCents = (opts.amountCents ?? 0) - (opts.platformFeeCents ?? 0)
    const ownerHtml =
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">' +
      '<h2 style="color:#064e3b;">New booking</h2>' +
      `<p>You have a new paid booking for <b>${escHtml(title)}</b>.</p>` +
      `<p><b>Guest:</b> ${escHtml(opts.guestEmail || '-')}<br>` +
      `<b>Dates:</b> ${dates}<br>` +
      `<b>Amount:</b> ${fmtEuro(opts.amountCents)}<br>` +
      `<b>Platform fee:</b> ${fmtEuro(opts.platformFeeCents)}<br>` +
      `<b>Net to you:</b> ${fmtEuro(netCents)}</p>` +
      '<p style="color:#6b7280;font-size:14px;">- Madeirabook</p>' +
      '</div>'
    await sendResendEmail(apiKey, {
      to: opts.ownerEmail,
      subject: `New booking - ${title}`,
      html: ownerHtml,
    })
    results.owner = true
  }

  return results
}
