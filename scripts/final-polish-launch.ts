import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// Final launch polish: canonical street addresses + pins for the three
// headline properties, and the curated isFeaturedOasis flags that feed the
// Oasis map's Beaches/Restaurants layers.
const PROPERTIES: Record<
  string,
  {
    geo: { lat: number; lng: number }
    address: { street: string; city: string; postal: string; country: string }
  }
> = {
  'hotel-orquidea': {
    geo: { lat: 32.651, lng: -16.91 },
    address: {
      street: 'R. dos Netos 69 71, São Martinho',
      city: 'Funchal',
      postal: '9000-084',
      country: 'PT',
    },
  },
  'pestana-casino-park': {
    geo: { lat: 32.651, lng: -16.917 },
    address: {
      street: 'R. Imperatriz D. Amelia',
      city: 'Funchal',
      postal: '9000-018',
      country: 'PT',
    },
  },
  'savoy-palace': {
    geo: { lat: 32.6457, lng: -16.9326 },
    address: {
      street: 'R. Imperatriz D. Amelia',
      city: 'Funchal',
      postal: '9004-549',
      country: 'PT',
    },
  },
}

const FEATURED_BEACHES = ['seixal-beach', 'lido-complex-beach']
const FEATURED_RESTAURANTS = ['il-gallo-doro']

async function setFeatured(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: 'beaches' | 'restaurants',
  slugs: string[],
) {
  for (const slug of slugs) {
    const found = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const doc = found.docs[0]
    if (!doc) {
      console.log(`${collection}/${slug}: NOT FOUND`)
      continue
    }
    await payload.update({
      collection,
      id: doc.id,
      data: { isFeaturedOasis: true },
    })
    console.log(`${collection}/${slug}: isFeaturedOasis -> true`)
  }
}

async function main() {
  const payload = await getPayload({ config })

  for (const [slug, data] of Object.entries(PROPERTIES)) {
    const found = await payload.find({
      collection: 'properties',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const doc = found.docs[0]
    if (!doc) {
      console.log(`${slug}: NOT FOUND`)
      continue
    }
    await payload.update({
      collection: 'properties',
      id: doc.id,
      data: {
        geoCoordinates: data.geo,
        address: data.address,
      },
    })
    console.log(
      `${slug}: geo -> ${JSON.stringify(data.geo)} | addr -> ${JSON.stringify(data.address)}`,
    )
  }

  await setFeatured(payload, 'beaches', FEATURED_BEACHES)
  await setFeatured(payload, 'restaurants', FEATURED_RESTAURANTS)

  process.exit(0)
}
main().catch((e) => {
  console.error('ERR:', e.message)
  process.exit(1)
})
