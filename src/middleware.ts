import { NextRequest, NextResponse } from 'next/server'

const REF_COOKIE = 'madeirabook_ref'
const REF_RE = /^[a-z0-9_-]{2,50}$/
const MAP_RE = /^\/m\/([a-z0-9_-]{2,50})\/?$/
const THIRTY_DAYS = 2592000

export function middleware(req: NextRequest) {
  const param = req.nextUrl.searchParams.get('ref')
  const mapMatch = req.nextUrl.pathname.match(MAP_RE)
  const ref =
    (param && REF_RE.test(param) ? param : null) ?? mapMatch?.[1] ?? null
  if (ref) {
    const res = NextResponse.next()
    res.cookies.set(REF_COOKIE, ref, {
      maxAge: THIRTY_DAYS,
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // read in client JS for the WhatsApp deeplink
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/webhook|api/cron|admin|_next|favicon|api/payload).*)'],
}
