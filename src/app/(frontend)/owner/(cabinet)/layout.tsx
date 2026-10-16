import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentOwner } from '@/lib/ownerAuth'

export const dynamic = 'force-dynamic'

const SERIF = { fontFamily: 'Cormorant Garamond, serif' } as const

const NAV = [
  { href: '/owner', label: 'Dashboard' },
  { href: '/owner/calendar', label: 'Calendar' },
  { href: '/owner/properties', label: 'Properties' },
  { href: '/owner/bookings', label: 'Bookings' },
  { href: '/owner/payments', label: 'Payments' },
]

export default async function OwnerCabinetLayout(props: {
  children: React.ReactNode
}) {
  const owner = await getCurrentOwner()
  if (!owner) redirect('/owner/login')

  return (
    <div className="min-h-dvh bg-[#0a1420] text-white">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap"
      />
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/owner" className="text-xl font-medium" style={SERIF}>
            Owner Cabinet
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-white/60 sm:inline">
              {owner.email}
            </span>
            <form method="POST" action="/api/owner/logout">
              <button
                type="submit"
                className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/70 transition-colors hover:border-white/40 hover:text-white"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 md:flex-row">
        <nav className="flex shrink-0 gap-2 overflow-x-auto md:w-48 md:flex-col">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 flex-1">{props.children}</div>
      </div>
    </div>
  )
}
