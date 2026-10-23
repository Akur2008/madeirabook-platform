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
    version: 'v1.1',
    paragraphs: [
      'v1.1 — supersedes v1.0. Signatures collected under v1.0 remain valid.',
      '1. Parties and scope. These Ambassador Terms ("Terms") form an agreement between Madeirabook ("we", "us", "the Platform") and the individual approved as a Madeirabook ambassador ("you", "the Ambassador"). They govern your participation in the Madeirabook ambassador programme, including your personal guide page ("Map"), referral link, referral code and any associated promotional materials.',
      '2. The programme. Approved ambassadors receive a personal Map at madeirabook.com/m/{code}, a referral link and a referral code. When a guest completes an eligible booking that is attributed to your code or link, you earn a commission as described below.',
      '3. Commission. You earn 2% of the net booking total (excluding taxes, fees and refunds) on qualifying bookings attributed to your referral code or link, confirmed through our attribution system. A booking qualifies when it is completed and paid, the guest stay has taken place, and it is not cancelled, refunded or charged back. Bookings you make for yourself (self-referrals) do not qualify.',
      '4. Attribution. Attribution is based on the referral code at checkout and a tracked referral cookie, on a last-click basis within the cookie lifetime stated on the platform. We record attribution in good faith; our records are the reference in case of dispute, subject to correction of manifest errors.',
      '5. Payouts. Commissions accrue after the guest stay is completed and are paid monthly, on or around the 1st of each month, via Stripe Connect to the Stripe Express account you set up during onboarding. You are responsible for completing Stripe onboarding, keeping your payout details current, and for any taxes due on your earnings under your local law. We may withhold or reverse payouts for cancelled, refunded, fraudulent or disputed bookings.',
      '6. Your obligations. You agree to present Madeirabook honestly and accurately; to disclose the commercial relationship where required by applicable advertising and consumer-protection rules (e.g. #ad or local equivalent); not to make misleading claims about prices, discounts or availability; and not to bid on Madeirabook brand terms in paid ads, place your code on coupon sites, or use spam, bots or purchased traffic.',
      '7. Brand use. We grant you a limited, non-exclusive, revocable right to use the Madeirabook name and provided materials solely to promote your Map while you are in the programme. No other use of our brand is permitted without written consent.',
      '8. Content License.',
      '8.1. By signing this agreement, the Ambassador grants Madeirabook and Madeira Oasis a worldwide, non-exclusive, royalty-free, perpetual license to use, reproduce, modify, distribute, and publicly display any content (videos, photographs, reels, stories, and other media) that the Ambassador shares with Madeirabook or publishes on their social media accounts in connection with the Ambassador Program.',
      '8.2. This content may be used in Madeirabook and Madeira Oasis marketing materials, on the websites, in interactive maps, in social media, in advertising, and in any other promotional channels, without additional payment beyond the 2% commission specified in Section 3.',
      '8.3. Attribution: Madeirabook will credit the Ambassador by name (their Instagram handle) on their branded map. No other attribution link is required.',
      '8.4. The Ambassador may revoke this license in writing at any time. Upon revocation, Madeirabook will stop using the content within 30 days. Content already published may remain.',
      '8.5. This license applies only to content created by the Ambassador themselves. Third-party content requires separate licensing.',
      '9. Data protection. We process your personal data (name, email, social handle, payout details) to run the programme, in line with our Privacy Policy and applicable GDPR obligations. Stripe processes your payout data under its own terms.',
      '10. Term and termination. Either party may end participation at any time with written notice. We may suspend or remove you immediately for breach of these Terms, fraud, or conduct harming the Madeirabook brand. On termination, accrued qualifying commissions are paid on the next monthly payout cycle; non-qualifying or fraudulent commissions are voided.',
      '11. Liability. The programme is provided "as is". We are not liable for indirect or consequential losses, or for downtime of tracking, maps or third-party services. Nothing in these Terms limits liability that cannot be limited by law.',
      '12. Changes. We may update these Terms with notice to your registered email. Continued participation after the notice period constitutes acceptance. If you do not agree, you may terminate under clause 10.',
      '13. Governing law. These Terms are governed by the laws of Portugal, without regard to conflict-of-law rules. Disputes are subject to the courts of Funchal, Madeira, unless mandatory consumer-protection law provides otherwise.',
      'By typing your name and signing below, you confirm that you have read, understood and agree to these Ambassador Terms.',
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
          className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#10b981]"
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
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#10b981] [color-scheme:dark]"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-white/80">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#10b981]"
          />
          I have read and agree to the {doc.title}.
        </label>

        <button
          type="submit"
          disabled={!canSubmit || state === 'signing'}
          className="w-full rounded-lg bg-[#10b981] py-3 font-semibold text-[#0a1420] transition-opacity hover:opacity-90 disabled:opacity-50"
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
