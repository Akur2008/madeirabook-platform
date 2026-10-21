import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// Attach the owner-uploaded galleries in public/images/<dir>/ to the Oasis
// properties. Media rows are URL references (no binary upload needed) and
// media[0] is the cover everywhere it is read (hotel hero, map pin, OG).
//
// - barcelo-funchal-oldtown: replaces the temporary Unsplash placeholder
//   cover added by add-barcelo-cover.ts.
// - pestana-casino: task slug — real slug is pestana-casino-park. New uploads
//   go in front so IMG_0128.jpg becomes the cover; existing R2 gallery stays.
// - savoy-palace: upload contained only videos (Properties has no video
//   field), so poster frames extracted from the reels are appended to the
//   existing gallery; the current R2 hero stays the cover.

const MEDIA: Record<
  string,
  { url: string; filename: string; width: number; height: number }[]
> = {
  'barcelo-funchal-oldtown': [
    {
      url: '/images/barcelo/IMG_0165.PNG',
      filename: 'IMG_0165.PNG',
      width: 1080,
      height: 1350,
    },
  ],
  'pestana-casino-park': [
    { url: '/images/pestana-casino/IMG_0128.jpg', filename: 'IMG_0128.jpg', width: 1170, height: 961 },
    { url: '/images/pestana-casino/IMG_0129.JPG', filename: 'IMG_0129.JPG', width: 1536, height: 1022 },
    { url: '/images/pestana-casino/IMG_0130.JPG', filename: 'IMG_0130.JPG', width: 1363, height: 2048 },
    { url: '/images/pestana-casino/IMG_0131.JPG', filename: 'IMG_0131.JPG', width: 1363, height: 2048 },
    { url: '/images/pestana-casino/IMG_0132.PNG', filename: 'IMG_0132.PNG', width: 1650, height: 718 },
    { url: '/images/pestana-casino/IMG_0133.jpg', filename: 'IMG_0133.jpg', width: 1170, height: 1468 },
    { url: '/images/pestana-casino/IMG_0134.jpg', filename: 'IMG_0134.jpg', width: 1170, height: 1471 },
    { url: '/images/pestana-casino/IMG_0136.jpg', filename: 'IMG_0136.jpg', width: 1170, height: 1165 },
    { url: '/images/pestana-casino/IMG_0137.jpg', filename: 'IMG_0137.jpg', width: 1170, height: 591 },
    { url: '/images/pestana-casino/IMG_0138.JPG', filename: 'IMG_0138.JPG', width: 2000, height: 1335 },
    { url: '/images/pestana-casino/IMG_0139.JPG', filename: 'IMG_0139.JPG', width: 3840, height: 2560 },
    { url: '/images/pestana-casino/IMG_0140.JPG', filename: 'IMG_0140.JPG', width: 3012, height: 2256 },
    { url: '/images/pestana-casino/IMG_0141.JPG', filename: 'IMG_0141.JPG', width: 3840, height: 2560 },
    { url: '/images/pestana-casino/IMG_0142.JPG', filename: 'IMG_0142.JPG', width: 3840, height: 2487 },
    { url: '/images/pestana-casino/IMG_0143.JPG', filename: 'IMG_0143.JPG', width: 3840, height: 2563 },
    { url: '/images/pestana-casino/IMG_0144.JPG', filename: 'IMG_0144.JPG', width: 3588, height: 2496 },
    { url: '/images/pestana-casino/IMG_0145.JPG', filename: 'IMG_0145.JPG', width: 2957, height: 1968 },
    { url: '/images/pestana-casino/IMG_0146.JPG', filename: 'IMG_0146.JPG', width: 2957, height: 1968 },
    { url: '/images/pestana-casino/IMG_0147.JPG', filename: 'IMG_0147.JPG', width: 940, height: 627 },
  ],
  'savoy-palace': [
    {
      url: '/images/savoy-palace/video-talesfromthetarmac-poster.jpg',
      filename: 'video-talesfromthetarmac-poster.jpg',
      width: 720,
      height: 1280,
    },
    {
      url: '/images/savoy-palace/video-unconditional-world-poster.jpg',
      filename: 'video-unconditional-world-poster.jpg',
      width: 720,
      height: 1280,
    },
    {
      url: '/images/savoy-palace/video-schauinslandreisen-1-poster.jpg',
      filename: 'video-schauinslandreisen-1-poster.jpg',
      width: 720,
      height: 1280,
    },
  ],
}

// 'prepend' puts the uploads in front (new cover); 'append' keeps the
// existing cover and adds the uploads to the gallery; 'replace' drops the
// old rows entirely.
const MODE: Record<string, 'prepend' | 'append' | 'replace'> = {
  'barcelo-funchal-oldtown': 'replace',
  'pestana-casino-park': 'prepend',
  'savoy-palace': 'append',
}

const ALT: Record<string, string> = {
  'barcelo-funchal-oldtown': 'Barceló Funchal Oldtown',
  'pestana-casino-park': 'Pestana Casino Park',
  'savoy-palace': 'Savoy Palace',
}

async function ensureMedia(
  p: Awaited<ReturnType<typeof getPayload>>,
  item: { url: string; filename: string; width: number; height: number },
  alt: string,
) {
  const existing = await p.find({
    collection: 'media',
    where: { url: { equals: item.url } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) return existing.docs[0].id as number
  const created = await p.create({
    collection: 'media',
    data: {
      url: item.url,
      alt,
      filename: item.filename,
      mimeType: item.url.toLowerCase().endsWith('.png')
        ? 'image/png'
        : 'image/jpeg',
      width: item.width,
      height: item.height,
    },
  })
  return created.id as number
}

async function main() {
  const p = await getPayload({ config })

  for (const [slug, items] of Object.entries(MEDIA)) {
    const { docs } = await p.find({
      collection: 'properties',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const doc = docs[0]
    if (!doc) {
      console.log(`${slug}: NOT FOUND — skipped`)
      continue
    }

    const newIds: number[] = []
    for (const item of items) {
      newIds.push(await ensureMedia(p, item, ALT[slug] ?? doc.title))
    }

    const existing = (doc.media ?? [])
      .map((m) => (typeof m.image === 'object' ? m.image?.id : m.image))
      .filter((id): id is number => typeof id === 'number')

    const mode = MODE[slug]
    const ids =
      mode === 'replace'
        ? newIds
        : mode === 'prepend'
          ? [...newIds, ...existing]
          : [...existing, ...newIds]

    await p.update({
      collection: 'properties',
      id: doc.id,
      data: { media: ids.map((image) => ({ image })) },
    })
    console.log(
      `${slug}: media ${mode} -> ${ids.length} rows, cover ${
        mode === 'append' ? 'unchanged' : (items[0]?.url ?? 'none')
      }`,
    )
  }

  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e.message)
  process.exit(1)
})
