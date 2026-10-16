type RelIds = number[]

export interface PropertyBody {
  title: string
  slug: string
  description: string | null
  shortDescription: string | null
  pricePerNight: number
  cleaningFee: number | null
  sizeM2: number | null
  bedrooms: number | null
  bathrooms: number | null
  maxGuests: number | null
  checkInTime: string
  checkOutTime: string
  location: number | null
  amenities: RelIds
  houseRules: RelIds
  pmsPropertyId: string | null
  isVerified: boolean
  status?: 'draft' | 'published' | 'archived'
}

function str(v: unknown, max = 4000): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, max)
  return t || null
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function relIds(v: unknown): RelIds {
  if (!Array.isArray(v)) return []
  return v.map((x) => Number(x)).filter((n) => Number.isInteger(n) && n > 0)
}

export function parsePropertyBody(
  raw: unknown,
): { data: PropertyBody } | { error: string } {
  const b = (raw ?? {}) as Record<string, unknown>

  const title = str(b.title, 120)
  if (!title) return { error: 'Title is required' }

  const pricePerNight = num(b.pricePerNight)
  if (pricePerNight === null || pricePerNight < 0) {
    return { error: 'Price per night is required' }
  }

  const status =
    b.status === 'published' || b.status === 'archived' ? b.status : 'draft'

  return {
    data: {
      title,
      slug: str(b.slug, 80) ?? '',
      description: str(b.description, 4000),
      shortDescription: str(b.shortDescription, 300),
      pricePerNight,
      cleaningFee: num(b.cleaningFee),
      sizeM2: num(b.sizeM2),
      bedrooms: num(b.bedrooms) ?? 1,
      bathrooms: num(b.bathrooms) ?? 1,
      maxGuests: num(b.maxGuests) ?? 2,
      checkInTime: str(b.checkInTime, 10) ?? '15:00',
      checkOutTime: str(b.checkOutTime, 10) ?? '11:00',
      location: num(b.location),
      amenities: relIds(b.amenities),
      houseRules: relIds(b.houseRules),
      pmsPropertyId: str(b.pmsPropertyId, 80),
      isVerified: b.isVerified === true,
      status,
    },
  }
}
