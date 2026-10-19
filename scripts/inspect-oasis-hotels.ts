import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'properties',
    where: { brand: { equals: 'madeiraoasis' } },
    limit: 100,
    depth: 2,
  })
  for (const p of docs) {
    const media = (p.media ?? [])
      .map((m: { image?: unknown }) => m.image)
      .filter((i: unknown) => typeof i === 'object' && i !== null)
      .map((i: { url?: string }) => i.url)
    const isUnsplash = media.some((u: string | undefined) =>
      (u ?? '').includes('unsplash'),
    )
    console.log(
      `${p.slug} | id=${p.id} | status=${p.status} | media=${media.length} | unsplash=${isUnsplash} | coords=${p.geoCoordinates?.lat},${p.geoCoordinates?.lng}`,
    )
    if (media[0]) console.log(`   first: ${media[0]}`)
  }
  const amenities = await payload.find({ collection: 'amenities', limit: 100 })
  console.log('\nAMENITIES:')
  for (const a of amenities.docs) {
    console.log(`  id=${a.id} ${a.name} (${a.icon})`)
  }
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
