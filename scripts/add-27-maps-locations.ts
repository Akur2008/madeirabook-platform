import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Adds locations resolved from 27 Google Maps short links (feat/add-27-maps-locations).
// Idempotent: matched by slug; existing docs get geoCoordinates corrected when the
// Google-resolved position differs by more than ~100 m. Places that already exist
// in the CMS (Balcões, Eira do Serrado, Cabo Girão, Fanal, Seixal beach, Prainha,
// Lido complex, PR1, Vista Balancal) are only coord-updated, never duplicated.
//
// Collection mapping (task brief asked for "category" on beaches — that field does
// not exist; the real schema has dedicated collections):
//   beach/lido/pools  -> beaches
//   miradouro/nature/attraction/other -> viewpoints
//   trail/PR          -> trails
//   restaurant        -> restaurants
//   hotel 5*/spa/r&c  -> properties brand=madeiraoasis (shown on /oasis)
//   hotel 4*/villa    -> properties brand=madeirabook (shown on /explore)

const DIST_EPS = 0.001 // ~100 m

interface Resolved {
  slug: string
  name: string
  lat: number
  lng: number
}

const BEACHES_NEW: (Resolved & { shortDescription: string })[] = [
  {
    slug: 'seixal-natural-pools',
    name: 'Seixal Natural Pools',
    lat: 32.8232092,
    lng: -17.1029264,
    shortDescription:
      'Natural lava-rock swimming pools on the Seixal shore below the green north-coast cliffs.',
  },
]

// resolved google coords for places that already exist in the CMS
const EXISTING_COORD_FIXES: { collection: string; slug: string; lat: number; lng: number }[] = [
  { collection: 'beaches', slug: 'seixal-beach', lat: 32.8222844, lng: -17.1031012 },
  { collection: 'beaches', slug: 'prainha-de-canical', lat: 32.7428699, lng: -16.7160549 },
  { collection: 'beaches', slug: 'lido-complex-beach', lat: 32.6358568, lng: -16.9323929 },
  { collection: 'viewpoints', slug: 'balcoes-ribeiro-frio', lat: 32.7415585, lng: -16.8902812 },
  { collection: 'viewpoints', slug: 'eira-do-serrado', lat: 32.7101123, lng: -16.9657381 },
  { collection: 'viewpoints', slug: 'miradouro-do-fanal', lat: 32.8096141, lng: -17.1438626 },
  { collection: 'viewpoints', slug: 'cabo-girao', lat: 32.6554974, lng: -17.0042461 },
  { collection: 'trails', slug: 'vereda-do-areeiro', lat: 32.7354833, lng: -16.9287991 },
  { collection: 'restaurants', slug: 'vista-balancal', lat: 32.6531213, lng: -16.8722773 },
]

const VIEWPOINTS_NEW: (Resolved & { shortDescription: string; type?: string })[] = [
  {
    slug: 'palacio-monte-madeira',
    name: 'Palácio Monte Madeira',
    lat: 32.6760253,
    lng: -16.9010704,
    shortDescription:
      'Historic palace and tropical gardens in Monte above Funchal, with panoramic views and a wine lodge.',
  },
  {
    slug: 'salto-do-patagarro',
    name: 'Cascata do Salto do Patagarro',
    lat: 32.7053966,
    lng: -16.9211385,
    shortDescription:
      'Tall waterfall cascading down the green slopes of the Funchal mountains.',
  },
  {
    slug: 'arvores-magicas-ribeiro-frio',
    name: 'Árvores Mágicas do Ribeiro Frio',
    lat: 32.7195845,
    lng: -16.8878906,
    shortDescription:
      'A grove of twisted moss-covered trees near Ribeiro Frio on the ER103 mountain road.',
  },
  {
    slug: 'ribeiro-frio',
    name: 'Ribeiro Frio',
    lat: 32.7333325,
    lng: -16.883333,
    shortDescription:
      'Laurel-forest park and trout farm at 860 m — trailhead for PR10, PR11 and the Balcões walk.',
  },
  {
    slug: 'santo-da-serra-golf-club',
    name: 'Santo da Serra Golf Club',
    lat: 32.722271,
    lng: -16.8038082,
    shortDescription:
      '27-hole golf course on the Santo da Serra plateau with views over Machico bay and the Atlantic.',
  },
  {
    slug: 'palheiro-golf',
    name: 'Palheiro Golf',
    lat: 32.653133,
    lng: -16.872157,
    shortDescription:
      '18-hole golf course in the Palheiro estate hills above Funchal, beside the Casa Velha hotel.',
  },
]

const RESTAURANTS_NEW: (Resolved & { shortDescription: string; cuisine: string; tier: string })[] = [
  {
    slug: 'marealta',
    name: 'MaréAlta - Peixe & Mariscos',
    lat: 32.7174812,
    lng: -16.7640459,
    shortDescription: 'Fish and seafood restaurant on the Machico waterfront.',
    cuisine: 'Seafood',
    tier: 'heritage',
  },
  {
    slug: 'abrigo-do-poiso',
    name: 'Abrigo do Poiso',
    lat: 32.7123838,
    lng: -16.8880419,
    shortDescription:
      'Mountain-lodge restaurant in Poiso on the road to Pico do Arieiro — espetada and poncha.',
    cuisine: 'Madeiran',
    tier: 'heritage',
  },
]

