import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

// Coordinates: OpenStreetMap hiking-route relations (endpoint geometry) +
// Nominatim cross-check. trailheadUrl links to the OSM relation.
// Images: Wikimedia Commons, license verified via Commons API extmetadata.

interface TrailSeed {
  name: string
  slug: string
  prCode?: string
  shortDescription: string
  description: string
  locationSlug?: string
  geoCoordinates: { lat: number; lng: number }
  endCoordinates?: { lat: number; lng: number }
  distanceKm: number
  durationMinutes: number
  elevationGain: number
  difficulty: 'easy' | 'moderate' | 'hard'
  type: 'levada' | 'vereda' | 'caldeirao' | 'coastal' | 'peak'
  isLinear: boolean
  season: string
  startPoint: string
  trailheadUrl: string
  heroImage: string
  imageAttribution: string
  highlights: string[]
  featured: boolean
}

const trails: TrailSeed[] = [
  {
    name: 'Levada do Caldeirão Verde',
    slug: 'levada-do-caldeirao-verde',
    prCode: 'PR9',
    shortDescription:
      'The classic Santana levada through emerald laurisilva to a 100-metre waterfall amphitheatre.',
    description: `Levada do Caldeirão Verde is Madeira's signature levada walk. Starting at the Queimadas forestry park — itself worth the trip for its thatched shelter house and giant tree ferns — the trail follows a contouring irrigation channel deep into the Santana mountains through UNESCO-listed laurel forest.

The route is nearly flat but not effortless: it passes through four tunnels (a torch or phone light is essential) and crosses sections carved into vertical rock with drops beside the path. The payoff is Caldeirão Verde, a green-walled amphitheatre where a thin waterfall plunges roughly 100 metres into the cauldron.

Allow a full morning or afternoon and start early — the parking at Queimadas fills fast and afternoon mist often closes over the cauldron. Sure-footedness and a head for heights are needed on the exposed sections, though the path itself is wide and well maintained.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.78401, lng: -16.9067 },
    endCoordinates: { lat: 32.77014, lng: -16.94887 },
    distanceKm: 13,
    durationMinutes: 300,
    elevationGain: 100,
    difficulty: 'moderate',
    type: 'levada',
    isLinear: true,
    season: 'All year',
    startPoint: 'Queimadas Forestry Park',
    trailheadUrl: 'https://www.openstreetmap.org/relation/4441701',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/LCV_-_Levada_channel_and_forest_path_on_Levada_do_Caldeir%C3%A3o_Verde%2C_Madeira%2C_2012.jpg/1920px-LCV_-_Levada_channel_and_forest_path_on_Levada_do_Caldeir%C3%A3o_Verde%2C_Madeira%2C_2012.jpg',
    imageAttribution:
      'Photo by Josep M. Gracia, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'UNESCO laurisilva forest',
      '100 m waterfall amphitheatre',
      'Four tunnels — bring a torch',
      'Thatched shelter at Queimadas',
    ],
    featured: true,
  },
  {
    name: 'Levada das 25 Fontes',
    slug: 'levada-das-25-fontes',
    prCode: 'PR6',
    shortDescription:
      'Madeira’s most walked trail — a levada descent from Rabaçal to a lagoon fed by 25 springs.',
    description: `The 25 Fontes levada drops from the Rabaçal valley into a shaded ravine where countless springs — the "25 fountains" — pour down a fern-covered rock face into a small lagoon. It is the most popular trail on the island, and for good reason: the amphitheatre of falling water at the end is genuinely magical.

The walk starts at the Rabaçal parking on the ER105 plateau road and descends a paved access track before joining the levada proper. The path is mostly gentle, but the return is uphill — save energy for the climb back. A shuttle bus sometimes runs on the access road in season.

Go early or late to avoid the midday crowds, and combine it with the short PR6.1 spur to the Risco waterfall if you have legs left. In wet winter months the springs are at their most dramatic; in late summer the flow can shrink to a trickle.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.75399, lng: -17.13297 },
    endCoordinates: { lat: 32.76527, lng: -17.12723 },
    distanceKm: 8.6,
    durationMinutes: 240,
    elevationGain: 300,
    difficulty: 'moderate',
    type: 'levada',
    isLinear: true,
    season: 'All year',
    startPoint: 'Rabaçal parking (ER105)',
    trailheadUrl: 'https://www.openstreetmap.org/relation/2235095',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Fringilla_coelebs_on_wire%2C_Levada_das_25_Fontes_-_Nov_2010.jpg/1920px-Fringilla_coelebs_on_wire%2C_Levada_das_25_Fontes_-_Nov_2010.jpg',
    imageAttribution:
      'Photo by Alexander Baxevanis, CC BY 2.0, via Wikimedia Commons',
    highlights: [
      'Lagoon fed by 25 springs',
      'Fern-covered waterfall wall',
      'Easy add-on: Risco waterfall (PR6.1)',
      'Madeira’s most iconic levada',
    ],
    featured: true,
  },
  {
    name: 'Levada do Risco',
    slug: 'levada-do-risco',
    prCode: 'PR6.1',
    shortDescription:
      'A short spur off PR6 to the sheer Risco waterfall — the easiest big payoff in Rabaçal.',
    description: `Levada do Risco is a short branch off the 25 Fontes route that ends at the base — and viewpoint — of the Risco waterfall, a tall white column of water dropping free off the cliff into the Rabaçal valley. At only around 1.5 km each way from the junction, it is the easiest high-reward walk in the area.

The trail follows the same levada contour as PR6, so it is flat and straightforward underfoot. Where it differs is the drama at the end: the viewpoint sits directly across from the falls, and after rain the spray drifts across the whole balcony.

Most walkers combine Risco with 25 Fontes in a single half-day — do Risco first while the light is on the falls, then continue to the springs. Watch for slippery rock after rain.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.75399, lng: -17.13297 },
    endCoordinates: { lat: 32.76013, lng: -17.12341 },
    distanceKm: 3,
    durationMinutes: 90,
    elevationGain: 150,
    difficulty: 'easy',
    type: 'levada',
    isLinear: true,
    season: 'All year',
    startPoint: 'Rabaçal parking (ER105)',
    trailheadUrl: 'https://www.openstreetmap.org/relation/2235098',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Madeira-Levada_do_Risco_%28path_PR6.1%29-Casa_do_Rabacal-Restaurant-01ASD.jpg/1920px-Madeira-Levada_do_Risco_%28path_PR6.1%29-Casa_do_Rabacal-Restaurant-01ASD.jpg',
    imageAttribution:
      'Photo by Asurnipal, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Direct view of Risco waterfall',
      'Short and flat — great for families',
      'Pairs with PR6 in one morning',
    ],
    featured: false,
  },
  {
    name: 'Levada do Rei',
    slug: 'levada-do-rei',
    prCode: 'PR18',
    shortDescription:
      'A lush north-coast levada from São Jorge through dense laurel forest to the Ribeiro Bonito spring.',
    description: `Levada do Rei ("the King's Levada") begins at the water treatment station above São Jorge on the wetter, greener north side of the island. The first kilometre crosses open farmland, then the trail enters deep laurisilva — one of the most intact stretches of laurel forest on any Madeiran walk.

The path hugs the levada through mossy tunnels of vegetation to Ribeiro Bonito, where the stream pours over boulders in a scene unchanged for centuries. Madeiran chaffinches and firecrests are constant company; this is one of the best trails for endemic birdlife.

The route is linear and roughly 10.6 km return. It is shaded and humid — bring a light layer even in summer, and expect mud after rain. São Jorge's chapel and the coastal road views make a good finish to the day.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.81695, lng: -16.92462 },
    endCoordinates: { lat: 32.79576, lng: -16.93691 },
    distanceKm: 10.6,
    durationMinutes: 240,
    elevationGain: 300,
    difficulty: 'moderate',
    type: 'levada',
    isLinear: true,
    season: 'All year',
    startPoint: 'Quebradas water station, São Jorge',
    trailheadUrl: 'https://www.openstreetmap.org/relation/2235097',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/Levada_do_Rei%2C_Madeira%2C_PR_10%2C_bird_on_the_trail.jpg/1920px-Levada_do_Rei%2C_Madeira%2C_PR_10%2C_bird_on_the_trail.jpg',
    imageAttribution: 'Photo by Gerda Arendt, CC0, via Wikimedia Commons',
    highlights: [
      'Pristine laurisilva corridor',
      'Ribeiro Bonito spring',
      'Best trail for endemic birds',
      'Quiet north-coast start',
    ],
    featured: false,
  },
  {
    name: 'Vereda dos Balcões',
    slug: 'vereda-dos-balcoes',
    prCode: 'PR11',
    shortDescription:
      'A gentle 1.5 km walk from Ribeiro Frio to a balcony viewpoint over the island’s highest peaks.',
    description: `Vereda dos Balcões is the friendliest introduction to Madeira's mountains: a nearly flat, wide path through laurel forest from Ribeiro Frio to a natural balcony suspended over the Ribeira da Metade valley. From the railing, Pico do Arieiro and Pico Ruivo frame the horizon, and hand-tame chaffinches land on outstretched palms.

The whole walk takes about an hour round trip at a dawdle, making it ideal for families, older travellers, or a leg-stretcher on a drive across the island. The viewpoint can cloud over after midday — morning gives the clearest summit views.

Ribeiro Frio itself has a trout farm, a café famous for poncha, and the trailheads of several longer routes including PR10 to Portela. Combine Balcões with a levada walk or stop here on the way to Santana.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.73642, lng: -16.88684 },
    endCoordinates: { lat: 32.7411, lng: -16.8895 },
    distanceKm: 3,
    durationMinutes: 90,
    elevationGain: 60,
    difficulty: 'easy',
    type: 'vereda',
    isLinear: true,
    season: 'All year',
    startPoint: 'Ribeiro Frio',
    trailheadUrl: 'https://www.openstreetmap.org/relation/2235104',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/2012-10-26_13-10-54_Pentax_JH_%2849282308716%29.jpg/1920px-2012-10-26_13-10-54_Pentax_JH_%2849282308716%29.jpg',
    imageAttribution:
      'Photo by Jan Helebrant, CC BY-SA 2.0, via Wikimedia Commons',
    highlights: [
      'Peak panorama from a natural balcony',
      'Chaffinches eat from your hand',
      'Suitable for all ages',
      'Trout farm and poncha at Ribeiro Frio',
    ],
    featured: false,
  },
  {
    name: 'Vereda do Areeiro',
    slug: 'vereda-do-areeiro',
    prCode: 'PR1',
    shortDescription:
      'The famous ridge walk between Madeira’s third and highest peaks — tunnels, stairs and sky.',
    description: `PR1 links Pico do Arieiro (1,818 m) to Pico Ruivo (1,861 m) along the island's central ridge — the most dramatic mountain walk in Madeira. The path climbs and dives through volcanic turrets, crosses tunnels bored through the rock, and traverses staircases bolted to the ridge line with clouds boiling up both sides.

This is a serious mountain trail despite its popularity: expect roughly 7 km one way with sustained climbs, exposed ledges (all railed), and weather that can turn in minutes. Check the status before setting out — the route closes in high wind, and fog can erase the path.

Most hikers walk one way with a taxi or shuttle back, or go out-and-back as far as the Ninho da Manta viewpoint. Sunrise from Arieiro followed by the ridge walk is the island's defining morning — arrive before dawn and watch the cloud sea catch fire below you.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.73547, lng: -16.92873 },
    endCoordinates: { lat: 32.7589, lng: -16.94282 },
    distanceKm: 7,
    durationMinutes: 210,
    elevationGain: 650,
    difficulty: 'hard',
    type: 'peak',
    isLinear: true,
    season: 'All year (wind-dependent)',
    startPoint: 'Pico do Arieiro',
    trailheadUrl: 'https://www.openstreetmap.org/relation/2235102',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/2016._Cami%C3%B1o_de_Pico_do_Areeiro._Madeira._Portugal_%2702.jpg/1920px-2016._Cami%C3%B1o_de_Pico_do_Areeiro._Madeira._Portugal_%2702.jpg',
    imageAttribution:
      'Photo by Luis Miguel Bugallo Sánchez (Lmbuga), CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Ridge between two highest peaks',
      'Tunnels and railed staircases',
      'Above the cloud sea at sunrise',
      'Madeira’s most dramatic hike',
    ],
    featured: true,
  },
  {
    name: 'Vereda do Pico Ruivo',
    slug: 'vereda-do-pico-ruivo',
    prCode: 'PR1.2',
    shortDescription:
      'The shortest route to Madeira’s rooftop — from Achada do Teixeira to the 1,862 m summit of Pico Ruivo.',
    description: `PR1.2 is the most accessible way to stand on the highest point of Madeira. From the Achada do Teixeira parking at 1,592 m, a broad, well-built path climbs steadily past the Casa de Abrigo mountain shelter to the summit of Pico Ruivo at 1,862 metres.

The ascent takes about an hour each way on a good path — there are no vertigo sections, but the altitude and stair climbs make it a steady workout. On a clear day the summit platform surveys the entire island: Curral das Freiras directly below, both coasts, and the whole central massif.

Come at sunrise if you can — you will share the summit with a handful of people while Pico do Arieiro crowds with tour groups. Weather moves fast at this altitude; bring a windproof layer even in August.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.76488, lng: -16.92108 },
    endCoordinates: { lat: 32.7589, lng: -16.94282 },
    distanceKm: 5.6,
    durationMinutes: 90,
    elevationGain: 270,
    difficulty: 'moderate',
    type: 'peak',
    isLinear: true,
    season: 'All year (wind-dependent)',
    startPoint: 'Achada do Teixeira',
    trailheadUrl: 'https://www.openstreetmap.org/relation/2235103',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/2016._Pico_Ruivo._Madeira._Portugal_%2716.jpg/1920px-2016._Pico_Ruivo._Madeira._Portugal_%2716.jpg',
    imageAttribution:
      'Photo by Luis Miguel Bugallo Sánchez (Lmbuga), CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Highest point of Madeira — 1,862 m',
      'Easiest summit route on the island',
      '360° panorama over both coasts',
      'Mountain shelter en route',
    ],
    featured: true,
  },
  {
    name: 'Vereda da Ponta de São Lourenço',
    slug: 'vereda-da-ponta-de-sao-lourenco',
    prCode: 'PR8',
    shortDescription:
      'A treeless volcanic peninsula at Madeira’s eastern tip — the island’s most otherworldly landscape.',
    description: `The Ponta de São Lourenço peninsula is Madeira turned inside out: instead of green laurisilva, you walk through bare ochre-and-basalt hills sculpted by wind, with the Atlantic crashing on both sides of the ridge. It is the driest, most Martian landscape on the island.

PR8 runs out-and-back from the Baía d'Abra parking to Casa do Sardinha, a tiny warden's house above the sea, and optionally up the Pico do Furado hump for the best panorama of the peninsula's end. About 7.4 km round trip with several short climbs — the terrain is easy but the sun is not; there is no shade and no water.

Wind is the defining feature — the peninsula is a kite-flying, hat-eating corridor. Go early for calm air and empty photos, bring water and sun protection, and expect the trail to be busy by late morning in season.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.74326, lng: -16.70104 },
    endCoordinates: { lat: 32.74758, lng: -16.69639 },
    distanceKm: 7.4,
    durationMinutes: 180,
    elevationGain: 200,
    difficulty: 'moderate',
    type: 'coastal',
    isLinear: true,
    season: 'All year (windy)',
    startPoint: 'Baía d’Abra parking',
    trailheadUrl: 'https://www.openstreetmap.org/relation/2235101',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/Cani%C3%A7al_%28Madeira%2C_Portugal%29%2C_Ponta_de_S%C3%A3o_Louren%C3%A7o_--_2025_--_1330.jpg/1920px-Cani%C3%A7al_%28Madeira%2C_Portugal%29%2C_Ponta_de_S%C3%A3o_Louren%C3%A7o_--_2025_--_1330.jpg',
    imageAttribution:
      'Photo by Dietmar Rabich, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Volcanic lunar peninsula',
      'Ocean on both sides of the path',
      'Pico do Furado summit detour',
      'Sunrise spot above the Atlantic',
    ],
    featured: true,
  },
  {
    name: 'Levada do Furado',
    slug: 'levada-do-furado',
    prCode: 'PR10',
    shortDescription:
      'A long linear levada from Ribeiro Frio to Portela — forest balconies and dizzying ledges.',
    description: `PR10 is the connoisseur's levada: 11 km one way from Ribeiro Frio to the Portela pass, contouring high above the north-coast valleys through some of the finest laurel forest on the island. The levada itself is flat, but the path is frequently carved into sheer rock with long drop-offs — it rewards walkers comfortable with exposure.

Highlights come steadily: window-like views down to Penha d'Águia and Faial, moss-hung tunnels of vegetation, and sections where the levada runs at shoulder height along a vertical wall. The route ends at the Portela viewpoint overlooking Porto da Cruz.

Because it is linear, plan logistics: arrange a taxi from Portela back to Ribeiro Frio, or walk out and return the same way for a full-day effort. After heavy rain sections can be slippery — check conditions at the Ribeiro Frio trailhead.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.73518, lng: -16.88626 },
    endCoordinates: { lat: 32.74222, lng: -16.85473 },
    distanceKm: 11,
    durationMinutes: 240,
    elevationGain: 100,
    difficulty: 'moderate',
    type: 'levada',
    isLinear: true,
    season: 'All year',
    startPoint: 'Ribeiro Frio',
    trailheadUrl: 'https://www.openstreetmap.org/relation/2754660',
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/3/3b/Levada_do_Furado%2C_Madeira_-_2013-04-05_-_90145224.jpg',
    imageAttribution:
      'Photo by Sergey Ashmarin, CC BY-SA 3.0, via Wikimedia Commons',
    highlights: [
      'Classic linear levada traverse',
      'Sheer ledges above the valley',
      'Ends at Portela viewpoint',
      'Densest laurel forest sections',
    ],
    featured: false,
  },
  {
    name: 'Levada do Alecrim',
    slug: 'levada-do-alecrim',
    prCode: 'PR6.2',
    shortDescription:
      'A quiet Rabaçal levada to the Dona Beja lagoon — the calm alternative to 25 Fontes.',
    description: `While crowds funnel towards 25 Fontes, PR6.2 branches off onto the Levada do Alecrim and delivers the same landscape with a fraction of the foot traffic. The path follows a clear mountain stream through heather forest to the Lagoa do Vento — Dona Beja lagoon — where the Risco waterfall's stream pools before its plunge.

The walk is gentle and short enough for a relaxed half-day: roughly 3.5 km each way on mostly level ground with a few rocky steps near the lagoon. Swimming in the lagoon is possible but cold and unofficial — most visitors come for the silence and the view back over the Rabaçal valley.

Combine it with the Pico Fernandes and Lagoa do Vento spurs if you want a longer loop. On foggy plateau days the heather moorland has a moody beauty of its own — bring a layer; Rabaçal weather changes quickly.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.75334, lng: -17.13235 },
    endCoordinates: { lat: 32.7577, lng: -17.12053 },
    distanceKm: 7,
    durationMinutes: 150,
    elevationGain: 150,
    difficulty: 'easy',
    type: 'levada',
    isLinear: true,
    season: 'All year',
    startPoint: 'Rabaçal parking (ER105)',
    trailheadUrl: 'https://www.openstreetmap.org/relation/4442860',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Levada_do_Alecrim_creek_%2838095371001%29.jpg/1920px-Levada_do_Alecrim_creek_%2838095371001%29.jpg',
    imageAttribution:
      'Photo by VillageHero, CC BY-SA 2.0, via Wikimedia Commons',
    highlights: [
      'Dona Beja lagoon (Lagoa do Vento)',
      'Far quieter than neighbouring PR6',
      'Heather moorland scenery',
    ],
    featured: false,
  },
  {
    name: 'Caldeirão do Inferno',
    slug: 'caldeirao-do-inferno',
    prCode: 'PR9.1',
    shortDescription:
      'The wild continuation past Caldeirão Verde — a steeper canyon, bigger falls, fewer people.',
    description: `Beyond the busy amphitheatre of Caldeirão Verde, the levada continues upstream into a narrower, darker gorge to Caldeirão do Inferno — the "Hell's Cauldron". The extension (sometimes numbered PR9.1) adds roughly 2 km each way of rougher, less-maintained path to the most committed stretch of the classic walk.

Where Caldeirão Verde is a tidy green bowl, the Inferno is rawer: the canyon walls pinch in, the channel drops through cascades, and the final falls thunder into a slot of rock. In flood conditions the extension can be impassable — do not attempt it in or after heavy rain.

Treat this as the full-day version of PR9: around 16–17 km return from Queimadas with the extra canyon time. Good footwear, a torch for the tunnels, and an early start are all essential.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.78367, lng: -16.90578 },
    endCoordinates: { lat: 32.77014, lng: -16.94887 },
    distanceKm: 16,
    durationMinutes: 360,
    elevationGain: 250,
    difficulty: 'moderate',
    type: 'caldeirao',
    isLinear: true,
    season: 'Apr–Oct (dry weather)',
    startPoint: 'Queimadas Forestry Park',
    trailheadUrl: 'https://www.openstreetmap.org/relation/2235099',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Caldeirao_Verde_A.JPG/1920px-Caldeirao_Verde_A.JPG',
    imageAttribution:
      'Photo by Pásztörperc, CC BY-SA 3.0, via Wikimedia Commons',
    highlights: [
      'Continuation beyond Caldeirão Verde',
      'Narrow canyon, bigger cascades',
      'Full-day version of PR9',
    ],
    featured: false,
  },
  {
    name: 'Levada da Ribeira da Janela',
    slug: 'levada-da-ribeira-da-janela',
    shortDescription:
      'A wild northwest levada through tunnels and jungle-green gorges above Ribeira da Janela.',
    description: `The Levada da Ribeira da Janela is one of the great untamed levadas of the northwest — a contouring channel that threads through tunnels, beneath dripping cliffs and over the wildest river valley on the island's north face.

Starting high near Lamaceiros above Porto Moniz, the trail works steadily along the valley wall through dense, mossy forest. Expect several unlit tunnels (a headlamp is better than a phone), sections of narrow path beside the channel, and almost no other walkers.

This is a levada for people who have done the famous ones: less polished, more jungle, and in parts genuinely vertiginous with unguarded edges. Allow a full morning, wear proper boots, and check that the route is open — landslides occasionally close sections in winter.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.8493, lng: -17.16764 },
    endCoordinates: { lat: 32.80152, lng: -17.15812 },
    distanceKm: 9,
    durationMinutes: 240,
    elevationGain: 200,
    difficulty: 'moderate',
    type: 'levada',
    isLinear: true,
    season: 'Apr–Oct',
    startPoint: 'Lamaceiros, Porto Moniz',
    trailheadUrl: 'https://www.openstreetmap.org/relation/4441705',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Ribeira_da_Janela_%28Madeira%2C_Portugal%29%2C_Ilheus_da_Janela_--_2025_--_1584.jpg/1920px-Ribeira_da_Janela_%28Madeira%2C_Portugal%29%2C_Ilheus_da_Janela_--_2025_--_1584.jpg',
    imageAttribution:
      'Photo by Dietmar Rabich, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Wildest valley on the north coast',
      'Unlit tunnels — bring a headlamp',
      'Almost no crowds',
    ],
    featured: false,
  },
  {
    name: 'Levada Nova (Ponta do Sol)',
    slug: 'levada-nova-ponta-do-sol',
    prCode: undefined,
    shortDescription:
      'A waterfall-curtain levada above Ponta do Sol — the famous "walk behind the falls" section.',
    description: `The Levada Nova above Ponta do Sol is famous for one moment: a stretch where the path passes behind a curtain of water pouring off the cliff — you walk through the spray with the valley opening beyond. On a sunny afternoon it is one of the most photogenic levada sections on the island.

The trail climbs gently along the levada contour above the Lombada district of Ponta do Sol, through smallholdings and then into greener, steeper terrain. Parts of the path are unprotected with drops beside the channel — fine for confident walkers, less so for small children.

Most people walk a loop combining Levada Nova with the parallel Levada do Moinho lower down, starting from the Lombada church area — about 10 km for the full circuit. Finish with sunset on the Ponta do Sol seafront; the town is officially the sunniest place on the island.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.68592, lng: -17.06653 },
    endCoordinates: { lat: 32.69422, lng: -17.08762 },
    distanceKm: 10,
    durationMinutes: 210,
    elevationGain: 250,
    difficulty: 'moderate',
    type: 'levada',
    isLinear: true,
    season: 'All year',
    startPoint: 'Lombada, Ponta do Sol',
    trailheadUrl: 'https://www.openstreetmap.org/relation/20019057',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Levada_Nova-001.JPG/1920px-Levada_Nova-001.JPG',
    imageAttribution:
      'Photo by Harald Lordick, CC BY-SA 3.0, via Wikimedia Commons',
    highlights: [
      'Path behind a waterfall curtain',
      'Pairs with Levada do Moinho loop',
      'Sunniest corner of Madeira',
    ],
    featured: false,
  },
  {
    name: 'Levada do Barreiro',
    slug: 'levada-do-barreiro',
    prCode: 'PR4',
    shortDescription:
      'A gentle levada on the slopes above Monte — city gardens giving way to eucalyptus shade.',
    description: `PR4 is the levada walk you can reach without leaving the Funchal suburbs. Starting in Monte — below the famous church and the wicker toboggan run — it follows the Levada do Barreiro west along the hillside through gardens, banana plots and eucalyptus groves towards the Poço do Bezerro area.

The path is short, gentle and mostly shaded, making it the best option when the high trails are clouded in or when you only have a spare morning. Views open occasionally over the Funchal amphitheatre to the harbour.

Combine it with the Monte sights: the tropical garden, the Nossa Senhora do Monte church, and the toboggan descent back to the city. At roughly 5 km the levada itself is short — extend it by linking with the PR3.1 Caminho Real descent if you want more distance.`,
    locationSlug: 'funchal',
    geoCoordinates: { lat: 32.72598, lng: -16.92474 },
    endCoordinates: { lat: 32.6953, lng: -16.90936 },
    distanceKm: 5.2,
    durationMinutes: 120,
    elevationGain: 80,
    difficulty: 'easy',
    type: 'levada',
    isLinear: true,
    season: 'All year',
    startPoint: 'Monte, Funchal',
    trailheadUrl: 'https://www.openstreetmap.org/relation/13562619',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/2016_Funchal._Madeira._Portugal-103.jpg/1920px-2016_Funchal._Madeira._Portugal-103.jpg',
    imageAttribution:
      'Photo by Luis Miguel Bugallo Sánchez (Lmbuga), CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Reachable by bus from Funchal',
      'Pairs with Monte sights',
      'Good bad-weather fallback',
    ],
    featured: false,
  },
  {
    name: 'Levada do Moinho',
    slug: 'levada-do-moinho',
    prCode: 'PR7',
    shortDescription:
      'The Porto Moniz levada past the old watermills — narrow, green and rarely walked.',
    description: `PR7 follows the Levada do Moinho — the "mill levada" that once fed the watermills of the Porto Moniz hinterland — from Lamaceiros along the Ribeira da Janela valley. It is one of the least-walked official routes, and on a weekday you may have the whole gorge to yourself.

The trail is mostly flat but narrow, with sections where the path clings to the valley side and a few short tunnels. Old mill ruins appear along the channel — reminders that these levadas were working infrastructure before they were attractions.

About 10 km one way, best done with a pickup arranged at the far end or as a partial out-and-back. The north side is wetter: waterproof footwear and a light jacket are sensible any month of the year.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.85176, lng: -17.16648 },
    endCoordinates: { lat: 32.82939, lng: -17.20839 },
    distanceKm: 10.3,
    durationMinutes: 230,
    elevationGain: 150,
    difficulty: 'moderate',
    type: 'levada',
    isLinear: true,
    season: 'All year',
    startPoint: 'Lamaceiros, Porto Moniz',
    trailheadUrl: 'https://www.openstreetmap.org/relation/2754642',
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/c/c4/Levada_do_Moinho_03.jpg',
    imageAttribution: 'Photo by Sarang, Public domain, via Wikimedia Commons',
    highlights: [
      'Abandoned watermill ruins',
      'One of the quietest PR routes',
      'Deep Ribeira da Janela gorge',
    ],
    featured: false,
  },
  {
    name: 'Vereda do Larano',
    slug: 'vereda-do-larano',
    shortDescription:
      'The old coastal path between Machico and Porto da Cruz — cliff-edge drama the whole way.',
    description: `The Vereda do Larano follows the historic coastal route between Machico and Porto da Cruz, clinging to the cliff line high above the Atlantic. Before the tunnels were bored through the headlands, this was how the villages traded and visited — the path is still paved in places with old stonework.

The standard walk runs from the Boca do Risco viewpoint above Caniçal along to the Larano viewpoint and down to Porto da Cruz — roughly 7–10 km depending on the chosen exit. The cliff sections are narrow with real exposure; there is a fixed cable on the steepest part, but a head for heights is essential.

Finish in Porto da Cruz with lunch by the sea and a look at the old rum distillery still powered by steam in season. The return can be done by bus along the main road.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.75535, lng: -16.77236 },
    endCoordinates: { lat: 32.76153, lng: -16.80438 },
    distanceKm: 10,
    durationMinutes: 210,
    elevationGain: 350,
    difficulty: 'moderate',
    type: 'coastal',
    isLinear: true,
    season: 'All year',
    startPoint: 'Boca do Risco, Caniçal',
    trailheadUrl: 'https://www.openstreetmap.org/relation/4444453',
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/f/ff/Estrada_do_Larano%2C_Porto_da_Cruz%2C_Madeira%2C_c._1900_-_Image_207375.jpg',
    imageAttribution:
      'Photo c. 1900, Public domain, via Wikimedia Commons',
    highlights: [
      'Historic cliff-edge path',
      'Views to Penha d’Águia',
      'Ends in Porto da Cruz',
    ],
    featured: false,
  },
  {
    name: 'Vereda da Encumeada',
    slug: 'vereda-da-encumeada',
    prCode: 'PR1.3',
    shortDescription:
      'The big climb from the Encumeada pass to Pico Ruivo — Madeira’s toughest official route.',
    description: `PR1.3 is the connoisseur's route to Pico Ruivo: instead of driving up to Achada do Teixeira, you earn the summit by climbing over 900 metres from the Encumeada pass through forested ravines to the island's rooftop. It is the hardest of the official PR trails.

The path winds up between the twin peaks of Pico Grande and Pico Jorge, emerging onto the high plateau where the views explode: the Curral das Freiras basin behind you, the whole central ridge ahead. The final stretch joins the PR1 ridge path before the summit shelter.

At around 11–12 km one way with serious elevation, this is a full-day mountain route — start early, carry water (there is none en route), and be sure of the weather. Most walkers arrange transport at the far end or descend to Achada do Teixeira.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.75427, lng: -17.01856 },
    endCoordinates: { lat: 32.76012, lng: -16.94181 },
    distanceKm: 11.2,
    durationMinutes: 270,
    elevationGain: 950,
    difficulty: 'hard',
    type: 'vereda',
    isLinear: true,
    season: 'Apr–Oct',
    startPoint: 'Boca da Encumeada',
    trailheadUrl: 'https://www.openstreetmap.org/relation/4441702',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Encumeada%2C_Madeira_-_Jan_2012_-_01.jpg/1920px-Encumeada%2C_Madeira_-_Jan_2012_-_01.jpg',
    imageAttribution:
      'Photo by Stephen Colebourne, CC BY 2.0, via Wikimedia Commons',
    highlights: [
      'Hardest official trail on the island',
      '950 m climb to Pico Ruivo',
      'Views over Curral das Freiras',
    ],
    featured: false,
  },
  {
    name: 'Levada dos Cedros',
    slug: 'levada-dos-cedros',
    prCode: 'PR14',
    shortDescription:
      'A gentle Fanal-forest levada past ancient cedars and hidden waterfalls.',
    description: `PR14 winds through the misty upland forest at Fanal — part of the Laurisilva UNESCO reserve — following the Levada dos Cedros past some of the oldest trees on the island. Giant, moss-draped Til trees (Madeira's "cedars") line the route, and small waterfalls spill across the path after rain.

The trail is easy underfoot and fairly flat, around 7 km out and back from the ER209 road near the Fanal parking. What makes it special is the atmosphere: when the cloud rolls in, the forest becomes genuinely primordial — twisted silhouettes, dripping moss, absolute quiet.

Combine it with a walk among the famous Fanal elder trees on the plateau, or with the PR13 descent from the same trailhead. Best in the morning before the mist thickens — or lean into the fog for the full fairy-tale effect.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.80619, lng: -17.1408 },
    endCoordinates: { lat: 32.82592, lng: -17.15793 },
    distanceKm: 7.2,
    durationMinutes: 150,
    elevationGain: 120,
    difficulty: 'easy',
    type: 'levada',
    isLinear: true,
    season: 'All year',
    startPoint: 'Fanal (ER209)',
    trailheadUrl: 'https://www.openstreetmap.org/relation/2239199',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Verlauf_der_Levada_dos_Cedros.jpg/1920px-Verlauf_der_Levada_dos_Cedros.jpg',
    imageAttribution:
      'Photo by Rudolphu, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Ancient Til trees in UNESCO forest',
      'Waterfalls across the path',
      'Pairs with Fanal plateau walk',
    ],
    featured: false,
  },
  {
    name: 'Levada do Paul da Serra',
    slug: 'levada-do-paul-da-serra',
    prCode: 'PR6.8',
    shortDescription:
      'A flat, open levada across the high plateau — big sky, wind turbines and silence.',
    description: `The Levada do Paul crosses the high Paúl da Serra plateau — Madeira's only flat country, a wind-swept moor at 1,400 m where the island's wind farm turns slowly above grazing cows. After the vertical drama of the coast and the enclosed tunnels of laurisilva, the openness here is a completely different Madeira.

The path follows the levada dead level for kilometre after kilometre — it is the flattest walking on the island and a favourite with runners. On clear days the views reach both coasts; on foggy ones the plateau is atmospheric but disorienting.

This is the levada to pick when you want easy kilometres and big sky rather than waterfalls. Combine it with the Bica da Cana viewpoint nearby or use it as a warm-up before dropping into Rabaçal for PR6.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.74832, lng: -17.12539 },
    endCoordinates: { lat: 32.75569, lng: -17.05901 },
    distanceKm: 7,
    durationMinutes: 120,
    elevationGain: 50,
    difficulty: 'easy',
    type: 'levada',
    isLinear: true,
    season: 'All year',
    startPoint: 'Paúl da Serra plateau',
    trailheadUrl: 'https://www.openstreetmap.org/relation/6193460',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Madeira-Paul_da_Serra-ER_105_%28street%29-07ESD.jpg/1920px-Madeira-Paul_da_Serra-ER_105_%28street%29-07ESD.jpg',
    imageAttribution:
      'Photo by Asurnipal, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Flattest trail on Madeira',
      'High-plateau moorland scenery',
      'Links to Rabaçal trails',
    ],
    featured: false,
  },
  {
    name: 'Vereda do Fanal',
    slug: 'vereda-do-fanal',
    prCode: 'PR13',
    shortDescription:
      'A long forest descent from the plateau into the mystical Fanal laurisilva.',
    description: `PR13 drops nearly 11 km from the edge of the Paúl da Serra plateau down through ever-thickening forest to Fanal — the famous grove of ancient, fog-draped Til trees that has become Madeira's most photographed landscape.

The upper section crosses open moorland with long views to the sea; the lower two-thirds enter dense laurisilva where the path is a green tunnel of moss and ferns. The forest can be muddy and the trail is sustained downhill — poles help if your knees complain.

Fanal at the end is the reward: centuries-old trees twisted into living sculpture, often half-dissolved in cloud. Arrange a lift back or continue on the quieter paths towards Assobiadores — the plateau road at the top means the route works best as a one-way descent.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.76715, lng: -17.10772 },
    endCoordinates: { lat: 32.80845, lng: -17.14205 },
    distanceKm: 10.8,
    durationMinutes: 240,
    elevationGain: 600,
    difficulty: 'moderate',
    type: 'vereda',
    isLinear: true,
    season: 'All year',
    startPoint: 'Paúl da Serra (ER105)',
    trailheadUrl: 'https://www.openstreetmap.org/relation/2754724',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Fanal_%28Madeira%2C_Portugal%29%2C_Lorbeerwald_--_2025_--_1527.jpg/1920px-Fanal_%28Madeira%2C_Portugal%29%2C_Lorbeerwald_--_2025_--_1527.jpg',
    imageAttribution:
      'Photo by Dietmar Rabich, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Ends in the famous Fanal forest',
      'Ancient moss-covered Til trees',
      'Moorland-to-jungle transition',
    ],
    featured: false,
  },
]

async function seedTrails(): Promise<void> {
  const payload = await getPayload({ config })

  const locations = await payload.find({ collection: 'locations', limit: 100 })
  const locationBySlug = new Map(locations.docs.map((l) => [l.slug, l.id]))

  let okCount = 0

  for (const trail of trails) {
    const { locationSlug, ...rest } = trail
    const locationId = locationSlug ? locationBySlug.get(locationSlug) : undefined

    const data = {
      ...rest,
      ...(locationId ? { location: locationId } : {}),
      status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'trails',
      where: { slug: { equals: trail.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({ collection: 'trails', id: existing.docs[0].id, data })
    } else {
      await payload.create({ collection: 'trails', data })
    }

    okCount++
    console.log(`OK trail ${trail.slug}`)
  }

  console.log(`Done. OK: ${okCount}`)
}

seedTrails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding trails:', error)
    process.exit(1)
  })
