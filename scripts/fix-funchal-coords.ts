import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config })
  const funchal = (await payload.find({ collection: 'locations', where: { slug: { equals: 'funchal' } } })).docs[0]
  if (!funchal) { console.error('funchal location not found'); process.exit(1) }
  await payload.update({
    collection: 'locations',
    id: funchal.id,
    data: { geoCoordinates: { lat: 32.635445, lng: -16.939719 } },
  })
  console.log('OK funchal coords -> 32.635445, -16.939719')
  process.exit(0)
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1) })
