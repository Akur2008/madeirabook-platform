import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// Read-only inspection: every property with the fields that drive pricing,
// booking and map behaviour.
async function main() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'properties',
    limit: 300,
    depth: 1,
    sort: 'slug',
  })
  for (const p of docs) {
    const owner =
      p.owner && typeof p.owner === 'object'
        ? {
            stripeAccountId: (p.owner as { stripeAccountId?: string }).stripeAccountId,
            chargesEnabled: (p.owner as { chargesEnabled?: boolean }).chargesEnabled,
          }
        : p.owner
    console.log(
      JSON.stringify({
        id: p.id,
        slug: p.slug,
        brand: p.brand,
        status: p.status,
        pms: p.pms ?? null,
        pmsPropertyId: p.pmsPropertyId ?? null,
        pricingScenario: (p as { pricingScenario?: string }).pricingScenario ?? null,
        isPlatform: p.isPlatform,
        commissionPercent: p.commissionPercent,
        pricePerNight: p.pricePerNight,
        owner,
      }),
    )
  }
  process.exit(0)
}
main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
