import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload, type CollectionSlug } from 'payload'

// Read-only dump: every doc in every media-bearing collection with the URLs
// of its media rows + mimeType, so flagged sources (Unsplash, scraped hotel
// galleries, third-party reels) can be identified before replacement.

const COLLECTIONS: { slug: CollectionSlug; label: string }[] = [
  { slug: 'properties', label: 'PROPERTIES' },
  { slug: 'beaches', label: 'BEACHES' },
  { slug: 'restaurants', label: 'RESTAURANTS' },
  { slug: 'trails', label: 'TRAILS' },
  { slug: 'viewpoints', label: 'VIEWPOINTS' },
  { slug: 'cities', label: 'CITIES' },
  { slug: 'homepage-videos', label: 'HOMEPAGE_VIDEOS' },
  { slug: 'guides', label: 'GUIDES' },
]

type MediaDoc = {
  id?: number
  url?: string
  filename?: string
  mimeType?: string
}

function flag(url: string | undefined, mime: string | undefined): string {
  const u = url ?? ''
  const tags: string[] = []
  if (u.includes('unsplash')) tags.push('UNSPLASH')
  if (mime?.startsWith('video/')) tags.push('VIDEO')
  if (/schauinsland|worldwithasuitcase|talesfromthetarmac|unconditional-world|elenabeatriz|practitecture/i.test(u))
    tags.push('3RD-PARTY-REEL')
  if (u.startsWith('/images/')) tags.push('LOCAL-PUBLIC')
  if (u.includes('r2.dev')) tags.push('R2')
  if (u.startsWith('http') && !u.includes('r2.dev') && !u.includes('unsplash')) tags.push('EXTERNAL')
  return tags.length ? `  [${tags.join(',')}]` : ''
}

async function main() {
  const p = await getPayload({ config })
  for (const c of COLLECTIONS) {
    let docs: Record<string, unknown>[] = []
    try {
      const r = await p.find({ collection: c.slug, limit: 300, depth: 1 })
      docs = r.docs as Record<string, unknown>[]
    } catch (e) {
      console.log(`=== ${c.label} === ERROR: ${(e as Error).message}`)
      continue
    }
    console.log(`=== ${c.label} (${docs.length}) ===`)
    for (const d of docs) {
      const media = (d.media ?? []) as { image?: MediaDoc | number }[]
      const hero = d.heroImage as MediaDoc | number | undefined
      const video = d.video as MediaDoc | number | undefined
      console.log(
        `  ${(d.slug as string) ?? d.id} | status=${d.status ?? '-'} | brand=${d.brand ?? '-'} | media=${media.length}`,
      )
      if (hero && typeof hero === 'object')
        console.log(`    hero: ${hero.url} (${hero.mimeType})${flag(hero.url, hero.mimeType)}`)
      if (video && typeof video === 'object')
        console.log(`    video: ${video.url} (${video.mimeType})${flag(video.url, video.mimeType)}`)
      media.forEach((m, i) => {
        const img = m.image
        if (img && typeof img === 'object')
          console.log(`    [${i}] ${img.url} (${img.mimeType ?? '?'})${flag(img.url, img.mimeType)}`)
        else console.log(`    [${i}] id=${img}`)
      })
    }
  }
  process.exit(0)
}
main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
