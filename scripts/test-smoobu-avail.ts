import 'dotenv/config'
import { checkAvailability } from '../src/lib/smoobu'

async function main() {
  const arrival = process.argv[2] || '2026-10-30'
  const departure = process.argv[3] || '2026-11-01'
  const items = await checkAvailability({ arrivalDate: arrival, departureDate: departure })
  console.log(JSON.stringify(items, null, 2))
  process.exit(0)
}
main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
