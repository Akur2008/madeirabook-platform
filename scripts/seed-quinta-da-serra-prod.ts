import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import os from 'node:os'
import path from 'node:path'

// Creates the "Quinta da Serra — Bio Luxury Sanctuary" property in the
// production DB (fixes madeiraoasis.com/hotels/quinta-da-serra 404 — the
// same row also serves /hotels/quinta-da-serra-v2 via middleware rewrite)
// and attaches 8 curated photos stored on R2 through the `uploads`
// collection. Files come from the earlier hotel scrape in Downloads.
// Idempotent: re-running updates the row instead of duplicating it.

const PHOTOS_DIR = path.join(
  os.homedir(),
  'Downloads',
  'hotel-scrape',
  'quinta-da-serra',
)

const MAX_WIDTH = 1920
const JPEG_QUALITY = 85

const PHOTOS: { src: string; name: string }[] = [
  { src: 'quinta-da-serra-hero-1.webp', name: 'quinta-da-serra-hero.jpg' },
  { src: 'quinta-da-serra-exterior-8.webp', name: 'quinta-da-serra-aerial.jpg' },
  { src: 'quinta-da-serra-pool-1.webp', name: 'quinta-da-serra-pool.jpg' },
  { src: 'quinta-da-serra-exterior-3.webp', name: 'quinta-da-serra-garden.jpg' },
  { src: 'quinta-da-serra-photo-1.webp', name: 'quinta-da-serra-pavilion.jpg' },
  { src: 'quinta-da-serra-room-12.jpg', name: 'quinta-da-serra-room-1.jpg' },
  { src: 'quinta-da-serra-view-2.webp', name: 'quinta-da-serra-valley.jpg' },
  { src: 'quinta-da-serra-spa-1.webp', name: 'quinta-da-serra-spa.jpg' },
]

const ALT = 'Hotel Quinta da Serra — Bio Hotel, Madeira'

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL is not set')
  const host = new URL(dbUrl).hostname
  if (host.includes('dev')) {
    throw new Error(`Refusing to run against dev database: ${host}`)
  }
  console.log(`target db host: ${host}`)

  const payload = await getPayload({ config })

  // --- Location: reuse Jardim da Serra if present ---
  let locationId: number | undefined
  const loc = await payload.find({
    collection: 'locations',
    where: { slug: { equals: 'jardim-da-serra' } },
    limit: 1,
  })
  if (loc.docs.length > 0) {
    locationId = loc.docs[0].id
    console.log(`location jardim-da-serra -> ${locationId} (existing)`)
  } else {
    const created = await payload.create({
      collection: 'locations',
      data: {
        name: 'Jardim da Serra',
        slug: 'jardim-da-serra',
        geoCoordinates: { lat: 32.6938, lng: -16.9949 },
      },
    })
    locationId = created.id
    console.log(`location jardim-da-serra -> ${locationId} (created)`)
  }

  // --- Photos: file -> uploads (R2) -> media doc (URL ref) ---
  const mediaIds: number[] = []
  for (const f of PHOTOS) {
    const srcPath = path.join(PHOTOS_DIR, f.src)

    let uploadUrl: string | undefined
    let width = MAX_WIDTH
    let height = 0

    const existingUpload = await payload.find({
      collection: 'uploads',
      where: { filename: { equals: f.name } },
      limit: 1,
    })
    if (existingUpload.docs.length > 0) {
      const u = existingUpload.docs[0]
      uploadUrl = u.url ?? undefined
      width = u.width ?? MAX_WIDTH
      height = u.height ?? 0
      console.log(`upload ${f.name} -> ${uploadUrl} (existing)`)
    } else {
      const buffer = await sharp(srcPath)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer()
      const meta = await sharp(buffer).metadata()
      width = meta.width ?? MAX_WIDTH
      height = meta.height ?? 0
      const upload = await payload.create({
        collection: 'uploads',
        data: { alt: ALT },
        file: {
          data: buffer,
          name: f.name,
          mimetype: 'image/jpeg',
          size: buffer.length,
        },
      })
      uploadUrl = upload.url ?? undefined
      console.log(`upload ${f.name} -> ${uploadUrl} (created)`)
    }

    if (!uploadUrl) throw new Error(`No URL for upload ${f.name}`)

    const existingMedia = await payload.find({
      collection: 'media',
      where: { url: { equals: uploadUrl } },
      limit: 1,
    })
    if (existingMedia.docs.length > 0) {
      mediaIds.push(existingMedia.docs[0].id)
      continue
    }
    const media = await payload.create({
      collection: 'media',
      data: {
        url: uploadUrl,
        alt: ALT,
        filename: f.name,
        mimeType: 'image/jpeg',
        width,
        height,
      },
    })
    mediaIds.push(media.id)
    console.log(`media ${f.name} -> id ${media.id}`)
  }

  // --- Property ---
  const data = {
    title: 'Quinta da Serra — Bio Luxury Sanctuary',
    slug: 'quinta-da-serra',
    brand: 'madeiraoasis' as const,
    hotelType: 'hotel' as const,
    status: 'published' as const,
    category: '5★ Bio Hotel & Mountain Retreat',
    shortDescription:
      '5-Star organic retreat nestled at 820m in Madeira mountains.',
    pricePerNight: 300,
    geoCoordinates: { lat: 32.6938, lng: -16.9949 },
    location: locationId,
    media: mediaIds.map((id) => ({ image: id })),
  }

  const existing = await payload.find({
    collection: 'properties',
    where: { slug: { equals: 'quinta-da-serra' } },
    limit: 1,
  })

  let propertyId: number
  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'properties',
      id: existing.docs[0].id,
      data,
    })
    propertyId = existing.docs[0].id
    console.log(`property quinta-da-serra -> id ${propertyId} (updated)`)
  } else {
    const created = await payload.create({ collection: 'properties', data })
    propertyId = created.id
    console.log(`property quinta-da-serra -> id ${propertyId} (created)`)
  }

  console.log(`DONE property id: ${propertyId}`)
  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
