import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// Uploads real Seixal Beach photos from ~/Downloads/madeira-photos/seixal-beach/
// to the `uploads` collection (R2 via storage-s3), replaces beaches.media[],
// and sets heroImage/posterUrl to the first uploaded photo.
// All images are resized to max width 1600px, JPEG quality 85.

const execFileAsync = promisify(execFile)

const SLUG = 'seixal-beach'
const PHOTOS_DIR =
  process.argv.slice(2).find((a) => !a.startsWith('--')) ??
  path.join(os.homedir(), 'Downloads', 'madeira-photos', SLUG)

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic'])
const MAX_WIDTH = 1600
const JPEG_QUALITY = 85

async function heicToJpeg(srcPath: string, tmpDir: string): Promise<string> {
  const outPath = path.join(tmpDir, `${path.parse(srcPath).name}.jpg`)
  await execFileAsync('sips', ['-s', 'format', 'jpeg', srcPath, '--out', outPath])
  return outPath
}

async function toJpegBuffer(filePath: string, tmpDir: string): Promise<Buffer> {
  const input =
    path.extname(filePath).toLowerCase() === '.heic'
      ? await heicToJpeg(filePath, tmpDir)
      : filePath
  return sharp(input)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer()
}

async function main() {
  const p = await getPayload({ config })

  const files = (await fs.readdir(PHOTOS_DIR))
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
  if (files.length === 0) {
    console.error(`no photos in ${PHOTOS_DIR}`)
    process.exit(1)
  }

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

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'seixal-photos-'))
  const media: { image: number }[] = []
  let firstUrl: string | null = null

  try {
    for (const file of files) {
      const buffer = await toJpegBuffer(path.join(PHOTOS_DIR, file), tmpDir)
      const base = path.parse(file).name.replace(/\s+/g, '-')
      const upload = await p.create({
        collection: 'uploads',
        data: { alt: beach.name },
        file: {
          data: buffer,
          name: `${SLUG}-${base}.jpg`,
          mimetype: 'image/jpeg',
          size: buffer.length,
        },
      })
      media.push({ image: upload.id })
      firstUrl ??= upload.url ?? null
      console.log(`  UPLOADED ${file} -> ${upload.url}`)
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }

  await p.update({
    collection: 'beaches',
    id: beach.id,
    data: {
      media,
      heroImage: firstUrl,
      posterUrl: firstUrl,
      imageAttribution: null,
    },
  })

  console.log(`\nOK ${SLUG}: ${media.length} photos, hero/poster = ${firstUrl}`)
  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
