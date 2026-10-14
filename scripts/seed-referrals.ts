import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

// creatorEmail "TODO" from the spec is not a valid email, so pending
// creators get a todo+<code>@madeirabook.com placeholder to fill in later.
type ReferralSeed = {
  code: string
  aliases: string[]
  creatorName: string
  creatorEmail: string
  commissionRate: number
  status: 'active' | 'paused'
  notes: string
}

const referrals: ReferralSeed[] = [
  {
    code: 'test_creator',
    aliases: [],
    creatorName: 'Test Creator',
    creatorEmail: 'test@madeirabook.com',
    commissionRate: 2,
    status: 'active',
    notes: 'Internal test',
  },
  {
    code: 'sxtraveler',
    aliases: ['sergio'],
    creatorName: 'Sergio @s.x.traveler',
    creatorEmail: 'todo+sxtraveler@madeirabook.com',
    commissionRate: 2,
    status: 'active',
    notes: 'Instagram 677k, Madeira guide',
  },
  {
    code: 'alex',
    aliases: [],
    creatorName: 'Alex (planned)',
    creatorEmail: 'todo+alex@madeirabook.com',
    commissionRate: 2,
    status: 'paused',
    notes: 'Planned creator',
  },
  {
    code: 'madeiraguide',
    aliases: [],
    creatorName: 'Madeira Guide (planned)',
    creatorEmail: 'todo+madeiraguide@madeirabook.com',
    commissionRate: 2,
    status: 'paused',
    notes: 'Planned creator',
  },
]

async function seedReferrals(): Promise<void> {
  const payload = await getPayload({ config })

  let ok = 0

  for (const data of referrals) {
    const existing = await payload.find({
      collection: 'referrals',
      where: { code: { equals: data.code } },
      limit: 1,
      depth: 0,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'referrals',
        id: existing.docs[0].id,
        data,
      })
    } else {
      await payload.create({ collection: 'referrals', data })
    }

    ok++
    console.log(`OK ${data.code}`)
  }

  console.log(`Done. OK: ${ok}`)
}

seedReferrals()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding referrals:', error)
    process.exit(1)
  })
