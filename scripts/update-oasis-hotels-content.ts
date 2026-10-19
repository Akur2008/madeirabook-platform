import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import os from 'node:os'
import path from 'node:path'

// Replaces Unsplash placeholder content on madeiraoasis Properties with real
// photos (uploaded to R2 via `uploads`, referenced through `media` docs) and
// real descriptions scraped from each hotel's official website.
// Idempotent: re-running reuses uploads/media matched by filename/url.

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
  alt: string
  photos: string[]
  shortDescription: string
  description: string
  amenityKeys: string[]
  lat?: number
  lng?: number
}

const HOTELS: HotelCfg[] = [
  {
    slug: 'the-cliff-bay',
    alt: 'The Cliff Bay — PortoBay, Funchal, Madeira',
    photos: [
      'the-cliff-bay-view-1.webp',
      'the-cliff-bay-view-3.jpg',
      'the-cliff-bay-photo-1.jpg',
      'the-cliff-bay-view-4.jpg',
      'the-cliff-bay-room-1.jpg',
      'the-cliff-bay-view-6.jpg',
      'the-cliff-bay-photo-2.jpg',
      'the-cliff-bay-view-8.jpg',
    ],
    shortDescription:
      'Perched on a natural promontory above Funchal bay — direct sea access, subtropical gardens and the two-Michelin-star Il Gallo d’Oro.',
    description: `The jewel in the crown of PortoBay Hotels & Resorts, The Cliff Bay sits high on a natural promontory overlooking the bay of Funchal. Its direct access to the sea, gardens surrounding the esplanades and views over the Atlantic define the stay.

**Highlights of the stay:**
* **Il Gallo d’Oro:** Two Michelin stars, a Michelin Green Star and a Michelin-awarded sommelier.
* **Ocean spa:** Eight treatment rooms, Turkish steam bath, jacuzzi, sauna and relaxation rooms.
* **Sea-level pool deck:** Outdoor saltwater pool at sea level, heated indoor/outdoor pool and a private bathing platform in the ocean.`,
    amenityKeys: ['oceanView', 'spa', 'fineDining', 'seaAccess', 'concierge', 'transfer'],
    lat: 32.638236,
    lng: -16.926251,
  },
  {
    slug: 'les-suites-cliff-bay',
    alt: 'Les Suites at The Cliff Bay — PortoBay, Funchal, Madeira',
    photos: [
      'les-suites-cliff-bay-view-1.webp',
      'les-suites-cliff-bay-garden-1.jpg',
      'les-suites-cliff-bay-photo-1.jpg',
      'les-suites-cliff-bay-room-1.jpg',
      'les-suites-cliff-bay-view-5.webp',
      'les-suites-cliff-bay-garden-3.jpg',
      'les-suites-cliff-bay-view-3.webp',
      'les-suites-cliff-bay-photo-2.jpg',
    ],
    shortDescription:
      'A private enclave of 23 luxury suites between two centuries-old houses, atop a promontory with ocean and garden views.',
    description: `Flanked by two centuries-old houses, Les Suites at The Cliff Bay is an exclusive five-star retreat of 23 luxury suites spread across a 6,000 m² estate above the sea. Guests enjoy an infinity pool, jacuzzi, gardens and lounges, plus an indoor pool, library, cinema room, gym and pilates room.

Dining is centred on Avista, with Asian and Mediterranean menus, and light meals at the Infinity Pool Bar — all with dream views over the Atlantic and Funchal.`,
    amenityKeys: ['oceanView', 'infinityPool', 'fineDining', 'garden', 'concierge', 'transfer'],
    lat: 32.639685,
    lng: -16.92574,
  },
  {
    slug: 'pestana-churchill-bay',
    alt: 'Pestana Churchill Bay — Câmara de Lobos, Madeira',
    photos: [
      'pestana-churchill-bay-photo-1.jpg',
      'pestana-churchill-bay-photo-8.jpg',
      'pestana-churchill-bay-photo-4.jpg',
      'pestana-churchill-bay-photo-2.jpg',
      'pestana-churchill-bay-photo-5.jpg',
      'pestana-churchill-bay-photo-6.jpg',
      'pestana-churchill-bay-photo-3.jpg',
      'pestana-churchill-bay-photo-7.jpg',
    ],
    shortDescription:
      'Historic Pousada on the seafront of Câmara de Lobos — the bay Winston Churchill painted, with a panoramic rooftop pool.',
    description: `The Pestana Churchill Bay overlooks the bay of Câmara de Lobos, a picturesque Madeiran fishing town a few minutes from Funchal. Occupying the former Council Chamber and fish wholesale market on the seafront, it was the first hotel to open in the historic centre.

Its 57 rooms are inspired by the paintings of Winston Churchill. A restaurant of regional flavours, bar and terrace by the water, a panoramic rooftop pool and a sauna complete the stay — with the promenade and the town’s culinary tradition at the doorstep.`,
    amenityKeys: ['oceanView', 'rooftop', 'fineDining', 'concierge', 'transfer'],
  },
  {
    slug: 'reids-palace-belmond',
    alt: 'Reid’s Palace, A Belmond Hotel — Funchal, Madeira',
    photos: [
      'reids-palace-belmond-exterior-1.jpg',
      'reids-palace-belmond-photo-3.jpg',
      'reids-palace-belmond-photo-1.jpg',
      'reids-palace-belmond-room-1.jpg',
      'reids-palace-belmond-room-5.jpg',
      'reids-palace-belmond-photo-2.jpg',
      'reids-palace-belmond-room-6.jpg',
      'reids-palace-belmond-room-7.jpg',
    ],
    shortDescription:
      'Madeira’s clifftop paradise since 1891 — subtropical gardens, the Michelin-starred William Restaurant and afternoon tea on the famous terrace.',
    description: `Overlooking the Atlantic Ocean, Reid’s Palace has remained the ultimate place to unwind in the Madeiran sunshine since the Reid family opened it in 1891. Kings, writers and film stars have all found their slice of paradise amid its lush subtropical gardens.

The hotel offers 126 rooms and suites, the Michelin-starred William Restaurant, Ristorante Villa Cipriani, al fresco Brisa do Mar, traditional afternoon tea, three outdoor swimming pools, the Maré Spa and direct access to the sea.`,
    amenityKeys: ['oceanView', 'spa', 'fineDining', 'garden', 'seaAccess', 'concierge'],
    lat: 32.640836,
    lng: -16.924231,
  },
  {
    slug: 'savoy-palace',
    alt: 'Savoy Palace — Funchal, Madeira',
    photos: [
      'savoy-palace-photo-2.jpg',
      'savoy-palace-photo-4.jpg',
      'savoy-palace-photo-5.jpg',
      'savoy-palace-photo-6.jpg',
      'savoy-palace-photo-7.jpg',
      'savoy-palace-photo-8.jpg',
      'savoy-palace-photo-9.jpg',
      'savoy-palace-photo-10.jpg',
    ],
    shortDescription:
      'A superior 5-star in the heart of Funchal — member of The Leading Hotels of the World, inspired by Madeira’s landscapes and traditions.',
    description: `Savoy Palace is a superior five-star hotel in Funchal, member of The Leading Hotels of the World and Virtuoso. Inspired by the lush landscapes and century-old traditions of Madeira, its design pays homage to the island, with superb views over the Atlantic, the mountains and the hotel’s gardens.

Individually created areas give the resort the atmosphere of a boutique hotel — rooftop pool, spa, and a collection of restaurants and bars above the bay of Funchal.`,
    amenityKeys: ['rooftop', 'spa', 'fineDining', 'infinityPool', 'concierge', 'transfer'],
  },
  {
    slug: 'royal-savoy',
    alt: 'Royal Savoy — Funchal, Madeira',
    photos: [
      'royal-savoy-photo-2.jpg',
      'royal-savoy-photo-4.jpg',
      'royal-savoy-photo-5.jpg',
      'royal-savoy-photo-6.jpg',
      'royal-savoy-photo-7.jpg',
      'royal-savoy-photo-8.jpg',
      'royal-savoy-photo-9.jpg',
      'royal-savoy-photo-10.jpg',
    ],
    shortDescription:
      'Heritage sea resort with decades of service by the ocean — 174 rooms, private sea access and the classic English sense of comfort.',
    description: `Royal Savoy is a five-star heritage sea resort on Madeira Island, shaped by decades of hospitality and the historic bond between the island and the United Kingdom. A collection of artefacts from around the world gives the interiors their atmosphere of history and tradition.

The hotel features 174 bedrooms, a spa and gym, four swimming pools, private sea access, five restaurants and bars, and a paddle court — generous spaces for guests seeking warmth, comfort and indulgent suites by the sea.`,
    amenityKeys: ['oceanView', 'spa', 'infinityPool', 'seaAccess', 'garden', 'concierge'],
  },
  {
    slug: 'quinta-da-casa-branca',
    alt: 'Quinta da Casa Branca — Funchal, Madeira',
    photos: [
      'quinta-da-casa-branca-garden-1.jpg',
      'quinta-da-casa-branca-photo-1.jpg',
      'quinta-da-casa-branca-garden-2.jpg',
      'quinta-da-casa-branca-room-1.jpg',
      'quinta-da-casa-branca-garden-3.jpg',
      'quinta-da-casa-branca-garden-4.jpg',
      'quinta-da-casa-branca-room-2.jpg',
      'quinta-da-casa-branca-room-3.jpg',
    ],
    shortDescription:
      'A five-star boutique hotel in the heart of a botanical garden near the centre of Funchal — an old estate away from the bustle of the city.',
    description: `Quinta da Casa Branca is a five-star boutique hotel set in the lush gardens of an old garden estate, near the centre of Funchal yet removed from its bustle. Over the years the estate has grown into what the family calls a true “Collection of Nature’s Works of Art” — from the camphor trees at the entrance to rare specimens gathered across the grounds.

Rooms and suites sit among the gardens and the estate’s banana plantation, with a pool, garden pavilions and a restaurant in the former manor house.`,
    amenityKeys: ['garden', 'infinityPool', 'fineDining', 'wine', 'concierge', 'transfer'],
  },
  {
    slug: 'enoteca-quinta-da-serra',
    alt: 'Enoteca Quinta da Serra — Jardim da Serra, Madeira',
    photos: [
      'enoteca-quinta-da-serra-hero-2.webp',
      'enoteca-quinta-da-serra-exterior-5.webp',
      'enoteca-quinta-da-serra-pool-2.webp',
      'enoteca-quinta-da-serra-view-6.webp',
      'enoteca-quinta-da-serra-room-3.webp',
      'enoteca-quinta-da-serra-room-6.webp',
      'enoteca-quinta-da-serra-photo-5.webp',
      'enoteca-quinta-da-serra-exterior-2.webp',
    ],
    shortDescription:
      'A wine-estate retreat high in Jardim da Serra at 820 m — organic gardens, a panoramic indoor pool and valley views down to the Atlantic.',
    description: `Set at 820 metres above sea level in Jardim da Serra, this wine-estate hotel occupies a 14-hectare property of gardens, vineyards and preserved nature. Organic agriculture and certified BIO cuisine define the kitchen, where the estate’s own produce reaches the table.

Days unfold between the heated indoor pool, the spa and jacuzzi, the century-old gardens and the social rooms of the historic building — with levada trails and viewpoints minutes away and Funchal 15 km below.`,
    amenityKeys: ['infinityPool', 'spa', 'wine', 'garden', 'fineDining', 'transfer'],
  },
  {
    slug: 'aqua-natura-bay',
    alt: 'Aqua Natura Bay — Porto Moniz, Madeira',
    photos: [
      'aqua-natura-bay-exterior-1.jpg',
      'aqua-natura-bay-restaurant-1.jpg',
      'aqua-natura-bay-pool-1.jpg',
      'aqua-natura-bay-exterior-2.jpg',
      'aqua-natura-bay-exterior-3.jpg',
      'aqua-natura-bay-exterior-4.jpg',
      'aqua-natura-bay-restaurant-2.jpg',
      'aqua-natura-bay-restaurant-3.jpg',
    ],
    shortDescription:
      'A four-star hotel in Porto Moniz between the Atlantic and the north-coast mountains — next to the world-renowned natural swimming pools.',
    description: `Aqua Natura Bay stands in the village of Porto Moniz on Madeira’s north coast, between views over the Atlantic Ocean and the imposing mountainside. The world-renowned natural swimming pools and the Laurissilva forest — UNESCO Natural Heritage — are at its doorstep.

The wellness centre offers an outdoor pool with ocean views, indoor pool, sauna, jacuzzi, Turkish bath and massage treatments. The Lapa Bay restaurant pairs local flavours with the warmth of the north coast, and diving in the Madeira Aquarium is a signature experience.`,
    amenityKeys: ['oceanView', 'seaAccess', 'spa', 'fineDining', 'concierge'],
  },
  {
    slug: 'castanheiro-boutique-hotel',
    alt: 'Castanheiro Boutique Hotel — Funchal, Madeira',
    photos: [
      'castanheiro-boutique-hotel-pool-1.jpg',
      'castanheiro-boutique-hotel-view-1.jpg',
      'castanheiro-boutique-hotel-garden-1.jpg',
      'castanheiro-boutique-hotel-room-1.jpg',
      'castanheiro-boutique-hotel-room-2.jpg',
      'castanheiro-boutique-hotel-room-3.jpg',
      'castanheiro-boutique-hotel-pool-2.jpg',
      'castanheiro-boutique-hotel-exterior-3.jpg',
    ],
    shortDescription:
      'A design boutique hotel in the heart of Funchal’s old town — five historic buildings, a rooftop lap pool over the rooftops and a living gallery of Portuguese art.',
    description: `Castanheiro Boutique Hotel blends five historic buildings in the centre of Funchal into an innovative design concept, steps from the marina and the old town. Each wing carries its own era — from 18th-century façades to modernist lines — with Portuguese art throughout.

On the rooftop, a lap pool and bar look over the red roofs to the bay. A year-round outdoor pool, spa with hydrotherapy circuit and hot tub, and the Tipografia restaurant complete the stay.`,
    amenityKeys: ['rooftop', 'spa', 'fineDining', 'wine', 'concierge'],
    lat: 32.6497773,
    lng: -16.9100901,
  },
  {
    slug: 'quinta-do-furao',
    alt: 'Quinta do Furão — Santana, Madeira',
    photos: [
      'quinta-do-furao-photo-1.jpg',
      'quinta-do-furao-room-1.jpg',
      'quinta-do-furao-photo-2.jpg',
      'quinta-do-furao-exterior-2.jpg',
      'quinta-do-furao-restaurant-1.jpg',
      'quinta-do-furao-room-2.jpg',
      'quinta-do-furao-room-3.jpg',
      'quinta-do-furao-exterior-1.jpg',
    ],
    shortDescription:
      'A wine-growing estate on the cliffs of Santana’s north coast — vineyards, ocean-view rooms and a renowned regional restaurant.',
    description: `Quinta do Furão is a working wine estate set on the cliffs above the Atlantic near Santana, on Madeira’s green north coast. Rooms face the sea, the mountains or the estate’s own vineyards and gardens, decorated in light, warm tones.

The estate’s restaurant is one of the island’s most loved tables for regional cuisine — espetada, Madeiran specialities and wines from the property’s cellar. Levada walks, vineyards and the dramatic coastline begin at the doorstep.`,
    amenityKeys: ['oceanView', 'wine', 'fineDining', 'garden', 'transfer'],
  },
  {
    slug: 'hotel-suite-eden-mar',
    alt: 'Suite Hotel Eden Mar — PortoBay, Funchal, Madeira',
    photos: [
      'hotel-suite-eden-mar-view-1.webp',
      'hotel-suite-eden-mar-pool-1.webp',
      'hotel-suite-eden-mar-view-2.webp',
      'hotel-suite-eden-mar-pool-2.webp',
      'hotel-suite-eden-mar-photo-1.jpg',
      'hotel-suite-eden-mar-view-3.webp',
      'hotel-suite-eden-mar-pool-3.webp',
      'hotel-suite-eden-mar-photo-2.jpg',
    ],
    shortDescription:
      'An all-suite tropical resort by the ocean in Funchal — part of the Vila Porto Mare resort with 5 pools, 5 restaurants and gardens.',
    description: `Suite Hotel Eden Mar occupies the eastern section of the Vila Porto Mare resort in Funchal’s hotel zone, and shares all of its facilities — five restaurants, three bars, five pools, a spa and sports fields amid tropical gardens.

Its 146 suites and rooms come with kitchenettes and terraces, combining apartment-style independence with full resort service, entertainment and live music throughout the year.`,
    amenityKeys: ['oceanView', 'infinityPool', 'spa', 'seaAccess', 'garden', 'fineDining'],
    lat: 32.63753,
    lng: -16.931365,
  },
  {
    slug: 'pestana-promenade',
    alt: 'Pestana Promenade — Funchal, Madeira',
    photos: [
      'pestana-promenade-photo-1.jpg',
      'pestana-promenade-view-1.jpg',
      'pestana-promenade-room-1.jpg',
      'pestana-promenade-room-2.jpg',
      'pestana-promenade-room-3.jpg',
      'pestana-promenade-room-4.jpg',
      'pestana-promenade-room-5.jpg',
      'pestana-promenade-room-6.jpg',
    ],
    shortDescription:
      'One of the tallest hotels in Funchal, two minutes from the beach — gardens, one of the island’s largest pools and direct access to the Lido promenade.',
    description: `The Pestana Promenade is a four-star hotel in Funchal, a two-minute walk from the beach and the Lido, with direct access to the promenade that stretches all the way to Praia Formosa.

Vast gardens surround one of the largest swimming pools on the island, joined by an indoor pool, spa, jacuzzi and restaurants. Rooms look over the gardens, the pool or the Atlantic — with Funchal’s restaurant quarter close by.`,
    amenityKeys: ['oceanView', 'infinityPool', 'spa', 'seaAccess', 'concierge'],
  },
  {
    slug: 'estalagem-da-ponta-do-sol',
    alt: 'Estalagem da Ponta do Sol — Ponta do Sol, Madeira',
    photos: [
      'estalagem-da-ponta-do-sol-exterior-1.jpg',
      'estalagem-da-ponta-do-sol-exterior-2.webp',
      'estalagem-da-ponta-do-sol-room-1.jpg',
      'estalagem-da-ponta-do-sol-room-2.jpg',
      'estalagem-da-ponta-do-sol-exterior-3.jpg',
      'estalagem-da-ponta-do-sol-room-3.jpg',
      'estalagem-da-ponta-do-sol-room-4.jpg',
      'estalagem-da-ponta-do-sol-exterior-4.jpg',
    ],
    shortDescription:
      'The escape hotel on a cliff above Ponta do Sol — minimalist design, panoramic glass, infinity pool and the sunniest sunsets on the island.',
    description: `Set on the top of a cliff above Ponta do Sol — the sunniest point of Madeira — the Estalagem is the island’s original escape hotel. The decoration is deliberately minimalist in shades of black and white, so the natural beauty outside the panoramic windows stays centre stage.

Rooms have balconies or terraces facing the ocean. The infinity pool, wellness spa and a cultural programme of concerts and events make it a landmark of the south coast — quiet, architectural and impossibly scenic.`,
    amenityKeys: ['oceanView', 'infinityPool', 'spa', 'fineDining', 'concierge'],
    lat: 32.679756,
    lng: -17.103612,
  },
]

async function main() {
  const payload = await getPayload({ config })

  for (const h of HOTELS) {
    const dir = path.join(BASE, h.slug)
    const mediaIds: number[] = []

    for (const file of h.photos) {
      const uploadName = file.replace(/\.(webp|png|avif)$/i, '.jpg')
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
        const buffer = await sharp(path.join(dir, file))
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
            name: uploadName,
            mimetype: 'image/jpeg',
            size: buffer.length,
          },
        })
        uploadUrl = upload.url ?? undefined
        console.log(`  upload ${uploadName} -> ${uploadUrl}`)
      }
      if (!uploadUrl) throw new Error(`No URL for ${uploadName}`)

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
    const data: Record<string, unknown> = {
      media: mediaIds.map((id) => ({ image: id })),
      shortDescription: h.shortDescription,
      description: h.description,
      amenities: h.amenityKeys.map((k) => AMENITY_IDS[k]).filter(Boolean),
    }
    if (h.lat && h.lng) data.geoCoordinates = { lat: h.lat, lng: h.lng }
    await payload.update({ collection: 'properties', id: existing.docs[0].id, data })
    console.log(`OK ${h.slug} -> ${mediaIds.length} photos, id=${existing.docs[0].id}`)
  }

  console.log('DONE')
  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
