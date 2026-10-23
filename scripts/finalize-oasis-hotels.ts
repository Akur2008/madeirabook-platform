import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

// Final pass over the Madeira Oasis showcase:
// 1) Uploads scraped official-site photos for the four hotels that had no
//    media (casa-velha, enotel-lido, pestana-carlton, pestana-vila-lido) and
//    attaches them — first file becomes the cover.
// 2) Fills descriptions/addresses/amenities from official-site copy.
// 3) Uploads the Quinta da Serra official video and appends it to its media.
// 4) Refines geoCoordinates to the exact pin (official JSON-LD or
//    map-verified values).
// 5) Publishes every property with brand madeiraoasis / both.
// Idempotent: uploads and media are matched by filename/url.

const BASE = path.join(os.homedir(), 'Downloads', 'hotel-scrape')
const MAX_WIDTH = 1920
const JPEG_QUALITY = 85

const AMENITY_IDS: Record<string, number> = {
  oceanView: 15,
  spa: 16,
  infinityPool: 17,
  fineDining: 18,
  concierge: 19,
  transfer: 20,
  wine: 21,
  garden: 22,
  seaAccess: 23,
  rooftop: 24,
}

interface HotelCfg {
  slug: string
  dir: string
  alt: string
  photos: string[]
  description: string
  address: { street: string; city: string; postal: string; country: string }
  amenityKeys: string[]
  lat: number
  lng: number
}

