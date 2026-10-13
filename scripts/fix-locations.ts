import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config })
  const funchal = (await payload.find({ collection: 'locations', where: { slug: { equals: 'funchal' } } })).docs[0]
  const canico = (await payload.find({ collection: 'locations', where: { slug: { equals: 'canico-de-baixo' } } })).docs[0]

  for (const slug of ['apartamentos-do-mar-303', 'apartamentos-do-mar-607']) {
    const d = (await payload.find({ collection: 'properties', where: { slug: { equals: slug } } })).docs[0]
    if (d) {
      await payload.update({ collection: 'properties', id: d.id, data: { location: funchal.id } })
      console.log('OK', slug, '-> funchal')
    }
  }

  const pent = (await payload.find({ collection: 'properties', where: { slug: { equals: 'penthouse-on-the-beach-madeira' } } })).docs[0]
  if (pent) {
    await payload.update({ collection: 'properties', id: pent.id, data: { location: canico.id } })
    console.log('OK penthouse -> canico-de-baixo')
  }

  await payload.update({ collection: 'locations', id: canico.id, data: { geoCoordinates: { lat: 32.64636, lng: -16.82803 } } })
  console.log('OK canico coords -> 32.64636, -16.82803')

  await payload.update({ collection: 'locations', id: funchal.id, data: {
    description: 'Rua da Quinta Calaça 3, São Martinho — quiet residential area west of Funchal, walking distance to Lido promenade and oceanfront.',
  } })
  console.log('OK funchal description updated')
  process.exit(0)
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1) })
