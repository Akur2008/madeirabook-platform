import type { Metadata } from 'next'
import React from 'react'

import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Owner sign in — Madeirabook',
  robots: { index: false, follow: false },
}

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

export default async function OwnerLoginPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const searchParams = await props.searchParams
  const expired = searchParams.expired === '1'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0a1420] px-6 text-white">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-medium" style={SERIF}>
          Owner Cabinet
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Enter the email you signed up with. We will send you a one-time login
          link.
        </p>
        {expired && (
          <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            Link expired or invalid. Request a new one below.
          </div>
        )}
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-white/40">
          Madeirabook — Local community for Madeira stays
        </p>
      </div>
    </div>
  )
}
