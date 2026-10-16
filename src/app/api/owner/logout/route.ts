import { NextRequest, NextResponse } from 'next/server'

import { OWNER_SESSION_COOKIE } from '@/lib/ownerAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/owner/login', req.url), 303)
  res.cookies.set(OWNER_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return res
}
