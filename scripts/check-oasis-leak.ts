import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config })

  // 1) Which referrals resolve /m/merlin_visual? (code OR aliases)
  const code = 'merlin_visual'
  const { docs: refs } = await payload.find({
    collection: 'referrals',
    where: {
      or: [{ code: { equals: code } }, { aliases: { contains: code } }],
    },
    limit: 10,
    depth: 0,
  })
  console.log('REFERRALS matching', code, ':', refs.length)
  for (const r of refs) {
    console.log(
      `  id=${r.id} code=${r.code} status=${r.status} oasisAccess=${r.oasisAccess} aliases=${JSON.stringify(r.aliases)}`,
    )
  }

  // 2) All referrals and their oasisAccess
  const { docs: allRefs } = await payload.find({
    collection: 'referrals',
    limit: 100,
    depth: 0,
  })
  console.log('\nALL REFERRALS:', allRefs.length)
  for (const r of allRefs) {
    console.log(`  ${r.code} | status=${r.status} | oasisAccess=${r.oasisAccess}`)
  }

  // 3) Oasis properties by status
  const { docs: oasis, totalDocs } = await payload.find({
    collection: 'properties',
    where: { brand: { equals: 'madeiraoasis' } },
    limit: 100,
    depth: 0,
  })
  console.log('\nOASIS PROPERTIES total:', totalDocs)
  const byStatus: Record<string, number> = {}
  for (const p of oasis) {
    byStatus[p.status ?? 'null'] = (byStatus[p.status ?? 'null'] ?? 0) + 1
  }
  console.log('  by status:', byStatus)

  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
