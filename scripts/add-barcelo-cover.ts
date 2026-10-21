import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// Final cleanup — barcelo-funchal-oldtown had no cover, so its Oasis map
// popup rendered without an image. Attach a stock Oasis pool photo as
// media[0] (the page reads the first media item as the pin coverImage).
// Temporary placeholder until the real Barcelo gallery is uploaded.

const BARCELO_SLUG = 'barcelo-funchal-oldtown'
const COVER_URL =
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80'

async function ensureMedia(
  p: Awaited<ReturnType<typeof getPayload>>,
  url: string,
  alt: string,
) {
  const existing = await p.find({
    collection: 'media',
    where: { url: { equals: url } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) return existing.docs[0].id as number
  const created = await p.create({
    collection: 'media',
    data: {
      url,
      alt,
      filename: 'barcelo-funchal-oldtown-cover.jpg',
      mimeType: 'image/jpeg',
      width: 1600,
      height: 900,
    },
  })
  return created.id as number
}

async function main() {
  const p = await getPayload({ config })

  const { docs } = await p.find({
    collection: 'properties',
    where: { slug: { equals: BARCELO_SLUG } },
    limit: 1,
    depth: 0,
  })
  const barcelo = docs[0]
  if (!barcelo) throw new Error(`${BARCELO_SLUG} not found`)

  const coverId = await ensureMedia(
    p,
    COVER_URL,
    'Barceló Funchal Oldtown — rooftop pool over the Atlantic',
  )

  await p.update({
    collection: 'properties',
    id: barcelo.id,
    data: { media: [{ image: coverId }] },
  })
  console.log(`barcelo-funchal-oldtown: cover set (media id ${coverId})`)

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
