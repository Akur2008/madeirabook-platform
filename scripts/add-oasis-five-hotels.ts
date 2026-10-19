import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import os from 'node:os'
import path from 'node:path'

// Adds five new hotels to the Madeira Oasis showcase (brand=madeiraoasis,
// hotelType=hotel, status=published) and creates Hotel Orquídea under the
// madeirabook brand. Photos are read from ~/Downloads/hotel-scrape/<dir>,
// converted to JPEG <=1920px, uploaded to R2 via `uploads`, referenced
// through `media` docs and attached as property.media[] (first = hero).
// Idempotent: re-running reuses uploads/media matched by filename/url and
// updates existing properties matched by slug.

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
  title: string
  brand: 'madeiraoasis' | 'madeirabook'
  category: string
  shortDescription: string
  description: string
  pricePerNight: number
  lat: number
  lng: number
  locationSlug: string
  amenityKeys: string[]
  alt: string
  photos: { src: string; name: string }[]
}

const HOTELS: HotelCfg[] = [
  {
    slug: 'galomar-sentido',
    dir: 'galomar',
    title: 'Sentido Galomar — Adult Only',
    brand: 'madeiraoasis',
    category: '5★ Adults-Only Eco Resort',
    shortDescription:
      'Adults-only eco-resort in Caniço with direct ocean access, organic cuisine, and carbon-neutral luxury.',
    description: `Perched on the cliffs of Caniço de Baixo, Sentido Galomar is Madeira's adults-only eco-retreat — a hotel built around silence, sustainability and the Atlantic at its feet. The resort holds a direct-private sea access via its own bathing platform and lido, with the underwater Galomar diving reserve just below.

**Highlights of the stay:**
* **Carbon-neutral hospitality:** Energy-efficient design, solar power and a certified sustainability programme across the whole Galo Resort.
* **Organic dining:** The Atlântida restaurant serves seasonal organic cuisine on an oceanfront terrace above the lava rocks.
* **Wellness & activity:** Ashoka Spa, panoramic pools, outdoor yoga and direct access to diving and kayaking on the south coast.`,
    pricePerNight: 260,
    lat: 32.6426,
    lng: -16.8319,
    locationSlug: 'canico-de-baixo',
    amenityKeys: ['oceanView', 'spa', 'infinityPool', 'fineDining', 'seaAccess', 'concierge'],
    alt: 'Sentido Galomar — Adults Only Eco Resort, Caniço, Madeira',
    photos: [
      { src: 'galomar-hero-1.webp', name: 'galomar-sentido-hero.jpg' },
      { src: 'galomar-view-2.jpg', name: 'galomar-sentido-view-1.jpg' },
      { src: 'galomar-pool-1.jpg', name: 'galomar-sentido-pool-1.jpg' },
      { src: 'galomar-room-1.jpg', name: 'galomar-sentido-room-1.jpg' },
      { src: 'galomar-restaurant-1.jpg', name: 'galomar-sentido-restaurant-1.jpg' },
      { src: 'galomar-exterior-1.webp', name: 'galomar-sentido-exterior-1.jpg' },
      { src: 'galomar-photo-1.jpg', name: 'galomar-sentido-photo-1.jpg' },
      { src: 'galomar-view-10.webp', name: 'galomar-sentido-view-2.jpg' },
    ],
  },
  {
    slug: 'oasis-canico',
    dir: 'oasis',
    title: 'Oasis Caniço — The Views Resort',
    brand: 'madeiraoasis',
    category: '5★ Oceanfront Resort',
    shortDescription:
      '5★ oceanfront resort in Caniço with direct Atlantic access, infinity pools, and Michelin-trained cuisine.',
    description: `The Views Oasis sits directly above the sea at Praia dos Reis Magos in Caniço de Baixo, with panoramic ocean views from the rooms, pools and terraces. Indoor and outdoor pools, a spa with jacuzzi and sauna, a gym and an oceanfront restaurant make it a complete south-coast retreat.

**Highlights of the stay:**
* **Oceanfront pools:** Outdoor pool over the Atlantic plus a heated indoor pool for year-round swimming.
* **Sea-view rooms:** Comfortable rooms and suites, most facing the open ocean.
* **Spa & dining:** Health and beauty treatments, sauna and jacuzzi, with regional and international cuisine by the water.`,
    pricePerNight: 200,
    lat: 32.6464,
    lng: -16.8259,
    locationSlug: 'canico-de-baixo',
    amenityKeys: ['oceanView', 'infinityPool', 'spa', 'fineDining', 'seaAccess', 'concierge'],
    alt: 'Oasis Caniço — The Views Resort, Caniço de Baixo, Madeira',
    photos: [
      { src: 'oasis-hero-1.jpg', name: 'oasis-canico-hero.jpg' },
      { src: 'oasis-pool-2.jpg', name: 'oasis-canico-pool-1.jpg' },
      { src: 'oasis-view-4.jpg', name: 'oasis-canico-view-1.jpg' },
      { src: 'oasis-room-1.jpg', name: 'oasis-canico-room-1.jpg' },
      { src: 'oasis-spa-4.jpg', name: 'oasis-canico-spa-1.jpg' },
      { src: 'oasis-restaurant-1.jpg', name: 'oasis-canico-restaurant-1.jpg' },
      { src: 'oasis-hero-16.jpg', name: 'oasis-canico-view-2.jpg' },
      { src: 'oasis-exterior-1.jpg', name: 'oasis-canico-exterior-1.jpg' },
    ],
  },
  {
    slug: 'riu-madeira',
    dir: 'riu-madeira',
    title: 'Hotel Riu Madeira — All Inclusive',
    brand: 'madeiraoasis',
    category: '4★ All-Inclusive Beachfront Resort',
    shortDescription:
      '24-hour All-Inclusive resort on the beachfront of Praia dos Reis Magos, with ocean-view pools, spa, and 3 restaurants.',
    description: `The Hotel Riu Madeira sits on the beachfront of Praia dos Reis Magos in Caniço de Baixo, with 24-hour All-Inclusive service and first-class facilities facing the Atlantic. Two outdoor swimming pools — one heated in winter — a sun terrace with ocean views and a seafront promenade define the stay.

**Highlights of the stay:**
* **24h All-Inclusive:** Themed restaurants, bars and a careful selection of hot and cold dishes, appetizers and desserts.
* **Beachfront location:** Direct access to Praia dos Reis Magos, a tennis court with sea views and a gym.
* **Spa & Wellness centre:** Treatments, relaxation areas and free WiFi throughout the hotel.`,
    pricePerNight: 210,
    lat: 32.64603,
    lng: -16.827,
    locationSlug: 'canico-de-baixo',
    amenityKeys: ['oceanView', 'infinityPool', 'spa', 'fineDining', 'seaAccess', 'concierge'],
    alt: 'Hotel Riu Madeira — All Inclusive, Praia dos Reis Magos, Caniço de Baixo',
    photos: [
      { src: 'riu-madeira-exterior-1.jpg', name: 'riu-madeira-hero.jpg' },
      { src: 'riu-madeira-exterior-3.jpg', name: 'riu-madeira-view-1.jpg' },
      { src: 'riu-madeira-exterior-5.jpg', name: 'riu-madeira-aerial-1.jpg' },
      { src: 'riu-madeira-exterior-2.jpg', name: 'riu-madeira-view-2.jpg' },
      { src: 'riu-madeira-exterior-4.jpg', name: 'riu-madeira-photo-1.jpg' },
      { src: 'riu-madeira-exterior-6.jpg', name: 'riu-madeira-photo-2.jpg' },
      { src: 'riu-madeira-exterior-7.jpg', name: 'riu-madeira-photo-3.jpg' },
      { src: 'riu-madeira-exterior-9.jpg', name: 'riu-madeira-photo-4.jpg' },
    ],
  },
  {
    slug: 'pestana-casino-park',
    dir: 'pestana-casino-park',
    title: 'Pestana Casino Park — Ocean & Spa',
    brand: 'madeiraoasis',
    category: '5★ Design Hotel (Oscar Niemeyer)',
    shortDescription:
      '5★ hotel designed by Oscar Niemeyer, 5 minutes from Funchal center, with infinity pool, spa, and casino.',
    description: `The Pestana Casino Park is a 5-star hotel in Funchal surrounded by 161,400 sq ft of private gardens. Designed by world-renowned master architect Oscar Niemeyer, it stands adjacent to the Funchal bay cruise port, five minutes on foot from the city centre and the epicentre of the island's social and cultural life.

Its privileged location on the shores of the Atlantic makes it one of the most famous hotels on Madeira — an outdoor infinity pool integrated with a children's pool, a heated indoor pool with water jets, jacuzzi, Turkish bath, sauna and gym, plus a rooftop pool reserved for guests over 16.

Restaurants and bars come with panoramic views, a tennis court overlooks the ocean, and every room has Wi-Fi and a private balcony. The Madeira Casino — also a Niemeyer design — is part of the complex.`,
    pricePerNight: 300,
    lat: 32.651,
    lng: -16.917,
    locationSlug: 'funchal',
    amenityKeys: ['infinityPool', 'spa', 'rooftop', 'fineDining', 'garden', 'concierge'],
    alt: 'Pestana Casino Park — Ocean & Spa, Funchal, Madeira',
    photos: [
      { src: 'pestana-casino-park-garden-1.jpg', name: 'pestana-casino-park-hero.jpg' },
      { src: 'pestana-casino-park-pool-1.jpg', name: 'pestana-casino-park-pool-1.jpg' },
      { src: 'pestana-casino-park-garden-3.jpg', name: 'pestana-casino-park-garden-1.jpg' },
      { src: 'pestana-casino-park-garden-4.jpg', name: 'pestana-casino-park-garden-2.jpg' },
      { src: 'pestana-casino-park-restaurant-1.jpg', name: 'pestana-casino-park-restaurant-1.jpg' },
      { src: 'pestana-casino-park-room-1.jpg', name: 'pestana-casino-park-room-1.jpg' },
      { src: 'pestana-casino-park-room-2.jpg', name: 'pestana-casino-park-room-2.jpg' },
      { src: 'pestana-casino-park-garden-5.jpg', name: 'pestana-casino-park-garden-3.jpg' },
    ],
  },
  {
    slug: 'eira-do-serrado',
    dir: 'eira-do-serrado',
    title: 'Eira do Serrado — Hotel & Spa',
    brand: 'madeiraoasis',
    category: '4★ Mountain Retreat',
    shortDescription:
      'Mountain hotel overlooking the Valley of the Nuns, with heated indoor pool, spa, and panoramic views of Curral das Freiras.',
    description: `The Eira do Serrado Hotel & Spa stands at 1,094 metres on the ridge above Curral das Freiras — the Valley of the Nuns — one of Madeira's most dramatic landscapes. Mountains rise on every side and the valley floor drops away below the panoramic terrace.

**Highlights of the stay:**
* **Panoramic views:** Rooms, restaurant and terrace look over the Valley of the Nuns and the central peaks.
* **Heated indoor pool & spa:** Indoor pool, sauna, jacuzzi and treatment rooms — warm refuge in the mountains.
* **Gateway to the valley:** Viewpoints, chestnut groves and levada walks begin at the doorstep; Funchal is 30 minutes below.`,
    pricePerNight: 130,
    lat: 32.711,
    lng: -16.956,
    locationSlug: 'curral-das-freiras',
    amenityKeys: ['spa', 'fineDining', 'garden', 'transfer'],
    alt: 'Eira do Serrado Hotel & Spa — Curral das Freiras, Madeira',
    photos: [
      { src: 'eira-do-serrado-hero-1.jpg', name: 'eira-do-serrado-hero.jpg' },
      { src: 'eira-do-serrado-view-1.jpg', name: 'eira-do-serrado-view-1.jpg' },
      { src: 'eira-do-serrado-exterior-1.jpg', name: 'eira-do-serrado-exterior-1.jpg' },
      { src: 'eira-do-serrado-exterior-2.jpg', name: 'eira-do-serrado-exterior-2.jpg' },
      { src: 'eira-do-serrado-pool-1.jpg', name: 'eira-do-serrado-pool-1.jpg' },
      { src: 'eira-do-serrado-spa-2.jpg', name: 'eira-do-serrado-spa-1.jpg' },
      { src: 'eira-do-serrado-room-1.jpg', name: 'eira-do-serrado-room-1.jpg' },
      { src: 'eira-do-serrado-view-2.jpg', name: 'eira-do-serrado-view-2.jpg' },
    ],
  },
  {
    slug: 'hotel-orquidea',
    dir: 'orquidea',
    title: 'Hotel Orquídea',
    brand: 'madeirabook',
    category: '3★ Central Funchal Hotel',
    shortDescription:
      'Renovated hotel in the heart of Funchal — walking distance to the Sé Cathedral, museums, theatres and shops.',
    description: `Hotel Orquídea sits in the heart of Funchal, Madeira's capital, within easy walking distance of the city's historic sights — the Sé Cathedral, São Lourenço Palace, the Sacred Art Museum and the Madeira Wine Institute.

Recently renovated single, double, twin and triple rooms feature air conditioning, cable TV, internet access and private bathrooms; Superior rooms add extra-long beds, tea and coffee facilities, walk-in showers and premium amenities. A practical, central base for both tourists and business travellers — Funchal airport is about 23 km away.`,
    pricePerNight: 110,
    lat: 32.651529,
    lng: -16.909497,
    locationSlug: 'funchal',
    amenityKeys: ['concierge'],
    alt: 'Hotel Orquídea — Funchal, Madeira',
    photos: [
      { src: 'orquidea-exterior-1.webp', name: 'hotel-orquidea-hero.jpg' },
      { src: 'orquidea-photo-5.jpg', name: 'hotel-orquidea-photo-1.jpg' },
      { src: 'orquidea-room-1.webp', name: 'hotel-orquidea-room-1.jpg' },
      { src: 'orquidea-room-3.webp', name: 'hotel-orquidea-room-2.jpg' },
      { src: 'orquidea-view-1.webp', name: 'hotel-orquidea-view-1.jpg' },
      { src: 'orquidea-photo-8.jpg', name: 'hotel-orquidea-photo-2.jpg' },
    ],
  },
]

