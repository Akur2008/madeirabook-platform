import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'properties',
    where: { slug: { contains: 'quinta' } },
    limit: 50,
    depth: 2,
  })
  for (const p of docs) {
    const media = (p.media ?? [])
      .map((m: { image?: unknown }) => m.image)
      .filter((i: unknown) => typeof i === 'object' && i !== null)
      .map((i: { url?: string; mimeType?: string }) => `${i.mimeType} ${i.url}`)
    console.log(
      `\n${p.slug} | id=${p.id} | status=${p.status} | brand=${p.brand} | title=${p.title}`,
    )
    console.log(`  location=${JSON.stringify((p.location as { name?: string })?.name)} geo=${JSON.stringify(p.geoCoordinates)}`)
    console.log(`  media (${media.length}):`)
    for (const m of media) console.log(`    ${m}`)
  }
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
