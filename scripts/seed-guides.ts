import { getPayload, type Payload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

import { guideWhereToStay } from './guides-content/where-to-stay.js'
import { guideBestTime } from './guides-content/best-time.js'
import { guideItinerary } from './guides-content/itinerary-7-days.js'
import { guideRestaurants } from './guides-content/restaurants-funchal.js'
import { guideNoCar } from './guides-content/madeira-without-a-car.js'

export type Block =
  | { t: 'h2' | 'h3'; text: string }
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }

export interface GuideDef {
  slug: string
  title: string
  excerpt: string
  category: 'gastronomy' | 'lifestyle' | 'logistics' | 'spots' | 'history'
  coverFilename?: string
  featuredRestaurants?: string[]
  featuredBeaches?: string[]
  featuredProperties?: string[]
  seo: { title: string; description: string }
  faqs: { question: string; answer: string }[]
  blocks: Block[]
}

// ---------- Lexical builders ----------

const textNode = (text: string, format = 0) => ({
  mode: 'normal' as const,
  text,
  type: 'text' as const,
  style: '',
  detail: 0,
  format,
  version: 1,
})

const linkNode = (label: string, url: string) => ({
  type: 'link' as const,
  version: 2,
  format: '',
  indent: 0,
  direction: 'ltr' as const,
  children: [textNode(label)],
  fields: { linkType: 'custom', newTab: false, url },
})

// Parses **bold** and [label](url) inline markup.
function inline(text: string) {
  const nodes: ReturnType<typeof textNode | typeof linkNode>[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(textNode(text.slice(last, m.index)))
    if (m[1] !== undefined) nodes.push(linkNode(m[1], m[2]))
    else nodes.push(textNode(m[3], 1))
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(textNode(text.slice(last)))
  return nodes
}

const wrap = (type: string, children: unknown[], extra: Record<string, unknown> = {}) => ({
  type,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  children,
  ...extra,
})

function toLexical(blocks: Block[]) {
  const children = blocks.map((b) => {
    switch (b.t) {
      case 'h2':
      case 'h3':
        return wrap('heading', inline(b.text), { tag: b.t })
      case 'p':
        return wrap('paragraph', inline(b.text))
      case 'ul':
        return wrap(
          'list',
          b.items.map((item, i) =>
            wrap('listitem', inline(item), { checked: undefined, value: i + 1 }),
          ),
          { tag: 'ul', listType: 'bullet', start: 1 },
        )
    }
  })
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children,
    },
  }
}

// ---------- Seed ----------

async function findIds(
  p: Payload,
  collection: 'restaurants' | 'beaches' | 'properties',
  slugs: string[] | undefined,
) {
  if (!slugs?.length) return []
  const { docs } = await p.find({
    collection,
    where: { slug: { in: slugs } },
    limit: slugs.length,
    depth: 0,
  })
  const bySlug = new Map(docs.map((d) => [d.slug, d.id]))
  return slugs.map((s) => bySlug.get(s)).filter(Boolean) as number[]
}

async function findUploadId(p: Payload, filename: string | undefined) {
  if (!filename) return undefined
  const { docs } = await p.find({
    collection: 'uploads',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  })
  return docs[0]?.id as number | undefined
}

async function main() {
  const payload = await getPayload({ config: await config })

  const guides: GuideDef[] = [
    guideWhereToStay,
    guideBestTime,
    guideItinerary,
    guideRestaurants,
    guideNoCar,
  ]

  for (const g of guides) {
    const data = {
      title: g.title,
      slug: g.slug,
      excerpt: g.excerpt,
      content: toLexical(g.blocks),
      category: g.category,
      status: 'published' as const,
      publishedAt: '2026-10-24T10:00:00.000Z',
      coverImage: await findUploadId(payload, g.coverFilename),
      featuredRestaurants: await findIds(payload, 'restaurants', g.featuredRestaurants),
      featuredBeaches: await findIds(payload, 'beaches', g.featuredBeaches),
      featuredProperties: await findIds(payload, 'properties', g.featuredProperties),
      seo: { title: g.seo.title, description: g.seo.description },
      faqs: g.faqs,
    }

    const { docs } = await payload.find({
      collection: 'guides',
      where: { slug: { equals: g.slug } },
      limit: 1,
      depth: 0,
    })

    if (docs[0]) {
      await payload.update({ collection: 'guides', id: docs[0].id, data })
      console.log('updated:', g.slug)
    } else {
      await payload.create({ collection: 'guides', data })
      console.log('created:', g.slug)
    }
  }

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
