'use client'

import React, { useState } from 'react'

export type AgreementDocumentType = 'owner_terms' | 'ambassador_terms'

type State = 'idle' | 'signing' | 'done' | 'error'

const DOCUMENTS: Record<
  AgreementDocumentType,
  { title: string; version: string; paragraphs: string[] }
> = {
  owner_terms: {
    title: 'Owner Terms',
    version: 'v1.0',
    paragraphs: [
      'PLACEHOLDER — final legal text to be provided by counsel.',
      'These Owner Terms govern the relationship between Madeirabook and the property owner for listings managed through the Madeirabook platform, including the owner cabinet, calendar, rates and bookings tools.',
      'By signing, the owner confirms they are authorized to list the linked properties, that the information provided is accurate, and that bookings confirmed through the platform are honoured at the displayed rates.',
      'Madeirabook acts as the booking channel and payment facilitator. Commission, payout timing and Stripe Connect payout terms are defined in the owner onboarding materials and may be updated with notice.',
      'The owner is responsible for the property\'s legal compliance, safety standards and guest experience on site. Madeirabook may delist a property that repeatedly fails these obligations.',
      'Either party may terminate this agreement with 30 days written notice. Existing confirmed bookings are honoured or properly refunded under the cancellation policy.',
    ],
  },
  ambassador_terms: {
    title: 'Ambassador Terms',
    version: 'v1.0',
    paragraphs: [
      'PLACEHOLDER — final legal text to be provided by counsel.',
      'These Ambassador Terms govern participation in the Madeirabook ambassador programme, including the personal guide page, referral link and discount code issued to the ambassador.',
      'The ambassador earns a commission on qualifying bookings made through their referral link, at the rate shown on the welcome page. Commissions are paid out after the guest stay is completed.',
      'The ambassador agrees to present Madeirabook honestly, not to make misleading claims, and to disclose the commercial relationship where required by applicable advertising rules.',
      'Self-referrals, coupon-site distribution and paid ads bidding on the Madeirabook brand are not qualifying traffic and may lead to removal from the programme.',
      'Either party may end participation at any time with written notice. Accrued, qualifying commissions are paid out on the next payout cycle.',
    ],
  },
}

export default function DigitalSignature({
  documentType,
  token,
  redirectTo,
  onSigned,
}: {
  documentType: AgreementDocumentType
  /** Ambassador invitation token — proves identity for ambassador_terms. */
  token?: string
  /** Fallback navigation target when onSigned is not provided. */
  redirectTo?: string
  onSigned?: () => void
}) {
  const doc = DOCUMENTS[documentType]
  const [signedName, setSignedName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [signedDate, setSignedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')

  const canSubmit =
    signedName.trim().length >= 2 && agreed && Boolean(signedDate)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit || state === 'signing') return
    setError('')
    setState('signing')
    try {
      const res = await fetch('/api/agreements/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          token,
          signedName,
          agreed,
          signedDate,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setState('error')
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setState('done')
      if (onSigned) {
        onSigned()
      } else if (redirectTo) {
        window.location.assign(redirectTo)
      }
    } catch {
      setState('error')
      setError('Network error. Please try again.')
    }
  }

  if (state === 'done' && !onSigned && !redirectTo) {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6 text-center">
        <p className="text-lg font-semibold text-green-400">Signed.</p>
        <p className="mt-2 text-sm text-white/60">
          Your signature for the {doc.title} has been recorded.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          {doc.title}
        </p>
        <p className="font-mono text-xs text-white/40">{doc.version}</p>
      </div>

      <div className="mt-3 max-h-56 space-y-3 overflow-y-auto rounded-md border border-white/10 bg-[#0a1420]/60 p-4 text-sm leading-relaxed text-white/70">
        {doc.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <input
          type="text"
          required
          value={signedName}
          onChange={(e) => setSignedName(e.target.value)}
          placeholder="Type your full name to sign"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#d4af37]"
        />

        <div className="flex items-center gap-3">
          <label
            htmlFor={`signed-date-${documentType}`}
            className="shrink-0 text-xs text-white/50"
          >
            Date
          </label>
          <input
            id={`signed-date-${documentType}`}
            type="date"
            required
            value={signedDate}
            onChange={(e) => setSignedDate(e.target.value)}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#d4af37] [color-scheme:dark]"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-white/80">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#d4af37]"
          />
          I have read and agree to the {doc.title}.
        </label>

        <button
          type="submit"
          disabled={!canSubmit || state === 'signing'}
          className="w-full rounded-lg bg-[#d4af37] py-3 font-semibold text-[#0a1420] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state === 'signing' ? 'Signing…' : 'Sign & continue →'}
        </button>

        {state === 'error' && error && (
          <p className="text-sm text-red-300">{error}</p>
        )}
      </form>
    </div>
  )
}
