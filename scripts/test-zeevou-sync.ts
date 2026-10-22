import 'dotenv/config'
import { syncPropertyToZeevou } from '../src/lib/zeevou'
import { getZeevouRequestLog } from '../src/services/pms/zeevou'

// Sandbox verification for syncPropertyToZeevou: pushes the Payload property
// "hotel-orquidea" to Zeevou as a Complex (Property -> UnitType -> Unit ->
// RatePlan) and writes the external ids back.
// Every Zeevou API request/response is dumped — on failure the output is
// meant to be pasted verbatim into a Zeevou support request.
// Run: npx tsx scripts/test-zeevou-sync.ts [slug-or-id]

const TARGET = process.argv[2] || 'hotel-orquidea'

function dumpRequestLog() {
  const log = getZeevouRequestLog()
  console.log(`\n=== Zeevou API trace (${log.length} requests) ===`)
  for (const [i, e] of log.entries()) {
    console.log(`\n--- [${i + 1}] ${e.method} ${e.url}`)
    console.log(`    at: ${e.at}`)
    if (e.requestBody) {
      console.log(`    request:  ${JSON.stringify(e.requestBody)}`)
    }
    console.log(`    status:   ${e.status}`)
    console.log(`    response: ${JSON.stringify(e.responseBody).slice(0, 2000)}`)
  }
}

async function main() {
  console.log(
    'Zeevou base:',
    process.env.ZEEVOU_BASE_URL ||
      process.env.ZEEVOU_SANDBOX_URL ||
      'https://sandbox.zeevou.com',
  )
  console.log(`target property: ${TARGET}`)

  try {
    const result = await syncPropertyToZeevou(TARGET)
    console.log('\n=== sync result ===')
    console.log(JSON.stringify(result, null, 2))
    if (result.alreadySynced) {
      console.log(
        `\nALREADY SYNCED — zeevou_property_id = ${result.zeevouPropertyId}`,
      )
    } else {
      console.log(`\nSUCCESS — zeevou_property_id = ${result.zeevouPropertyId}`)
      for (const ut of result.zeevou?.unitTypes ?? []) {
        console.log(
          `  unit_type=${ut.unitTypeId} units=[${ut.unitIds}] rate_plans=[${ut.ratePlanIds}] default_rp=${ut.defaultRatePlanId}`,
        )
      }
    }
  } catch (e) {
    console.error('\n=== SYNC FAILED ===')
    console.error(e instanceof Error ? e.message : e)
    dumpRequestLog()
    console.error(
      '\nSupport request material: the last request above is the failing ' +
        'step — "request" is the exact JSON payload sent, "status"/"response" ' +
        'the exact error returned.',
    )
    process.exit(1)
  }

  dumpRequestLog()
  console.log('\nDONE')
  process.exit(0)
}

main().catch((e) => {
  console.error('FAILED:', e)
  dumpRequestLog()
  process.exit(1)
})
