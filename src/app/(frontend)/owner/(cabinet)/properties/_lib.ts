import { getPayload } from 'payload'

import config from '@payload-config'

import type { FormOption } from './_components/PropertyForm'

export async function getFormOptions(): Promise<{
  amenities: FormOption[]
  houseRules: FormOption[]
  locations: FormOption[]
}> {
  const payload = await getPayload({ config: await config })

  const [amenitiesRes, houseRulesRes, locationsRes] = await Promise.all([
    payload.find({
      collection: 'amenities',
      limit: 200,
      depth: 0,
      sort: 'name',
    }),
    payload.find({
      collection: 'house-rules',
      limit: 200,
      depth: 0,
      sort: 'name',
    }),
    payload.find({
      collection: 'locations',
      limit: 200,
      depth: 0,
      sort: 'name',
    }),
  ])

  return {
    amenities: amenitiesRes.docs.map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
    })),
    houseRules: houseRulesRes.docs.map((r) => ({ id: r.id, name: r.name })),
    locations: locationsRes.docs.map((l) => ({ id: l.id, name: l.name })),
  }
}
