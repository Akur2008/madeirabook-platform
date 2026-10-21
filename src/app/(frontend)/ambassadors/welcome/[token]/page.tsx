import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'
import Stripe from 'stripe'

import config from '@payload-config'
import DigitalSignature from '@/components/DigitalSignature'
import { hasSignedAmbassadorTerms } from '@/lib/agreements'
import {
  fetchAmbassadorMapData,
  type AmbassadorMapData,
} from '@/lib/ambassador-map'
import { FEATURES } from '@/lib/features'
import ExploreMap from '../../../components/ExploreMap'
import AcceptInvite from './AcceptInvite'
import CopyLinkButton from './CopyLinkButton'
import EditPicks from './EditPicks'
import SetupPayouts from './SetupPayouts'

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
  'Share your link in bio.',
  'Post stories with your map.',
  'Get paid.',
]

type Spot = { id?: number | string; name?: string | null; slug?: string | null }

function spotsOf(list: unknown): Spot[] {
  if (!Array.isArray(list)) return []
  return list.filter(
    (item): item is Spot =>
      typeof item === 'object' && item !== null && Boolean((item as Spot).slug),
  )
}

function spotIdsOf(list: unknown): string[] {
  return spotsOf(list)
    .map((s) => s.id)
    .filter((id): id is number | string => id != null)
    .map(String)
}

function isExpired(iso: string | null | undefined): boolean {
  return iso ? Date.parse(iso) < Date.now() : false
}

