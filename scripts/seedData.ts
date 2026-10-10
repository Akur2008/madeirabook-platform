import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

const toRichText = (text: string) => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text, version: 1 }],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
      },
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

const locations = [
  {
    name: 'Funchal',
    slug: 'funchal',
    description: 'Capital of Madeira, located on the south coast.',
    geoCoordinates: {
      lat: 32.6506,
      lng: -16.9085,
    },
  },
  {
    name: 'Caniço de Baixo',
    slug: 'canico-de-baixo',
    description: 'Coastal area known for hotels and ocean views.',
    geoCoordinates: {
      lat: 32.6436,
      lng: -16.8833,
    },
  },
  {
    name: 'Jardim da Serra',
    slug: 'jardim-da-serra',
    description: 'Mountain village with lush gardens and cloud forests.',
    geoCoordinates: {
      lat: 32.6767,
      lng: -16.9456,
    },
  },
  {
    name: 'Ponta do Sol',
    slug: 'ponta-do-sol',
    description: 'Sunny coastal village on the southwest coast.',
    geoCoordinates: {
      lat: 32.6747,
      lng: -17.0867,
    },
  },
  {
    name: 'Seixal',
    slug: 'seixal',
    description: 'Village on the north coast with waterfalls and natural pools.',
    geoCoordinates: {
      lat: 32.8233,
      lng: -17.1633,
    },
  },
]

const amenities = [
  {
    name: 'WiFi',
    icon: 'wifi',
  },
  {
    name: 'Ocean View',
    icon: 'ocean',
  },
  {
    name: 'Pool',
    icon: 'pool',
  },
  {
    name: 'Kitchen',
    icon: 'kitchen',
  },
  {
    name: 'Parking',
    icon: 'parking',
  },
  {
    name: 'Air Conditioning',
    icon: 'ac',
  },
  {
    name: 'Garden',
    icon: 'garden',
  },
  {
    name: 'Terrace',
    icon: 'terrace',
  },
]

const properties = [
  {
    title: 'Oasis Hotel Caniço',
    slug: 'oasis-hotel-cannico',
    brand: 'madeiraoasis',
    pmsPropertyId: 'ZEEV-001',
    pricePerNight: 180,
    cleaningFee: 50,
    featured: true,
    status: 'published',
  },
  {
    title: 'Quinta da Serra',
    slug: 'quinta-da-serra',
    brand: 'madeiraoasis',
    pmsPropertyId: 'ZEEV-002',
    pricePerNight: 220,
    cleaningFee: 60,
    featured: true,
    status: 'published',
  },
  {
    title: 'Estalagem Ponta do Sol',
    slug: 'estalagem-ponta-do-sol',
    brand: 'madeiraoasis',
    pmsPropertyId: 'ZEEV-003',
    pricePerNight: 250,
    cleaningFee: 70,
    featured: true,
    status: 'published',
  },
  {
    title: 'Aqua Natura Seixal',
    slug: 'aqua-natura-seixal',
    brand: 'madeiraoasis',
    pmsPropertyId: 'ZEEV-004',
    pricePerNight: 200,
    cleaningFee: 55,
    featured: true,
    status: 'published',
  },
  {
    title: 'Cliff Bay',
    slug: 'cliff-bay',
    brand: 'madeiraoasis',
    pmsPropertyId: 'ZEEV-005',
    pricePerNight: 350,
    cleaningFee: 100,
    featured: true,
    status: 'published',
  },
] as const

export async function seedData(): Promise<void> {
  const payload = await getPayload({ config })

  console.log('🌱 Seeding data...')

  // Seed Locations
  console.log('📍 Seeding Locations...')
  for (const location of locations) {
    try {
      await payload.create({
        collection: 'locations',
        data: { ...location, description: toRichText(location.description) },
      })
      console.log(`  ✓ Created location: ${location.name}`)
    } catch (error) {
      console.log(`  - Location ${location.name} already exists or error:`, error)
    }
  }

  // Seed Amenities
  console.log('🛎️  Seeding Amenities...')
  for (const amenity of amenities) {
    try {
      await payload.create({
        collection: 'amenities',
        data: amenity,
      })
      console.log(`  ✓ Created amenity: ${amenity.name}`)
    } catch (error) {
      console.log(`  - Amenity ${amenity.name} already exists or error:`, error)
    }
  }

  // Get location IDs for relationships
  const funchal = await payload.find({
    collection: 'locations',
    where: {
      slug: {
        equals: 'funchal',
      },
    },
  })

  const canico = await payload.find({
    collection: 'locations',
    where: {
      slug: {
        equals: 'canico-de-baixo',
      },
    },
  })

  const jardim = await payload.find({
    collection: 'locations',
    where: {
      slug: {
        equals: 'jardim-da-serra',
      },
    },
  })

  const ponta = await payload.find({
    collection: 'locations',
    where: {
      slug: {
        equals: 'ponta-do-sol',
      },
    },
  })

  const seixal = await payload.find({
    collection: 'locations',
    where: {
      slug: {
        equals: 'seixal',
      },
    },
  })

  // Get amenity IDs for relationships
  const allAmenities = await payload.find({
    collection: 'amenities',
  })

  // Seed Properties with relationships
  console.log('🏠 Seeding Properties...')
  const propertyLocations = [
    canico.docs[0]?.id,
    jardim.docs[0]?.id,
    ponta.docs[0]?.id,
    seixal.docs[0]?.id,
    funchal.docs[0]?.id,
  ]

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i]
    try {
      await payload.create({
        collection: 'properties',
        data: {
          ...property,
          location: propertyLocations[i],
          amenities: allAmenities.docs.map((a) => a.id),
        },
      })
      console.log(`  ✓ Created property: ${property.title}`)
    } catch (error) {
      console.log(`  - Property ${property.title} already exists or error:`, error)
    }
  }

  console.log('✅ Seeding completed!')
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData()
    .then(() => {
      console.log('🎉 Data seeded successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error seeding data:', error)
      process.exit(1)
    })
}
