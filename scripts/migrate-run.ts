import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import { migrations } from '../src/migrations/index.js'
import 'dotenv/config'

async function run(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.db.migrate({ migrations })
  console.log('Migrations applied')
  process.exit(0)
}

run().catch((error) => {
  console.error('Migration error:', error)
  process.exit(1)
})
