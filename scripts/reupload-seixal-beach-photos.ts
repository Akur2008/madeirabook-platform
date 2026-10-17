import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// Re-uploads the 3 Seixal Beach photos with SEO filenames:
//   IMG_0010.* -> seixal-beach-madeira-hero.jpg  (hero)
//   IMG_0009*  -> seixal-beach-madeira-2.jpg
//   IMG_0012.* -> seixal-beach-madeira-3.jpg
// Clears beaches.media[]/heroImage/posterUrl, deletes the previously
// uploaded `uploads` docs (R2 objects are removed by storage-s3), then
// re-creates media[] in order [hero, 2, 3] with hero as hero/poster.
// Usage: npx tsx scripts/reupload-seixal-beach-photos.ts

const SLUG = 'seixal-beach'
const PHOTOS_DIR = path.join(os.homedir(), 'Downloads', 'madeira-photos', SLUG)
const MAX_WIDTH = 1600
const JPEG_QUALITY = 85

const MAPPING = [
  { src: 'IMG_0010', name: `${SLUG}-madeira-hero.jpg` },
  { src: 'IMG_0009', name: `${SLUG}-madeira-2.jpg` },
  { src: 'IMG_0012', name: `${SLUG}-madeira-3.jpg` },
]

const relId = (v: unknown): number | string | null =>
  typeof v === 'object' && v !== null ? (v as { id: number | string }).id : (v as number | string | null)

async function main() {
  const p = await getPayload({ config })

  const { docs } = await p.find({
    collection: 'beaches',
    where: { slug: { equals: SLUG } },
    limit: 1,
    depth: 0,
  })
  const beach = docs[0]
  if (!beach) {
    console.error(`${SLUG} not found`)
    process.exit(1)
  }

  const oldIds = (beach.media ?? [])
    .map((m) => relId(m.image))
    .filter((id): id is number | string => id != null)
  const videoId = relId(beach.videoFile)
  console.log(`old uploads to delete: ${oldIds.join(', ') || 'none'}`)

  // Clear references first — Postgres FK on beaches_media would block
  // deleting rows that media[] still points at.
  await p.update({
    collection: 'beaches',
    id: beach.id,
    data: {
      media: [],
      heroImage: null,
      posterUrl: null,
      ...(videoId != null && oldIds.includes(videoId) ? { videoFile: null } : {}),
    },
  })

  for (const id of oldIds) {
    await p.delete({ collection: 'uploads', id })
    console.log(`  DELETED upload ${id}`)
  }

  const dirFiles = await fs.readdir(PHOTOS_DIR)
  const media: { image: number }[] = []
  let heroUrl: string | null = null

  for (const { src, name } of MAPPING) {
    const file = dirFiles.find((f) => path.parse(f).name.startsWith(src))
    if (!file) {
      console.error(`missing source for ${src}* in ${PHOTOS_DIR}`)
      process.exit(1)
    }
    const buffer = await sharp(path.join(PHOTOS_DIR, file))
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer()
    const upload = await p.create({
      collection: 'uploads',
      data: { alt: beach.name },
      file: { data: buffer, name, mimetype: 'image/jpeg', size: buffer.length },
    })
    media.push({ image: upload.id })
    if (name.endsWith('-hero.jpg')) heroUrl = upload.url ?? null
    console.log(`  UPLOADED ${file} -> ${upload.url}`)
  }

  await p.update({
    collection: 'beaches',
    id: beach.id,
    data: { media, heroImage: heroUrl, posterUrl: heroUrl, imageAttribution: null },
  })

  console.log(`\nOK ${SLUG}: media=[${media.map((m) => m.image).join(', ')}]`)
  console.log(`hero/poster = ${heroUrl}`)
  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
