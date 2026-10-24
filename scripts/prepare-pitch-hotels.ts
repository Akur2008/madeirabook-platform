import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import os from 'node:os'
import path from 'node:path'

// Prepares the two B2B pitch hotel pages (Oasis Caniço / Galomar Resort):
// uploads the hotels' own official-site photos (already scraped to
// ~/Downloads/hotel-scrape) to R2 via the `uploads` collection, registers
// `media` docs and rewrites the property content: description, amenities,
// geo and address.
// Idempotent: uploads/media are reused when filename/url already exist.

const SCRAPE_BASE = path.join(os.homedir(), 'Downloads', 'hotel-scrape')
const MAX_WIDTH = 1920
const JPEG_QUALITY = 85

interface Photo {
  file: string
  alt: string
}

interface HotelCfg {
  slug: string
  sourceDir: string
  title: string
  category: string
  hotelType: 'hotel' | 'resort'
  shortDescription: string
  description: string
  amenityIds: number[]
  lat: number
  lng: number
  address: { street: string; city: string; postal: string }
  sourceSite: string
  photos: Photo[]
}

const HOTELS: HotelCfg[] = [
  {
    slug: 'oasis-canico',
    sourceDir: 'oasis',
    title: 'Oasis Caniço',
    category: '4★ Oceanfront Family Resort',
    hotelType: 'resort',
    shortDescription:
      'Oceanfront family resort at Praia dos Reis Magos, Caniço de Baixo — pools, spa and sea views.',
    description: `The Views Oásis — known to many simply as the Oasis of Caniço — sits directly on the seafront of Caniço de Baixo, on the promenade above Praia dos Reis Magos. From the rooms, the view reaches the Desertas Islands and Ponta de São Lourenço; on foot, the boardwalk leads straight to the beach.

A retreat for all generations: family junior suites, a kids' playroom and playground, the Vi & Ew mascots welcoming children at check-in, a weekly entertainment programme for adults and children, and a Kids Corner at the Acquamarina restaurant.

**Highlights of the stay:**
* **Pools facing the Atlantic:** Outdoor pool by the sea plus a heated indoor pool for year-round swimming.
* **Spa & gym:** Health and beauty treatments, jacuzzi, sauna and a fitness room.
* **Dining by the water:** Refined, varied cuisine across the resort's restaurants and bars, with the ocean promenade at the doorstep.

Less than 12 km from Funchal, 2 km from the Garajau Nature Reserve and conveniently set between Madeira's two golf courses — quiet by the sea, close to everything.`,
    amenityIds: [15, 2, 16, 18, 23, 22, 20, 1, 4],
    lat: 32.64639865449557,
    lng: -16.82590819014718,
    address: {
      street: 'Praia dos Reis Magos',
      city: 'Caniço de Baixo',
      postal: '9125-024',
    },
    sourceSite: 'https://www.theviewshotels.pt/en/oasis/',
    photos: [
      { file: 'oasis-hero-10.jpg', alt: 'Oasis Caniço (The Views Oásis) — palm garden and ocean promenade' },
      { file: 'oasis-hero-3.jpg', alt: 'Oasis Caniço — sea-view room balcony over the Atlantic' },
      { file: 'oasis-pool-2.jpg', alt: 'Oasis Caniço — heated indoor pool' },
      { file: 'oasis-pool-1.jpg', alt: 'Oasis Caniço — outdoor pool terrace' },
      { file: 'oasis-view-4.jpg', alt: 'Oasis Caniço — spa jacuzzi' },
      { file: 'oasis-room-1.jpg', alt: 'Oasis Caniço — spa hammam' },
      { file: 'oasis-restaurant-1.jpg', alt: 'Oasis Caniço — restaurant' },
      { file: 'oasis-hero-4.jpg', alt: 'Oasis Caniço — family dining' },
      { file: 'oasis-photo-8.jpg', alt: 'Oasis Caniço — terrace with palms' },
      { file: 'oasis-hero-11.jpg', alt: 'Oasis Caniço — snorkelling at Reis Magos beach' },
    ],
  },
  {
    slug: 'galomar-sentido',
    sourceDir: 'galomar',
    title: 'Galomar Resort',
    category: '4★ Adults-Only Eco Resort',
    hotelType: 'resort',
    shortDescription:
      'Adults-only eco-resort on the cliffs of Caniço — seawater pool, Ashoka Spa, Lido Galomar.',
    description: `Sentido Galomar — the adults-only wing of the Galo Resort — occupies a privileged position on top of the cliffs at Ponta da Oliveira, Caniço de Baixo. Built with photovoltaic panels, guest energy monitoring and endemic-plant gardens, it holds the Green Key certification and stands as a reference for sustainable stays on Madeira's south coast.

Below the cliff lies Lido Galomar, the resort's ocean bathing complex carved into the volcanic shore, with seawater pools, a sun deck and direct Atlantic access — and the base of Manta Diving at the edge of the Garajau underwater nature reserve.

**Highlights of the stay:**
* **Adults only (16+):** Sea-water pool, garden, solarium and terraces reserved for grown-up quiet.
* **Ashoka Spa:** Panoramic ocean-view saunas, indoor heated pool, massage and treatments.
* **Active by the ocean:** Yoga and meditation studio, plus diving, kayak and hiking through the Galo Resort's activity partners.

Breakfast is served at the oceanfront Atlantis restaurant; additional restaurants, bars and the sports club of Sentido Galosol are open to Galomar guests. Caniço centre is about 2.5 km away, Funchal 12 km, and the airport a 15-minute drive.`,
    amenityIds: [15, 16, 23, 2, 22, 18, 20, 1, 4],
    lat: 32.64260283660215,
    lng: -16.831914863754264,
    address: {
      street: 'Ponta da Oliveira',
      city: 'Caniço de Baixo',
      postal: '9125-031',
    },
    sourceSite: 'https://www.galoresort.com/Sentido-Hotel-Galomar/',
    photos: [
      { file: 'galomar-photo-1.jpg', alt: 'Galomar Resort — aerial view of the resort and Lido Galomar' },
      { file: 'galomar-view-5.jpg', alt: 'Galomar Resort — Lido Galomar ocean pool below the cliff' },
      { file: 'galomar-view-2.jpg', alt: 'Galomar Resort — volcanic bathing platform, direct Atlantic access' },
      { file: 'galomar-view-4.jpg', alt: 'Galomar Resort — oceanfront sun deck' },
      { file: 'galomar-hero-1.webp', alt: 'Galomar Resort — outdoor seawater pool' },
      { file: 'galomar-pool-1.jpg', alt: 'Galomar Resort — Ashoka Spa indoor pool' },
      { file: 'galomar-room-1.jpg', alt: 'Galomar Resort — yoga pavilion with ocean view' },
      { file: 'galomar-restaurant-1.jpg', alt: 'Galomar Resort — suite balcony over the Atlantic' },
      { file: 'galomar-photo-3.jpg', alt: 'Galomar Resort — Manta Diving boat, Garajau reserve' },
      { file: 'galomar-exterior-2.webp', alt: 'Galomar Resort — lobby lounge' },
    ],
  },
]

