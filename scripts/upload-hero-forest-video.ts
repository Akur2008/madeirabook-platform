import 'dotenv/config'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// Uploads the homepage hero forest loop (video + poster frame) to R2.
// Source files are produced by ffmpeg in ~/madeirabook-media/hero-work/.

const WORK_DIR = path.join(os.homedir(), 'madeirabook-media', 'hero-work')

const FILES = [
  {
    local: 'forest-with-sound.mp4',
    key: 'homepage-hero-forest.mp4',
    contentType: 'video/mp4',
  },
  {
    local: 'homepage-hero-forest-poster.jpg',
    key: 'homepage-hero-forest-poster.jpg',
    contentType: 'image/jpeg',
  },
]

const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL || 'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev'

async function main() {
  const client = new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    region: 'auto',
    forcePathStyle: true,
  })

  for (const { local, key, contentType } of FILES) {
    const body = await fs.readFile(path.join(WORK_DIR, local))
    await client.send(
      new PutObjectCommand({
        Bucket: 'madeirabook-sounds',
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    console.log(`${R2_PUBLIC_URL}/${key}  (${body.length} bytes)`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
