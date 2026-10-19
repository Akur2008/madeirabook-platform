import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'

// Generic official-site scraper for Madeira Oasis hotels.
// Usage: npx tsx scripts/scrape-oasis-hotel.ts <slug> <url> [more urls]
// Saves to ~/Downloads/hotel-scrape/<slug>/ : metadata.json + photos.

const SUBPAGE_RE =
  /room|suit|accommod|galler|dinin|restaur|gastron|spa|pool|experien|facilit|about|hotel|estate|garden/i
const MAX_SUBPAGES = 3
const MAX_SAVED_PHOTOS = 12
const MIN_WIDTH = 1200
const MIN_WIDTH_FALLBACK = 900

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

interface PageData {
  jsonld: string[]
  metaDescription: string
  imgs: string[]
  paras: string[]
  tels: string[]
  mails: string[]
  mapLinks: string[]
  links: string[]
}

// NOTE: passed as a string because tsx/esbuild injects a `__name` helper that
// does not exist inside the browser context.
const EXTRACT_SRC = `(() => {
  const meta = (n) => {
    const el = document.querySelector('meta[property="' + n + '"],meta[name="' + n + '"]')
    return el ? el.getAttribute('content') || '' : ''
  }
  const imgs = new Set()
  const push = (u) => {
    if (u && /^https?:/i.test(u) && !/\\.(svg|ico)(\\?|$)/i.test(u)) imgs.add(u)
  }
  const srcsetUrls = (s) => {
    if (s) s.split(',').forEach((e) => push(e.trim().split(/\\s+/)[0]))
  }
  document.querySelectorAll('img').forEach((img) => {
    push(img.src)
    push(img.getAttribute('data-src'))
    push(img.getAttribute('data-lazy-src'))
    push(img.getAttribute('data-original'))
    push(img.getAttribute('data-lazy'))
    srcsetUrls(img.srcset)
    srcsetUrls(img.getAttribute('data-srcset'))
  })
  document.querySelectorAll('source').forEach((s) => srcsetUrls(s.getAttribute('srcset')))
  document.querySelectorAll('[style]').forEach((el) => {
    const st = el.getAttribute('style') || ''
    const m = st.match(/url\\(["']?(https?:[^"')]+)/g)
    if (m) m.forEach((x) => push(x.replace(/^url\\(["']?/, '')))
  })
  push(meta('og:image'))
  push(meta('twitter:image'))
  document.querySelectorAll('link[rel="image_src"],link[imagesrcset]').forEach((l) => {
    push(l.getAttribute('href'))
    srcsetUrls(l.getAttribute('imagesrcset'))
  })
  const paras = [...document.querySelectorAll('main p,article p,section p,.content p,p')]
    .map((p) => (p.textContent || '').replace(/\\s+/g, ' ').trim())
    .filter((t) => t.length > 80)
  const attr = (sel, a) =>
    [...document.querySelectorAll(sel)].map((e) => e.getAttribute(a) || '').filter(Boolean)
  const mapsSel = 'iframe[src*="google.com/maps"],iframe[src*="maps.google"],a[href*="google.com/maps"],a[href*="maps.google"],iframe[src*="/maps/"]'
  return {
    jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
      (s) => s.textContent || '',
    ),
    metaDescription: meta('og:description') || meta('description'),
    imgs: [...imgs],
    paras: paras.slice(0, 80),
    tels: attr('a[href^="tel:"]', 'href'),
    mails: attr('a[href^="mailto:"]', 'href'),
    mapLinks: attr(mapsSel, 'src').concat(attr(mapsSel, 'href')),
    links: [...document.querySelectorAll('a[href]')].map((a) => a.href),
  }
})()`

async function extract(page: import('@playwright/test').Page): Promise<PageData> {
  return page.evaluate(EXTRACT_SRC) as Promise<PageData>
}

