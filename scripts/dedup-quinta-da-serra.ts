import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'properties',
    where: { slug: { equals: 'enoteca-quinta-da-serra' } },
    limit: 1,
    depth: 0,
  })
  const dup = docs[0]
  if (!dup) {
    console.log('enoteca-quinta-da-serra not found')
    process.exit(1)
  }
  console.log(`before: slug=${dup.slug} id=${dup.id} status=${dup.status}`)

  if (dup.status !== 'draft') {
    await payload.update({
      collection: 'properties',
      id: dup.id,
      data: { status: 'draft' },
    })
  }

  const { docs: after } = await payload.find({
    collection: 'properties',
    where: { slug: { equals: 'enoteca-quinta-da-serra' } },
    limit: 1,
    depth: 0,
  })
  console.log(`after: slug=${after[0].slug} status=${after[0].status}`)

  // Canonical record must stay published.
  const { docs: canonical } = await payload.find({
    collection: 'properties',
    where: {
      and: [
        { slug: { equals: 'quinta-da-serra' } },
        { status: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  console.log(
    `canonical quinta-da-serra: ${canonical.length ? `published (id=${canonical[0].id})` : 'MISSING'}`,
  )
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
