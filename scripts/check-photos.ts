import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

async function main() {
  const p = await getPayload({ config })
  const collections = [
    { slug: 'properties', name: 'STAYS' },
    { slug: 'beaches', name: 'BEACHES' },
    { slug: 'restaurants', name: 'RESTAURANTS' },
    { slug: 'trails', name: 'TRAILS' },
    { slug: 'viewpoints', name: 'VIEWPOINTS' },
  ]
  for (const c of collections) {
    const r = await p.find({ collection: c.slug, limit: 200, depth: 0 })
    const withPhoto = r.docs.filter(d => (d.media && d.media.length > 0) || d.heroImage)
    const without = r.docs.filter(d => (!d.media || d.media.length === 0) && !d.heroImage)
    console.log('=== ' + c.name + ' ===')
    console.log('  Total: ' + r.docs.length + ' | With photo: ' + withPhoto.length + ' | Without: ' + without.length)
    if (without.length > 0) {
      console.log('  --- MISSING PHOTOS ---')
      without.forEach(d => console.log('  ' + (d.slug || d.id)))
    }
  }
  process.exit(0)
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1) })
