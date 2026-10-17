import 'dotenv/config'
import config from '../src/payload.config'
import { getPayload } from 'payload'
import sharp from 'sharp'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// Batch 2: restaurants that had no photos after the first upload pass.
// Photos were curated manually (see ATTRIBUTION per slug), staged under
// ~/Downloads/madeira-photos/<slug>/photo.jpg, resized to max width 1600px,
// JPEG quality 85, uploaded to `uploads` (R2) and appended to media[].
// posterUrl is set from the first uploaded photo; imageAttribution records
// the source so images can be replaced later.

const PHOTOS_DIR = path.join(os.homedir(), 'Downloads', 'madeira-photos')

const SOURCES: Record<string, { url: string; attribution: string }> = {
  'dona-amelia': {
    url: 'https://www.donaameliarestaurant.com/services-6',
    attribution: 'Source: donaameliarestaurant.com (official site)',
  },
  espettus: {
    url: 'https://restaurantguru.com/Espettus-Funchal',
    attribution: 'Source: Restaurant Guru (restaurantguru.com)',
  },
  favila: {
    url: 'https://restaurantguru.com/Restaurante-Favilla-Funchal',
    attribution: 'Source: Restaurant Guru (restaurantguru.com)',
  },
  'fx-restaurant': {
    url: 'https://visit.funchal.pt/item/fx-restaurant-sports-bar/',
    attribution: 'Source: Visit Funchal (visit.funchal.pt)',
  },
  'il-basilico': {
    url: 'https://restaurantguru.com/Il-Basilico-Funchal',
    attribution: 'Source: Restaurant Guru (restaurantguru.com)',
  },
  'il-vivaldi': {
    url: 'https://restaurantguru.com/Il-Vivaldi-Funchal',
    attribution: 'Source: Restaurant Guru (restaurantguru.com)',
  },
  'motya-cafe': {
    url: 'https://motya.pt/',
    attribution: 'Source: motya.pt (official site)',
  },
  'o-recante': {
    url: 'https://restaurantguru.com/Paladares-da-terra-Canical',
    attribution: 'Source: Restaurant Guru (restaurantguru.com)',
  },
  'o-tapassol': {
    url: 'https://restaurantguru.com/O-Tapassol-Funchal',
    attribution: 'Source: Restaurant Guru (restaurantguru.com)',
  },
  oxalis: {
    url: 'https://restaurantguru.com/Oxalis-Funchal',
    attribution: 'Source: Restaurant Guru (restaurantguru.com)',
  },
  'quinta-estacao': {
    url: 'https://restaurantguru.com/Quinta-Estacao-Funchal',
    attribution: 'Source: Restaurant Guru (restaurantguru.com)',
  },
  razao: {
    url: 'https://socalconature.com/razao-restaurante/',
    attribution: 'Source: socalconature.com (official site)',
  },
  'rose-garden': {
    url: 'https://restaurantguru.com/Rose-Garden-Funchal',
    attribution: 'Source: Restaurant Guru (restaurantguru.com)',
  },
  'socalco-nature': {
    url: 'https://socalconature.com/',
    attribution: 'Source: socalconature.com (official site)',
  },
  terreiro: {
    url: 'https://restaurantguru.com/Terreiro-Caffe-Portugal-3',
    attribution: 'Source: Restaurant Guru (restaurantguru.com)',
  },
  theos: {
    url: 'https://theos.pt/',
    attribution: 'Source: theos.pt (official site)',
  },
  'three-house': {
    url: 'https://restaurantguru.com/Three-House-Hotel-and-Gastrobar-Funchal',
    attribution: 'Source: Restaurant Guru (restaurantguru.com)',
  },
  tipografia: {
    url: 'https://restaurantguru.com/Restaurante-Tipografia-Funchal',
    attribution: 'Source: Restaurant Guru (restaurantguru.com)',
  },
}

const ONLY = process.argv
  .find((a) => a.startsWith('--only='))
  ?.split('=')[1]

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const MAX_WIDTH = 1600
const JPEG_QUALITY = 85

async function main() {
  const p = await getPayload({ config })

  const updated: { slug: string; count: number }[] = []
  const skipped: { slug: string; reason: string }[] = []

  for (const slug of Object.keys(SOURCES)) {
    if (ONLY && slug !== ONLY) continue
    const dir = path.join(PHOTOS_DIR, slug)

    let files: string[] = []
    try {
      files = (await fs.readdir(dir)).filter((f) =>
        IMAGE_EXTS.has(path.extname(f).toLowerCase()),
      )
    } catch {
      skipped.push({ slug, reason: 'no local folder' })
      continue
    }
    if (!files.length) {
      skipped.push({ slug, reason: 'empty folder' })
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
      skipped.push({ slug, reason: 'not found in Payload' })
      continue
    }
    if (restaurant.media && restaurant.media.length > 0) {
      skipped.push({ slug, reason: 'already has media' })
      continue
    }

    const media = (restaurant.media ?? []).map((m) => ({ image: m.image }))
    let firstUrl: string | null = null

    for (const file of files.sort()) {
      const buffer = await sharp(path.join(dir, file))
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer()
      const upload = await p.create({
        collection: 'uploads',
        data: { alt: restaurant.name },
        file: {
          data: buffer,
          name: `${slug}-${path.parse(file).name}.jpg`,
          mimetype: 'image/jpeg',
          size: buffer.length,
        },
      })
      media.push({ image: upload.id })
      firstUrl ??= upload.url ?? null
      console.log(`  UPLOADED ${slug}/${file} -> uploads/${upload.id}`)
    }

    const data: Record<string, unknown> = {
      media,
      imageAttribution: SOURCES[slug].attribution,
    }
    if (!restaurant.posterUrl && firstUrl) data.posterUrl = firstUrl

    await p.update({ collection: 'restaurants', id: restaurant.id, data })
    updated.push({ slug, count: files.length })
    console.log(`OK ${slug} (${files.length} photo${files.length > 1 ? 's' : ''})`)
  }

  console.log('\n=== REPORT ===')
  updated.forEach((u) => console.log(`  OK ${u.slug} -> ${u.count}`))
  skipped.forEach((s) => console.log(`  SKIP ${s.slug} :: ${s.reason}`))
  console.log(`Updated: ${updated.length} | Skipped: ${skipped.length}`)

  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
