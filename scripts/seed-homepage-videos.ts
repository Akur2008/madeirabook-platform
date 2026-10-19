import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

// Seeds the 9 homepage rotation videos after upload-homepage-trio.ts.
// Idempotent: skips rows whose videoUrl is already registered.

const R2 =
  process.env.R2_PUBLIC_URL || 'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev'

const ROWS = [
  {
    category: 'mountains',
    slot: 'trio-1',
    order: 1,
    title: 'Aerial above the clouds on the ridge',
    name: 'mountains-1',
  },
  {
    category: 'mountains',
    slot: 'trio-1',
    order: 2,
    title: 'Peak emerging from a sea of clouds',
    name: 'mountains-2',
  },
  {
    category: 'mountains',
    slot: 'trio-1',
    order: 3,
    title: 'Drone over cloud-filled valley at dusk',
    name: 'mountains-3',
  },
  {
    category: 'forest',
    slot: 'trio-2',
    order: 1,
    title: 'Levada path through the green hillside',
    name: 'forest-1',
  },
  {
    category: 'forest',
    slot: 'trio-2',
    order: 2,
    title: 'Laurel forest trail with ferns',
    name: 'forest-2',
  },
  {
    category: 'forest',
    slot: 'trio-2',
    order: 3,
    title: 'Mossy stream in the woods',
    name: 'forest-3',
  },
  {
    category: 'ocean',
    slot: 'trio-3',
    order: 1,
    title: 'Waves breaking on the lava cliff edge',
    name: 'ocean-1',
  },
  {
    category: 'ocean',
    slot: 'trio-3',
    order: 2,
    title: 'Coastal cliff glowing at sunset',
    name: 'ocean-2',
  },
  {
    category: 'ocean',
    slot: 'trio-3',
    order: 3,
    title: 'Green headland and surf from above',
    name: 'ocean-3',
  },
] as const

async function main() {
  const payload = await getPayload({ config: await config })

  for (const row of ROWS) {
    const videoUrl = `${R2}/homepage-video-${row.name}.mp4`
    const posterUrl = `${R2}/homepage-video-${row.name}-poster.jpg`

    const existing = await payload.find({
      collection: 'homepage-videos',
      where: { videoUrl: { equals: videoUrl } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs.length > 0) {
      console.log(`skip ${row.name} (already seeded)`)
      continue
    }

    await payload.create({
      collection: 'homepage-videos',
      data: {
        category: row.category,
        slot: row.slot,
        videoUrl,
        posterUrl,
        title: row.title,
        isActive: true,
        order: row.order,
      },
    })
    console.log(`created ${row.name}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
