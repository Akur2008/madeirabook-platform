'use client'

import Link from 'next/link'
import { useSyncExternalStore, type ComponentProps } from 'react'

import { oasisBase } from '@/lib/oasis-domain'

type OasisLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  // Clean oasis path, e.g. "/" or "/hotels/<slug>"
  href: string
}

const emptySubscribe = () => () => {}

// Oasis pages are served at the root on madeiraoasis.com but live under
// /oasis/* elsewhere (madeirabook.com, localhost dev). The href is emitted
// clean for SSR/crawlers and re-prefixed client-side on non-oasis hosts.
export default function OasisLink({ href, ...rest }: OasisLinkProps) {
  const base = useSyncExternalStore(
    emptySubscribe,
    () => oasisBase(window.location.hostname),
    () => '',
  )
  const resolved = base ? (href === '/' ? base : `${base}${href}`) : href
  return <Link href={resolved} suppressHydrationWarning {...rest} />
}