// Read-only preview of the ambassador's own map — same ExploreMap the public
// /m/[code] page renders, incl. the gold Oasis pins (Coming Soon popups).
function MapPreview({
  mapData,
  displayName,
  avatarUrl,
  accentColor,
  refCode,
}: {
  mapData: AmbassadorMapData
  displayName: string
  avatarUrl?: string | null
  accentColor?: string | null
  refCode: string
}) {
  return (
    <div className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
        Your map — live preview
      </p>
      <div className="mt-3 h-[420px] overflow-hidden rounded-xl border border-white/10">
        <ExploreMap
          properties={[]}
          beaches={mapData.beaches}
          restaurants={mapData.restaurants}
          ambassadorPins={mapData.pins}
          oasisStays={mapData.oasisStays}
          refCode={refCode}
          ambassador={{ displayName, avatarUrl, accentColor }}
        />
      </div>
      <p className="mt-2 text-center text-xs text-white/40">
        Gold ★ pins are Madeira Oasis hotels — read-only preview, booking opens
        soon.
      </p>
    </div>
  )
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
  searchParams: Promise<{ stripe?: string }>
}) {
  const { token } = await props.params
  const { stripe: stripeReturn } = await props.searchParams
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'referrals',
    where: { invitationToken: { equals: token } },
    limit: 1,
    depth: 1,
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

  // Referrals store only the Stripe account id — charges_enabled is
  // fetched live so this page is always the source of truth for payouts.
  let stripeChargesEnabled = false
  if (referral.stripeAccountId && process.env.STRIPE_SECRET_KEY) {
    try {
      const account = await new Stripe(
        process.env.STRIPE_SECRET_KEY,
      ).accounts.retrieve(referral.stripeAccountId)
      stripeChargesEnabled = Boolean(account.charges_enabled)
    } catch (e) {
      console.warn(`welcome/${token}: Stripe account retrieve failed`, e)
    }
  }

  const payoutBlock = !referral.stripeAccountId ? (
    <p className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4 text-center text-sm text-white/60">
      Stripe account not created yet — contact{' '}
      <a href="mailto:hello@madeirabook.com" className="underline">
        hello@madeirabook.com
      </a>
    </p>
  ) : stripeChargesEnabled ? (
    <p className="mt-8 rounded-full border border-green-500/40 bg-green-500/10 px-4 py-2 text-center text-xs font-semibold uppercase tracking-widest text-green-400">
      ✅ Payouts active
    </p>
  ) : (
    <div className="mt-8">
      <SetupPayouts token={token} />
      <p className="mt-2 text-center text-xs text-white/40">
        {stripeReturn === 'done'
          ? 'Details submitted — Stripe is reviewing your account.'
          : 'Takes ~5 minutes. A fresh link is generated on every click, so it never expires.'}
      </p>
    </div>
  )

  if (referral.invitationUsedAt) {
    const mapData = await fetchAmbassadorMapData(payload, referral)
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
        <MapPreview
          mapData={mapData}
          displayName={displayName}
          avatarUrl={referral.avatarUrl}
          accentColor={referral.accentColor}
          refCode={code}
        />
        {payoutBlock}
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

  if (!(await hasSignedAmbassadorTerms(payload, referral.id))) {
    return (
      <Shell>
        <h1 className="text-center text-4xl font-medium tracking-tight" style={SERIF}>
          Almost there, {displayName}.
        </h1>
        <p className="mt-4 text-center text-sm text-white/60">
          Review and sign the Ambassador Terms to unlock your guide.
        </p>
        <div className="mt-8">
          <DigitalSignature
            documentType="ambassador_terms"
            token={token}
            redirectTo={`/ambassadors/welcome/${token}`}
          />
        </div>
      </Shell>
    )
  }

  // Options for the "Edit my picks" modal — published madeirabook spots only.
  // Oasis hotels live in the `properties` collection (brand='madeiraoasis'),
  // so beaches/restaurants lists can never contain them.
  const [{ docs: beachDocs }, { docs: restaurantDocs }] = await Promise.all([
    payload.find({
      collection: 'beaches',
      where: { status: { equals: 'published' } },
      sort: 'name',
      limit: 200,
      depth: 0,
    }),
    payload.find({
      collection: 'restaurants',
      where: { status: { equals: 'published' } },
      sort: 'name',
      limit: 200,
      depth: 0,
    }),
  ])
  const beachOptions = beachDocs.map((d) => ({ id: String(d.id), name: d.name }))
  const restaurantOptions = restaurantDocs.map((d) => ({
    id: String(d.id),
    name: d.name,
  }))

  const mapData = await fetchAmbassadorMapData(payload, referral)
  const oasisPreview =
    FEATURES.ambassadorOasisAccess || referral.oasisAccess === true

  return (
    <Shell>
      {oasisPreview && (
        <p className="mb-6 rounded-full border border-[#d4af37]/50 bg-[#d4af37]/10 px-4 py-2 text-center text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
          🌟 Oasis Access — Premium Collection
        </p>
      )}
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
          Your map link
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="break-all font-mono text-sm text-white/80">
            madeirabook.com/m/{code}
          </p>
          <CopyLinkButton url={`https://madeirabook.com/m/${code}`} />
        </div>
        <p className="mt-4 text-sm text-white/60">
          Earn 2% from every booking made through your map.{' '}
          Discount code:{' '}
          <span className="font-mono font-semibold text-[#d4af37]">
            {code.toUpperCase()}
          </span>
        </p>
      </div>

      <MapPreview
        mapData={mapData}
        displayName={displayName}
        avatarUrl={referral.avatarUrl}
        accentColor={referral.accentColor}
        refCode={code}
      />

      {payoutBlock}

      {(spotsOf(referral.selectedBeaches).length > 0 ||
        spotsOf(referral.selectedRestaurants).length > 0) && (
        <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Your curated spots
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {spotsOf(referral.selectedBeaches).map((b) => (
              <li key={`b-${b.slug}`}>
                <a
                  href={`/beaches/${b.slug}`}
                  target="_blank"
                  rel="noopener"
                  className="transition-colors hover:text-[#d4af37]"
                >
                  🏖️ {b.name}
                </a>
              </li>
            ))}
            {spotsOf(referral.selectedRestaurants).map((r) => (
              <li key={`r-${r.slug}`}>
                <a
                  href={`/restaurants/${r.slug}`}
                  target="_blank"
                  rel="noopener"
                  className="transition-colors hover:text-[#d4af37]"
                >
                  🍽️ {r.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 space-y-3">
        <EditPicks
          token={token}
          beaches={beachOptions}
          restaurants={restaurantOptions}
          initialBeachIds={spotIdsOf(referral.selectedBeaches)}
          initialRestaurantIds={spotIdsOf(referral.selectedRestaurants)}
        />
        <div>
          <a
            href={`/ambassadors/add-pin?token=${token}`}
            className="block w-full rounded-md border border-[#d4af37]/50 bg-[#d4af37]/10 px-4 py-4 text-center text-sm font-semibold text-[#d4af37] transition-colors hover:bg-[#d4af37]/20"
          >
            ➕ Add your own spot
          </a>
          <p className="mt-2 text-center text-xs text-white/40">
            Share a hidden gem — it will appear on your map after a quick review.
          </p>
        </div>
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