const LOCATIONS_NEW: Resolved[] = [
  { slug: 'estreito-da-calheta', name: 'Estreito da Calheta', lat: 32.7300565, lng: -17.194027 },
  { slug: 'sao-vicente', name: 'São Vicente', lat: 32.7968, lng: -17.0435 },
  { slug: 'santo-antonio-da-serra', name: 'Santo António da Serra', lat: 32.7225, lng: -16.8153 },
  { slug: 'sao-goncalo', name: 'São Gonçalo', lat: 32.658, lng: -16.8674 },
]

interface PropertySeed extends Resolved {
  title: string
  brand: 'madeirabook' | 'madeiraoasis'
  hotelType: 'hotel' | 'villa'
  category: string
  shortDescription: string
  pricePerNight: number
  locationSlug: string
}

const PROPERTIES_NEW: PropertySeed[] = [
  {
    slug: 'cliffscape-by-ourmadeira',
    title: 'Cliffscape by OurMadeira',
    name: 'Cliffscape by OurMadeira',
    lat: 32.7300565,
    lng: -17.194027,
    brand: 'madeirabook',
    hotelType: 'villa',
    category: 'Cliff-top Holiday Villa',
    shortDescription:
      'Modern cliff-top villa in Estreito da Calheta with ocean views, pool and sunset-facing terraces.',
    pricePerNight: 350,
    locationSlug: 'estreito-da-calheta',
  },
  {
    slug: 'estalagem-do-vale',
    title: 'Estalagem do Vale',
    name: 'Estalagem do Vale',
    lat: 32.7909985,
    lng: -17.0387612,
    brand: 'madeirabook',
    hotelType: 'hotel',
    category: '4★ São Vicente Valley Hotel',
    shortDescription:
      'Country hotel in the green São Vicente valley — pool, gardens and mountain views on the north coast.',
    pricePerNight: 110,
    locationSlug: 'sao-vicente',
  },
  {
    slug: 'portobay-serra-golf',
    title: 'Hotel PortoBay Serra Golf',
    name: 'Hotel PortoBay Serra Golf',
    lat: 32.722494,
    lng: -16.8152546,
    brand: 'madeirabook',
    hotelType: 'hotel',
    category: '4★ Golf Hotel, Santo da Serra',
    shortDescription:
      '4★ hotel inside the Santo da Serra golf estate — gardens, tea house and fairway views.',
    pricePerNight: 160,
    locationSlug: 'santo-antonio-da-serra',
  },
  {
    slug: 'hotel-alto-lido',
    title: 'Hotel Alto Lido',
    name: 'Hotel Alto Lido',
    lat: 32.6382248,
    lng: -16.9367076,
    brand: 'madeirabook',
    hotelType: 'hotel',
    category: '4★ Lido District Hotel',
    shortDescription:
      '4★ hotel on Estrada Monumental in the Lido district — pools, restaurants and the promenade at the doorstep.',
    pricePerNight: 120,
    locationSlug: 'funchal',
  },
  {
    slug: 'portobay-santa-maria',
    title: 'Hotel PortoBay Santa Maria',
    name: 'Hotel PortoBay Santa Maria',
    lat: 32.6470797,
    lng: -16.9007063,
    brand: 'madeirabook',
    hotelType: 'hotel',
    category: '4★ Aparthotel, Funchal Seafront',
    shortDescription:
      '4★ aparthotel on the Funchal seafront promenade — studios with kitchenettes and an outdoor pool.',
    pricePerNight: 140,
    locationSlug: 'funchal',
  },
  {
    slug: 'casa-velha-do-palheiro',
    title: 'Casa Velha do Palheiro — Relais & Châteaux',
    name: 'Casa Velha do Palheiro',
    lat: 32.6580288,
    lng: -16.8673696,
    brand: 'madeiraoasis',
    hotelType: 'hotel',
    category: '5★ Relais & Châteaux Country House',
    shortDescription:
      'Relais & Châteaux country house in the Palheiro gardens — fine dining, spa and the estate golf course.',
    pricePerNight: 240,
    locationSlug: 'sao-goncalo',
  },
  {
    slug: 'enotel-lido',
    title: 'Enotel Lido Madeira — All Inclusive',
    name: 'Enotel Lido Madeira',
    lat: 32.637533,
    lng: -16.9356384,
    brand: 'madeiraoasis',
    hotelType: 'hotel',
    category: '5★ All-Inclusive Oceanfront Resort',
    shortDescription:
      '5★ all-inclusive resort on the Lido promenade — four restaurants, infinity pool, spa and sea views.',
    pricePerNight: 280,
    locationSlug: 'funchal',
  },
  {
    slug: 'pestana-vila-lido',
    title: 'Pestana Vila Lido Madeira',
    name: 'Pestana Vila Lido Madeira',
    lat: 32.636344,
    lng: -16.930556,
    brand: 'madeiraoasis',
    hotelType: 'hotel',
    category: '5★ Oceanfront Hotel',
    shortDescription:
      '5★ oceanfront hotel in the Lido area — panoramic pool deck, direct promenade access and Atlantic views.',
    pricePerNight: 320,
    locationSlug: 'funchal',
  },
  {
    slug: 'pestana-carlton-madeira',
    title: 'Pestana Carlton Madeira',
    name: 'Pestana Carlton Madeira',
    lat: 32.642592,
    lng: -16.921813,
    brand: 'madeiraoasis',
    hotelType: 'hotel',
    category: '5★ Landmark Ocean Resort',
    shortDescription:
      'Iconic 5★ resort above Funchal bay — cliff-top pools, diving centre, gardens and four restaurants.',
    pricePerNight: 250,
    locationSlug: 'funchal',
  },
]

