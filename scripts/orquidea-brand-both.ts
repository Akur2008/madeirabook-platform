import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// Hotel Orquídea is the golden-standard card on BOTH maps: brand 'both'
// keeps it on madeirabook (/p/*) and publishes it on the Oasis map and
// /hotels/hotel-orquidea on madeiraoasis.com.
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
  if (doc.brand === 'both') {
    console.log('hotel-orquidea: already brand=both')
    process.exit(0)
  }
  await payload.update({
    collection: 'properties',
    id: doc.id,
    data: { brand: 'both' },
  })
  console.log(`hotel-orquidea: brand ${doc.brand} -> both`)
  process.exit(0)
}
main().catch((e) => {
  console.error('ERR:', e.message)
  process.exit(1)
})
