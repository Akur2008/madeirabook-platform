// Notifications for the Stripe webhook: Telegram (Bot API) and Resend.
// Both go through plain fetch — no extra dependencies. Missing env vars
// degrade to a skipped send, never to a thrown error in the caller path.

export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<{ ok: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { ok: false }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) {
    throw new Error(`Telegram ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }
  return { ok: true }
}

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

async function sendResendEmail(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Madeirabook <hello@madeirabook.com>',
      to,
      subject,
      html,
    }),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`)
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
    await sendResendEmail(
      apiKey,
      opts.guestEmail,
      `Booking confirmed - ${title}`,
      guestHtml,
    )
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
    await sendResendEmail(
      apiKey,
      opts.ownerEmail,
      `New booking - ${title}`,
      ownerHtml,
    )
    results.owner = true
  }

  return results
}
