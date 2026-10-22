import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// Attach the owner-uploaded reels in public/images/<dir>/ to the Oasis
// properties as video media rows (media docs are URL references, so a row
// with mimeType video/* marks the clip — no schema change needed).
// Videos are APPENDED so media[0] stays the cover photo everywhere it is
// read (hotel hero, map pin, OG image). Hotel page and map BottomSheet pick
// the first video entry for the muted-autoplay block.

const VIDEOS: Record<
  string,
  { url: string; filename: string; width: number; height: number }[]
> = {
  'savoy-palace': [
    {
      url: '/images/savoy-palace/video-talesfromthetarmac.mp4',
      filename: 'video-talesfromthetarmac.mp4',
      width: 720,
      height: 1280,
    },
    {
      url: '/images/savoy-palace/video-unconditional-world.mp4',
      filename: 'video-unconditional-world.mp4',
      width: 720,
      height: 1280,
    },
    {
      url: '/images/savoy-palace/video-schauinslandreisen-1.mp4',
      filename: 'video-schauinslandreisen-1.mp4',
      width: 720,
      height: 1280,
    },
  ],
  'pestana-casino-park': [
    {
      url: '/images/pestana-casino/video-elenabeatriz61.mp4',
      filename: 'video-elenabeatriz61.mp4',
      width: 720,
      height: 1280,
    },
    {
      url: '/images/pestana-casino/video-practitecture.mp4',
      filename: 'video-practitecture.mp4',
      width: 720,
      height: 1280,
    },
  ],
  'barcelo-funchal-oldtown': [
    {
      url: '/images/barcelo/video-schauinslandreisen.mp4',
      filename: 'video-schauinslandreisen.mp4',
      width: 720,
      height: 1280,
    },
    {
      url: '/images/barcelo/video-worldwithasuitcase.mp4',
      filename: 'video-worldwithasuitcase.mp4',
      width: 720,
      height: 1280,
    },
  ],
}

const ALT: Record<string, string> = {
  'savoy-palace': 'Savoy Palace',
  'pestana-casino-park': 'Pestana Casino Park',
  'barcelo-funchal-oldtown': 'Barceló Funchal Oldtown',
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
      mimeType: 'video/mp4',
      width: item.width,
      height: item.height,
    },
  })
  return created.id as number
}

async function main() {
  const p = await getPayload({ config })

  for (const [slug, items] of Object.entries(VIDEOS)) {
    const { docs } = await p.find({
      collection: 'properties',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    const doc = docs[0]
    if (!doc) {
      console.log(`${slug}: NOT FOUND — skipped`)
      continue
    }

    const existing = (doc.media ?? [])
      .map((m) => (typeof m.image === 'object' ? m.image?.id : m.image))
      .filter((id): id is number => typeof id === 'number')

    const existingUrls = new Set(
      (doc.media ?? [])
        .map((m) =>
          typeof m.image === 'object' && m.image ? (m.image as { url?: string }).url : null,
        )
        .filter(Boolean),
    )

    const newIds: number[] = []
    for (const item of items) {
      if (existingUrls.has(item.url)) continue
      newIds.push(await ensureMedia(p, item, `${ALT[slug] ?? doc.title} — video`))
    }

    if (!newIds.length) {
      console.log(`${slug}: videos already attached — skipped`)
      continue
    }

    const ids = [...existing, ...newIds]
    await p.update({
      collection: 'properties',
      id: doc.id,
      data: { media: ids.map((image) => ({ image })) },
    })
    console.log(`${slug}: appended ${newIds.length} video(s) -> ${ids.length} media rows`)
  }

  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e.message)
  process.exit(1)
})
