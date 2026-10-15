import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import AcceptInvite from './AcceptInvite'

export const metadata: Metadata = {
  title: 'Madeirabook — Ambassador invitation',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const PERKS = [
  {
    title: 'Your branded Madeira map',
    text: 'With your name and your accent color.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
        <path d="M9 4v14M15 6v14" />
      </svg>
    ),
  },
  {
    title: 'Curated island picks',
    text: 'Beaches, restaurants, viewpoints.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    title: '2% commission',
    text: 'From every booking through your link.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M19 5 5 19" />
        <circle cx="7" cy="7" r="2.5" />
        <circle cx="17" cy="17" r="2.5" />
      </svg>
    ),
  },
  {
    title: 'Ready-made banners',
    text: 'For Reels and Stories.',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m3 16 5-5 4 4 3-3 6 6" />
      </svg>
    ),
  },
]

const NEXT_STEPS = [
  'Accept this invitation and connect payouts.',
  'We build your map within 24 hours.',
  'Share your links and earn 2% on every booking.',
]

function isExpired(iso: string | null | undefined): boolean {
  return iso ? Date.parse(iso) < Date.now() : false
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />
      <div className="mx-auto max-w-md px-6 py-12">{children}</div>
    </div>
  )
}

export default async function WelcomePage(props: {
  params: Promise<{ token: string }>
}) {
  const { token } = await props.params
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'referrals',
    where: { invitationToken: { equals: token } },
    limit: 1,
    depth: 0,
  })

  const referral = docs[0]
  if (!referral) notFound()

  const displayName = referral.displayName || referral.creatorName
  const code = referral.code
  const expiresAt = referral.invitationExpiresAt
    ? new Date(referral.invitationExpiresAt)
    : null
  const expiryLabel = expiresAt?.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (referral.invitationUsedAt) {
    return (
      <Shell>
        <h1 className="text-center text-3xl font-medium" style={SERIF}>
          Already accepted.
        </h1>
        <p className="mt-4 text-center text-sm text-white/60">
          This invitation for {displayName} has already been claimed. Questions?{' '}
          <a href="mailto:hello@madeirabook.com" className="underline">
            hello@madeirabook.com
          </a>
        </p>
      </Shell>
    )
  }

  if (isExpired(referral.invitationExpiresAt)) {
    return (
      <Shell>
        <h1 className="text-center text-3xl font-medium" style={SERIF}>
          Invitation expired.
        </h1>
        <p className="mt-4 text-center text-sm text-white/60">
          This link expired on {expiryLabel}. Write to{' '}
          <a href="mailto:hello@madeirabook.com" className="underline">
            hello@madeirabook.com
          </a>{' '}
          and we&apos;ll send a new one.
        </p>
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="text-center text-4xl font-medium tracking-tight" style={SERIF}>
        Welcome, {displayName}.
      </h1>
      <p className="mt-4 text-center text-xl text-white/80" style={SERIF}>
        Here&apos;s your Madeira guide.
      </p>

      <div className="mt-10 space-y-3">
        {PERKS.map((perk) => (
          <div
            key={perk.title}
            className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <span className="mt-0.5 text-[#d4af37]">{perk.icon}</span>
            <div>
              <p className="text-sm font-semibold">{perk.title}</p>
              <p className="mt-0.5 text-sm text-white/60">{perk.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Your personal links
        </p>
        <p className="mt-3 break-all font-mono text-sm text-white/80">
          madeirabook.com/map?ref={code}
        </p>
        <p className="mt-2 break-all font-mono text-sm text-white/80">
          madeirabook.com/links?ref={code}
        </p>
        <p className="mt-4 text-sm text-white/60">
          Discount code:{' '}
          <span className="font-mono font-semibold text-[#d4af37]">
            {code.toUpperCase()}
          </span>
        </p>
      </div>

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          What&apos;s next
        </p>
        <ol className="mt-3 space-y-3">
          {NEXT_STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-sm text-white/80">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#d4af37]/50 text-xs text-[#d4af37]"
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10">
        <AcceptInvite token={token} />
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-white/40">
        This invitation expires on {expiryLabel}. Questions?{' '}
        <a href="mailto:hello@madeirabook.com" className="underline">
          hello@madeirabook.com
        </a>
      </p>
    </Shell>
  )
}
