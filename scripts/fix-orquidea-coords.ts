import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// Pin Orquídea on the Funchal centre coordinates (task: 32.651, -16.910).
async function main() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'properties',
    where: { slug: { equals: 'hotel-orquidea' } },
    limit: 1,
  })
  const doc = docs[0]
  if (!doc) {
    console.log('hotel-orquidea: NOT FOUND')
    process.exit(1)
  }
  const old = doc.geoCoordinates
  const geo = { lat: 32.651, lng: -16.91 }
  await payload.update({
    collection: 'properties',
    id: doc.id,
    data: { geoCoordinates: geo },
  })
  console.log(`hotel-orquidea: ${JSON.stringify(old)} -> ${JSON.stringify(geo)}`)
  process.exit(0)
}
main().catch((e) => {
  console.error('ERR:', e.message)
  process.exit(1)
})