async function main() {
  const payload = await getPayload({ config })

  for (const h of HOTELS) {
    const dir = path.join(SCRAPE_BASE, h.sourceDir)
    const mediaIds: number[] = []

    for (const [i, photo] of h.photos.entries()) {
      const uploadName = `${h.slug}-official-${String(i + 1).padStart(2, '0')}.jpg`
      const existingUpload = await payload.find({
        collection: 'uploads',
        where: { filename: { equals: uploadName } },
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
        const buffer = await sharp(path.join(dir, photo.file))
          .rotate()
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer()
        const meta = await sharp(buffer).metadata()
        width = meta.width ?? MAX_WIDTH
        height = meta.height ?? 0
        const upload = await payload.create({
          collection: 'uploads',
          data: { alt: `${photo.alt} — official photo, ${h.sourceSite}` },
          file: {
            data: buffer,
            name: uploadName,
            mimetype: 'image/jpeg',
            size: buffer.length,
          },
        })
        uploadUrl = upload.url ?? undefined
        console.log(`  upload ${uploadName} -> ${uploadUrl}`)
      }
      if (!uploadUrl) throw new Error(`No URL for ${photo.file}`)

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
            alt: `${photo.alt} — official photo, ${h.sourceSite}`,
            filename: uploadName,
            mimeType: 'image/jpeg',
            width,
            height,
          },
        })
        mediaIds.push(media.id)
      }
    }

    const existing = await payload.find({
      collection: 'properties',
      where: { slug: { equals: h.slug } },
      limit: 1,
    })
    if (!existing.docs.length) {
      console.log(`SKIP ${h.slug}: no property`)
      continue
    }
    await payload.update({
      collection: 'properties',
      id: existing.docs[0].id,
      data: {
        title: h.title,
        category: h.category,
        hotelType: h.hotelType,
        media: mediaIds.map((id) => ({ image: id })),
        shortDescription: h.shortDescription,
        description: h.description,
        amenities: h.amenityIds,
        geoCoordinates: { lat: h.lat, lng: h.lng },
        address: { ...h.address, country: 'PT' },
      },
    })
    console.log(
      `OK ${h.slug} -> ${mediaIds.length} photos, id=${existing.docs[0].id}`,
    )
  }

  console.log('DONE')
  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