async function upsert(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: 'beaches' | 'viewpoints' | 'trails' | 'restaurants' | 'properties' | 'locations',
  slug: string,
  data: Record<string, unknown>,
): Promise<'created' | 'updated'> {
  const existing = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
  if (existing.docs.length > 0) {
    await payload.update({ collection, id: existing.docs[0].id, data: data as never })
    return 'updated'
  }
  await payload.create({ collection, data: data as never })
  return 'created'
}

async function main() {
  const payload = await getPayload({ config })

  // --- locations ---
  const locationBySlug = new Map<string, number | string>()
  const allLocations = await payload.find({ collection: 'locations', limit: 300 })
  for (const l of allLocations.docs) locationBySlug.set(l.slug, l.id)
  for (const loc of LOCATIONS_NEW) {
    if (!locationBySlug.has(loc.slug)) {
      const created = await payload.create({
        collection: 'locations',
        data: { name: loc.name, slug: loc.slug, geoCoordinates: { lat: loc.lat, lng: loc.lng } },
      })
      locationBySlug.set(loc.slug, created.id)
      console.log(`OK location ${loc.slug} id=${created.id}`)
    }
  }

  // --- coord fixes on existing docs (only when they differ > ~100 m) ---
  for (const fix of EXISTING_COORD_FIXES) {
    const collection = fix.collection as 'beaches'
    const existing = await payload.find({
      collection,
      where: { slug: { equals: fix.slug } },
      limit: 1,
    })
    const doc = existing.docs[0]
    if (!doc) {
      console.log(`MISS ${fix.collection}/${fix.slug}`)
      continue
    }
    const cur = (doc as { geoCoordinates?: { lat?: number; lng?: number } }).geoCoordinates
    if (
      cur?.lat != null &&
      cur?.lng != null &&
      Math.abs(cur.lat - fix.lat) < DIST_EPS &&
      Math.abs(cur.lng - fix.lng) < DIST_EPS
    ) {
      console.log(`SAME ${fix.collection}/${fix.slug}`)
      continue
    }
    await payload.update({
      collection,
      id: doc.id,
      data: { geoCoordinates: { lat: fix.lat, lng: fix.lng } } as never,
    })
    console.log(`FIXED ${fix.collection}/${fix.slug} -> ${fix.lat},${fix.lng}`)
  }

  // --- new beaches ---
  for (const b of BEACHES_NEW) {
    const r = await upsert(payload, 'beaches', b.slug, {
      name: b.name,
      slug: b.slug,
      shortDescription: b.shortDescription,
      geoCoordinates: { lat: b.lat, lng: b.lng },
      status: 'published',
    })
    console.log(`${r.toUpperCase()} beach ${b.slug}`)
  }

  // --- new viewpoints ---
  for (const v of VIEWPOINTS_NEW) {
    const r = await upsert(payload, 'viewpoints', v.slug, {
      name: v.name,
      slug: v.slug,
      shortDescription: v.shortDescription,
      geoCoordinates: { lat: v.lat, lng: v.lng },
      ...(v.type ? { type: v.type } : {}),
      status: 'published',
    })
    console.log(`${r.toUpperCase()} viewpoint ${v.slug}`)
  }

  // --- new restaurants ---
  for (const rest of RESTAURANTS_NEW) {
    const r = await upsert(payload, 'restaurants', rest.slug, {
      name: rest.name,
      slug: rest.slug,
      shortDescription: rest.shortDescription,
      cuisine: rest.cuisine,
      tier: rest.tier,
      geoCoordinates: { lat: rest.lat, lng: rest.lng },
      status: 'published',
    })
    console.log(`${r.toUpperCase()} restaurant ${rest.slug}`)
  }

  // --- new properties ---
  for (const p of PROPERTIES_NEW) {
    const r = await upsert(payload, 'properties', p.slug, {
      title: p.title,
      slug: p.slug,
      brand: p.brand,
      hotelType: p.hotelType,
      category: p.category,
      shortDescription: p.shortDescription,
      pricePerNight: p.pricePerNight,
      geoCoordinates: { lat: p.lat, lng: p.lng },
      location: locationBySlug.get(p.locationSlug),
      status: 'published',
      isPlatform: true,
    })
    console.log(`${r.toUpperCase()} property ${p.slug} (${p.brand})`)
  }

  console.log('DONE')
  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
