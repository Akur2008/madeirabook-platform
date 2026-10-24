import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'restaurants',
    limit: 100,
    depth: 2,
  })
  console.log(`total=${docs.length}`)
  for (const r of docs) {
    const v = r.videoFile
    const videoUrl =
      typeof v === 'object' && v !== null ? (v as { url?: string }).url : null
    const photo =
      (typeof r.media?.[0]?.image === 'object'
        ? (r.media[0].image as { url?: string }).url
        : null) ?? r.heroImage
    console.log(
      `${r.slug} | status=${r.status} | video=${videoUrl ?? '-'} | poster=${r.posterUrl ?? '-'} | photo=${photo ?? '-'} | geo=${r.geoCoordinates?.lat},${r.geoCoordinates?.lng}`,
    )
  }
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
