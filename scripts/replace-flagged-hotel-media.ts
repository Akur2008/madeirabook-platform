import 'dotenv/config'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import config from '../src/payload.config'
import { getPayload } from 'payload'

// Replaces audit-flagged media on Madeira Oasis hotels with freely-licensed
// Wikimedia Commons photos of the same hotel (or, where Commons has no
// photo of the property, a labelled local-area / same-resort image — never a
// different hotel's photo).
//
// What gets removed from each media[] array:
//   - scraped official-site photos (R2 uploads/<hotel>-*.jpg)
//   - third-party reels (/images/*/video-*.mp4, r2 ...-video-1.mp4)
//   - poster frames extracted from those reels (/images/*/video-*-poster.jpg)
//   - any remaining Unsplash URLs
// What stays:
//   - owner-uploaded galleries under /images/<dir>/IMG_* (barcelo,
//   pestana-casino-park, hotel-orquidea — untouched property)
// Files are NOT deleted from R2/public — only array references change.
//
// Each Commons file is downloaded as a 1920px thumbnail, re-hosted on R2
// under hotels/<slug>-commons-<n>.jpg, and registered as a media doc whose
// `alt` carries the attribution line (same convention as
// restaurants.imageAttribution).

const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL || 'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev'
const UA =
  'MadeirabookPlatform/1.0 (content licensing cleanup; contact: admin@madeirabook.com)'

interface Img {
  file: string // Commons "File:..." title
  label: string // honest caption for alt text
}
interface Plan {
  keepLocal?: boolean // keep existing /images/**.jpg owner photos
  images: Img[]
}

