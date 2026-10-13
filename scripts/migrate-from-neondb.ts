import 'dotenv/config'
import pg from 'pg'
import { getPayload } from 'payload'
import type { Payload, Where } from 'payload'
import config from '../src/payload.config.js'

const { Client } = pg

const FALLBACK_PRICE_PER_NIGHT = 100

const stats = { ok: 0, skip: 0, fail: 0 }
const ok = (msg: string) => {
  stats.ok++
  console.log(`OK ${msg}`)
}
const skip = (msg: string) => {
  stats.skip++
  console.log(`SKIP ${msg}`)
}
const fail = (msg: string, err: unknown) => {
  stats.fail++
  console.log(`FAIL ${msg}: ${err instanceof Error ? err.message : String(err)}`)
}

const toNum = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

async function findByField(
  payload: Payload,
  collection: 'amenities' | 'house-rules' | 'locations' | 'media' | 'properties',
  field: string,
  value: string,
) {
  const res = await payload.find({
    collection,
    where: { [field]: { equals: value } } as Where,
    limit: 1,
    depth: 0,
  })
  return res.docs[0] ?? null
}

async function main() {
  const legacy = new Client({ connectionString: process.env.LEGACY_DATABASE_URL })
  await legacy.connect()
  const payload = await getPayload({ config })

  const amenityMap = new Map<number, number>()
  const locationMap = new Map<number, number>()
  const houseRuleMap = new Map<number, number>()
  const mediaMap = new Map<number, number>()

  console.log('--- amenities ---')
  const amenities = await legacy.query(`SELECT id, name, icon FROM amenities ORDER BY id`)
  for (const row of amenities.rows) {
    try {
      const data = { name: row.name, icon: row.icon ?? undefined }
      const existing = await findByField(payload, 'amenities', 'name', row.name)
      const doc = existing
        ? await payload.update({ collection: 'amenities', id: existing.id, data })
        : await payload.create({ collection: 'amenities', data })
      amenityMap.set(row.id, doc.id)
      ok(`amenity ${row.name}`)
    } catch (e) {
      fail(`amenity ${row.name}`, e)
    }
  }

  console.log('--- locations ---')
  const locations = await legacy.query(`SELECT * FROM locations ORDER BY id`)
  for (const row of locations.rows) {
    if (!row.slug || row.geo_coordinates_lat == null || row.geo_coordinates_lng == null) {
      skip(`location id=${row.id} (missing slug or geoCoordinates)`)
      continue
    }
    try {
      const data = {
        name: row.name,
        slug: row.slug,
        description: row.description ?? undefined,
        geoCoordinates: {
          lat: Number(row.geo_coordinates_lat),
          lng: Number(row.geo_coordinates_lng),
        },
      }
      const existing = await findByField(payload, 'locations', 'slug', row.slug)
      const doc = existing
        ? await payload.update({ collection: 'locations', id: existing.id, data })
        : await payload.create({ collection: 'locations', data })
      locationMap.set(row.id, doc.id)
      ok(`location ${row.slug}`)
    } catch (e) {
      fail(`location ${row.slug}`, e)
    }
  }

  console.log('--- house-rules ---')
  const houseRules = await legacy.query(`SELECT * FROM house_rules ORDER BY id`)
  for (const row of houseRules.rows) {
    try {
      const existing = await findByField(payload, 'house-rules', 'name', row.name)
      const doc = existing
        ? await payload.update({ collection: 'house-rules', id: existing.id, data: { name: row.name } })
        : await payload.create({ collection: 'house-rules', data: { name: row.name } })
      houseRuleMap.set(row.id, doc.id)
      ok(`house-rule ${row.name}`)
    } catch (e) {
      fail(`house-rule ${row.name}`, e)
    }
  }

  console.log('--- media ---')
  const media = await legacy.query(
    `SELECT id, url, alt, filename, mime_type, filesize, width, height FROM media ORDER BY id`,
  )
  for (const row of media.rows) {
    if (typeof row.url !== 'string' || !row.url.startsWith('https://')) {
      skip(`media id=${row.id} (invalid url: ${row.url ?? 'empty'})`)
      continue
    }
    try {
      const data = {
        url: row.url,
        alt: row.alt ?? undefined,
        filename: row.filename ?? undefined,
        mimeType: row.mime_type ?? undefined,
        filesize: toNum(row.filesize),
        width: toNum(row.width),
        height: toNum(row.height),
      }
      const existing = row.filename
        ? await findByField(payload, 'media', 'filename', row.filename)
        : await findByField(payload, 'media', 'url', row.url)
      const doc = existing
        ? await payload.update({ collection: 'media', id: existing.id, data })
        : await payload.create({ collection: 'media', data })
      mediaMap.set(row.id, doc.id)
      ok(`media ${row.filename ?? row.id}`)
    } catch (e) {
      fail(`media ${row.filename ?? row.id}`, e)
    }
  }

  console.log('--- properties ---')
  const properties = await legacy.query(`SELECT * FROM properties ORDER BY id`)
  for (const row of properties.rows) {
    if (!row.slug || row.status !== 'published' || !row.title) {
      skip(`property id=${row.id} (draft or missing slug/title)`)
      continue
    }
    try {
      const mediaLinks = await legacy.query(
        `SELECT image_id FROM properties_media WHERE _parent_id = $1 ORDER BY _order`,
        [row.id],
      )
      const amenityLinks = await legacy.query(
        `SELECT amenities_id FROM properties_rels WHERE parent_id = $1 AND path = 'amenities' ORDER BY "order"`,
        [row.id],
      )
      const ruleLinks = await legacy.query(
        `SELECT house_rules_id FROM properties_rels WHERE parent_id = $1 AND path IN ('houseRules', 'house_rules') ORDER BY "order"`,
        [row.id],
      )

      const data = {
        title: row.title,
        slug: row.slug,
        brand: row.brand ?? 'madeirabook',
        pmsPropertyId: row.pms_property_id ?? row.smoobu_id ?? undefined,
        pricePerNight: toNum(row.price_per_night) ?? FALLBACK_PRICE_PER_NIGHT,
        cleaningFee: toNum(row.cleaning_fee),
        description: row.description ?? undefined,
        shortDescription: row.short_description ?? undefined,
        sizeM2: toNum(row.size_m2),
        bedrooms: toNum(row.bedrooms),
        bathrooms: toNum(row.bathrooms),
        maxGuests: toNum(row.max_guests),
        checkInTime: row.check_in_time ?? '15:00',
        checkOutTime: row.check_out_time ?? '11:00',
        featured: row.featured ?? false,
        status: 'published' as const,
        media: mediaLinks.rows
          .map((r: { image_id: number }) => mediaMap.get(r.image_id))
          .filter((id): id is number => typeof id === 'number')
          .map((id) => ({ image: id })),
        amenities: amenityLinks.rows
          .map((r: { amenities_id: number }) => amenityMap.get(r.amenities_id))
          .filter((id): id is number => typeof id === 'number'),
        houseRules: ruleLinks.rows
          .map((r: { house_rules_id: number }) => houseRuleMap.get(r.house_rules_id))
          .filter((id): id is number => typeof id === 'number'),
        location: row.location_id ? locationMap.get(row.location_id) : undefined,
      }

      const existing = await findByField(payload, 'properties', 'slug', row.slug)
      if (existing) {
        await payload.update({ collection: 'properties', id: existing.id, data })
      } else {
        await payload.create({ collection: 'properties', data })
      }
      ok(`property ${row.slug}`)
    } catch (e) {
      fail(`property ${row.slug}`, e)
    }
  }

  console.log(`Done. OK: ${stats.ok}, SKIP: ${stats.skip}, FAIL: ${stats.fail}`)
  await legacy.end()
  process.exit(stats.fail > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