async function main() {
  const payload = await getPayload({ config })

  // --- Locations ---
  const locationBySlug = new Map<string, number>()
  const neededLocations: Record<string, { name: string; lat: number; lng: number }> = {
    'canico-de-baixo': { name: 'Caniço de Baixo', lat: 32.64636, lng: -16.82803 },
    funchal: { name: 'Funchal', lat: 32.635445, lng: -16.939719 },
    'curral-das-freiras': { name: 'Curral das Freiras', lat: 32.711, lng: -16.956 },
  }
  for (const [slug, loc] of Object.entries(neededLocations)) {
    const existing = await payload.find({
      collection: 'locations',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      locationBySlug.set(slug, existing.docs[0].id)
    } else {
      const created = await payload.create({
        collection: 'locations',
        data: {
          name: loc.name,
          slug,
          geoCoordinates: { lat: loc.lat, lng: loc.lng },
        },
      })
      locationBySlug.set(slug, created.id)
      console.log(`OK location ${slug} id=${created.id}`)
    }
  }

  for (const h of HOTELS) {
    const dir = path.join(BASE, h.dir)
    const mediaIds: number[] = []

    for (const photo of h.photos) {
      const existingUpload = await payload.find({
        collection: 'uploads',
        where: { filename: { equals: photo.name } },
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
        const buffer = await sharp(path.join(dir, photo.src))
          .rotate()
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer()
        const meta = await sharp(buffer).metadata()
        width = meta.width ?? MAX_WIDTH
        height = meta.height ?? 0
        const upload = await payload.create({
          collection: 'uploads',
          data: { alt: h.alt },
          file: {
            data: buffer,
            name: photo.name,
            mimetype: 'image/jpeg',
            size: buffer.length,
          },
        })
        uploadUrl = upload.url ?? undefined
        console.log(`  upload ${photo.name} -> ${uploadUrl}`)
      }
      if (!uploadUrl) throw new Error(`No URL for ${photo.name}`)

      const existingMedia = await payload.find({
        collection: 'media',
        where: { url: { equals: uploadUrl } },
        limit: 1,
      })
      if (existingMedia.docs.length > 0) {
        mediaIds.push(existingMedia.docs[0].id)
      } else {
        const media = await payload.create({
          collection: 'media',
          data: {
            url: uploadUrl,
            alt: h.alt,
            filename: photo.name,
            mimeType: 'image/jpeg',
            width,
            height,
          },
        })
        mediaIds.push(media.id)
      }
    }

    const data: Record<string, unknown> = {
      title: h.title,
      slug: h.slug,
      brand: h.brand,
      hotelType: 'hotel',
      status: 'published',
      category: h.category,
      shortDescription: h.shortDescription,
      description: h.description,
      pricePerNight: h.pricePerNight,
      geoCoordinates: { lat: h.lat, lng: h.lng },
      location: locationBySlug.get(h.locationSlug),
      amenities: h.amenityKeys.map((k) => AMENITY_IDS[k]).filter(Boolean),
      media: mediaIds.map((id) => ({ image: id })),
    }

    const existing = await payload.find({
      collection: 'properties',
      where: { slug: { equals: h.slug } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      await payload.update({ collection: 'properties', id: existing.docs[0].id, data: data as never })
      console.log(`UPDATED ${h.slug} -> ${mediaIds.length} photos, id=${existing.docs[0].id}`)
    } else {
      const created = await payload.create({ collection: 'properties', data: data as never })
      console.log(`CREATED ${h.slug} -> ${mediaIds.length} photos, id=${created.id}`)
    }
  }

  console.log('DONE')
  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