const PLAN: Record<string, Plan> = {
  'the-cliff-bay': {
    images: [
      { file: 'File:The grand Cliff Bay Hotel in Funchal, Madeira Island, Portugal.jpg', label: 'The Cliff Bay' },
      { file: 'File:Perfect merge between sea and coast (5468554102).jpg', label: 'The Cliff Bay — ocean deck' },
      { file: 'File:Beach (8651827146).jpg', label: 'The Cliff Bay — sea access' },
    ],
  },
  'les-suites-cliff-bay': {
    images: [
      { file: 'File:Perfect merge between sea and coast (5468554102).jpg', label: 'Les Suites at The Cliff Bay resort' },
      { file: 'File:The grand Cliff Bay Hotel in Funchal, Madeira Island, Portugal.jpg', label: 'The Cliff Bay resort complex' },
      { file: 'File:Beach (8651827146).jpg', label: 'The Cliff Bay resort — sea access' },
    ],
  },
  'saccharum-resort': {
    images: [
      { file: 'File:Saccharum - Resort & Spa.jpg', label: 'Saccharum Resort & Spa' },
      { file: 'File:Sugar cane madeira hg.jpg', label: 'Sugar cane, Madeira — the resort’s design theme' },
    ],
  },
  'pestana-churchill-bay': {
    images: [
      { file: 'File:Pestana Churchill Bay.jpg', label: 'Pestana Churchill Bay' },
      { file: 'File:Pestana Churchill Bay 2.jpg', label: 'Pestana Churchill Bay' },
      { file: 'File:Madeira-Camara de Lobos-Hotel (Pestana) Churchill Bay-03ASD.jpg', label: 'Pestana Churchill Bay' },
      { file: 'File:Madeira-Camara de Lobos-Hotel (Pestana) Churchill Bay-04ASD.jpg', label: 'Pestana Churchill Bay' },
      { file: 'File:Madeira-Camara de Lobos-harbour armourstones-Hotel (Pestana) Churchill Bay-06ASD.jpg', label: 'Pestana Churchill Bay from Câmara de Lobos harbour' },
    ],
  },
  'reids-palace-belmond': {
    images: [
      { file: 'File:Funchal, Belmond Reid’s Palace.jpg', label: 'Reid’s Palace, A Belmond Hotel' },
      { file: "File:Reid's Palace Hotel, September 2009.jpg", label: 'Reid’s Palace' },
      { file: "File:Seaside swimming pool at Reid's Palace Hotel in Funchal, Madeira, Portugal - September 2010.jpg", label: 'Reid’s Palace — seaside pool' },
      { file: "File:The Atlantic Ocean Terrace at Reid's Palace Hotel, Funchal - Jul 2012.jpg", label: 'Reid’s Palace — Atlantic Ocean terrace' },
      { file: 'File:Reids Hotel Funchal Seaside 2016.JPG', label: 'Reid’s Palace from the sea' },
      { file: 'File:Funchal, Reid’s Palace (from Ribeiro Seco).jpg', label: 'Reid’s Palace — garden view' },
    ],
  },
  'savoy-palace': {
    images: [
      { file: 'File:Hotel Savoy Palace in Funchal, Madeira.jpg', label: 'Savoy Palace' },
      { file: 'File:Funchal, Savoy Palace.jpg', label: 'Savoy Palace' },
      { file: 'File:Savoy Palace, Funchal - 2022-02-14 - DSC07846.jpg', label: 'Savoy Palace' },
      { file: 'File:Savoy Palace, Funchal - 2022-02-14 - DSC07850.jpg', label: 'Savoy Palace' },
      { file: 'File:Funchal Savoy Palace Pool-2503 (51405252967).jpg', label: 'Savoy Palace — pool' },
      { file: 'File:Madeira - Funchal - Avenida do Infante DSC 2510 Savoy Palace Grounds (53370309092).jpg', label: 'Savoy Palace — grounds' },
    ],
  },
  'royal-savoy': {
    images: [
      { file: 'File:Royal Savoy pool by moonlight - Aug 2012.jpg', label: 'Royal Savoy — pool' },
      { file: 'File:Oliveira milenar, Royal Savoy Hotel, Funchal - 2013-05-11 - DSC00782.jpg', label: 'Royal Savoy — ancient olive tree' },
      { file: 'File:Oliveira milenar, Royal Savoy Hotel, Funchal - 2013-05-11 - DSC00784.jpg', label: 'Royal Savoy — ancient olive tree' },
    ],
  },
  'quinta-da-casa-branca': {
    images: [
      { file: 'File:Quinta da Casa Branca, CAISL.jpg', label: 'Quinta da Casa Branca' },
      { file: 'File:9 th floor panorama. - panoramio.jpg', label: 'View from Quinta da Casa Branca' },
      { file: 'File:9 th floor night view. - panoramio.jpg', label: 'Night view from Quinta da Casa Branca' },
    ],
  },
  'enoteca-quinta-da-serra': {
    images: [
      { file: 'File:PT-ABM-VIC-21341 - Quinta do Jardim da Serra, 1945-1954.jpg', label: 'Quinta do Jardim da Serra estate' },
      { file: 'File:"Jardim da Serra" - The Highest Villa in Madeira, MON 1909.jpg', label: 'Jardim da Serra — historic villa' },
      { file: 'File:Quinta do Jardim da Serra, Ilha da Madeira, c 1850.jpg', label: 'Quinta do Jardim da Serra, c. 1850' },
      { file: 'File:Rede junto à entrada da Quinta do Jardim da Serra, Estreito de Câmara de Lobos, 1900s.jpg', label: 'Quinta do Jardim da Serra entrance, 1900s' },
    ],
  },
  'quinta-da-serra': {
    images: [
      { file: 'File:PT-ABM-VIC-21341 - Quinta do Jardim da Serra, 1945-1954.jpg', label: 'Quinta do Jardim da Serra estate' },
      { file: 'File:"Jardim da Serra" - The Highest Villa in Madeira, MON 1909.jpg', label: 'Jardim da Serra — historic villa' },
      { file: 'File:Quinta do Jardim da Serra, Ilha da Madeira, c 1850.jpg', label: 'Quinta do Jardim da Serra, c. 1850' },
      { file: 'File:Rede junto à entrada da Quinta do Jardim da Serra, Estreito de Câmara de Lobos, 1900s.jpg', label: 'Quinta do Jardim da Serra entrance, 1900s' },
    ],
  },
  'aqua-natura-bay': {
    images: [
      { file: 'File:Hotel Aqua Natura Bay, Porto Moniz, Madeira 02.jpg', label: 'Aqua Natura Bay' },
      { file: 'File:Aquário da Madeira e Hotel Aqua Natura Bay, Porto Moniz, Madeira 02.jpg', label: 'Aqua Natura Bay and Madeira Aquarium' },
      { file: 'File:Porto Moniz, Madeira - Jan 2012 - 08.jpg', label: 'Porto Moniz natural pools by the hotel' },
    ],
  },
  'castanheiro-boutique-hotel': {
    images: [
      { file: 'File:Rua do Castanheiro, nº 47, Funchal - Madeira, October 2012.jpg', label: 'Rua do Castanheiro — the hotel’s street' },
      { file: 'File:Rua do Castanheiro, Funchal - 2013-05-17 - DSC01528.jpg', label: 'Rua do Castanheiro, Funchal old town' },
      { file: 'File:Funchal Rooftops.jpg', label: 'Funchal rooftops' },
    ],
  },
  'quinta-do-furao': {
    images: [
      { file: 'File:Quinta de furao (25974985217).jpg', label: 'Quinta do Furão' },
      { file: 'File:Quinta do Furão - Ilha da Madeira - Portugal (116780654).jpg', label: 'Quinta do Furão' },
      { file: 'File:Porto Santo in distance, from Miradouro da Quinta do Furão (in Santana).jpg', label: 'View from Quinta do Furão miradouro' },
      { file: 'File:Cabane dans les vignes - panoramio.jpg', label: 'Vineyard cabin at Quinta do Furão' },
    ],
  },
  'hotel-suite-eden-mar': {
    images: [
      { file: 'File:Funchal - Hotel Resort Vila Porto Mare 8 5-09 - panoramio.jpg', label: 'Vila Porto Mare resort (Eden Mar complex)' },
      { file: 'File:Funchal - Hotel Resort Vila Porto Mare 10 5-09 - panoramio.jpg', label: 'Vila Porto Mare resort (Eden Mar complex)' },
      { file: 'File:Hotel Porto Mare, Funchal - Jan 2012 - 10.jpg', label: 'Vila Porto Mare resort gardens' },
      { file: 'File:Hotel Porto Mare, Funchal - Jan 2012 - 12.jpg', label: 'Vila Porto Mare resort gardens' },
    ],
  },
  'pestana-promenade': {
    images: [
      { file: 'File:View From The Pestana Promenade (54544698641).jpg', label: 'View from Pestana Promenade' },
      { file: 'File:View From The Pestana Promenade (54539604019).jpg', label: 'View from Pestana Promenade' },
      { file: 'File:Funchal, Promenade do Lido (Passeio Público Marítimo) 2.jpg', label: 'Promenade do Lido at the hotel' },
    ],
  },
  'estalagem-da-ponta-do-sol': {
    images: [
      { file: 'File:Lines and shadows, Estalagem da Ponta do Sol, Madeira - Mar 2013.jpg', label: 'Estalagem da Ponta do Sol' },
      { file: 'File:2024 (challenge No. 1- old unpublished pics) - Day 52 - i-lines and shaows on walkway, Madeira, Portugal 2013 (53540887819).jpg', label: 'Estalagem da Ponta do Sol — walkway' },
      { file: 'File:Pontadosol1.JPG', label: 'Ponta do Sol' },
    ],
  },
  'pestana-carlton-madeira': {
    images: [
      { file: 'File:Madeira 2018. Our hotel. The Pestana Carlton. (44720889694).jpg', label: 'Pestana Carlton Madeira' },
      { file: 'File:Pestana Carlton Madeira - vista (2010).jpg', label: 'Pestana Carlton Madeira' },
      { file: 'File:Madeira 2018. Our hotel. The Pestana Carlton. The garden level pool. (44530407245).jpg', label: 'Pestana Carlton — garden pool' },
      { file: 'File:Madeira 2018. Our hotel. The Pestana Carlton. Garden pool. (44530411755).jpg', label: 'Pestana Carlton — garden pool' },
      { file: 'File:Madeira 2018. Our hotel. The Pestana Carlton. Lower swimming pool. (44530412945).jpg', label: 'Pestana Carlton — lower pool' },
      { file: 'File:Pestana Carlton Madeira (2010).jpg', label: 'Pestana Carlton Madeira' },
    ],
  },
  'pestana-vila-lido': {
    images: [
      { file: 'File:Funchal Pestana Vila Lido.JPG', label: 'Pestana Vila Lido' },
      { file: 'File:Lido - Funchal 01.jpg', label: 'Lido coast below the hotel' },
      { file: 'File:2016 Piscinas. Lido. Funchal. Madeira Portugal-4.jpg', label: 'Lido swimming complex, Funchal' },
    ],
  },
  'enotel-lido': {
    images: [
      { file: 'File:Lido - Funchal 01.jpg', label: 'Lido coast, Funchal' },
      { file: 'File:2016 Piscinas. Lido. Funchal. Madeira Portugal-4.jpg', label: 'Lido swimming complex, Funchal' },
      { file: 'File:São Martinho (Madeira, Portugal), Miradouro do Lido -- 2025 -- 1946.jpg', label: 'Lido promenade, Funchal' },
      { file: 'File:Madeira 4 2014.jpg', label: 'Funchal hotel zone and coast' },
    ],
  },
  'casa-velha-do-palheiro': {
    images: [
      { file: 'File:Quinta do Palheiro Ferreiro, Funchal - Madeira, October 2012 (10).jpg', label: 'Palheiro estate gardens' },
      { file: 'File:Madeira - Funchal - Quinta do Palheiro Ferreiro (33434137012).jpg', label: 'Palheiro estate gardens' },
      { file: 'File:Madeira - Funchal - Quinta do Palheiro Ferreiro - view to Funchal (32776927713).jpg', label: 'View from Palheiro estate to Funchal' },
      { file: 'File:Madeira - Funchal - Quinta do Palheiro Ferreiro - chimneys (32748004414).jpg', label: 'Palheiro estate house' },
    ],
  },
  'eira-do-serrado': {
    images: [
      { file: 'File:Looking up at Estalagem Eira do Serrado DSCF0387 (52617517722).jpg', label: 'Eira do Serrado hotel' },
      { file: 'File:Madeira Eira do Serrado 2016 3.jpg', label: 'Eira do Serrado viewpoint' },
      { file: 'File:Curral das freiras 2017.jpg', label: 'Curral das Freiras from Eira do Serrado' },
      { file: 'File:20211122.Madeira.Eira do Serrado.-011.jpg', label: 'Eira do Serrado' },
    ],
  },
  'pestana-casino-park': {
    keepLocal: true,
    images: [
      { file: 'File:Pestana Casino Park Hotel in Funchal, Madeira..jpg', label: 'Pestana Casino Park' },
      { file: 'File:Casino funchal - do hotel Pestana Casino Park.jpg', label: 'Casino da Madeira from Pestana Casino Park' },
      { file: 'File:Pestana Casino Park Hotel, Madeira (15967863763).jpg', label: 'Pestana Casino Park' },
    ],
  },
  'riu-madeira': {
    images: [
      { file: 'File:Madeira-Canico-Hotel Riu Madeira-03ASD.jpg', label: 'Riu Madeira' },
      { file: 'File:Riu Palace Madeira.jpg', label: 'Riu Palace Madeira' },
      { file: 'File:Riu Palace Madeira 2.jpg', label: 'Riu Palace Madeira' },
      { file: 'File:Caniço de Baixo - Ilha da Madeira - Portugal (12055651504).jpg', label: 'Caniço de Baixo coast' },
    ],
  },
  'oasis-canico': {
    images: [
      { file: 'File:Praia dos Reis Magos - Ilha da Madeira - Portugal (2172709832).jpg', label: 'Praia dos Reis Magos below the hotel' },
      { file: 'File:Reis Magos, Caniço - May 2007.jpg', label: 'Reis Magos, Caniço de Baixo' },
      { file: 'File:Caniço de Baixo - Ilha da Madeira - Portugal (12055651504).jpg', label: 'Caniço de Baixo' },
    ],
  },
  'galomar-sentido': {
    images: [
      { file: 'File:Hotel Galomar - Caniço - Ilha da Madeira - Portugal (11520431034).jpg', label: 'Galomar (Sentido Galomar)' },
      { file: 'File:Hotel Galomar - Caniço - Ilha da Madeira - Portugal (11520427894).jpg', label: 'Galomar (Sentido Galomar)' },
      { file: 'File:Hotel Galomar - Caniço - Ilha da Madeira - Portugal (11520519883).jpg', label: 'Galomar (Sentido Galomar)' },
    ],
  },
  'barcelo-funchal-oldtown': {
    keepLocal: true,
    images: [
      { file: 'File:Funchal - Rua de Santa Maria, Old Town.jpg', label: 'Funchal old town by the hotel' },
      { file: 'File:Funchal Old Town - November 2010.jpg', label: 'Funchal old town' },
      { file: 'File:Funchal Rooftops.jpg', label: 'Funchal rooftops' },
    ],
  },
}

