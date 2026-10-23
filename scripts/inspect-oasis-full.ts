import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'properties',
    where: { brand: { in: ['madeiraoasis', 'both'] } },
    limit: 200,
    depth: 2,
    sort: 'slug',
  })
  for (const p of docs) {
    const media = (p.media ?? [])
      .map((m: { image?: unknown }) => m.image)
      .filter((i: unknown) => typeof i === 'object' && i !== null) as {
      url?: string
      mimeType?: string
    }[]
    const videos = media.filter((m) =>
      (m.mimeType ?? m.url ?? '').includes('video') ||
      (m.url ?? '').endsWith('.mp4'),
    )
    console.log(
      [
        p.slug,
        `id=${p.id}`,
        `brand=${p.brand}`,
        `status=${p.status}`,
        `media=${media.length}(video=${videos.length})`,
        `coords=${p.geoCoordinates?.lat},${p.geoCoordinates?.lng}`,
        `loc=${typeof p.location === 'object' ? p.location?.name : p.location}`,
        `desc=${(p.description ?? '').length}ch`,
        `short=${(p.shortDescription ?? '').length}ch`,
        `cat=${p.category ?? '-'}`,
      ].join(' | '),
    )
    for (const m of media) console.log(`      ${m.url}`)
  }
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