const HOTELS: HotelCfg[] = [
  {
    slug: 'casa-velha-do-palheiro',
    dir: 'casa-velha-do-palheiro',
    alt: 'Casa Velha do Palheiro — Relais & Châteaux, Funchal, Madeira',
    photos: [
      'casa-velha-do-palheiro-photo-1.webp',
      'casa-velha-do-palheiro-photo-2.webp',
      'casa-velha-do-palheiro-photo-4.jpg',
      'casa-velha-do-palheiro-restaurant-1.png',
      'casa-velha-do-palheiro-room-1.webp',
      'casa-velha-do-palheiro-photo-6.jpg',
      'casa-velha-do-palheiro-room-3.webp',
      'casa-velha-do-palheiro-photo-5.jpg',
    ],
    description: `Casa Velha do Palheiro is a Relais & Châteaux hotel set within the 150-hectare Palheiro Nature Estate, above the city of Funchal. Originally built in 1804 as a hunting lodge by the Conde de Carvalhal, the house has been carefully restored into a peaceful country-house retreat surrounded by the renowned Palheiro Gardens and the Palheiro Golf course.

Guests enjoy elegant rooms and suites — all with en-suite bathrooms, heated towel rails, and bathtubs in the suites and golf wing — refined dining at Oxalis Restaurant, treatments at Palheiro Spa, estate walks, golf, gardens and the Casa de Chá Tea House, which sits inside Palheiro Gardens with direct access from the hotel grounds.`,
    address: {
      street: 'Rua da Estalagem 23, São Gonçalo',
      city: 'Funchal',
      postal: '9060-415',
      country: 'PT',
    },
    amenityKeys: ['garden', 'spa', 'fineDining', 'wine', 'concierge', 'transfer'],
    lat: 32.6580288,
    lng: -16.8673696,
  },
  {
    slug: 'enotel-lido',
    dir: 'enotel-lido',
    alt: 'Enotel Lido — All Inclusive 5★ Resort, Funchal, Madeira',
    photos: [
      'enotel-lido-exterior-1.jpg',
      'enotel-lido-exterior-2.jpg',
      'enotel-lido-photo-1.jpg',
      'enotel-lido-room-1.jpg',
      'enotel-lido-photo-2.jpg',
      'enotel-lido-room-3.jpg',
      'enotel-lido-exterior-3.jpg',
      'enotel-lido-photo-3.jpg',
    ],
    description: `This is the best All Inclusive in Madeira, with all the luxury and services you look for at a 5-star hotel. Enotel Hotels & Resorts presents Enotel Lido, impeccably renovated in 2021 with focus on two big improvements — innovation and concept. Comfort and refinement are regular features in all rooms, so that the guest may relax during an unforgettable stay.

The relaxation that the deepest blue can provide — the exuberant views over the Atlantic Ocean and the sunny location were the hotel's biggest inspiration. The most renowned All Inclusive in Madeira takes a unique approach to this system, connecting the hotel's atmosphere and hospitality with the delights the ocean has to offer.`,
    address: {
      street: 'Rua Simplício dos Passos Gouveia 29',
      city: 'Funchal',
      postal: '9004-576',
      country: 'PT',
    },
    amenityKeys: ['oceanView', 'infinityPool', 'spa', 'fineDining', 'concierge'],
    lat: 32.63765,
    lng: -16.93558,
  },
  {
    slug: 'pestana-carlton-madeira',
    dir: 'pestana-carlton-madeira',
    alt: 'Pestana Carlton Madeira — Premium Ocean Resort, Funchal',
    photos: [
      'pestana-carlton-madeira-photo-1.jpg',
      'pestana-carlton-madeira-view-1.jpg',
      'pestana-carlton-madeira-pool-1.jpg',
      'pestana-carlton-madeira-room-1.jpg',
      'pestana-carlton-madeira-photo-2.jpg',
      'pestana-carlton-madeira-restaurant-1.jpg',
      'pestana-carlton-madeira-photo-4.jpg',
      'pestana-carlton-madeira-pool-2.jpg',
    ],
    description: `The Pestana Carlton Madeira is a luxurious and charming 5-star hotel in the city of Funchal, on the island Madeira, with views of the sea, garden, swimming pool or Funchal Bay.

It has 4 swimming pools — two huge outdoor saltwater pools and two indoor heated pools — with direct access to the Atlantic Ocean, plus a diving center with the possibility of diving baptisms and boat trips.

If you'd like to savor cultural and culinary diversity, the Arcos restaurant with its show cooking and magnificent buffets is a wonderful choice. For more international options, try a snack at The Pub or at the Garden Pool.`,
    address: {
      street: 'Largo António Nobre nº 1',
      city: 'Funchal',
      postal: '9004-531',
      country: 'PT',
    },
    amenityKeys: ['oceanView', 'infinityPool', 'spa', 'fineDining', 'seaAccess', 'concierge'],
    lat: 32.642461,
    lng: -16.922017,
  },
  {
    slug: 'pestana-vila-lido',
    dir: 'pestana-vila-lido',
    alt: 'Pestana Vila Lido Madeira — Premium Ocean Hotel, Funchal',
    photos: [
      'pestana-vila-lido-photo-1.jpg',
      'pestana-vila-lido-view-1.jpg',
      'pestana-vila-lido-pool-1.jpg',
      'pestana-vila-lido-room-1.jpg',
      'pestana-vila-lido-view-2.jpg',
      'pestana-vila-lido-room-3.jpg',
      'pestana-vila-lido-spa-1.jpg',
      'pestana-vila-lido-photo-2.jpg',
    ],
    description: `Extraordinary views, impeccable location: the 5-star Pestana Vila Lido Madeira, with direct access to the sea, near the center of Funchal. Modern and classic, it stands in one of the most elegant areas of Madeira's capital.

An extraordinary cylindrical building houses the rooms, all with balconies. The old house, a large chalet that recaptures the sophistication of early 20th-century tourism and preserves the charm of Vila Lido's origins in 1938, contains the common areas. Between them, a precious garden and pool.

The proximity to the Atlantic is a privilege of Pestana Vila Lido Madeira. The access stairs to the sea, built to ensure complete safety, are the exclusive path for bathing in warm and calm waters.`,
    address: {
      street: 'Rua do Gorgulho 15-17',
      city: 'Funchal',
      postal: '9000-107',
      country: 'PT',
    },
    amenityKeys: ['oceanView', 'infinityPool', 'spa', 'fineDining', 'seaAccess', 'garden'],
    lat: 32.636451,
    lng: -16.930829,
  },
]

