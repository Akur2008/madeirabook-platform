import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// Uploads restaurant photos from ~/Downloads/madeira-photos/<slug>/ to the
// `uploads` collection (R2 via storage-s3) and appends them to restaurant.media[].
// HEIC files are converted via macOS `sips`; all images are resized to
// max width 1600px, JPEG quality 85.

const execFileAsync = promisify(execFile)

const PHOTOS_DIR =
  process.argv.slice(2).find((a) => !a.startsWith('--')) ??
  path.join(os.homedir(), 'Downloads', 'madeira-photos')

// Folder name -> restaurant slug, for mismatched folder names.
const SLUG_ALIASES: Record<string, string> = {
  akua: 'akva',
}

// Optional --only=<folder> to process a single folder.
const ONLY = process.argv
  .find((a) => a.startsWith('--only='))
  ?.split('=')[1]

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

  const entries = await fs.readdir(PHOTOS_DIR, { withFileTypes: true })
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name)

  const updated: { slug: string; count: number }[] = []
  const notFound: string[] = []
  const emptyFolders: string[] = []
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'restaurant-photos-'))

  try {
    for (const folder of folders) {
      if (ONLY && folder !== ONLY) continue
      const slug = SLUG_ALIASES[folder] ?? folder
      const dir = path.join(PHOTOS_DIR, folder)
      const files = (await fs.readdir(dir))
        .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
        .sort()

      if (files.length === 0) {
        emptyFolders.push(folder)
        continue
      }

      const { docs } = await p.find({
        collection: 'restaurants',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
      })
      const restaurant = docs[0]
      if (!restaurant) {
        notFound.push(slug)
        continue
      }

      const media = (restaurant.media ?? []).map((m) => ({ image: m.image }))
      let firstUrl: string | null = null

      for (const file of files) {
        const buffer = await toJpegBuffer(path.join(dir, file), tmpDir)
        const name = `${slug}-${path.parse(file).name}.jpg`
        const upload = await p.create({
          collection: 'uploads',
          data: { alt: restaurant.name },
          file: {
            data: buffer,
            name,
            mimetype: 'image/jpeg',
            size: buffer.length,
          },
        })
        media.push({ image: upload.id })
        firstUrl ??= upload.url ?? null
        console.log(`  UPLOADED ${slug}/${file} -> uploads/${upload.id}`)
      }

      const data: Record<string, unknown> = { media }
      if (!restaurant.posterUrl && firstUrl) data.posterUrl = firstUrl

      await p.update({ collection: 'restaurants', id: restaurant.id, data })
      updated.push({ slug, count: files.length })
      console.log(`OK ${slug} (${files.length} photo${files.length > 1 ? 's' : ''})`)
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }

  console.log('\n=== REPORT ===')
  console.log('Updated:')
  updated.forEach((u) => console.log(`  ${u.slug} -> ${u.count}`))
  console.log(`Total restaurants updated: ${updated.length}`)
  console.log('Not found in Payload:', notFound.length ? notFound.join(', ') : 'none')
  console.log('Folders with no photos:', emptyFolders.length ? emptyFolders.join(', ') : 'none')

  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
