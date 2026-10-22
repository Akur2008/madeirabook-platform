// Zeevou sync orchestration: pushes a Payload property to Zeevou as a
// "Complex" (is_single_unit: false) with its unit-types / units / rate-plans,
// then writes the returned Zeevou ids back:
//   properties.pms = 'zeevou', pmsPropertyId, pmsMeta
//   unit-types.externalId, units.externalId, rate-plans.externalId
// Used by scripts/test-zeevou-sync.ts and POST /api/admin/zeevou/sync.

import { getPayload } from 'payload'

import config from '@payload-config'
import {
  createComplex,
  type ZeevouComplexResult,
  type ZeevouUnitTypeInput,
} from '@/services/pms/zeevou'
import type { Property, RatePlan, Unit, UnitType } from '@/payload-types'

export interface ZeevouSyncResult {
  payloadPropertyId: number
  slug: string
  alreadySynced: boolean
  /** Zeevou property id — existing one when alreadySynced, new otherwise. */
  zeevouPropertyId: number | null
  zeevou: ZeevouComplexResult | null
}

async function loadProperty(
  payload: Awaited<ReturnType<typeof getPayload>>,
  propertyId: number | string,
): Promise<Property> {
  const asNumber = Number(propertyId)
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return (await payload.findByID({
      collection: 'properties',
      id: asNumber,
      depth: 1,
    })) as Property
  }
  const found = await payload.find({
    collection: 'properties',
    where: { slug: { equals: String(propertyId) } },
    limit: 1,
    depth: 1,
  })
  const doc = found.docs[0] as Property | undefined
  if (!doc) throw new Error(`Property "${propertyId}" not found`)
  return doc
}

// Reads the Payload Complex structure for a property (active rows only) and
// maps it to Zeevou createComplex inputs. When the property has no unit
// types yet, creates a default "Standard" unit-type + unit + rate-plan so the
// returned Zeevou externalIds can be stored on real rows.
async function buildUnitTypes(
  payload: Awaited<ReturnType<typeof getPayload>>,
  property: Property,
): Promise<{
  inputs: ZeevouUnitTypeInput[]
  rows: { unitType: UnitType; units: Unit[]; ratePlans: RatePlan[] }[]
}> {
  const utResult = await payload.find({
    collection: 'unit-types',
    where: {
      and: [
        { property: { equals: property.id } },
        { status: { equals: 'active' } },
      ],
    },
    limit: 100,
    depth: 0,
  })
  let unitTypes = utResult.docs as UnitType[]

  if (unitTypes.length === 0) {
    const ut = (await payload.create({
      collection: 'unit-types',
      data: {
        property: property.id,
        name: 'Standard',
        capacity: property.maxGuests ?? 2,
        bedrooms: property.bedrooms ?? 1,
        bathrooms: property.bathrooms ?? 1,
        status: 'active',
      },
    })) as UnitType
    const unit = (await payload.create({
      collection: 'units',
      data: { unitType: ut.id, name: 'Standard-1', status: 'active' },
    })) as Unit
    const ratePlan = (await payload.create({
      collection: 'rate-plans',
      data: {
        unitType: ut.id,
        name: 'Standard',
        basePrice: property.pricePerNight || 100,
        minNights: 1,
        status: 'active',
      },
    })) as RatePlan
    unitTypes = [ut]
    return {
      inputs: [
        {
          name: ut.name,
          capacity: ut.capacity ?? property.maxGuests ?? 2,
          ratePlans: [
            {
              name: ratePlan.name,
              basePrice: ratePlan.basePrice,
              minNights: ratePlan.minNights ?? 1,
              isDefault: true,
            },
          ],
          units: [{ name: unit.name }],
        },
      ],
      rows: [{ unitType: ut, units: [unit], ratePlans: [ratePlan] }],
    }
  }

  const inputs: ZeevouUnitTypeInput[] = []
  const rows: { unitType: UnitType; units: Unit[]; ratePlans: RatePlan[] }[] = []

  for (const ut of unitTypes) {
    const [unitsResult, ratePlansResult] = await Promise.all([
      payload.find({
        collection: 'units',
        where: {
          and: [
            { unitType: { equals: ut.id } },
            { status: { equals: 'active' } },
          ],
        },
        limit: 500,
        depth: 0,
      }),
      payload.find({
        collection: 'rate-plans',
        where: {
          and: [
            { unitType: { equals: ut.id } },
            { status: { equals: 'active' } },
          ],
        },
        limit: 100,
        depth: 0,
      }),
    ])
    const units = unitsResult.docs as Unit[]
    const ratePlans = ratePlansResult.docs as RatePlan[]

    const rpInputs = ratePlans.map((rp, i) => ({
      name: rp.name,
      basePrice: rp.basePrice,
      minNights: rp.minNights ?? 1,
      isDefault: i === 0,
    }))
    if (rpInputs.length === 0) {
      rpInputs.push({
        name: 'Standard',
        basePrice: property.pricePerNight || 100,
        minNights: 1,
        isDefault: true,
      })
    }

    const unitInputs =
      units.length > 0
        ? units.map((u) => ({ name: u.name }))
        : [{ name: `${ut.name}-1` }]

    inputs.push({
      name: ut.name,
      capacity: ut.capacity ?? property.maxGuests ?? 2,
      description: ut.description ?? '',
      ratePlans: rpInputs,
      units: unitInputs,
    })
    rows.push({ unitType: ut, units, ratePlans })
  }

  return { inputs, rows }
}

