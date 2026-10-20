import 'dotenv/config'
import { getAccessToken } from '../src/services/pms/zeevou-oauth'
import { createComplex, getZeevouIds } from '../src/services/pms/zeevou'

// Sandbox verification for createComplex: provisions Orquídea as a Zeevou
// "Complex" (is_single_unit: false) with 1 UnitType + 1 Unit + 1 RatePlan,
// then reads the objects back to verify the chain.
// Run: npx tsx scripts/test-zeevou-complex.ts

const BASE =
  process.env.ZEEVOU_BASE_URL ||
  process.env.ZEEVOU_SANDBOX_URL ||
  'https://sandbox.zeevou.com'

async function apiGet(path: string) {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  })
  const body = await res.json().catch(() => null)
  console.log(`GET ${path} -> ${res.status}`)
  return body
}

async function main() {
  console.log('Zeevou base:', BASE)

  console.log('\n=== getZeevouIds ===')
  console.log(JSON.stringify(await getZeevouIds()))

  console.log('\n=== createComplex (Orquidea) ===')
  const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '')
  const result = await createComplex(
    {
      name: `Hotel Orquidea Sandbox ${stamp}`,
      shortName: `orquidea-${stamp}`,
      description: 'Sandbox complex test — mirrors Payload rooms structure.',
      address: {
        street: 'Rua da Orquidea 1',
        postalCode: '9000-000',
        city: 'Funchal',
        country: 'PT',
      },
      maxGuests: 2,
    },
    [
      {
        name: 'Standard',
        capacity: 2,
        description: 'Standard double room',
        ratePlans: [
          { name: 'Standard', basePrice: 110, minNights: 1, isDefault: true },
          { name: 'Standard with breakfast', basePrice: 125, minNights: 1 },
        ],
        units: [{ name: 'Standard-1' }, { name: 'Standard-2' }],
      },
    ],
  )
  console.log('created:', JSON.stringify(result, null, 2))

  console.log('\n=== read back ===')
  const prop = (await apiGet(`/apis/properties/${result.propertyId}`)) as Record<
    string,
    unknown
  >
  console.log(
    `property: id=${prop.id} name="${prop.name}" is_single_unit=${prop.is_single_unit} unit_types=${JSON.stringify(prop.unit_types).slice(0, 200)}`,
  )

  const uts = (await apiGet(
    `/apis/unit_types?property=${result.propertyId}`,
  )) as Record<string, unknown>
  const members = (uts['hydra:member'] ?? uts) as Record<string, unknown>[]
  for (const ut of members) {
    console.log(
      `unit_type: id=${ut.id} name="${ut.name}" capacity=${ut.maximum_capacity} rate_plans=${JSON.stringify(ut.rate_plans).slice(0, 300)}`,
    )
  }

  const units = (await apiGet(
    `/apis/units?unit_type=${result.unitTypes[0]?.unitTypeId}`,
  )) as Record<string, unknown>
  const unitMembers = (units['hydra:member'] ?? units) as Record<
    string,
    unknown
  >[]
  for (const u of unitMembers) {
    console.log(`unit: id=${u.id} name="${u.name}"`)
  }

  const rps = (await apiGet(
    `/apis/rate_plans?unit_type=${result.unitTypes[0]?.unitTypeId}`,
  )) as Record<string, unknown>
  const rpMembers = (rps['hydra:member'] ?? rps) as Record<string, unknown>[]
  for (const rp of rpMembers) {
    console.log(
      `rate_plan: id=${rp.id} name="${rp.name}" type=${rp.type} default=${rp.is_default} weekday=${rp.weekday_price} min_stay=${rp.min_stay}`,
    )
  }

  console.log('\nDONE')
  process.exit(0)
}

main().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
