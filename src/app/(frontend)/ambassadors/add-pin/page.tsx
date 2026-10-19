import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import AddPinForm from './AddPinForm'

export const metadata: Metadata = {
  title: 'Add your spot — Madeirabook Ambassador',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const
const TOKEN_RE = /^[a-f0-9]{32}$/

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

export default async function AddPinPage(props: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token: urlToken } = await props.searchParams
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get('ambassador_token')?.value
  const token =
    typeof urlToken === 'string' && TOKEN_RE.test(urlToken)
      ? urlToken
      : cookieToken && TOKEN_RE.test(cookieToken)
        ? cookieToken
        : null

  if (!token) {
    return (
      <Shell>
        <h1 className="text-center text-3xl font-medium" style={SERIF}>
          Invalid link.
        </h1>
        <p className="mt-4 text-center text-sm text-white/60">
          Open this page from your ambassador invitation link, or write to{' '}
          <a href="mailto:hello@madeirabook.com" className="underline">
            hello@madeirabook.com
          </a>
          .
        </p>
      </Shell>
    )
  }

  const payload = await getPayload({ config: await config })
  const { docs } = await payload.find({
    collection: 'referrals',
    where: { invitationToken: { equals: token } },
    limit: 1,
    depth: 0,
  })
  const referral = docs[0]
  if (!referral) {
    return (
      <Shell>
        <h1 className="text-center text-3xl font-medium" style={SERIF}>
          Invalid link.
        </h1>
        <p className="mt-4 text-center text-sm text-white/60">
          This invitation link is no longer valid. Questions?{' '}
          <a href="mailto:hello@madeirabook.com" className="underline">
            hello@madeirabook.com
          </a>
        </p>
      </Shell>
    )
  }

  const displayName = referral.displayName || referral.creatorName

  return (
    <Shell>
      <h1
        className="text-center text-4xl font-medium tracking-tight"
        style={SERIF}
      >
        Add your own spot.
      </h1>
      <p className="mt-4 text-center text-sm text-white/60">
        {displayName}, share a hidden gem for your map — we review every spot
        before it goes live.
      </p>
      <div className="mt-8">
        <AddPinForm token={token} />
      </div>
    </Shell>
  )
}
