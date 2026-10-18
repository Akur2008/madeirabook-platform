import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import os from 'node:os'
import path from 'node:path'

// Uploads the curated Quinta da Serra photo set for the v3 showcase page
// (src/app/(oasis)/oasis/hotels/quinta-da-serra-v3/page.tsx) to the `uploads`
// collection (R2 via storage-s3). Images are resized to max width 1920px,
// JPEG quality 85; the OG variant is a 1200x630 cover crop.

const PHOTOS_DIR = path.join(
  os.homedir(),
  'Downloads',
  'hotel-scrape',
  'quinta-da-serra',
)

const MAX_WIDTH = 1920
const JPEG_QUALITY = 85

const FILES: { src: string; name: string; og?: boolean }[] = [
  { src: 'quinta-da-serra-hero-1.webp', name: 'quinta-da-serra-v3-hero.jpg' },
  {
    src: 'quinta-da-serra-hero-1.webp',
    name: 'quinta-da-serra-v3-og.jpg',
    og: true,
  },
  { src: 'quinta-da-serra-exterior-8.webp', name: 'quinta-da-serra-v3-aerial.jpg' },
  { src: 'quinta-da-serra-exterior-9.webp', name: 'quinta-da-serra-v3-estate.jpg' },
  { src: 'quinta-da-serra-exterior-3.webp', name: 'quinta-da-serra-v3-garden.jpg' },
  { src: 'quinta-da-serra-pool-1.webp', name: 'quinta-da-serra-v3-pool.jpg' },
  { src: 'quinta-da-serra-photo-1.webp', name: 'quinta-da-serra-v3-pavilion.jpg' },
  { src: 'quinta-da-serra-view-4.webp', name: 'quinta-da-serra-v3-eucalyptus.jpg' },
  { src: 'quinta-da-serra-room-12.jpg', name: 'quinta-da-serra-v3-suite.jpg' },
  { src: 'quinta-da-serra-view-2.webp', name: 'quinta-da-serra-v3-valley.jpg' },
  { src: 'quinta-da-serra-spa-1.webp', name: 'quinta-da-serra-v3-spa.jpg' },
]

async function toJpegBuffer(filePath: string, og: boolean): Promise<Buffer> {
  const img = sharp(filePath).rotate()
  if (og) {
    return img.resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer()
  }
  return img
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer()
}

async function main() {
  const p = await getPayload({ config })

  for (const f of FILES) {
    const buffer = await toJpegBuffer(path.join(PHOTOS_DIR, f.src), !!f.og)
    const upload = await p.create({
      collection: 'uploads',
      data: { alt: 'Hotel Quinta da Serra — Bio Hotel, Madeira' },
      file: {
        data: buffer,
        name: f.name,
        mimetype: 'image/jpeg',
        size: buffer.length,
      },
    })
    console.log(`UPLOADED ${f.src} -> ${upload.url}`)
  }

  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
