import 'dotenv/config'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// Uploads the 9 homepage rotation clips + poster frames to R2.
// Produced by ~/madeirabook-media/homepage-trio/process.sh (Pexels sources,
// compressed to 1080p h264 crf 26, <5MB each).

const WORK_DIR = path.join(os.homedir(), 'madeirabook-media', 'homepage-trio')

const NAMES = [
  'mountains-1',
  'mountains-2',
  'mountains-3',
  'forest-1',
  'forest-2',
  'forest-3',
  'ocean-1',
  'ocean-2',
  'ocean-3',
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

  for (const name of NAMES) {
    const files = [
      {
        local: path.join('out', `homepage-video-${name}.mp4`),
        key: `homepage-video-${name}.mp4`,
        contentType: 'video/mp4',
      },
      {
        local: path.join('posters', `homepage-video-${name}-poster.jpg`),
        key: `homepage-video-${name}-poster.jpg`,
        contentType: 'image/jpeg',
      },
    ]
    for (const { local, key, contentType } of files) {
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
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
