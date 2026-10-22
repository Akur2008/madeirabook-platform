import 'dotenv/config'

// Smoke test for the Google Indexing API client (src/lib/googleIndexing.ts).
// Submits one URL_NOTIFICATION for an Oasis hotel page and prints the
// structured outcome. No dev server needed — only GOOGLE_INDEXING_KEY in
// .env (JSON service-account key). Missing/invalid key -> warning + skip.
// Run: npx tsx scripts/test-google-indexing.ts [url]

import { submitToGoogleIndexing } from '../src/lib/googleIndexing'

const TEST_URL =
  process.argv[2] || 'https://www.madeiraoasis.com/hotels/barcelo-funchal-oldtown'

async function main() {
  if (!process.env.GOOGLE_INDEXING_KEY) {
    console.warn(
      'GOOGLE_INDEXING_KEY is not set in .env — the submit call will be skipped.',
    )
  }
  console.log(`Submitting URL_UPDATED: ${TEST_URL}`)
  const outcome = await submitToGoogleIndexing(TEST_URL)
  console.log('Outcome:', JSON.stringify(outcome, null, 2))
  if (!outcome.configured) {
    console.warn('Indexing API not configured — nothing was sent to Google.')
    return
  }
  if (outcome.ok) {
    console.log(`SUCCESS — Google accepted the notification (HTTP ${outcome.status}).`)
  } else {
    console.error(`FAILED — Google rejected the call: ${outcome.detail}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('FAILED:', e instanceof Error ? e.message : e)
  process.exit(1)
})
