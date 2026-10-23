import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// One-off data fix: assigns pricingScenario to every property per the
// pricing manifest (src/lib/pricing-rules.ts).
//   - the three Smoobu apartments  -> smoobu
//   - hotel-orquidea + every other Oasis hotel -> display_only
//   - anything else (unclassified drafts) -> display_only (field default)
const SMOOBU_SLUGS = [
  'apartamentos-do-mar-303',
  'apartamentos-do-mar-607',
  'penthouse-on-the-beach-madeira',
]

async function main() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'properties',
    limit: 500,
    depth: 0,
  })

  let changed = 0
  for (const p of docs) {
    const target = SMOOBU_SLUGS.includes(p.slug) ? 'smoobu' : 'display_only'
    const current = (p as { pricingScenario?: string }).pricingScenario ?? null
    if (current === target) {
      console.log(`${p.slug}: already ${target}`)
      continue
    }
    await payload.update({
      collection: 'properties',
      id: p.id,
      data: { pricingScenario: target },
    })
    changed += 1
    console.log(`${p.slug}: ${current ?? 'null'} -> ${target}`)
  }
  console.log(`done — ${changed} updated, ${docs.length - changed} unchanged`)
  process.exit(0)
}
main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
