// One-off cleanup for the wrong Seixal Beach imagery:
// - clears videoFile (the shared reference-33s.mp4 upload) on every
//   beaches/viewpoints/trails/restaurants doc that still points at it
// - clears seixal-beach media[]/heroImage/posterUrl — the uploaded photos
//   show a restaurant terrace and a balcony view, not the beach. Left empty
//   on purpose: real photos get uploaded via /admin later.
import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

const run = async () => {
  const payload = await getPayload({ config: await config })

  const { docs: refVideos } = await payload.find({
    collection: 'uploads',
    where: { filename: { equals: 'reference-33s.mp4' } },
    limit: 10,
    depth: 0,
  })
  const refIds = new Set(refVideos.map((v) => v.id))
  console.log(`reference uploads: ${[...refIds].join(', ') || 'none'}`)

  for (const collection of [
    'beaches',
    'viewpoints',
    'trails',
    'restaurants',
  ] as const) {
    const { docs } = await payload.find({ collection, limit: 300, depth: 0 })
    for (const d of docs) {
      const videoId =
        typeof d.videoFile === 'object' && d.videoFile !== null
          ? d.videoFile.id
          : d.videoFile
      if (videoId != null && refIds.has(videoId)) {
        await payload.update({
          collection,
          id: d.id,
          data: { videoFile: null },
        })
        console.log(`cleared videoFile on ${collection}/${d.slug}`)
      }
    }
  }

  const { docs: seixal } = await payload.find({
    collection: 'beaches',
    where: { slug: { equals: 'seixal-beach' } },
    limit: 1,
    depth: 0,
  })
  if (!seixal[0]) {
    console.error('seixal-beach not found')
    process.exit(1)
  }
  await payload.update({
    collection: 'beaches',
    id: seixal[0].id,
    data: {
      media: [],
      heroImage: null,
      posterUrl: null,
      imageAttribution: null,
    },
  })
  console.log('cleared seixal-beach media/heroImage/posterUrl')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
