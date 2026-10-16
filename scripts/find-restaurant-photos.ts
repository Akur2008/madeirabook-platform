import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

// Dry-run by default. Run with `--write` to update heroImage + imageAttribution.
// Search: Wikimedia Commons API -> license check via extmetadata -> Wikidata P18 fallback.

const WRITE = process.argv.includes('--write')

const SLUGS = [
  'socalco-nature',
  'oxalis',
  'avista',
  'bar-mare',
  'razao',
  'bago',
  'o-recante',
  'fx-restaurant',
  'come-together',
  'rose-garden',
  'laranjinha-bistro',
  'motya-cafe',
  'espettus',
  'quinta-estacao',
  'quinta-bela-vista',
  'il-basilico',
  'o-tapassol',
  'chefe-steak-house',
  'casa-da-quinta',
  'criss-place',
  'favila',
  'terreiro',
  'dona-amelia',
  'casa-velha',
  'il-vivaldi',
  'tipografia',
  'konsai-sushi',
  'theos',
  'akva',
  'kampo',
  'three-house',
]

const UA = 'MadeirabookPlatform/1.0 (content curation; contact: admin@madeirabook.com)'

const LICENSE_OK = /^(CC BY( |$)|CC BY-SA|CC0|Public domain)/i
const LICENSE_BAD = /NC|ND|NonCommercial|NoDerivativ|GFDL|Fair use/i

interface CommonsImage {
  title: string
  thumbUrl: string
  artist: string
  license: string
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function commonsSearch(query: string): Promise<string[]> {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&list=search&format=json' +
    `&srnamespace=6&srlimit=8&srsearch=${encodeURIComponent(query)}`
  const data = await fetchJson(url)
  return (data?.query?.search ?? []).map((r: any) => r.title as string)
}

async function commonsImageInfo(titles: string[]): Promise<CommonsImage[]> {
  if (!titles.length) return []
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    '&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=1920' +
    `&titles=${encodeURIComponent(titles.join('|'))}`
  const data = await fetchJson(url)
  const pages = Object.values(data?.query?.pages ?? {}) as any[]
  const out: CommonsImage[] = []
  for (const p of pages) {
    const ii = p?.imageinfo?.[0]
    if (!ii || ii.mime !== 'image/jpeg') continue
    if ((ii.width ?? 0) < 1200) continue
    const license = stripHtml(ii.extmetadata?.LicenseShortName?.value ?? '')
    if (!LICENSE_OK.test(license) || LICENSE_BAD.test(license)) continue
    const artist = stripHtml(ii.extmetadata?.Artist?.value ?? 'Unknown')
    out.push({
      title: p.title as string,
      thumbUrl: ii.thumburl ?? ii.url,
      artist,
      license,
    })
  }
  return out
}

function relevant(img: CommonsImage, name: string): boolean {
  const t = img.title.toLowerCase()
  const words = name
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['the', 'restaurant', 'cafe', 'bar', 'casa'].includes(w))
  return words.some((w) => t.includes(w))
}

async function wikidataP18(name: string): Promise<string | null> {
  const url =
    'https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json' +
    `&language=en&limit=3&search=${encodeURIComponent(name)}`
  const data = await fetchJson(url)
  for (const e of data?.search ?? []) {
    const desc = (e.description ?? '').toLowerCase()
    if (!desc.includes('restaurant') && !desc.includes('madeira')) continue
    const ent = await fetchJson(
      `https://www.wikidata.org/wiki/Special:EntityData/${e.id}.json`,
    )
    const p18 = ent?.entities?.[e.id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
    if (typeof p18 === 'string') return `File:${p18.replace(/ /g, '_')}`
  }
  return null
}

async function main() {
  const p = await getPayload({ config })
  const { docs } = await p.find({
    collection: 'restaurants',
    where: { slug: { in: SLUGS } },
    limit: 100,
    depth: 0,
  })

  const report: { slug: string; status: string; detail: string }[] = []

  for (const doc of docs) {
    const name = doc.name as string
    const queries = [
      `${name} Madeira restaurant`,
      `${name} Madeira`,
      `${name} Funchal`,
    ]
    let found: CommonsImage | null = null
    const seen = new Set<string>()

    for (const q of queries) {
      let titles: string[] = []
      try {
        titles = await commonsSearch(q)
      } catch {
        continue
      }
      titles = titles.filter((t) => !seen.has(t))
      titles.forEach((t) => seen.add(t))
      const images = await commonsImageInfo(titles.slice(0, 5))
      found = images.find((i) => relevant(i, name)) ?? null
      if (found) break
    }

    if (!found) {
      try {
        const p18 = await wikidataP18(`${name} Madeira`)
        if (p18) {
          const images = await commonsImageInfo([p18])
          found = images[0] ?? null
        }
      } catch {
        // ignore
      }
    }

    if (!found) {
      report.push({ slug: doc.slug, status: 'SKIP', detail: 'no free image found' })
      continue
    }

    const attribution = `Photo by ${found.artist}, ${found.license}, via Wikimedia Commons`
    if (WRITE) {
      await p.update({
        collection: 'restaurants',
        id: doc.id,
        data: { heroImage: found.thumbUrl, imageAttribution: attribution },
      })
    }
    report.push({
      slug: doc.slug,
      status: 'OK',
      detail: `${found.title} | ${found.license} | ${attribution}`,
    })
  }

  console.log(`\n=== ${WRITE ? 'WRITE' : 'DRY-RUN'} RESULTS ===`)
  const ok = report.filter((r) => r.status === 'OK')
  const skip = report.filter((r) => r.status === 'SKIP')
  report.forEach((r) => console.log(`${r.status} ${r.slug} :: ${r.detail}`))
  console.log(`\nFound: ${ok.length}/${report.length} | Missing: ${skip.length}`)

  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