function parseJsonLd(blocks: string[]) {
  const out: {
    description?: string
    address?: string
    phone?: string
    lat?: number
    lng?: number
    amenities: string[]
    images: string[]
  } = { amenities: [], images: [] }
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    const o = node as Record<string, unknown>
    const types = ([] as unknown[]).concat(o['@type'] ?? [])
    if (types.some((t) => /hotel|lodging|resort/i.test(String(t)))) {
      if (typeof o.description === 'string' && !out.description)
        out.description = o.description
      const addr = o.address as Record<string, unknown> | undefined
      if (addr && typeof addr === 'object') {
        out.address = [
          addr.streetAddress,
          addr.postalCode,
          addr.addressLocality,
          addr.addressCountry &&
          typeof addr.addressCountry === 'object'
            ? (addr.addressCountry as Record<string, unknown>).name
            : addr.addressCountry,
        ]
          .filter(Boolean)
          .join(' ')
      }
      if (typeof o.telephone === 'string' && !out.phone) out.phone = o.telephone
      const geo = o.geo as Record<string, unknown> | undefined
      if (geo && typeof geo === 'object') {
        const lat = Number(geo.latitude)
        const lng = Number(geo.longitude)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          out.lat = lat
          out.lng = lng
        }
      }
      const feats = ([] as unknown[]).concat(o.amenityFeature ?? [])
      for (const f of feats) {
        const name = (f as Record<string, unknown>)?.name
        if (typeof name === 'string') out.amenities.push(name)
      }
    }
    const img = o.image ?? o.photo
    for (const i of ([] as unknown[]).concat(img ?? [])) {
      if (typeof i === 'string') out.images.push(i)
      else if (i && typeof i === 'object') {
        const u = (i as Record<string, unknown>).url
        if (typeof u === 'string') out.images.push(u)
      }
    }
    for (const k of ['@graph', 'mainEntity', 'containsPlace']) walk(o[k])
  }
  for (const b of blocks) {
    try {
      walk(JSON.parse(b))
    } catch {
      /* ignore malformed json-ld */
    }
  }
  return out
}

function coordsFromMapLinks(links: string[]) {
  for (const l of links) {
    const m =
      l.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ??
      l.match(/[?&](?:q|ll|query|center)=(-?\d+\.\d+),(-?\d+\.\d+)/) ??
      l.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (m) return { lat: Number(m[1]), lng: Number(m[2]) }
  }
  return undefined
}

function classify(name: string) {
  const n = name.toLowerCase()
  if (/room|suite|quarto|bedroom|zimmer/.test(n)) return 'room'
  if (/pool|piscina/.test(n)) return 'pool'
  if (/spa|wellness|massage/.test(n)) return 'spa'
  if (/restaur|dining|gastro|breakfast|bar|food|chef/.test(n)) return 'restaurant'
  if (/garden|jardim|park|terrasse|terrace/.test(n)) return 'garden'
  if (/view|aerial|drone|vista|ocean|sea|beach/.test(n)) return 'view'
  if (/lobby|exterior|facade|entrance|building|hotel/.test(n)) return 'exterior'
  return 'photo'
}

