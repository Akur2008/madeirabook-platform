import { NextResponse } from 'next/server'

import { syncPropertyToZeevou } from '@/lib/zeevou'
import { getZeevouRequestLog } from '@/services/pms/zeevou'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/admin/zeevou/sync
// Auth: Authorization: Bearer <ADMIN_SECRET> (falls back to CRON_SECRET).
// Body: { propertyId: number } or { slug: string }
// Pushes a Payload property to Zeevou as a Complex (property -> unit_type ->
// rate_plan + unit) and writes the returned ids back. On failure the response
// includes the exact Zeevou request/response trace for a support ticket.
export async function POST(req: Request) {
  const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET
  if (
    !secret ||
    req.headers.get('authorization') !== `Bearer ${secret}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { propertyId?: unknown; slug?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const target =
    typeof body.slug === 'string' && body.slug
      ? body.slug
      : Number(body.propertyId)
  if (
    (typeof target === 'number' && (!Number.isFinite(target) || target <= 0)) ||
    (typeof target === 'string' && !target)
  ) {
    return NextResponse.json(
      { error: 'Provide propertyId (number) or slug (string)' },
      { status: 400 },
    )
  }

  try {
    const result = await syncPropertyToZeevou(target)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('zeevou sync failed:', e)
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : 'Zeevou sync failed',
        trace: getZeevouRequestLog(),
      },
      { status: 502 },
    )
  }
}
