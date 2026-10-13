import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

const locations = [
  {
    name: 'Caniço de Baixo',
    slug: 'canico-de-baixo',
    geoCoordinates: { lat: 32.6453, lng: -16.8489 },
    text: 'Caniço de Baixo is a quiet coastal area east of Funchal, known for the promenade along the ocean, warm microclimate, and easy access to both Funchal and the airport.',
  },
  {
    name: 'Funchal',
    slug: 'funchal',
    geoCoordinates: { lat: 32.6669, lng: -16.9241 },
    text: 'Funchal is the capital of Madeira — a harbour city with old town, botanical gardens, and the best restaurants on the island.',
  },
]

const propertySlugs = [
  'apartamentos-do-mar-303',
  'apartamentos-do-mar-607',
  'penthouse-on-the-beach-madeira',
]

const paragraph = (text: string) => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [
          { type: 'text', text, format: 0, version: 1, mode: 'normal', style: '', detail: 0 },
        ],
      },
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

async function seedLocations(): Promise<void> {
  const payload = await getPayload({ config })

  const locationIds: Record<string, number> = {}

  for (const loc of locations) {
    const data = {
      name: loc.name,
      slug: loc.slug,
      description: paragraph(loc.text),
      geoCoordinates: loc.geoCoordinates,
    }

    const existing = await payload.find({
      collection: 'locations',
      where: { slug: { equals: loc.slug } },
      limit: 1,
    })

    const doc =
      existing.docs.length > 0
        ? await payload.update({ collection: 'locations', id: existing.docs[0].id, data })
        : await payload.create({ collection: 'locations', data })

    locationIds[loc.slug] = doc.id
    console.log(`OK location ${loc.slug}`)
  }

  const properties = await payload.find({ collection: 'properties', limit: 100 })

  for (const property of properties.docs) {
    if (!propertySlugs.includes(property.slug)) continue

    await payload.update({
      collection: 'properties',
      id: property.id,
      data: { location: locationIds['canico-de-baixo'] },
    })
    console.log(`OK link ${property.slug} → canico-de-baixo`)
  }

  console.log('Done.')
}

seedLocations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding locations:', error)
    process.exit(1)
  })
