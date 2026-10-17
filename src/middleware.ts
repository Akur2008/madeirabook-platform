import { NextRequest, NextResponse } from 'next/server'

import { isOasisHost } from '@/lib/oasis-domain'

const REF_COOKIE = 'madeirabook_ref'
const REF_RE = /^[a-z0-9_-]{2,50}$/
const MAP_RE = /^\/m\/([a-z0-9_-]{2,50})\/?$/
const THIRTY_DAYS = 2592000

export function middleware(req: NextRequest) {
  // Multi-domain routing: madeiraoasis.com serves the /oasis route group at
  // the root. /oasis* URLs are redirected to their clean form, / and
  // /hotels/* are rewritten internally; /api/*, /_next/*, /admin and every
  // other path pass through untouched.
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase()
  if (isOasisHost(host)) {
    const { pathname } = req.nextUrl
    if (pathname === '/oasis' || pathname.startsWith('/oasis/')) {
      const url = req.nextUrl.clone()
      url.pathname = pathname.slice('/oasis'.length) || '/'
      return NextResponse.redirect(url, 308)
    }
    if (pathname === '/hotels') {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url, 308)
    }
    if (pathname === '/' || pathname.startsWith('/hotels/')) {
      const url = req.nextUrl.clone()
      url.pathname = `/oasis${pathname === '/' ? '' : pathname}`
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

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
