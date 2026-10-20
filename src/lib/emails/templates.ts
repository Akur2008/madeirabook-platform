// Templates for the email-queue collection (1:1 port of core emails/templates.js).
// Each is (subscriber) => { subject, html, text }.
// subscriber is a subscribers doc — at minimum { email, unsubscribeToken }.

const APP_URL = process.env.APP_URL || 'https://www.madeirabook.com'

export interface EmailQueueSubscriber {
  email: string
  unsubscribeToken?: string | null
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export function unsubscribeUrl(token: string | null | undefined): string {
  return `${APP_URL}/api/unsubscribe/${token}`
}

function unsubscribeFooter(token: string | null | undefined): string {
  return `
    <p style="color: #6b7280; font-size: 11px; margin-top: 32px; line-height: 1.5;">
      You received this email because you subscribed at madeirabook.com.<br>
      <a href="${unsubscribeUrl(token)}" style="color: #6b7280; text-decoration: underline;">
        Unsubscribe
      </a>
    </p>
  `
}

const BTN =
  'display:inline-block;padding:14px 28px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;'

function wrapper(
  posterUrl: string | null,
  title: string,
  bodyText: string,
  ctaText: string,
  ctaUrl: string,
  token: string | null | undefined,
): string {
  const poster = posterUrl
    ? '<img src="' + posterUrl + '" alt="" style="width:100%;max-width:600px;border-radius:12px;display:block;margin-bottom:20px;">'
    : ''
  return (
    '<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1f2937;background:#fff;padding:20px;">' +
    poster +
    '<h2 style="color:#064e3b;font-size:24px;margin:0 0 16px 0;">' +
    title +
    '</h2>' +
    bodyText +
    '<p style="margin:24px 0;"><a href="' +
    ctaUrl +
    '" style="' +
    BTN +
    '">' +
    ctaText +
    '</a></p>' +
    '<p style="color:#9ca3af;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;">' +
    'Madeirabook · <a href="https://www.madeirabook.com" style="color:#9ca3af;">madeirabook.com</a><br>' +
    'You are receiving this because you subscribed to our guide.' +
    '</p>' +
    unsubscribeFooter(token) +
    '</div>'
  )
}

export const templates: Record<
  string,
  (subscriber: EmailQueueSubscriber) => RenderedEmail
> = {
  // Sent immediately on subscribe (not via email-queue). The PDF guide is
  // attached by the caller — 1:1 port of core routes/subscribe.js.
  welcome: (subscriber) => ({
    subject: 'Your Madeira Travel Guide 🌴',
    text:
      'Thanks for subscribing! Your Madeira travel guide is attached.\n\n' +
      'Follow us on Instagram @madeirabook\n\n' +
      'Unsubscribe: ' +
      unsubscribeUrl(subscriber.unsubscribeToken),
    html:
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">' +
      '<h2 style="color: #064e3b;">Thanks for subscribing!</h2>' +
      '<p>Your Madeira travel guide is attached to this email.</p>' +
      '<p style="margin: 24px 0;">Follow us on Instagram @madeirabook</p>' +
      '<p style="color: #6b7280; font-size: 14px;">Inside you\'ll find restaurant discounts of 30–50%, flight price alerts, and other useful guides for your trip to Madeira.</p>' +
      '<p style="color: #6b7280; font-size: 14px;">— The Madeirabook team</p>' +
      unsubscribeFooter(subscriber.unsubscribeToken) +
      '</div>',
  }),

  gateway_ocean_reactivation: (subscriber) => ({
    subject: 'We saved you a way in',
    text: "You left us your email a while back. We haven't forgotten. Here's the entrance to four elements of Madeira: https://www.madeirabook.com/gateway/ocean",
    html: wrapper(
      null,
      'We saved you a way in',
      "<p>You left us your email a while back. We haven't forgotten.</p>" +
        "<p>Since then we've built something quiet — four ways into the island, each one tuned to a different mood.</p>" +
        '<p>Two questions. Then we show you the sea, the forest, the sun, or the wild north. Your choice.</p>',
      'Find your element →',
      'https://www.madeirabook.com/gateway/ocean?utm_source=email&utm_campaign=reactivation',
      subscriber.unsubscribeToken,
    ),
  }),

  gateway_ocean: (subscriber) => ({
    subject: "The ocean doesn't ask questions — but you do",
    text: 'Two questions. Then we show you the sea. Click to enter: https://www.madeirabook.com/gateway/ocean',
    html: wrapper(
      null,
      "The ocean doesn't ask questions",
      '<p>But you do. And we have answers.</p>' +
        '<p>Two questions. Then we show you the sea.</p>' +
        '<p>Which element of Madeira is yours — the wild ocean, the misty forest, the sun on the basalt, or the waterfalls of the north?</p>',
      'Enter the gateway →',
      'https://www.madeirabook.com/gateway/ocean?utm_source=email&utm_campaign=gateway_ocean',
      subscriber.unsubscribeToken,
    ),
  }),

  restaurants_funchal: (subscriber) => ({
    subject: '5 restaurants in Funchal with 30–50% off',
    text: 'Inside: 5 restaurants in Funchal with TheFork discounts. Click to see the guide.',
    html: wrapper(
      null,
      '5 restaurants in Funchal — 30–50% off',
      '<p>Funchal has a secret: TheFork discounts. We collected 5 places where dinner costs 30–50% less than the menu price.</p>' +
        '<p>All within a 15-minute walk from the Lido.</p>',
      'See the guide →',
      'https://www.madeirabook.com/where-to-eat-madeira.html?utm_source=email&utm_campaign=restaurants_funchal',
      subscriber.unsubscribeToken,
    ),
  }),

  madeira_winter: (subscriber) => ({
    subject: 'Madeira in winter: +20°C while Europe freezes',
    text: 'While London has -5°C, Madeira has +20°C. Flights from €27.',
    html: wrapper(
      null,
      'Madeira in winter: +20°C',
      '<p>While Europe freezes, Madeira stays warm. January average: +20°C. Ocean: +18°C (swimmable).</p>' +
        '<p>Flights from London: from €27. Fewer tourists than summer — 3× less.</p>' +
        '<p>The best time to come is exactly when everyone else is at home.</p>',
      'See winter guide →',
      'https://www.madeirabook.com/best-time-to-visit-madeira.html?utm_source=email&utm_campaign=madeira_winter',
      subscriber.unsubscribeToken,
    ),
  }),

  return_offer: (subscriber) => ({
    subject: 'The apartments you saw — 10% off for you',
    text: 'Three ocean-view apartments in Funchal. Direct booking, no platform fees.',
    html: wrapper(
      null,
      'Three apartments. One ocean.',
      '<p>Direct booking, no platform fees, and 10% off for our subscribers.</p>' +
        '<p>303 — studio, 3rd floor, ocean view.<br>' +
        '607 — studio, 6th floor, ocean view.<br>' +
        'Penthouse — top floor, panoramic terrace.</p>',
      'See availability →',
      'https://www.madeirabook.com/?utm_source=email&utm_campaign=return_offer',
      subscriber.unsubscribeToken,
    ),
  }),
}

// Private invitation for an approved ambassador. Sent directly (not via the
// email queue) from the Applications afterChange hook.
export function ambassadorInvitation(opts: {
  displayName: string
  token: string
}): RenderedEmail {
  const name = opts.displayName.split(/['\s]/)[0] || opts.displayName
  const nameHtml = name.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
  const inviteUrl = `https://www.madeirabook.com/ambassadors/welcome/${opts.token}`

  const text =
    `Hi ${name},\n\n` +
    'Thanks for applying. We reviewed your profile and would love to have you onboard as one of our 10 launch ambassadors.\n\n' +
    `Your private invitation link (expires in 7 days):\n${inviteUrl}\n\n` +
    "Here's what's inside:\n" +
    '- Your branded Madeira map (with your name, your accent color)\n' +
    '- Curated beaches, restaurants, viewpoints\n' +
    '- 2% commission from every booking through your link\n' +
    '- Ready-made banners for Reels/Stories\n\n' +
    'After you accept, we build your map within 24 hours.\n\n' +
    'Welcome aboard,\nAndrei\nMadeirabook'

  const html =
    '<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1f2937;background:#fff;padding:20px;">' +
    '<h2 style="color:#064e3b;font-size:24px;margin:0 0 16px 0;">You\'re invited to Madeirabook Ambassadors</h2>' +
    `<p>Hi ${nameHtml},</p>` +
    '<p>Thanks for applying. We reviewed your profile and would love to have you onboard as one of our 10 launch ambassadors.</p>' +
    '<p>Your private invitation link (expires in 7 days):</p>' +
    `<p style="margin:24px 0;"><a href="${inviteUrl}" style="${BTN}">Accept your invitation →</a></p>` +
    '<p>Here\'s what\'s inside:</p>' +
    '<ul style="padding-left:20px;line-height:1.7;">' +
    '<li>Your branded Madeira map (with your name, your accent color)</li>' +
    '<li>Curated beaches, restaurants, viewpoints</li>' +
    '<li>2% commission from every booking through your link</li>' +
    '<li>Ready-made banners for Reels/Stories</li>' +
    '</ul>' +
    '<p>After you accept, we build your map within 24 hours.</p>' +
    '<p>Welcome aboard,<br>Andrei<br>Madeirabook</p>' +
    '<p style="color:#9ca3af;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;">' +
    'Madeirabook · <a href="https://www.madeirabook.com" style="color:#9ca3af;">madeirabook.com</a><br>' +
    'You are receiving this because you applied to the ambassador program.' +
    '</p>' +
    '</div>'

  return { subject: "You're invited to Madeirabook Ambassadors", html, text }
}

// Acceptance email sent to the ambassador right after approval. Carries the
// live map link. Payout setup always goes through the ambassador page —
// Stripe onboarding links expire within minutes, so we never embed one.
export function ambassadorAccepted(opts: {
  displayName: string
  code: string
  stripeAccountReady: boolean
  inviteUrl: string
}): RenderedEmail {
  const name = opts.displayName.split(/['\s]/)[0] || opts.displayName
  const nameHtml = name.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
  const mapUrl = `https://www.madeirabook.com/m/${opts.code}`

  const stripeBlock = opts.stripeAccountReady
    ? `<p style="margin:24px 0;"><a href="${opts.inviteUrl}" style="${BTN}">Set up payouts (Stripe) →</a></p>` +
      '<p style="color:#6b7280;font-size:13px;">Takes ~5 minutes. Payouts land monthly, on the 1st. The link is always valid — a fresh Stripe session opens on every click.</p>'
    : '<p style="color:#6b7280;font-size:13px;">We are setting up your payout account — expect a separate email with the Stripe link shortly.</p>'

  const text =
    `Hi ${name},\n\n` +
    "You're accepted to Madeirabook Ambassadors.\n\n" +
    `Your map: ${mapUrl}\n` +
    `Sign the Ambassador Terms: ${opts.inviteUrl}\n` +
    (opts.stripeAccountReady
      ? `Click here to set up payouts (link is always valid): ${opts.inviteUrl}\n`
      : 'We are setting up your payout account — expect a separate email with the Stripe link shortly.\n') +
    '\nShare your link. Earn 2% on every booking. Get paid monthly.\n\n' +
    'Welcome aboard,\nAndrei\nMadeirabook'

  const html =
    '<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1f2937;background:#fff;padding:20px;">' +
    '<h2 style="color:#064e3b;font-size:24px;margin:0 0 16px 0;">You\'re accepted to Madeirabook Ambassadors</h2>' +
    `<p>Hi ${nameHtml},</p>` +
    '<p>Your application was approved. Two steps left:</p>' +
    `<p><b>1. Your map:</b> <a href="${mapUrl}" style="color:#064e3b;">${mapUrl}</a><br>` +
    `<b>2. Sign the Ambassador Terms:</b> <a href="${opts.inviteUrl}" style="color:#064e3b;">${opts.inviteUrl}</a></p>` +
    stripeBlock +
    '<p style="border-left:3px solid #10b981;padding-left:12px;color:#374151;">' +
    'Share your link. Earn 2% on every booking. Get paid monthly.</p>' +
    '<p>Welcome aboard,<br>Andrei<br>Madeirabook</p>' +
    '<p style="color:#9ca3af;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;">' +
    'Madeirabook · <a href="https://www.madeirabook.com" style="color:#9ca3af;">madeirabook.com</a><br>' +
    'You are receiving this because you applied to the ambassador program.' +
    '</p>' +
    '</div>'

  return { subject: "You're accepted to Madeirabook Ambassadors", html, text }
}
