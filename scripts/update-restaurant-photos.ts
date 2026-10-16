import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

// Verified Wikimedia Commons images for restaurants without photos.
// Each entry was manually checked: depicts the venue, license is CC-free.

const UPDATES: { slug: string; heroImage: string; imageAttribution: string }[] = [
  {
    slug: 'casa-velha',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Rua_Imperatriz_D._Am%C3%A9lia%2C_Funchal_-_2020-09-18_-_IMG_8830.jpg/1920px-Rua_Imperatriz_D._Am%C3%A9lia%2C_Funchal_-_2020-09-18_-_IMG_8830.jpg',
    imageAttribution: 'Photo by PESP/ Wikimedia, CC BY-SA 4.0, via Wikimedia Commons',
  },
  {
    slug: 'quinta-bela-vista',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Quinta_da_Bela_Vista%2C_Funchal%2C_Madeira_-_2012-02-25_-_DSC02306.jpg/1920px-Quinta_da_Bela_Vista%2C_Funchal%2C_Madeira_-_2012-02-25_-_DSC02306.jpg',
    imageAttribution:
      'Photo by Paulo SP/ Wikimedia, CC BY-SA 4.0, via Wikimedia Commons',
  },
  {
    slug: 'avista',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/The_grand_Cliff_Bay_Hotel_in_Funchal%2C_Madeira_Island%2C_Portugal.jpg/1920px-The_grand_Cliff_Bay_Hotel_in_Funchal%2C_Madeira_Island%2C_Portugal.jpg',
    imageAttribution: 'Photo by uggboy, CC BY 2.0, via Wikimedia Commons',
  },
]

async function main() {
  const p = await getPayload({ config })
  for (const u of UPDATES) {
    const { docs } = await p.find({
      collection: 'restaurants',
      where: { slug: { equals: u.slug } },
      limit: 1,
      depth: 0,
    })
    const doc = docs[0]
    if (!doc) {
      console.log(`MISS ${u.slug}`)
      continue
    }
    await p.update({
      collection: 'restaurants',
      id: doc.id,
      data: { heroImage: u.heroImage, imageAttribution: u.imageAttribution },
    })
    console.log(`OK ${u.slug} -> ${u.heroImage.slice(0, 90)}...`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
