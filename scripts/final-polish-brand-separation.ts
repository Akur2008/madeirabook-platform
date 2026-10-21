import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// Final polish — brand separation:
//  1. hotel-orquidea gallery -> local photos in public/images/Orchidea/*
//     (brand stays madeirabook, status published — visible on madeirabook.com,
//     never on the Oasis map which only reads brand=madeiraoasis).
//  2. Create barcelo-funchal-oldtown (brand=madeiraoasis, published) — the
//     only hotel on the Oasis map.
//  3. Draft every other brand=madeiraoasis property so the map shows
//     Barcelo alone until more addresses are approved.

const ORCHIDEA_PHOTOS = [
  'IMG_0153.JPG',
  'IMG_0154.JPG',
  'IMG_0155.WEBP',
  'IMG_0156.WEBP',
  'IMG_0157.WEBP',
  'IMG_0158.WEBP',
  'IMG_0159.WEBP',
  'IMG_0160.WEBP',
  'IMG_0161.WEBP',
  'IMG_0163.WEBP',
  'IMG_0164.PNG',
].map((f) => `/images/Orchidea/${f}`)

const MIME: Record<string, string> = {
  JPG: 'image/jpeg',
  JPEG: 'image/jpeg',
  WEBP: 'image/webp',
  PNG: 'image/png',
}

const BARCELO_SLUG = 'barcelo-funchal-oldtown'

async function ensureMedia(
  p: Awaited<ReturnType<typeof getPayload>>,
  url: string,
  alt: string,
) {
  const existing = await p.find({
    collection: 'media',
    where: { url: { equals: url } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) return existing.docs[0].id as number
  const ext = url.split('.').pop() ?? ''
  const created = await p.create({
    collection: 'media',
    data: {
      url,
      alt,
      filename: url.split('/').pop(),
      mimeType: MIME[ext.toUpperCase()] ?? 'image/jpeg',
    },
  })
  return created.id as number
}

async function main() {
  const p = await getPayload({ config })

  // --- 1. Orquidea gallery -------------------------------------------------
  const orq = await p.find({
    collection: 'properties',
    where: { slug: { equals: 'hotel-orquidea' } },
    limit: 1,
    depth: 0,
  })
  if (!orq.docs[0]) throw new Error('hotel-orquidea not found')
  const orqId = orq.docs[0].id

  const mediaIds: { image: number }[] = []
  for (const url of ORCHIDEA_PHOTOS) {
    const id = await ensureMedia(
      p,
      url,
      `Hotel Orquídea — ${url.split('/').pop()}`,
    )
    mediaIds.push({ image: id })
  }

  await p.update({
    collection: 'properties',
    id: orqId,
    data: {
      brand: 'madeirabook',
      status: 'published',
      media: mediaIds,
    },
  })
  console.log(`hotel-orquidea: gallery set to ${mediaIds.length} local photos`)

  // --- 2. Barcelo Funchal Oldtown ------------------------------------------
  const barceloData = {
    title: 'Barceló Funchal Oldtown',
    slug: BARCELO_SLUG,
    brand: 'madeiraoasis' as const,
    status: 'published' as const,
    hotelType: 'hotel' as const,
    category: '5★ Design Hotel — Funchal Old Town',
    geoCoordinates: { lat: 32.6474, lng: -16.909 },
    address: {
      street: 'Rua da Alfândega 9',
      city: 'Funchal',
      postal: '9000-059',
      country: 'PT',
    },
    pricePerNight: 205,
    shortDescription:
      'Five-star Barceló flagship in the heart of Funchal’s old town — rooftop pool over the Atlantic, steps from the cathedral and the marina.',
    description:
      'Barceló Funchal Oldtown is a five-star design hotel on Rua da Alfândega in the historic centre of Funchal. Rooftop pool and bar overlooking the Atlantic, À-la-carte dining, and the old town’s restaurants and the marina on the doorstep.',
  }

  const existing = await p.find({
    collection: 'properties',
    where: { slug: { equals: BARCELO_SLUG } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) {
    await p.update({
      collection: 'properties',
      id: existing.docs[0].id,
      data: barceloData,
    })
    console.log('barcelo-funchal-oldtown: updated (already existed)')
  } else {
    await p.create({ collection: 'properties', data: barceloData })
    console.log('barcelo-funchal-oldtown: created (madeiraoasis, published)')
  }

  // --- 3. Draft every other madeiraoasis property --------------------------
  const oasis = await p.find({
    collection: 'properties',
    where: {
      and: [
        { brand: { equals: 'madeiraoasis' } },
        { slug: { not_equals: BARCELO_SLUG } },
      ],
    },
    limit: 300,
    depth: 0,
  })
  let drafted = 0
  for (const d of oasis.docs) {
    if (d.status === 'draft') continue
    await p.update({
      collection: 'properties',
      id: d.id,
      data: { status: 'draft' },
    })
    drafted++
    console.log(`  ${d.slug} -> draft`)
  }
  console.log(`drafted ${drafted} madeiraoasis properties`)

  // --- verify ---------------------------------------------------------------
  const { docs: visible } = await p.find({
    collection: 'properties',
    where: {
      and: [
        { brand: { equals: 'madeiraoasis' } },
        { status: { equals: 'published' } },
      ],
    },
    limit: 300,
    depth: 0,
  })
  console.log(
    'Oasis map now shows:',
    visible.map((d) => d.slug),
  )

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