async function main() {
  const [slug, ...urls] = process.argv.slice(2)
  if (!slug || !urls.length) {
    console.error('usage: scrape-oasis-hotel.ts <slug> <url> [url2...]')
    process.exit(1)
  }
  const outDir = path.join(os.homedir(), 'Downloads', 'hotel-scrape', slug)
  await fs.mkdir(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  })
  const page = await ctx.newPage()

  const allImgs: string[] = []
  const jsonldBlocks: string[] = []
  const paras: string[] = []
  const tels = new Set<string>()
  const mails = new Set<string>()
  const mapLinks: string[] = []
  let metaDescription = ''
  const visited = new Set<string>()
  const queue = [...urls]

  while (queue.length && visited.size < urls.length + MAX_SUBPAGES) {
    const u = queue.shift()!
    if (visited.has(u)) continue
    visited.add(u)
    try {
      await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForTimeout(2500)
      for (let i = 0; i < 4; i++) {
        await page.mouse.wheel(0, 1400)
        await page.waitForTimeout(700)
      }
      const d = await extract(page)
      jsonldBlocks.push(...d.jsonld)
      paras.push(...d.paras)
      d.tels.forEach((t) => tels.add(t))
      d.mails.forEach((m) => mails.add(m))
      mapLinks.push(...d.mapLinks)
      if (!metaDescription) metaDescription = d.metaDescription
      allImgs.push(...d.imgs)
      if (visited.size === 1) {
        const seed = new URL(u)
        const prefix = seed.pathname.replace(/\/$/, '')
        for (const l of d.links) {
          try {
            const lo = new URL(l)
            // On multi-hotel portals (pestana.com, belmond.com) only crawl
            // pages under the hotel's own path; dedicated hotel sites (seed
            // path '/') may crawl any same-origin link.
            const inScope = prefix === '' || lo.pathname.startsWith(prefix)
            if (
              lo.origin === seed.origin &&
              inScope &&
              SUBPAGE_RE.test(lo.pathname) &&
              !visited.has(l) &&
              queue.length < urls.length + MAX_SUBPAGES
            ) {
              queue.push(lo.href.split('#')[0])
            }
          } catch {
            /* bad url */
          }
        }
      }
      console.log(`OK ${u} -> ${d.imgs.length} imgs, ${d.paras.length} paras`)
    } catch (e) {
      console.log(`FAIL ${u}: ${(e as Error).message.slice(0, 120)}`)
    }
  }
  await browser.close()

  const ld = parseJsonLd(jsonldBlocks)
  const coords = ld.lat ? { lat: ld.lat, lng: ld.lng } : coordsFromMapLinks(mapLinks)

  // dedupe + rank images: json-ld/og images first, then DOM order.
  // CDN size variants (e.g. img.belmond.com/f_auto/t_2400_ar_4_5/...) are
  // normalized so one photo counts once — we keep the best variant ≤2400px.
  const normKey = (u: string) =>
    u.replace(/\/(f_auto\/)?t_\d+(_ar_[\d_]+)?\//g, '/')
  const sizeOf = (u: string) => {
    const m = u.match(/\/t_(\d+)_/)
    return m ? Number(m[1]) : 0
  }
  const byKey = new Map<string, string>()
  for (const u of [...ld.images, ...allImgs]) {
    if (
      /logo|icon|sprite|flag|avatar|partner|badge|tripadvisor|facebook|instagram|loading|placeholder|blank\.|spinner/i.test(
        u,
      )
    )
      continue
    const k = normKey(u)
    const prev = byKey.get(k)
    if (!prev) {
      byKey.set(k, u)
      continue
    }
    const s = sizeOf(u)
    const ps = sizeOf(prev)
    const prefer = (v: number) => (v && v <= 2400 ? 1e6 + v : v)
    if (prefer(s) > prefer(ps)) byKey.set(k, u)
  }
  const candidates = [...byKey.values()]

  const saved: { url: string; w: number; h: number; cat: string; buf: Buffer; ext: string }[] = []
  const weak: typeof saved = []
  for (const u of candidates.slice(0, 80)) {
    if (saved.length >= MAX_SAVED_PHOTOS) break
    try {
      const res = await fetch(u, {
        headers: { 'User-Agent': UA, Referer: urls[0] },
        signal: AbortSignal.timeout(20000),
      })
      if (!res.ok) continue
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 25000) continue
      const meta = await sharp(buf).metadata().catch(() => undefined)
      if (!meta?.width || !meta?.height) continue
      const ext = (meta.format ?? 'jpg').replace('jpeg', 'jpg')
      const rec = { url: u, w: meta.width, h: meta.height, cat: classify(u), buf, ext }
      if (meta.width >= MIN_WIDTH) saved.push(rec)
      else if (meta.width >= MIN_WIDTH_FALLBACK) weak.push(rec)
      if (saved.length + weak.length > MAX_SAVED_PHOTOS + 6) break
    } catch {
      /* skip */
    }
  }
  const chosen = [...saved, ...weak].slice(0, MAX_SAVED_PHOTOS)
  const counters: Record<string, number> = {}
  const photoList: string[] = []
  for (const c of chosen) {
    const idx = (counters[c.cat] = (counters[c.cat] ?? 0) + 1)
    const fname = `${slug}-${c.cat}-${idx}.${c.ext}`
    await fs.writeFile(path.join(outDir, fname), c.buf)
    photoList.push(fname)
    console.log(`saved ${fname} ${c.w}x${c.h}`)
  }

  const description =
    ld.description ??
    paras.filter((p) => p.length > 120).slice(0, 3).join('\n\n') ??
    metaDescription

  const metadata = {
    slug,
    official_url: urls[0],
    scraped_pages: [...visited],
    metaDescription,
    description_en: description ?? '',
    paragraphs: paras.slice(0, 20),
    amenities: ld.amenities,
    coordinates: coords ?? null,
    contact: {
      phone:
        [...tels][0]?.replace('tel:', '') || ld.phone || null,
      email: [...mails][0]?.replace('mailto:', '').split('?')[0] || null,
      address: ld.address ?? null,
    },
    photos_count: photoList.length,
    photo_list: photoList,
    image_source_urls: candidates.slice(0, 60),
  }
  await fs.writeFile(
    path.join(outDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2),
  )
  await fs.writeFile(
    path.join(outDir, '_raw.json'),
    JSON.stringify({ jsonldBlocks, mapLinks, paras }, null, 2),
  )
  console.log(
    `DONE ${slug}: ${photoList.length} photos, desc=${(description ?? '').length} chars, coords=${JSON.stringify(coords)}`,
  )
  process.exit(0)
}

main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