export async function syncPropertyToZeevou(
  propertyId: number | string,
): Promise<ZeevouSyncResult> {
  const payload = await getPayload({ config: await config })
  const property = await loadProperty(payload, propertyId)

  if (property.pms === 'zeevou' && property.pmsPropertyId) {
    return {
      payloadPropertyId: property.id,
      slug: property.slug,
      alreadySynced: true,
      zeevouPropertyId: Number(property.pmsPropertyId) || null,
      zeevou: null,
    }
  }

  const { inputs, rows } = await buildUnitTypes(payload, property)

  const location =
    property.location && typeof property.location === 'object'
      ? (property.location as unknown as Record<string, unknown>)
      : null

  const zeevou = await createComplex(
    {
      name: property.title,
      shortName: property.slug || property.title,
      description:
        property.description || property.shortDescription || property.title,
      address: {
        street: property.address?.street || '-',
        postalCode: property.address?.postal || '-',
        city:
          property.address?.city ||
          (location?.title ? String(location.title) : 'Funchal'),
        country: property.address?.country || 'PT',
        lat: property.geoCoordinates?.lat ?? undefined,
        lng: property.geoCoordinates?.lng ?? undefined,
      },
      maxGuests: property.maxGuests ?? 2,
      bedrooms: property.bedrooms ?? 1,
      basePrice: property.pricePerNight || 100,
    },
    inputs,
  )

  // Write Zeevou ids back to the Payload rows that produced each input.
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    const created = zeevou.unitTypes[i]
    if (!created) continue

    if (created.unitTypeId) {
      await payload.update({
        collection: 'unit-types',
        id: row.unitType.id,
        data: { externalId: String(created.unitTypeId) },
      })
    }

    for (let j = 0; j < row.units.length; j += 1) {
      const unitId = created.unitIds[j]
      if (!unitId) continue
      await payload.update({
        collection: 'units',
        id: row.units[j].id,
        data: { externalId: String(unitId) },
      })
    }

    // ratePlanIds[0] is the embedded default plan (first input rate plan,
    // since buildUnitTypes marks index 0 as default); the rest map in order.
    const createdRpIds = created.ratePlanIds
    for (let j = 0; j < row.ratePlans.length; j += 1) {
      const rpId = createdRpIds[j]
      if (!rpId) continue
      await payload.update({
        collection: 'rate-plans',
        id: row.ratePlans[j].id,
        data: { externalId: String(rpId) },
      })
    }
  }

  const firstUt = zeevou.unitTypes[0]
  await payload.update({
    collection: 'properties',
    id: property.id,
    data: {
      pms: 'zeevou',
      pmsPropertyId: String(zeevou.propertyId),
      pmsMeta: {
        unitTypeId: firstUt?.unitTypeId ?? undefined,
        unitId: firstUt?.unitIds[0] ?? undefined,
        ratePlanId: firstUt?.defaultRatePlanId ?? undefined,
      },
    },
  })

  return {
    payloadPropertyId: property.id,
    slug: property.slug,
    alreadySynced: false,
    zeevouPropertyId: zeevou.propertyId,
    zeevou,
  }
}
