import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'
import fs from 'node:fs'

// Uploads the Quinta da Serra v3 showcase reel (Instagram Reel + "Мой фильм
// 180" mountain ambient audio, 608x1080, ~57s, faststart) to the `uploads`
// collection (R2 via storage-s3). Used by
// src/app/(oasis)/oasis/hotels/quinta-da-serra-v3/page.tsx.

const VIDEO_PATH = '/tmp/quinta-v3/quinta-da-serra-v3-reel-with-audio.mp4'
const VIDEO_NAME = 'quinta-da-serra-v3-reel-with-audio.mp4'

async function main() {
  const p = await getPayload({ config })

  const buffer = fs.readFileSync(VIDEO_PATH)
  const upload = await p.create({
    collection: 'uploads',
    data: { alt: 'Quinta da Serra — a quiet retreat above the clouds' },
    file: {
      data: buffer,
      name: VIDEO_NAME,
      mimetype: 'video/mp4',
      size: buffer.length,
    },
  })
  console.log(`UPLOADED ${VIDEO_NAME} -> ${upload.url}`)

  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
