import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'
async function main() {
  const p = await getPayload({ config })
  const { docs } = await p.find({
    collection: 'properties',
    where: { slug: { equals: 'savoy-palace' } },
    limit: 1,
    depth: 2,
  })
  const doc = docs[0]
  if (!doc) process.exit(1)
  const rows = doc.media ?? []
  const key = 'savoy-palace-photo-6.jpg'
  const sorted = [...rows].sort((a, b) => {
    const au = typeof a.image === 'object' ? a.image?.url ?? '' : ''
    const bu = typeof b.image === 'object' ? b.image?.url ?? '' : ''
    return (bu.endsWith(key) ? 1 : 0) - (au.endsWith(key) ? 1 : 0)
  })
  await p.update({
    collection: 'properties',
    id: doc.id,
    data: {
      media: sorted.map((m) => ({
        image: typeof m.image === 'object' ? m.image?.id : m.image,
      })),
    },
  })
  console.log('cover ->', typeof sorted[0].image === 'object' ? sorted[0].image?.url : sorted[0].image)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