// Exact pin coordinates (official-site JSON-LD where available, otherwise
// map-verified). barcelo-funchal-oldtown is the reference page — untouched.
const COORDS: Record<string, { lat: number; lng: number }> = {
  'aqua-natura-bay': { lat: 32.866784, lng: -17.166198 },
  'castanheiro-boutique-hotel': { lat: 32.649572, lng: -16.910217 },
  'eira-do-serrado': { lat: 32.710232, lng: -16.962948 },
  'enoteca-quinta-da-serra': { lat: 32.693832, lng: -16.994911 },
  'estalagem-da-ponta-do-sol': { lat: 32.679245, lng: -17.10355 },
  'galomar-sentido': { lat: 32.642603, lng: -16.831915 },
  'hotel-orquidea': { lat: 32.65155, lng: -16.909606 },
  'hotel-suite-eden-mar': { lat: 32.63757, lng: -16.931616 },
  'les-suites-cliff-bay': { lat: 32.639267, lng: -16.925734 },
  'oasis-canico': { lat: 32.646239, lng: -16.825565 },
  'pestana-casino-park': { lat: 32.643802, lng: -16.917342 },
  'pestana-churchill-bay': { lat: 32.647685, lng: -16.975904 },
  'pestana-promenade': { lat: 32.637398, lng: -16.936984 },
  'quinta-da-casa-branca': { lat: 32.641942, lng: -16.927068 },
  'quinta-do-furao': { lat: 32.821668, lng: -16.888839 },
  'reids-palace-belmond': { lat: 32.640539, lng: -16.923789 },
  'riu-madeira': { lat: 32.645629, lng: -16.827112 },
  'royal-savoy': { lat: 32.642066, lng: -16.92048 },
  'savoy-palace': { lat: 32.64366, lng: -16.920563 },
}

const QUINTA_DA_SERRA_DESCRIPTION = `A five-star certified Bio Hotel set in a historic manor house in Jardim da Serra, in the mountains above Câmara de Lobos, Madeira. Surrounded by lush gardens and an organic farm, the hotel offers elegant rooms and suites with sea and mountain views, an organic gastronomy restaurant, an indoor heated pool, and a spa & wellness center.

It holds BIO Hotel, Green Key and Biosphere sustainability certifications. Room types: Standard, Superior, Junior Suite and Master Suite.`

type P = Awaited<ReturnType<typeof getPayload>>

async function uploadPhoto(
  p: P,
  srcPath: string,
  name: string,
  alt: string,
): Promise<{ mediaId: number; url: string }> {
  const existingUpload = await p.find({
    collection: 'uploads',
    where: { filename: { equals: name } },
    limit: 1,
  })
  let uploadUrl: string | undefined
  let width = MAX_WIDTH
  let height = 0
  if (existingUpload.docs.length > 0) {
    const u = existingUpload.docs[0]
    uploadUrl = u.url ?? undefined
    width = u.width ?? MAX_WIDTH
    height = u.height ?? 0
  } else {
    const buffer = await sharp(srcPath)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer()
    const meta = await sharp(buffer).metadata()
    width = meta.width ?? MAX_WIDTH
    height = meta.height ?? 0
    const upload = await p.create({
      collection: 'uploads',
      data: { alt },
      file: {
        data: buffer,
        name,
        mimetype: 'image/jpeg',
        size: buffer.length,
      },
    })
    uploadUrl = upload.url ?? undefined
    console.log(`    upload ${name} -> ${uploadUrl}`)
  }
  if (!uploadUrl) throw new Error(`No URL for ${name}`)

  const existingMedia = await p.find({
    collection: 'media',
    where: { url: { equals: uploadUrl } },
    limit: 1,
  })
  if (existingMedia.docs.length > 0) {
    return { mediaId: existingMedia.docs[0].id as number, url: uploadUrl }
  }
  const media = await p.create({
    collection: 'media',
    data: {
      url: uploadUrl,
      alt,
      filename: name,
      mimeType: 'image/jpeg',
      width,
      height,
    },
  })
  return { mediaId: media.id as number, url: uploadUrl }
}

