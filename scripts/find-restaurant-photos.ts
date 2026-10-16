import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

// Dry-run by default. Run with `--write` to update heroImage + imageAttribution.
// Sources: Wikimedia Commons search (strict relevance) -> Wikidata P18 fallback.

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

// Extra search queries for venues known under hotel/alt names.
const EXTRA_QUERIES: Record<string, string[]> = {
  'socalco-nature': ['Socalco Nature hotel', 'Socalco Calheta'],
  'quinta-bela-vista': ['Quinta Bela Vista Funchal hotel', 'Bela Vista Funchal'],
  'casa-velha': ['Casa Velha do Palheiro', 'Palheiro hotel'],
  'casa-da-quinta': ['Casa da Quinta Madeira'],
  'dona-amelia': ['Restaurante Dona Amélia Funchal', 'Dona Amelia restaurant'],
  'o-tapassol': ['Tapassol restaurant Funchal', 'O Tapassol'],
  'avista': ['Avista restaurant Funchal', 'Avista Cliff Bay'],
  'bar-mare': ['Bar Mare Câmara de Lobos', 'Bar Mare Madeira'],
  'rose-garden': ['Rose Garden restaurant Madeira'],
  'quinta-estacao': ['Quinta da Estação Madeira'],
  'espettus': ['Espettus Funchal'],
  'o-recante': ['Recante restaurant Madeira'],
}

const UA = 'MadeirabookPlatform/1.0 (content curation; contact: admin@madeirabook.com)'

const LICENSE_OK = /^(CC BY( |$)|CC BY-SA|CC0|Public domain)/i
const LICENSE_BAD = /NC|ND|NonCommercial|NoDerivativ|GFDL|Fair use/i
const MADEIRA_CTX = /madeira|funchal|porto santo|câmara de lobos|calheta|machico|santana|porto moniz|são vicente|ribeira brava|ponta do sol|caniço|santa cruz/i
const VENUE_CTX = /restaur|dining|food|esplanad|hotel|quinta|chef|taberna|tasca|cervejaria|churrascar|sushi|steak|bistr|café|cafe/i
const GENERIC_WORDS = new Set([
  'restaurant',
  'restaurante',
  'cafe',
  'café',
  'bar',
  'casa',
  'o',
  'a',
  'do',
  'da',
  'de',
  'the',
  'steak',
  'house',
  'bistro',
  'bistrô',
  'sushi',
  'grill',
])

interface CommonsImage {
  title: string
  thumbUrl: string
  artist: string
  license: string
  description: string
  categories: string[]
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
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function commonsSearch(query: string): Promise<string[]> {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&list=search&format=json' +
    `&srnamespace=6&srlimit=10&srsearch=${encodeURIComponent(query)}`
  const data = await fetchJson(url)
  return (data?.query?.search ?? []).map((r: any) => r.title as string)
}

async function commonsImageInfo(titles: string[]): Promise<CommonsImage[]> {
  if (!titles.length) return []
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    '&prop=imageinfo|categories&iiprop=url|size|extmetadata|mime&iiurlwidth=1920&cllimit=max' +
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
    out.push({
      title: p.title as string,
      thumbUrl: ii.thumburl ?? ii.url,
      artist: stripHtml(ii.extmetadata?.Artist?.value ?? 'Unknown'),
      license,
      description: stripHtml(ii.extmetadata?.ImageDescription?.value ?? ''),
      categories: (p.categories ?? []).map((c: any) => c.title as string),
    })
  }
  return out
}

function significantWords(name: string): string[] {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !GENERIC_WORDS.has(w))
}

function relevant(img: CommonsImage, name: string): boolean {
  const haystack = `${img.title} ${img.description} ${img.categories.join(' ')}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  const words = significantWords(name)
  if (!words.length) return false
  if (!words.every((w) => haystack.includes(w))) return false
  if (!VENUE_CTX.test(haystack)) return false
  if (!MADEIRA_CTX.test(haystack)) return false
  return true
}

async function wikidataP18(name: string): Promise<string | null> {
  const url =
    'https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json' +
    `&language=en&limit=5&search=${encodeURIComponent(name)}`
  const data = await fetchJson(url)
  for (const e of data?.search ?? []) {
    const desc = (e.description ?? '').toLowerCase()
    if (
      !desc.includes('restaurant') &&
      !desc.includes('hotel') &&
      !desc.includes('madeira')
    )
      continue
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
      `"${name}" restaurant`,
      `"${name}" Madeira`,
      `Restaurante "${name}"`,
      `"${name}" Funchal`,
      ...(EXTRA_QUERIES[doc.slug as string] ?? []),
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
      titles = titles.filter((t) => !seen.has(t)).slice(0, 6)
      titles.forEach((t) => seen.add(t))
      if (!titles.length) continue
      const images = await commonsImageInfo(titles)
      found = images.find((i) => relevant(i, name)) ?? null
      if (found) break
    }

    let source = 'commons-search'
    if (!found) {
      try {
        const p18 = await wikidataP18(`${name} Madeira`)
        if (p18) {
          const images = await commonsImageInfo([p18])
          if (images[0]) {
            found = images[0]
            source = 'wikidata-p18'
          }
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
      detail: `[${source}] ${found.title} | ${found.license} | ${found.thumbUrl}`,
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
