import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'
import { sendAdminAlert } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_RE = /^[a-f0-9]{32}$/
const CATEGORIES = new Set(['beach', 'restaurant', 'viewpoint', 'other'])
const VIDEO_MIMES = new Set(['video/mp4', 'video/quicktime'])
const PHOTO_MAX_BYTES = 5 * 1024 * 1024
const VIDEO_MAX_BYTES = 30 * 1024 * 1024

const bad = (error: string, status = 400) =>
  NextResponse.json({ ok: false, error }, { status })

async function uploadFile(
  payload: Awaited<ReturnType<typeof getPayload>>,
  file: File,
  alt: string,
) {
  const data = Buffer.from(await file.arrayBuffer())
  return payload.create({
    collection: 'uploads',
    overrideAccess: true,
    data: { alt },
    file: {
      data,
      mimetype: file.type,
      name: file.name || 'pin-media',
      size: data.byteLength,
    },
  })
}

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return bad('Expected multipart form data')
  }

  const token = form.get('token')
  if (typeof token !== 'string' || !TOKEN_RE.test(token)) {
    return bad('Invalid invitation', 404)
  }

  const title = (form.get('title') ?? '').toString().trim()
  if (!title || title.length > 60) {
    return bad('Title is required (max 60 chars)')
  }

  const category = (form.get('category') ?? '').toString()
  if (!CATEGORIES.has(category)) {
    return bad('Invalid category')
  }

  const lat = Number(form.get('lat'))
  const lng = Number(form.get('lng'))
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return bad('Pick the spot on the map')
  }

  const description = (form.get('description') ?? '').toString().trim()
  if (description.length > 500) {
    return bad('Description is too long (max 500 chars)')
  }

  const photo = form.get('photo')
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > PHOTO_MAX_BYTES) return bad('Photo is too large (max 5 MB)')
    if (!photo.type.startsWith('image/')) return bad('Photo must be an image')
  }
  const video = form.get('video')
  if (video instanceof File && video.size > 0) {
    if (video.size > VIDEO_MAX_BYTES) return bad('Video is too large (max 30 MB)')
    if (!VIDEO_MIMES.has(video.type)) return bad('Video must be mp4 or mov')
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
    return bad('Invalid invitation', 404)
  }

  const photoDoc =
    photo instanceof File && photo.size > 0
      ? await uploadFile(payload, photo, title)
      : null
  const videoDoc =
    video instanceof File && video.size > 0
      ? await uploadFile(payload, video, title)
      : null

  const pin = await payload.create({
    collection: 'ambassador-pins',
    overrideAccess: true,
    data: {
      referral: referral.id,
      title,
      category: category as 'beach' | 'restaurant' | 'viewpoint' | 'other',
      coordinates: { lat, lng },
      description: description || undefined,
      photo: photoDoc?.id,
      video: videoDoc?.id,
      status: 'pending',
    },
  })

  const appUrl = (process.env.APP_URL || 'https://www.madeirabook.com').replace(/\/$/, '')
  await sendAdminAlert(
    `New spot pending from @${referral.code} — ${title}`,
    [
      `Ambassador: ${referral.creatorName} (${referral.code})`,
      `Title: ${title}`,
      `Category: ${category}`,
      `Coordinates: ${lat}, ${lng}`,
      `Description: ${description || '-'}`,
      `Photo: ${photoDoc ? 'yes' : 'no'} · Video: ${videoDoc ? 'yes' : 'no'}`,
      '',
      `Moderate: ${appUrl}/admin/collections/ambassador-pins`,
    ].join('\n'),
  )

  const res = NextResponse.json({ ok: true, id: pin.id })
  res.cookies.set('ambassador_token', token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: 'lax',
  })
  return res
}
