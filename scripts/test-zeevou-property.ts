import 'dotenv/config'
import {
  createProperty,
  getRates,
  getReservations,
  getZeevouIds,
} from '../src/services/pms/zeevou'

// Sandbox verification for the Zeevou (Silver) adapter:
// resolves EUR + Madeira area, creates a full property
// (property -> unit_type -> unit -> rate_plan) and prints the ids.
// Run: npx tsx scripts/test-zeevou-property.ts
async function main() {
  console.log('Zeevou base:', process.env.ZEEVOU_BASE_URL || process.env.ZEEVOU_SANDBOX_URL || 'https://sandbox.zeevou.com')

  console.log('\n=== getZeevouIds ===')
  const ids = await getZeevouIds()
  console.log(JSON.stringify(ids))

  console.log('\n=== createProperty ===')
  const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '')
  const created = await createProperty({
    name: `Madeirabook Test Property ${stamp}`,
    shortName: `mb-test-${stamp}`,
    description: 'Sandbox test property created by the PMS integration.',
    address: {
      street: 'Rua de Santa Maria 1',
      postalCode: '9060-291',
      city: 'Funchal',
      country: 'PT',
    },
    maxGuests: 2,
    bedrooms: 1,
    basePrice: 100,
  })
  console.log(JSON.stringify(created))

  console.log('\n=== getRates ===')
  const rates = await getRates(created.propertyId, '2026-11-01', '2026-11-07')
  console.log(JSON.stringify(rates).slice(0, 500))

  console.log('\n=== getReservations ===')
  const bookings = await getReservations(created.propertyId, '2026-10-01', '2026-12-31')
  console.log(JSON.stringify(bookings).slice(0, 500))

  console.log('\nDONE — zeevou_property_id =', created.propertyId)
  process.exit(0)
}

main().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
