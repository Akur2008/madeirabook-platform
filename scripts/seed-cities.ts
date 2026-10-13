import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

// name | slug | airportCode | country | flightDurationMinutes | basePrice
const cities: [string, string, string, string, number, number][] = [
  ['Lisbon', 'lisbon', 'LIS', 'Portugal', 105, 17],
  ['Porto', 'porto', 'OPO', 'Portugal', 115, 25],
  ['London', 'london', 'LGW', 'United Kingdom', 210, 27],
  ['Manchester', 'manchester', 'MAN', 'United Kingdom', 225, 45],
  ['Edinburgh', 'edinburgh', 'EDI', 'United Kingdom', 235, 55],
  ['Paris', 'paris', 'CDG', 'France', 195, 60],
  ['Frankfurt', 'frankfurt', 'FRA', 'Germany', 240, 70],
  ['Munich', 'munich', 'MUC', 'Germany', 250, 75],
  ['Zurich', 'zurich', 'ZRH', 'Switzerland', 220, 90],
  ['Vienna', 'vienna', 'VIE', 'Austria', 270, 80],
  ['Amsterdam', 'amsterdam', 'AMS', 'Netherlands', 230, 65],
  ['Brussels', 'brussels', 'BRU', 'Belgium', 220, 60],
  ['Madrid', 'madrid', 'MAD', 'Spain', 130, 45],
  ['Barcelona', 'barcelona', 'BCN', 'Spain', 150, 55],
  ['Dublin', 'dublin', 'DUB', 'Ireland', 210, 50],
]

const duration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`

async function seedCities(): Promise<void> {
  const payload = await getPayload({ config })

  let ok = 0

  for (const [name, slug, airportCode, country, flightDurationMinutes, basePrice] of cities) {
    const flight = duration(flightDurationMinutes)

    const data = {
      name,
      slug,
      airportCode,
      country,
      flightDurationMinutes,
      basePrice,
      currency: 'EUR',
      hero: `Escape from ${name} to Madeira`,
      description:
        `Direct flights from ${name} to Madeira (FNC) take about ${flight}. ` +
        `Madeira is warm year-round (+20°C in winter), has no venomous animals, ` +
        `and offers rare ocean-front stays away from mass tourism.`,
      faqs: [
        {
          question: `How long is the flight from ${name} to Madeira?`,
          answer: `About ${flight} direct.`,
        },
        {
          question: `What's the cheapest month to fly from ${name}?`,
          answer: `Winter (November–February) — prices drop to €${basePrice} one way.`,
        },
      ],
      status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'cities',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({ collection: 'cities', id: existing.docs[0].id, data })
    } else {
      await payload.create({ collection: 'cities', data })
    }

    ok++
    console.log(`OK ${slug}`)
  }

  console.log(`Done. OK: ${ok}`)
}

seedCities()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding cities:', error)
    process.exit(1)
  })
