import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

const beaches = [
  {
    name: 'Seixal Beach',
    slug: 'seixal-beach',
    shortDescription:
      'A dramatic black volcanic sand beach on the north coast, framed by green cliffs and waterfalls.',
    description: `Seixal Beach (Praia do Porto do Seixal) is one of the few natural sandy beaches on Madeira's north coast. The sand is black and volcanic, the bay sits beneath steep green cliffs, and thin waterfalls drop from the rock face behind the village — a setting that feels more like Hawaii than Europe.

The beach is in the village of Seixal, municipality of Porto Moniz, about 40 minutes by car from Funchal via the VE4/ER101 coastal road. Parking is limited near the harbour, so arrive early in summer. The north coast gets Atlantic swell — swim on calm days and treat the ocean with respect.

Go for the landscape rather than beach facilities: there is a small café and showers, but the real draw is swimming under the cliffs at golden hour and watching clouds spill over the ridge above the bay.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.8219, lng: -17.1031 },
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Seixal_-_Ilha_da_Madeira_-_Portugal_%2851817017914%29.jpg/1920px-Seixal_-_Ilha_da_Madeira_-_Portugal_%2851817017914%29.jpg',
    imageAttribution:
      'Photo by Vitor Oliveira, CC BY-SA 2.0, via Wikimedia Commons',
    highlights: [
      'Black volcanic sand',
      'Cliffs and waterfalls backdrop',
      'Natural swimming on calm days',
      'Sunset views over the north coast',
    ],
    bestTimeToVisit: 'May–October',
    featured: true,
  },
  {
    name: 'Porto Moniz Natural Pools',
    slug: 'porto-moniz-natural-pools',
    shortDescription:
      'Volcanic lava pools filled by the tide — Madeira’s most famous natural swimming spot.',
    description: `The Piscinas Naturais of Porto Moniz are swimming pools formed by solidified lava flows at the northwestern tip of the island. Atlantic waves spill over the dark rock and refill the pools with clear ocean water, so you swim in the sea without being exposed to its full force.

Porto Moniz is about 50 minutes from Funchal by car through the mountain tunnels of the VE4. There are two complexes: the wilder free-access pools by the aquarium, and the managed pools with lifeguards, changing rooms and a small entry fee. Both are open year-round, though winter swells can close them.

This is the island's signature swim — floating in still water while surf breaks on the lava wall a few metres away. Combine it with Seixal Beach and the Fanal laurel forest for the best day on the north coast.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.8687, lng: -17.1702 },
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/Madeira_-_Porto_Moniz_-_03_-_Piscinas_naturales.jpg/1920px-Madeira_-_Porto_Moniz_-_03_-_Piscinas_naturales.jpg',
    imageAttribution: 'Photo by Xosema, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Swimming in lava-formed pools',
      'Lifeguarded managed complex',
      'Dramatic Atlantic surf views',
      'Open year-round',
    ],
    bestTimeToVisit: 'June–September',
    featured: true,
  },
  {
    name: 'Calheta Beach',
    slug: 'calheta-beach',
    shortDescription:
      'One of Madeira’s few golden sand beaches — sand imported from Morocco, sheltered by breakwaters.',
    description: `Calheta Beach is Madeira's original artificial golden sand beach, opened in 2004 with sand brought in from Morocco. Two crescent coves sit inside concrete breakwaters that keep the water calm and swimmable — rare comfort on an island of pebble shores.

Calheta is on the southwest coast, about 30 minutes from Funchal via the VE3 expressway, with parking above the marina. The beach has sunbed rentals, showers, and a row of restaurants along the marina wall. The Savoy Saccharum hotel sits right above the eastern cove.

Choose Calheta when you want an easy, guaranteed beach day: the sunniest microclimate on the island, calm water for children, and sunset over the Atlantic straight down the bay. It gets busy on weekends — weekdays are quieter.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.7186, lng: -17.1741 },
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Madeira-Calheta-harbour-public_sand_beach-99ASD.jpg/1920px-Madeira-Calheta-harbour-public_sand_beach-99ASD.jpg',
    imageAttribution: 'Photo by Asurnipal, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Golden imported sand',
      'Calm water inside breakwaters',
      'Full facilities and marina restaurants',
      'Sunniest spot on the southwest coast',
    ],
    bestTimeToVisit: 'May–October',
    featured: true,
  },
  {
    name: 'Ponta do Sol Beach',
    slug: 'ponta-do-sol-beach',
    shortDescription:
      'A pebble beach at the foot of Madeira’s prettiest seaside village, with a long sunny promenade.',
    description: `Ponta do Sol's beach is a clean stretch of rounded pebbles below the pastel-coloured village that gives the town its name — "Point of the Sun", statistically the sunniest place on Madeira. The waterfront promenade runs the length of the bay past cafés and the old quay.

The town is 25 minutes west of Funchal on the VE3, with parking along the front. Swimming is straightforward in calm weather; the entry is pebbly, so beach shoes help. A small platform and steps lead into the water in front of the promenade.

Come for an afternoon that drifts into evening: swim, then eat on the seafront as the sun drops into the ocean directly opposite — Ponta do Sol faces southwest and gets one of the best sunsets on the island.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.6795, lng: -17.1054 },
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Pontadosol1.JPG/1920px-Pontadosol1.JPG',
    imageAttribution:
      'Photo by Roman Klementschitz, CC BY 3.0, via Wikimedia Commons',
    highlights: [
      'Sunniest village on Madeira',
      'Pebble beach with promenade',
      'Seafront cafés and old quay',
      'West-facing sunsets',
    ],
    bestTimeToVisit: 'May–October',
    featured: false,
  },
  {
    name: 'Prainha de Caniçal',
    slug: 'prainha-de-canical',
    shortDescription:
      'A tiny black sand cove at the start of the Ponta de São Lourenço trail — the island’s easternmost swim.',
    description: `Prainha ("little beach") is a pocket of black volcanic sand tucked into the cliffs east of Caniçal, just below the trailhead of the Ponta de São Lourenço peninsula. It is one of the very few natural sand beaches on Madeira and stays quieter than the resort shores.

The cove sits about 35 minutes from Funchal near the eastern tip of the island, off the road towards Baía d'Abra. Access is down a stepped path; there are no facilities, so bring water and shade. The surrounding landscape is dry and golden — completely different from green Madeira.

Pair it with the São Lourenço hike: walk the peninsula in the morning while it is cool, then cool off at Prainha in the afternoon. The water here is often the clearest on the south coast.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.7429, lng: -16.7156 },
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Prainha_Beach_%2842402305755%29.jpg/1920px-Prainha_Beach_%2842402305755%29.jpg',
    imageAttribution:
      'Photo by Michael Gaylard, CC BY 2.0, via Wikimedia Commons',
    highlights: [
      'Natural black sand cove',
      'Next to São Lourenço trailhead',
      'Clear water for snorkelling',
      'Rare quiet eastern beach',
    ],
    bestTimeToVisit: 'April–October',
    featured: false,
  },
  {
    name: 'Praia Formosa',
    slug: 'praia-formosa-funchal',
    shortDescription:
      'Funchal’s largest public beach — a long pebble shore with a promenade all the way to Câmara de Lobos.',
    description: `Praia Formosa is the biggest beach in the Funchal area: a broad band of dark pebbles and coarse black sand stretching west from the Lido district. A palm-lined promenade runs along the top and continues as a coastal path to the fishing village of Câmara de Lobos.

The beach is 10 minutes west of central Funchal by bus or car, with access ramps, showers and several beach cafés. The sea can have a shore break — flags are flown and lifeguards are on duty in summer. Sunsets face west along the cliff line.

For visitors staying in Funchal, this is the effortless beach: reachable without a car, free, and big enough that it never feels packed. Walk the promenade at dusk when the cliffs glow and the locals come out to jog.`,
    locationSlug: 'funchal',
    geoCoordinates: { lat: 32.6392, lng: -16.9512 },
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/S%C3%A3o_Martinho_%28Madeira%2C_Portugal%29%2C_Praia_Formosa_--_2025_--_0244.jpg/1920px-S%C3%A3o_Martinho_%28Madeira%2C_Portugal%29%2C_Praia_Formosa_--_2025_--_0244.jpg',
    imageAttribution:
      'Photo by Dietmar Rabich, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Largest beach near Funchal',
      'Promenade to Câmara de Lobos',
      'Beach cafés and showers',
      'Sunsets along the cliffs',
    ],
    bestTimeToVisit: 'May–October',
    featured: false,
  },
  {
    name: 'Praia da Calheta',
    slug: 'praia-da-calheta',
    shortDescription:
      'The western cove of Calheta’s golden sand beach — same Moroccan sand, slightly calmer corner.',
    description: `Praia da Calheta is the western half of Calheta's twin artificial beach. It shares the same imported Moroccan sand and the same protective breakwaters, but sits a little further from the marina bars, which keeps it marginally quieter in high season.

Access is the same as for the eastern cove: VE3 to Calheta, parking above the marina, then a short walk along the sand. Sunbeds and parasols rent on both coves; the marina restaurants are a five-minute stroll.

If the eastern cove looks crowded, walk west — the water is equally calm, the sunset view is identical, and there is usually space for a towel even in August. Swim inside the breakwater line; the open Atlantic begins just beyond it.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.7175, lng: -17.1768 },
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Madeira-Calheta-harbour-public_sand_beach-Hotel_Savoy-21ESD.jpg/1920px-Madeira-Calheta-harbour-public_sand_beach-Hotel_Savoy-21ESD.jpg',
    imageAttribution:
      'Photo by Rikki Mitterer, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Golden sand, quieter cove',
      'Sheltered swimming',
      'Steps from marina restaurants',
      'Same sunset as the east cove',
    ],
    bestTimeToVisit: 'May–October',
    featured: false,
  },
  {
    name: 'Machico Beach',
    slug: 'machico-beach',
    shortDescription:
      'A sheltered golden sand bay on the east coast — calm, family-friendly, ten minutes from the airport.',
    description: `Machico's Praia da Banda d'Além is a compact golden sand beach inside the wide, sheltered Machico bay — historically the first landing point of the Portuguese discoverers in 1419. Breakwaters and the bay's shape keep the water flat most of the year.

The beach is 10 minutes from the airport and about 25 from Funchal via the VR1. It has showers, lifeguards in season, and a promenade of fish restaurants behind it — Machico remains a working town rather than a resort strip.

This is the best first-or-last-day beach on Madeira: swim here straight off the plane, or on departure morning before the flight. Families pick it for the gentle entry; locals pick it for lunch afterwards.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.7184, lng: -16.7623 },
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Madeira_-_Machico_-_the_beach_%2832761306833%29.jpg/1920px-Madeira_-_Machico_-_the_beach_%2832761306833%29.jpg',
    imageAttribution:
      'Photo by muffinn, CC BY 2.0, via Wikimedia Commons',
    highlights: [
      'Sheltered golden sand bay',
      'Calm water, family-friendly',
      'Fish restaurants on the promenade',
      'Ten minutes from the airport',
    ],
    bestTimeToVisit: 'May–October',
    featured: false,
  },
  {
    name: 'Praia do Faial',
    slug: 'praia-do-faial',
    shortDescription:
      'A quiet pebble bay on the north coast with a front-row view of the Penha d’Águia sea cliff.',
    description: `Praia do Faial is a small pebble beach on the north coast below the village of Faial in the municipality of Santana. Its defining feature is the view east to Penha d'Águia — the 590-metre "Eagle Rock" sea cliff that marks the border between Santana and Machico.

The beach sits at the end of a steep road down from the ER101, about 40 minutes from Funchal. There is a modest bathing complex with a small pool and a seasonal café. Like all north coast beaches, it needs a calm day for swimming — check conditions before descending.

Go on a clear afternoon when the sun still reaches the north shore: swim, then watch the light climb Penha d'Águia as the shade fills the bay. Combine with the Santana thatched houses and the Levada dos Balcões nearby.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.7929, lng: -16.849 },
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Faial_in_Santana%2C_Madeira%2C_2023_May.jpg/1920px-Faial_in_Santana%2C_Madeira%2C_2023_May.jpg',
    imageAttribution:
      'Photo by Ximonic (Simo Räsänen), CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'View of Penha d’Águia cliff',
      'Quiet north-coast bay',
      'Small bathing complex and pool',
      'Gateway to Santana sights',
    ],
    bestTimeToVisit: 'June–September',
    featured: false,
  },
  {
    name: 'Jardim do Mar',
    slug: 'jardim-do-mar',
    shortDescription:
      'A wave-polished pebble shore below a preserved village — Madeira’s most famous surf point.',
    description: `Jardim do Mar is a tiny traffic-free village on the southwest coast, built on a flat promontory above the sea. Its waterfront is a wide field of round, wave-polished pebbles rather than a lounging beach — people come here for the Atlantic itself, not for sunbeds.

The village is 35 minutes from Funchal via Calheta, with parking at the top and pedestrian lanes down to the seafront promenade. The point here is one of Europe's best big-wave surf spots; in winter swells, watching the surf is the activity.

Come for a slow day: walk the lanes between gardens, sit on the sea wall with a coffee, and watch waves roll in over the pebble shelf. On calm summer days locals swim off the rocks at the point — confidently swimmers only.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.7395, lng: -17.2115 },
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/07/Madeira-Jardim_do_Mar-01ASD.jpg/1920px-Madeira-Jardim_do_Mar-01ASD.jpg',
    imageAttribution: 'Photo by Asurnipal, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'World-class surf point',
      'Traffic-free preserved village',
      'Polished pebble shore',
      'Sea wall promenade and cafés',
    ],
    bestTimeToVisit: 'May–October (surf: Nov–Mar)',
    featured: false,
  },
]

async function seedBeaches(): Promise<void> {
  const payload = await getPayload({ config })

  const locations = await payload.find({ collection: 'locations', limit: 100 })
  const locationBySlug = new Map(locations.docs.map((l) => [l.slug, l.id]))

  let okCount = 0

  for (const beach of beaches) {
    const { locationSlug, ...rest } = beach
    const locationId = locationSlug ? locationBySlug.get(locationSlug) : undefined

    const data = {
      ...rest,
      ...(locationId ? { location: locationId } : {}),
      status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'beaches',
      where: { slug: { equals: beach.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({ collection: 'beaches', id: existing.docs[0].id, data })
    } else {
      await payload.create({ collection: 'beaches', data })
    }

    okCount++
    console.log(`OK beach ${beach.slug}`)
  }

  console.log(`Done. OK: ${okCount}`)
}

seedBeaches()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding beaches:', error)
    process.exit(1)
  })