async function main() {
  const payload = await getPayload({ config })

  // --- 1+2: photos, descriptions, addresses, amenities, coords ---
  for (const h of HOTELS) {
    const dir = path.join(BASE, h.dir)
    const mediaIds: number[] = []
    for (const photo of h.photos) {
      const src = path.join(dir, photo)
      if (!fs.existsSync(src)) {
        console.log(`  !! missing ${src}`)
        continue
      }
      const name = photo.replace(/\.(webp|png)$/i, '.jpg')
      const { mediaId } = await uploadPhoto(payload, src, name, h.alt)
      mediaIds.push(mediaId)
    }

    const { docs } = await payload.find({
      collection: 'properties',
      where: { slug: { equals: h.slug } },
      limit: 1,
    })
    const doc = docs[0]
    if (!doc) {
      console.log(`${h.slug}: NOT FOUND`)
      continue
    }
    await payload.update({
      collection: 'properties',
      id: doc.id,
      data: {
        description: h.description,
        address: h.address,
        geoCoordinates: { lat: h.lat, lng: h.lng },
        amenities: h.amenityKeys
          .map((k) => AMENITY_IDS[k])
          .filter((id): id is number => id != null),
        media: mediaIds.map((image) => ({ image })),
        status: 'published',
      },
    })
    console.log(`OK ${h.slug}: ${mediaIds.length} photos attached`)
  }

  // --- 3: Quinta da Serra — real description + official video ---
  {
    const { docs } = await payload.find({
      collection: 'properties',
      where: { slug: { equals: 'quinta-da-serra' } },
      limit: 1,
      depth: 1,
    })
    const doc = docs[0]
    if (doc) {
      const videoPath = path.join(BASE, 'quinta-da-serra', 'quinta-da-serra-video-1.mp4')
      const data: Record<string, unknown> = {
        description: QUINTA_DA_SERRA_DESCRIPTION,
        status: 'published',
      }
      if (fs.existsSync(videoPath)) {
        const name = 'quinta-da-serra-video-1.mp4'
        const existingUpload = await payload.find({
          collection: 'uploads',
          where: { filename: { equals: name } },
          limit: 1,
        })
        let uploadUrl = existingUpload.docs[0]?.url as string | undefined
        if (!uploadUrl) {
          const buffer = fs.readFileSync(videoPath)
          const upload = await payload.create({
            collection: 'uploads',
            data: { alt: 'Quinta da Serra — Bio Hotel, Jardim da Serra, Madeira' },
            file: {
              data: buffer,
              name,
              mimetype: 'video/mp4',
              size: buffer.length,
            },
          })
          uploadUrl = upload.url ?? undefined
          console.log(`    upload ${name} -> ${uploadUrl}`)
        }
        if (uploadUrl) {
          const existingMedia = await payload.find({
            collection: 'media',
            where: { url: { equals: uploadUrl } },
            limit: 1,
          })
          let videoId = existingMedia.docs[0]?.id as number | undefined
          if (!videoId) {
            const media = await payload.create({
              collection: 'media',
              data: {
                url: uploadUrl,
                alt: 'Quinta da Serra — Bio Hotel, Jardim da Serra, Madeira',
                filename: name,
                mimeType: 'video/mp4',
              },
            })
            videoId = media.id as number
          }
          const existing = (doc.media ?? [])
            .map((m) => (typeof m.image === 'object' ? m.image?.id : m.image))
            .filter((id): id is number => typeof id === 'number')
          if (!existing.includes(videoId)) {
            data.media = [...existing, videoId].map((image) => ({ image }))
          }
        }
      }
      await payload.update({
        collection: 'properties',
        id: doc.id,
        data: data as never,
      })
      console.log('OK quinta-da-serra: description + video')
    }
  }

  // --- 4: coordinate refinements ---
  for (const [slug, geo] of Object.entries(COORDS)) {
    const { docs } = await payload.find({
      collection: 'properties',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const doc = docs[0]
    if (!doc) {
      console.log(`${slug}: NOT FOUND`)
      continue
    }
    await payload.update({
      collection: 'properties',
      id: doc.id,
      data: { geoCoordinates: geo },
    })
    console.log(`coords ${slug} -> ${geo.lat},${geo.lng}`)
  }

  // --- 5: publish every Oasis property still in draft ---
  const { docs } = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { brand: { in: ['madeiraoasis', 'both'] } },
        { status: { not_equals: 'published' } },
      ],
    },
    limit: 200,
  })
  for (const d of docs) {
    await payload.update({
      collection: 'properties',
      id: d.id,
      data: { status: 'published' },
    })
    console.log(`published ${d.slug}`)
  }

  console.log('DONE')
  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