interface Resolved {
  title: string
  thumb: string
  w: number
  h: number
  license: string
  artist: string
}

async function resolveFile(title: string): Promise<Resolved | null> {
  const api = new URL('https://commons.wikimedia.org/w/api.php')
  api.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: '1920',
  }).toString()
  let json: {
    query?: {
      pages?: Record<
        string,
        {
          title: string
          imageinfo?: {
            url: string
            thumburl?: string
            thumbwidth?: number
            thumbheight?: number
            width: number
            height: number
            extmetadata?: Record<string, { value?: string }>
          }[]
        }
      >
    }
  } | null = null
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(api, { headers: { 'User-Agent': UA } })
    const text = await res.text()
    try {
      json = JSON.parse(text)
      break
    } catch {
      await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)))
    }
  }
  if (!json) return null
  const pg = Object.values(json.query?.pages ?? {})[0]
  const ii = pg?.imageinfo?.[0]
  if (!ii) return null
  const em = ii.extmetadata ?? {}
  return {
    title: pg.title,
    thumb: ii.thumburl ?? ii.url,
    w: ii.thumbwidth ?? ii.width,
    h: ii.thumbheight ?? ii.height,
    license: em.LicenseShortName?.value ?? 'see Commons page',
    artist: (em.Artist?.value ?? 'unknown').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
  }
}

