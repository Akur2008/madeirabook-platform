import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// Migrates Hotel Orquídea to the Zeevou "Complex" structure:
//   Property -> UnitType ("Standard") -> Unit ("Standard-1") -> RatePlan ("Standard", 110 EUR)
// Apartments (is_platform = true) are intentionally skipped — they keep the
// simple structure. Idempotent: re-running reuses existing rows.
// Run: npx tsx scripts/migrate-orquidea-complex.ts

const ORQUIDEA_SLUG = 'hotel-orquidea'

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL is not set')
  console.log(`target db host: ${new URL(dbUrl).hostname}`)

  const payload = await getPayload({ config })

  const found = await payload.find({
    collection: 'properties',
    where: { slug: { equals: ORQUIDEA_SLUG } },
    limit: 1,
  })
  const property = found.docs[0]
  if (!property) {
    throw new Error(`Property "${ORQUIDEA_SLUG}" not found`)
  }
  console.log(`property ${property.slug} -> id ${property.id} (maxGuests=${property.maxGuests})`)

  // --- UnitType ---
  let unitTypeId: number
  const existingUT = await payload.find({
    collection: 'unit-types',
    where: { and: [{ property: { equals: property.id } }, { name: { equals: 'Standard' } }] },
    limit: 1,
  })
  if (existingUT.docs.length > 0) {
    unitTypeId = existingUT.docs[0].id
    console.log(`unit-type "Standard" -> id ${unitTypeId} (existing)`)
  } else {
    const ut = await payload.create({
      collection: 'unit-types',
      data: {
        property: property.id,
        name: 'Standard',
        capacity: property.maxGuests ?? 2,
        bedrooms: 1,
        bathrooms: 1,
        status: 'active',
      },
    })
    unitTypeId = ut.id
    console.log(`unit-type "Standard" -> id ${unitTypeId} (created)`)
  }

  // --- Unit ---
  const existingUnit = await payload.find({
    collection: 'units',
    where: { and: [{ unitType: { equals: unitTypeId } }, { name: { equals: 'Standard-1' } }] },
    limit: 1,
  })
  let unitId: number
  if (existingUnit.docs.length > 0) {
    unitId = existingUnit.docs[0].id
    console.log(`unit "Standard-1" -> id ${unitId} (existing)`)
  } else {
    const unit = await payload.create({
      collection: 'units',
      data: {
        unitType: unitTypeId,
        name: 'Standard-1',
        status: 'active',
      },
    })
    unitId = unit.id
    console.log(`unit "Standard-1" -> id ${unitId} (created)`)
  }

  // --- RatePlan ---
  const existingRP = await payload.find({
    collection: 'rate-plans',
    where: { and: [{ unitType: { equals: unitTypeId } }, { name: { equals: 'Standard' } }] },
    limit: 1,
  })
  let ratePlanId: number
  if (existingRP.docs.length > 0) {
    ratePlanId = existingRP.docs[0].id
    console.log(`rate-plan "Standard" -> id ${ratePlanId} (existing)`)
  } else {
    const rp = await payload.create({
      collection: 'rate-plans',
      data: {
        unitType: unitTypeId,
        name: 'Standard',
        basePrice: 110,
        minNights: 1,
        status: 'active',
      },
    })
    ratePlanId = rp.id
    console.log(`rate-plan "Standard" -> id ${ratePlanId} (created)`)
  }

  console.log(`DONE property=${property.id} unitType=${unitTypeId} unit=${unitId} ratePlan=${ratePlanId}`)
  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
