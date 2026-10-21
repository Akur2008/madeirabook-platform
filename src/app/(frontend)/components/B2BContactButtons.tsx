import React from 'react'

const WA_BASE = 'https://wa.me/79626854685'

const BTN =
  'inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-white/40'

export default function B2BContactButtons({
  whatsappMessage,
}: {
  whatsappMessage: string
}) {
  const waUrl = `${WA_BASE}?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <div className="mt-6">
      <p className="text-center text-xs uppercase tracking-wider text-white/40">
        Or contact us directly
      </p>
      <div className="mt-3 flex gap-3">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={BTN}
        >
          WhatsApp
        </a>
        <a href="mailto:hello@madeirabook.com" className={BTN}>
          Email
        </a>
      </div>
    </div>
  )
}
