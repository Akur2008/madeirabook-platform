import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import DigitalSignature from '@/components/DigitalSignature'
import { hasSignedOwnerTerms } from '@/lib/agreements'
import { getCurrentOwner } from '@/lib/ownerAuth'

export const metadata: Metadata = {
  title: 'Owner Terms — Madeirabook',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export default async function OwnerAgreementPage() {
  const owner = await getCurrentOwner()
  if (!owner) redirect('/owner/login')

  const payload = await getPayload({ config: await config })
  if (await hasSignedOwnerTerms(payload, owner.id)) redirect('/owner')

  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />
      <div className="mx-auto max-w-md px-6 py-12">
        <h1 className="text-3xl font-medium" style={SERIF}>
          One step left.
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Review and sign the Owner Terms to open your cabinet.
        </p>
        <div className="mt-8">
          <DigitalSignature documentType="owner_terms" redirectTo="/owner" />
        </div>
        <p className="mt-6 text-center text-xs text-white/40">
          Signed in as {owner.email}
        </p>
      </div>
    </div>
  )
}
