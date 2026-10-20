import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// slug -> target geoCoordinates
const COORDS: Record<string, { lat: number; lng: number }> = {
  'savoy-palace': { lat: 32.6457, lng: -16.9326 },
  'royal-savoy': { lat: 32.6457, lng: -16.9326 },
  'pestana-promenade': { lat: 32.6348, lng: -16.9363 },
  'pestana-casino-park': { lat: 32.651, lng: -16.917 },
  // task slug "pestana-carlton" does not exist; real slug is pestana-carlton-madeira
  'pestana-carlton-madeira': { lat: 32.643, lng: -16.922 },
  'pestana-vila-lido': { lat: 32.636, lng: -16.931 },
  'hotel-alto-lido': { lat: 32.638, lng: -16.937 },
  'enotel-lido': { lat: 32.638, lng: -16.936 },
  'pestana-churchill-bay': { lat: 32.6499, lng: -16.9772 },
}

const ORQUIDEA_ADDRESS = {
  street: 'Rua dos Netos 69-71',
  city: 'Funchal',
  postal: '9000-084',
  country: 'PT',
}

async function main() {
  const payload = await getPayload({ config })

  for (const [slug, geo] of Object.entries(COORDS)) {
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
    const old = doc.geoCoordinates
    await payload.update({
      collection: 'properties',
      id: doc.id,
      data: { geoCoordinates: geo },
    })
    console.log(`${slug}: ${JSON.stringify(old)} -> ${JSON.stringify(geo)}`)
  }

  const orq = await payload.find({
    collection: 'properties',
    where: { slug: { equals: 'hotel-orquidea' } },
    limit: 1,
  })
  const orqDoc = orq.docs[0]
  if (!orqDoc) {
    console.log('hotel-orquidea: NOT FOUND')
  } else {
    await payload.update({
      collection: 'properties',
      id: orqDoc.id,
      data: { address: ORQUIDEA_ADDRESS },
    })
    console.log(`hotel-orquidea: address -> ${JSON.stringify(ORQUIDEA_ADDRESS)}`)
  }
  process.exit(0)
}
main().catch((e) => {
  console.error('ERR:', e.message)
  process.exit(1)
})
