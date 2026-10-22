import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// Hides placeholder hotels from madeirabook.com: every published property is
// drafted except the real Madeirabook inventory (Orquídea + the three Caniço
// apartments) and Barceló — the one intentional hotel on the madeiraoasis.com
// map. All madeirabook.com queries already filter status=published +
// brand!=madeiraoasis, so drafting is enough; no code change required.

const KEEP_PUBLISHED = new Set([
  'hotel-orquidea',
  'apartamentos-do-mar-303',
  'apartamentos-do-mar-607',
  'penthouse-on-the-beach-madeira',
  // Intentional single hotel on the madeiraoasis.com map.
  'barcelo-funchal-oldtown',
])

async function main() {
  const payload = await getPayload({ config })

  const { docs, totalDocs } = await payload.find({
    collection: 'properties',
    where: { status: { equals: 'published' } },
    limit: 300,
    depth: 0,
  })
  console.log(`Published properties: ${totalDocs}`)

  let drafted = 0
  for (const p of docs) {
    if (KEEP_PUBLISHED.has(p.slug)) {
      console.log(`  keep  ${p.slug} (${p.brand})`)
      continue
    }
    await payload.update({
      collection: 'properties',
      id: p.id,
      data: { status: 'draft' },
    })
    drafted++
    console.log(`  draft ${p.slug} (${p.brand})`)
  }
  console.log(`Drafted: ${drafted}`)

  const { docs: stillPublished } = await payload.find({
    collection: 'properties',
    where: { status: { equals: 'published' } },
    limit: 300,
    depth: 0,
    sort: 'slug',
  })
  console.log('Still published:')
  for (const p of stillPublished) {
    console.log(`  ${p.slug} (${p.brand})`)
  }

  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