async function main() {
  const p = await getPayload({ config })
  const s3 = new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    region: 'auto',
    forcePathStyle: true,
  })

  const report: string[] = []

  for (const [slug, plan] of Object.entries(PLAN)) {
    const { docs } = await p.find({
      collection: 'properties',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    const doc = docs[0]
    if (!doc) {
      console.log(`${slug}: PROPERTY NOT FOUND — skipped`)
      continue
    }

    // Existing array entries to keep: owner-uploaded local photos only.
    const keepIds: number[] = []
    const removedUrls: string[] = []
    for (const m of doc.media ?? []) {
      const img = typeof m.image === 'object' && m.image ? m.image : null
      const url = (img as { url?: string } | null)?.url ?? ''
      const mime = (img as { mimeType?: string } | null)?.mimeType ?? ''
      const id = (img as { id?: number } | null)?.id
      const isOwnerPhoto =
        url.startsWith('/images/') &&
        mime.startsWith('image/') &&
        !/\/video-[^/]*-poster\./i.test(url)
      if (plan.keepLocal && isOwnerPhoto && typeof id === 'number') {
        keepIds.push(id)
      } else {
        removedUrls.push(url || `id:${id}`)
      }
    }

    // Resolve + download + upload each Commons file.
    const newIds: number[] = []
    for (const [i, spec] of plan.images.entries()) {
      const r = await resolveFile(spec.file)
      if (!r) {
        console.log(`  ${slug}: RESOLVE FAIL ${spec.file}`)
        continue
      }
      let dl: Response | null = null
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const res = await fetch(r.thumb.split('?')[0], {
            headers: { 'User-Agent': UA },
            signal: AbortSignal.timeout(30000),
          })
          if (res.ok) {
            dl = res
            break
          }
        } catch {
          /* retry below */
        }
        await new Promise((res) => setTimeout(res, 3000 * (attempt + 1)))
      }
      if (!dl) {
        console.log(`  ${slug}: DOWNLOAD FAIL ${spec.file}`)
        continue
      }
      const body = Buffer.from(await dl.arrayBuffer())
      const key = `hotels/${slug}-commons-${i + 1}.jpg`
      await s3.send(
        new PutObjectCommand({
          Bucket: 'madeirabook-sounds',
          Key: key,
          Body: body,
          ContentType: 'image/jpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      )
      const url = `${R2_PUBLIC_URL}/${key}`
      const alt = `${spec.label} — photo by ${r.artist}, ${r.license}, via Wikimedia Commons`

      const existing = await p.find({
        collection: 'media',
        where: { url: { equals: url } },
        limit: 1,
        depth: 0,
      })
      const mediaId =
        existing.docs[0]?.id ??
        (
          await p.create({
            collection: 'media',
            data: {
              url,
              alt,
              filename: `${slug}-commons-${i + 1}.jpg`,
              mimeType: 'image/jpeg',
              width: r.w,
              height: r.h,
              filesize: body.length,
            },
          })
        ).id
      newIds.push(mediaId as number)
      report.push(
        `| ${doc.title ?? slug} | ${spec.file} | ${r.artist} | ${r.license} | ${url} |`,
      )
      console.log(`  ${slug}: + ${key} (${r.w}x${r.h}, ${r.license})`)
      await new Promise((res) => setTimeout(res, 900))
    }

    if (!newIds.length && !plan.keepLocal) {
      console.log(`${slug}: NO replacements resolved — media left untouched`)
      continue
    }

    const ids = [...keepIds, ...newIds]
    await p.update({
      collection: 'properties',
      id: doc.id,
      data: { media: ids.map((image) => ({ image })) },
    })
    console.log(
      `${slug}: media -> ${ids.length} rows (kept ${keepIds.length}, added ${newIds.length}, removed ${removedUrls.length})`,
    )
    removedUrls.forEach((u) => console.log(`      - ${u}`))
  }

  const fs = await import('node:fs/promises')
  await fs.writeFile('/tmp/hotel-media-report.md', report.join('\n'))
  console.log(`\nWrote /tmp/hotel-media-report.md (${report.length} rows)`)
  process.exit(0)
}
main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
