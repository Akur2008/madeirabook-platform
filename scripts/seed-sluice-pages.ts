import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

const R2 = 'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev/gateways'

const sluicePages = [
  {
    slug: 'dolphins',
    title: 'Dolphins at Play',
    brand: 'mb' as const,
    stateGroup: 'MB-01' as const,
    element: 'ocean' as const,
    phase: 'direct' as const,
    videoUrl: `${R2}/dolphins.mp4`,
    posterUrl: `${R2}/dolphins.jpg`,
    ambientAudioUrl: `${R2}/dolphins.m4a`,
    shortDescription: 'Ocean pulse — grounding by the sea',
    status: 'published' as const,
  },
  {
    slug: 'above-clouds',
    title: 'Above the Clouds',
    brand: 'mb' as const,
    stateGroup: 'MB-02' as const,
    element: 'terra' as const,
    phase: 'adjacent' as const,
    videoUrl: `${R2}/above-clouds.mp4`,
    posterUrl: `${R2}/above-clouds.jpg`,
    ambientAudioUrl: `${R2}/above-clouds.m4a`,
    shortDescription: 'Height and expansion above the island',
    status: 'published' as const,
  },
  {
    slug: 'levada-drone',
    title: 'Levada Flow',
    brand: 'mb' as const,
    stateGroup: 'MB-04' as const,
    element: 'forest' as const,
    phase: 'wildcard' as const,
    videoUrl: `${R2}/levada-drone.mp4`,
    posterUrl: `${R2}/levada-drone.jpg`,
    ambientAudioUrl: `${R2}/levada-drone.m4a`,
    shortDescription: 'Forest silence, ancient water channels',
    status: 'published' as const,
  },
]

export async function seedSluicePages(): Promise<void> {
  const payload = await getPayload({ config })

  console.log('🌱 Seeding sluice pages...')

  for (const page of sluicePages) {
    const existing = await payload.find({
      collection: 'sluice-pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`  - ${page.slug} already exists, skipping`)
      continue
    }

    await payload.create({ collection: 'sluice-pages', data: page })
    console.log(`  ✓ Created ${page.slug}`)
  }

  console.log('✅ Sluice pages seeding completed!')
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSluicePages()
    .then(() => {
      console.log('🎉 Sluice pages seeded successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error seeding sluice pages:', error)
      process.exit(1)
    })
}
