import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config })

  const { docs, totalDocs } = await payload.find({
    collection: 'properties',
    where: { brand: { equals: 'madeiraoasis' } },
    limit: 200,
    depth: 0,
  })
  console.log(`Found ${totalDocs} madeiraoasis properties`)

  let updated = 0
  for (const p of docs) {
    if (p.status === 'published') continue
    await payload.update({
      collection: 'properties',
      id: p.id,
      data: { status: 'published' },
    })
    updated++
    console.log(`  ${p.slug} -> published`)
  }
  console.log(`Updated: ${updated}`)

  const { totalDocs: published } = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { brand: { equals: 'madeiraoasis' } },
        { status: { equals: 'published' } },
      ],
    },
    limit: 0,
  })
  console.log(`Published now: ${published}`)

  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
