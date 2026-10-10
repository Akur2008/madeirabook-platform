import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  const email = 'akur2013@gmail.com'
  const newPassword = 'PilotPass2026!'

  const found = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
  })

  console.log('Found users:', found.docs.length)

  if (found.docs.length === 0) {
    const all = await payload.find({ collection: 'users' })
    console.log('All users:', all.docs.map(u => u.email))
    process.exit(1)
  }

  await payload.update({
    collection: 'users',
    id: found.docs[0].id,
    data: { password: newPassword },
  })

  console.log('OK, password reset to:', newPassword)
  process.exit(0)
}

main().catch(e => {
  console.error('ERR:', e)
  process.exit(1)
})
