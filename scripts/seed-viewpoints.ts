import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

// Coordinates: OpenStreetMap (tourism=viewpoint nodes) + Nominatim cross-check.
// Images: Wikimedia Commons, license verified via Commons API extmetadata.

interface ViewpointSeed {
  name: string
  slug: string
  shortDescription: string
  description: string
  locationSlug?: string
  geoCoordinates: { lat: number; lng: number }
  elevationM: number
  type: 'cliff' | 'peak' | 'miradouro' | 'tower' | 'coastal' | 'valley'
  viewType: string[]
  access: 'car' | 'walk_short' | 'walk_long'
  bestTime: string
  glassPlatform: boolean
  heroImage: string
  imageAttribution: string
  highlights: string[]
  featured: boolean
}

const viewpoints: ViewpointSeed[] = [
  {
    name: 'Cabo Girão',
    slug: 'cabo-girao',
    shortDescription:
      'A glass skywalk on one of Europe’s highest sea cliffs — 580 m straight down to the waves.',
    description: `Cabo Girão is the cliff that defines Madeira's south coast: a near-vertical wall of rock dropping 580 metres to a strip of terraced farmland and the open Atlantic. The viewpoint caps it with a glass-floored skywalk — step onto the transparent platform and the sea is directly beneath your boots.

The panorama sweeps the entire south coast: Funchal and its harbour to the east, Câmara de Lobos' fishing bay below, and the cliff terraces where farmers still reach their plots by cable car and boat. Sunset is the classic hour, when the cliff face glows amber.

Entry to the skywalk is a small fee; the terrace around it is free. Come early morning for empty photos or late afternoon for the best light — midday tour buses make it the busiest viewpoint on the island. The Chapel of Nossa Senhora de Fátima next door is worth a minute.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.6572, lng: -17.0048 },
    elevationM: 580,
    type: 'cliff',
    viewType: ['ocean', 'city', 'sunset'],
    access: 'car',
    bestTime: 'Sunset',
    glassPlatform: true,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/CGI_-_Cliff_and_Atlantic_Ocean_from_Miradouro_do_Cabo_Gir%C3%A3o%2C_Madeira%2C_2023.jpg/1920px-CGI_-_Cliff_and_Atlantic_Ocean_from_Miradouro_do_Cabo_Gir%C3%A3o%2C_Madeira%2C_2023.jpg',
    imageAttribution:
      'Photo by Josep M. Gracia, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Glass skywalk at 580 m',
      'One of Europe’s highest sea cliffs',
      'South-coast panorama to Funchal',
    ],
    featured: true,
  },
  {
    name: 'Pico do Arieiro',
    slug: 'pico-do-arieiro',
    shortDescription:
      'Sunrise above the clouds on Madeira’s third-highest peak — the island’s most famous view.',
    description: `At 1,818 metres, Pico do Arieiro is the highest point on Madeira reachable by car — and the island's most famous sunrise spot. On a clear morning you stand above a boiling sea of cloud with only the neighbouring peaks breaking the surface, while the sun rises over the Atlantic behind the ridge.

The main miradouro sits steps from the parking; a second viewpoint, Miradouro do Ninho da Manta, is a short walk up a staircase of volcanic rock. This is also the trailhead for PR1, the ridge walk to Pico Ruivo.

Bring warm clothes whatever the season — it can be 15°C colder than Funchal, and wind is normal. For sunrise, arrive 40 minutes early and drive up in the dark; the glow starts before the disc appears. If the top is fogged in, wait — the cloud deck often breaks.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.73573, lng: -16.92871 },
    elevationM: 1818,
    type: 'peak',
    viewType: ['mountains', 'ocean', 'sunrise'],
    access: 'car',
    bestTime: 'Sunrise',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/View_from_Miradouro_do_Pico_do_Arieiro_-_Madeira_01.jpg/1920px-View_from_Miradouro_do_Pico_do_Arieiro_-_Madeira_01.jpg',
    imageAttribution:
      'Photo by H. Zell, CC BY-SA 3.0, via Wikimedia Commons',
    highlights: [
      'Sunrise above the cloud sea',
      'Trailhead for the PR1 ridge walk',
      'Drive-up access at 1,818 m',
    ],
    featured: true,
  },
  {
    name: 'Pico Ruivo',
    slug: 'pico-ruivo',
    shortDescription:
      'The rooftop of Madeira at 1,862 m — a 360° summit over the whole island.',
    description: `Pico Ruivo is the highest point of Madeira and of Portugal outside the Azores. The summit platform, reached by a short staircase from the Casa de Abrigo shelter, gives a complete 360-degree panorama: Curral das Freiras directly below, the São Lourenço peninsula to the east, and on the clearest days Porto Santo on the horizon.

You cannot drive to Ruivo — the two approaches are the short PR1.2 from Achada do Teixeira (about an hour) or the dramatic PR1 ridge walk from Pico do Arieiro. Either way the summit earns its reputation: few places in Europe let you survey an entire island in one turn.

At sunrise the peak often stands alone above the clouds — arrive early via Achada do Teixeira for the clearest skies. Weather closes in fast; if the summit is in fog, shelter at the Casa de Abrigo and wait it out.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.76032, lng: -16.94353 },
    elevationM: 1862,
    type: 'peak',
    viewType: ['mountains', 'ocean', 'sunrise'],
    access: 'walk_long',
    bestTime: 'Sunrise',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/2016._Pico_Ruivo._Madeira._Portugal_%2716.jpg/1920px-2016._Pico_Ruivo._Madeira._Portugal_%2716.jpg',
    imageAttribution:
      'Photo by Luis Miguel Bugallo Sánchez (Lmbuga), CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Highest point of Madeira',
      'Full 360° island panorama',
      'Reachable via PR1.2 in ~1 h',
    ],
    featured: true,
  },
  {
    name: 'Eira do Serrado',
    slug: 'eira-do-serrado',
    shortDescription:
      'The classic view into the Curral das Freiras crater — a village hidden inside a volcano.',
    description: `Eira do Serrado looks straight down into Curral das Freiras — the "Valley of the Nuns", a deep bowl village ringed by vertical ridges where nuns once hid from pirates. From the stone balcony the settlement seems to float in the crater far below, its white houses scattered between chestnut terraces.

The viewpoint sits at 1,095 m beside a small hotel, reachable by car on the road that climbs out of Funchal's Santo António district. A short path continues along the ridge for alternative angles, and a vertiginous trail descends into the village for the committed.

Afternoon light is kindest — the sun swings into the valley and the ridge shadows sharpen the relief. Pair it with the village itself: drive down afterwards for chestnut soup and to look back up at where you stood.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.71035, lng: -16.96576 },
    elevationM: 1095,
    type: 'miradouro',
    viewType: ['valley', 'mountains'],
    access: 'car',
    bestTime: 'Afternoon',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/Curral_das_Freiras_from_Eira_do_Serrado_01.jpg/1920px-Curral_das_Freiras_from_Eira_do_Serrado_01.jpg',
    imageAttribution:
      'Photo by H. Zell, CC BY-SA 3.0, via Wikimedia Commons',
    highlights: [
      'Crater view over Curral das Freiras',
      'Optional steep descent to the village',
      'Easy drive-up access from Funchal',
    ],
    featured: true,
  },
  {
    name: 'Boca da Corrida',
    slug: 'boca-da-corrida',
    shortDescription:
      'A quiet ridge-top viewpoint into Curral das Freiras, without the Eira do Serrado crowds.',
    description: `Boca da Corrida sits on the rim above Curral das Freiras at roughly 1,000 m — a quieter, wilder alternative to Eira do Serrado on the opposite side of the valley. From here you see the village from the west, with the encircling ridge line unbroken in every direction.

The viewpoint is also a trailhead: several paths drop into the crater or traverse the ridge towards Pico Grande. Even if you walk nothing, the short strolls along the rim in either direction open new angles every hundred metres.

Access is via the road through Estreito de Câmara de Lobos — the last stretch is narrow. There are no facilities, which is exactly the point: on a still morning you may be alone with the kestrels riding the ridge updraft.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.71067, lng: -16.9861 },
    elevationM: 1000,
    type: 'miradouro',
    viewType: ['valley', 'mountains'],
    access: 'car',
    bestTime: 'Morning',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Boca_dos_Namorados_1.jpg/1920px-Boca_dos_Namorados_1.jpg',
    imageAttribution:
      'Photo by Celsoazevedo, CC0, via Wikimedia Commons',
    highlights: [
      'Uncrowded Curral das Freiras rim',
      'Trailhead for ridge routes',
      'Raptor-watching on calm mornings',
    ],
    featured: false,
  },
  {
    name: 'Pico dos Barcelos',
    slug: 'pico-dos-barcelos',
    shortDescription:
      'The classic Funchal panorama — the whole amphitheatre from bay to banana terraces.',
    description: `Pico dos Barcelos is the viewpoint Funchal grew up with: a belvedere at 355 m in the Santo António district that frames the entire city amphitheatre — the harbour and cruise port below, the tiled roofs climbing the bowl, and the ridge line of the central massif behind.

Unlike the mountain viewpoints, Barcelos is about the city itself. Late afternoon is the move: the sun drops behind the western hills, the city lights come on, and the bay turns silver. There is a café at the top for a poncha with the view.

It is an easy stop on the way to or from Monte or Curral das Freiras — buses and taxis pass constantly. For photography, bring a zoom: the compression of the amphitheatre streets is the shot.`,
    locationSlug: 'funchal',
    geoCoordinates: { lat: 32.65866, lng: -16.93941 },
    elevationM: 355,
    type: 'miradouro',
    viewType: ['city', 'ocean', 'sunset'],
    access: 'car',
    bestTime: 'Sunset',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/Madeira_Pico_dos_Barcelos_2016_1.jpg/1920px-Madeira_Pico_dos_Barcelos_2016_1.jpg',
    imageAttribution:
      'Photo by Karelj, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Full Funchal amphitheatre view',
      'City lights at dusk',
      'Café at the viewpoint',
    ],
    featured: false,
  },
  {
    name: 'Miradouro da Portela',
    slug: 'miradouro-da-portela',
    shortDescription:
      'The mountain pass looking down on Porto da Cruz and the Eagle Rock headland.',
    description: `The Portela pass is where the island's weather visibly changes: the road crosses the ridge at about 670 m and suddenly the north coast opens up — Porto da Cruz and its surf bay below, Penha d'Águia's eagle-shaped sea cliff dominating the headland, and the São Lourenço peninsula floating beyond.

The miradouro at the pass is a natural stop on the road between Machico and Santana. On misty days clouds pour through the gap like slow water — dramatic in itself; on clear ones you can count the surf breaks in the bay.

Portela is also where PR10 ends — the levada trail from Ribeiro Frio finishes at the viewpoint, so you may meet mud-streaked hikers ordering celebratory poncha at the roadside café. Do the same.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.74733, lng: -16.82566 },
    elevationM: 670,
    type: 'miradouro',
    viewType: ['valley', 'ocean', 'mountains'],
    access: 'car',
    bestTime: 'Morning',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Orl%C3%AD_sk%C3%A1la.jpg/1920px-Orl%C3%AD_sk%C3%A1la.jpg',
    imageAttribution:
      'Photo by Ondřej Žváček, CC BY 2.5, via Wikimedia Commons',
    highlights: [
      'Eagle Rock (Penha d’Águia) panorama',
      'Weather divide between coasts',
      'Finish line of the PR10 levada',
    ],
    featured: false,
  },
  {
    name: 'Cristo Rei (Garajau)',
    slug: 'cristo-rei-garajau',
    shortDescription:
      'A Christ statue on the Garajau headland — arms open over the marine reserve below.',
    description: `Perched on the Garajau headland east of Funchal, the Cristo Rei statue has stood with arms outstretched over the Atlantic since 1927 — decades before Rio's famous copy. The viewpoint terraces below it look straight down into the Garajau marine reserve, one of the island's best dive spots.

The platform runs along the cliff edge with views west to the Desertas Islands and east towards Caniço. A stepped path continues down towards the pebble beach far below — a strenuous descent for a quiet swim in the reserve.

This is a ten-minute stop on the drive between Funchal and Machico, best at golden hour when the statue's silhouette catches the low sun. Small parking, no fee.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.63872, lng: -16.85086 },
    elevationM: 180,
    type: 'coastal',
    viewType: ['ocean', 'sunset'],
    access: 'car',
    bestTime: 'Sunset',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Cristo_Rei-Garajau.JPG/1920px-Cristo_Rei-Garajau.JPG',
    imageAttribution: 'Photo by Coeli, Public domain, via Wikimedia Commons',
    highlights: [
      'Older than Rio’s Christ — since 1927',
      'Over Garajau marine reserve',
      'Desertas Islands on the horizon',
    ],
    featured: false,
  },
  {
    name: 'Ponta do Rosto',
    slug: 'ponta-do-rosto',
    shortDescription:
      'Where the São Lourenço peninsula begins — cliffs dissolving into golden volcanic sea.',
    description: `Ponta do Rosto stands at the gateway to the São Lourenço peninsula, where green Madeira ends and the bare volcanic cape begins. The viewpoint perches on the first rise of the peninsula road, looking east along a coastline of basalt pyramids and west back to the island's green body.

It is the best single photo spot of the peninsula's geology: striated rock in ochre, rust and black dropping into absurdly clear water. Sunrise here is exceptional — the light comes straight up the channel.

The viewpoint is a five-minute drive from the PR8 trailhead, so combine them. There is no barrier beyond the fenced platform — the drop is real, watch footing in wind.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.75138, lng: -16.7086 },
    elevationM: 120,
    type: 'cliff',
    viewType: ['ocean', 'sunrise'],
    access: 'car',
    bestTime: 'Sunrise',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/2016_Vista_da_costa_desde_a_Ponta_do_Rosto_ate_a_Ponta_do_Castelo._Ponta_de_S%C3%A3o_Louren%C3%A7o._Madeira._Portugal-3.jpg/1920px-2016_Vista_da_costa_desde_a_Ponta_do_Rosto_ate_a_Ponta_do_Castelo._Ponta_de_S%C3%A3o_Louren%C3%A7o._Madeira._Portugal-3.jpg',
    imageAttribution:
      'Photo by Luis Miguel Bugallo Sánchez (Lmbuga), CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Gateway to São Lourenço cape',
      'Two-coast panorama',
      'Sunrise over the channel',
    ],
    featured: false,
  },
  {
    name: 'Miradouro da Ponta do Pargo',
    slug: 'miradouro-da-ponta-do-pargo',
    shortDescription:
      'The westernmost point — a lighthouse on a 300 m cliff at the edge of the map.',
    description: `Ponta do Pargo is the island's far west: a lighthouse standing on a cliff nearly 300 m above the Atlantic, at the end of a plateau that feels like the edge of the world. The viewpoint beside the Farol da Ponta do Pargo looks down the entire western seaboard — sheer coast in both directions, nothing but ocean ahead until the Azores.

This is Madeira's premier sunset spot: the sun drops straight into the sea off the headland with no land to interrupt it. The high plateau behind is apple-farming country — flat, green, and strangely rural compared to the drama at the edge.

The drive from Funchal is about an hour — combine it with the Garganta Funda waterfall viewpoint and Achadas da Cruz cable car nearby. Facilities are minimal: a small lighthouse exhibition and a lot of wind.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.81397, lng: -17.26353 },
    elevationM: 290,
    type: 'cliff',
    viewType: ['ocean', 'sunset'],
    access: 'car',
    bestTime: 'Sunset',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/Ponta_do_Pargo_%28Madeira%2C_Portugal%29%2C_Farol_da_Ponta_do_Pargo_--_2025_--_1792.jpg/1920px-Ponta_do_Pargo_%28Madeira%2C_Portugal%29%2C_Farol_da_Ponta_do_Pargo_--_2025_--_1792.jpg',
    imageAttribution:
      'Photo by Dietmar Rabich, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Westernmost point of Madeira',
      'Lighthouse on a ~300 m cliff',
      'The island’s best sunset',
    ],
    featured: true,
  },
  {
    name: 'Miradouro do Guindaste',
    slug: 'miradouro-do-guindaste',
    shortDescription:
      'Glass platforms jutting over the Faial cliffs — the north coast’s answer to Cabo Girão.',
    description: `The Guindaste viewpoint near Faial has been upgraded with two glass-floored platforms that jut out from the cliff edge — the north coast's own small skywalk, free and far quieter than Cabo Girão. Below, the Atlantic pounds a coastline of columnar basalt; ahead, Penha d'Águia rises like a fortress from the sea.

The platforms hang over a serious drop with the Faial bay and its fishing hamlet spread beneath. To the east the coast marches towards Ponta do Clérigo; west, the cliffs run unbroken to Porto da Cruz.

It sits just off the ER101 coastal road — a five-minute stop with a disproportionate payoff. Best in the morning when the light comes over the sea, and combine with the Fortim do Faial viewpoint just up the road.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.79425, lng: -16.84936 },
    elevationM: 200,
    type: 'cliff',
    viewType: ['ocean', 'cliff'],
    access: 'car',
    bestTime: 'Morning',
    glassPlatform: true,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/5/51/Talefe_Faial_573.jpg',
    imageAttribution:
      'Photo by RHaworth, CC BY 2.5, via Wikimedia Commons',
    highlights: [
      'Free glass platforms over the cliff',
      'Penha d’Águia rising from the sea',
      'Quieter than Cabo Girão',
    ],
    featured: false,
  },
  {
    name: 'Balcões',
    slug: 'balcoes-ribeiro-frio',
    shortDescription:
      'The natural balcony at the end of PR11 — peaks above, valley below, chaffinches on your hand.',
    description: `Balcões ("the balconies") is the viewpoint at the end of the easy PR11 trail from Ribeiro Frio — a stone-railed terrace hanging over the Ribeira da Metade valley at about 870 m. The view is a wall of peaks: Pico do Arieiro and Pico Ruivo dead ahead, with the green canyon dropping away beneath your feet.

What people remember longest is the birds: Madeiran chaffinches here are famously tame and will eat crumbs from an open palm. Arrive before the tour groups and it is just you, the peaks and the birdsong.

Because access is a 15-minute forest walk rather than a car park, Balcões stays calmer than drive-up viewpoints. Morning gives the clearest skies — clouds usually build over the ridge after midday.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.74159, lng: -16.89032 },
    elevationM: 870,
    type: 'valley',
    viewType: ['mountains', 'valley'],
    access: 'walk_short',
    bestTime: 'Morning',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4d/View_from_Balc%C3%B5es_-_Madeira.jpg/1920px-View_from_Balc%C3%B5es_-_Madeira.jpg',
    imageAttribution:
      'Photo by H. Zell, CC BY-SA 3.0, via Wikimedia Commons',
    highlights: [
      'Peak panorama at the end of PR11',
      'Tame chaffinches on your hand',
      '15-minute forest walk in',
    ],
    featured: false,
  },
  {
    name: 'Bica da Cana',
    slug: 'bica-da-cana',
    shortDescription:
      'A 1,560 m summit on the plateau edge — above the clouds with both coasts in sight.',
    description: `Bica da Cana is the high point on the road crossing Paúl da Serra — a hilltop viewpoint at about 1,560 m where the plateau suddenly opens onto a panorama of the island's spine. On clear mornings you can see from Pico Ruivo's ridge across the whole north coast to the sea.

The spot is a favourite at sunrise: the plateau generates its own cloud layer, and from Bica da Cana you often stand above it while the valley below is submerged in white. A short marked trail circles the top through heather and gorse.

Drive up on the ER105 — the parking area is right at the top. It is frequently cold and windy even when Funchal is warm; bring a jacket. On very clear days this is arguably the best single viewpoint on the island.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.75632, lng: -17.0546 },
    elevationM: 1560,
    type: 'peak',
    viewType: ['mountains', 'ocean', 'sunrise'],
    access: 'car',
    bestTime: 'Sunrise',
    glassPlatform: false,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/9/9d/Giestas_ou_maias_do_Paul_da_Serra%2C_Madeira%2C_Jos%C3%A9_Lemos_Silva_-_2022-05-05_-_Image_209455.jpg',
    imageAttribution:
      'Photo by José Lemos Silva, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Above the plateau cloud deck',
      'Both coasts on clear days',
      'Best-kept-secret sunrise spot',
    ],
    featured: false,
  },
  {
    name: 'Paúl da Serra Viewpoint',
    slug: 'paul-da-serra-viewpoint',
    shortDescription:
      'The high plateau’s roadside miradouro — endless moorland, wind turbines and silence.',
    description: `The Paúl da Serra viewpoint sits on the edge of Madeira's high plateau at about 1,400 m — the only flat, open landscape on an island of cliffs. From the roadside miradouro the moorland rolls away to the horizon: grazing cattle, wind turbines, and on clear days a glimpse of the sea below on both sides.

There is no drama here, and that is the appeal — after the vertigo of the coastal viewpoints, the plateau's emptiness is a palate cleanser. Stargazers know it as the darkest accessible sky on the island.

Stop here on the crossing between the north and south coasts, or use it as the jumping-off point for the Rabaçal and Fanal walks. Weather is several degrees colder than the coast and can close in without warning.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.75772, lng: -17.09732 },
    elevationM: 1400,
    type: 'miradouro',
    viewType: ['mountains', 'valley'],
    access: 'car',
    bestTime: 'All day',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Madeira-Paul_da_Serra-ER_105_%28street%29-07ESD.jpg/1920px-Madeira-Paul_da_Serra-ER_105_%28street%29-07ESD.jpg',
    imageAttribution:
      'Photo by Asurnipal, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Madeira’s only flat landscape',
      'Darkest sky for stargazing',
      'Gateway to Rabaçal and Fanal',
    ],
    featured: false,
  },
  {
    name: 'Miradouro da Encumeada',
    slug: 'miradouro-da-encumeada',
    shortDescription:
      'The great pass between north and south — valleys falling away on both sides.',
    description: `Boca da Encumeada is the saddle where Madeira's two halves meet: the road crests the ridge at 1,007 m and for a few metres you can see down to the sea on both sides of the island at once — Serra de Água's valley to the south, São Vicente's gorge to the north.

The miradouro terraces on both sides of the pass give two completely different views: north into the island's deepest valley where São Vicente hides, south down the long Ribeira Brava corridor. A hotel and snack bar sit at the top; there is almost always a line of camper vans at dawn.

This is also a major trailhead — PR1.3 to Pico Ruivo starts here, as does the old Caminho Real descent to the north coast. Even if you are only passing through on the ER228, stop: the pass is one of those places where the island's whole geometry suddenly makes sense.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.75456, lng: -17.01952 },
    elevationM: 1007,
    type: 'valley',
    viewType: ['valley', 'mountains', 'ocean'],
    access: 'car',
    bestTime: 'Morning',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Encumeada%2C_Madeira_-_Jan_2012_-_01.jpg/1920px-Encumeada%2C_Madeira_-_Jan_2012_-_01.jpg',
    imageAttribution:
      'Photo by Stephen Colebourne, CC BY 2.0, via Wikimedia Commons',
    highlights: [
      'Sea views on both sides at once',
      'Trailhead for PR1.3 to Pico Ruivo',
      'The island’s geographic divide',
    ],
    featured: false,
  },
  {
    name: 'Pico do Facho',
    slug: 'pico-do-facho',
    shortDescription:
      'The beacon hill above Machico — where watchfires once warned of pirates.',
    description: `Pico do Facho ("torch peak") earned its name from the signal fires lit here to warn Funchal of approaching pirates. Today the hilltop above Machico bay holds a panoramic platform with a triple view: the airport runway jutting into the sea, Machico's golden beach and valley, and the whole São Lourenço peninsula stretching east.

The viewpoint is a short climb or drive above the Machico–Caniçal road. Plane spotters come for the aircraft curving in below eye level; everyone else comes for the widest east-coast vista on the island.

Sunset works — the light rakes along Machico valley — but sunrise is special here: the sun comes up behind the São Lourenço headland and silhouettes the entire peninsula. Combine with a swim at Machico beach below.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.72383, lng: -16.75913 },
    elevationM: 280,
    type: 'peak',
    viewType: ['ocean', 'city', 'sunrise'],
    access: 'walk_short',
    bestTime: 'Sunrise',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Machico%2C_Madeira_-_2013-01-11_-_86138942.jpg/1920px-Machico%2C_Madeira_-_2013-01-11_-_86138942.jpg',
    imageAttribution:
      'Photo by Maximovich Nikolay, CC BY 3.0, via Wikimedia Commons',
    highlights: [
      'Pirate signal-fire hill',
      'Airport runway below eye level',
      'Sunrise over São Lourenço',
    ],
    featured: false,
  },
  {
    name: 'Ponta do Clérigo',
    slug: 'ponta-do-clerigo',
    shortDescription:
      'A sea-cliff lookout on the Santana coast — raw Atlantic and zero infrastructure.',
    description: `Ponta do Clérigo is a basalt headland on the Santana coast where the old north-coast road threads between cliff and sea. The lookout here is about as raw as Madeira's viewpoints get: no platforms, no café — just the Atlantic hitting black rock below and the coast running wild in both directions.

The point faces the open ocean east of Faial, catching the first light of the day. After storms the swell puts on a show; on calm days you can watch the water turn every shade of blue.

It makes a natural pause on the slow drive along the north coast between Santana and Porto da Cruz — combine it with the Guindaste platforms and the Faial waterfront. Respect the edge: there is no barrier.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.80732, lng: -16.8549 },
    elevationM: 100,
    type: 'coastal',
    viewType: ['ocean', 'sunrise'],
    access: 'car',
    bestTime: 'Morning',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/2016-_O_mar_e_as_rocas_en_Seixal._Madeira._Portugal.jpg/1920px-2016-_O_mar_e_as_rocas_en_Seixal._Madeira._Portugal.jpg',
    imageAttribution:
      'Photo by Luis Miguel Bugallo Sánchez (Lmbuga), CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Untamed north-coast cliffs',
      'No crowds, no fences',
      'Storm-swell spectacle',
    ],
    featured: false,
  },
  {
    name: 'Miradouro do Véu da Noiva',
    slug: 'miradouro-do-veu-da-noiva',
    shortDescription:
      'The bridal-veil waterfall pouring straight into the sea — the old coast road’s postcard.',
    description: `Véu da Noiva — "the bride's veil" — is the waterfall that drops off the old ER101 road's cliff straight towards the sea near Seixal. The miradouro on the new road looks across a ravine to the white ribbon of water with the abandoned old road's galleries still visible on the cliff face.

This was once the single most dangerous stretch of coast road in Madeira; the tunnels closed it to traffic and left the waterfall to itself. The viewpoint is a roadside pull-in, busy at midday but unforgettable regardless — the combination of waterfall, sea and cliff is Madeira in one frame.

Stop here on the way to Porto Moniz; ten minutes is enough for the view, longer if the light is good. Morning light hits the falls directly; late afternoon silhouettes them.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.81608, lng: -17.09514 },
    elevationM: 50,
    type: 'coastal',
    viewType: ['ocean', 'waterfall'],
    access: 'car',
    bestTime: 'Morning',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/2016-_Corga_pr%C3%B3xima_ao_V%C3%A9u_da_Noiva._Madeira._Portugal-4.jpg/1920px-2016-_Corga_pr%C3%B3xima_ao_V%C3%A9u_da_Noiva._Madeira._Portugal-4.jpg',
    imageAttribution:
      'Photo by Luis Miguel Bugallo Sánchez (Lmbuga), CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Waterfall pouring into the Atlantic',
      'Abandoned coast road on the cliff',
      'Classic north-coast postcard',
    ],
    featured: false,
  },
  {
    name: 'Miradouro do Seixal',
    slug: 'miradouro-do-seixal',
    shortDescription:
      'Above the black-sand bay of Seixal — green cliffs, waterfalls and surf.',
    description: `The Seixal viewpoint looks down on one of Madeira's most cinematic bays: black volcanic sand, vertical green cliffs streaked with thin waterfalls, and Atlantic surf rolling into the harbour. From the miradouro above the village the whole amphitheatre composes itself into a single photograph.

Seixal sits on the north coast between São Vicente and Porto Moniz — the viewpoint is a natural pause on the coastal drive and the best way to preview the beach below. In the late afternoon the low sun rakes across the cliff wall and the wet sand turns to glass.

Walk down to the beach afterwards for the swim with the cliffs overhead, or continue to the natural pools at Porto Moniz. The viewpoint itself is a small pull-in with no facilities.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.82343, lng: -17.1033 },
    elevationM: 30,
    type: 'coastal',
    viewType: ['ocean', 'beach'],
    access: 'car',
    bestTime: 'Afternoon',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/2016-_O_mar_e_as_rocas_en_Seixal._Madeira._Portugal.jpg/1920px-2016-_O_mar_e_as_rocas_en_Seixal._Madeira._Portugal.jpg',
    imageAttribution:
      'Photo by Luis Miguel Bugallo Sánchez (Lmbuga), CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Over Seixal’s black-sand bay',
      'Waterfall-streaked cliffs',
      'Pairs with Porto Moniz pools',
    ],
    featured: false,
  },
  {
    name: 'Miradouro do Fanal',
    slug: 'miradouro-do-fanal',
    shortDescription:
      'At the edge of the ancient laurel forest — where Madeira becomes a fairy tale.',
    description: `The Fanal viewpoint sits where the ER209 road reaches the famous grove — centuries-old Til trees with twisted, moss-armoured trunks scattered across a misty mountainside at about 1,150 m. On foggy days the forest dissolves into silhouettes; on clear ones the view opens over the north coast to the sea far below.

The viewpoint area is the trailhead for both PR13 (the descent from the plateau) and PR14 (Levada dos Cedros), and the starting point for walks among the elder trees themselves — some are estimated to predate the Portuguese settlement of the island.

Fanal is part of the Laurisilva UNESCO World Heritage forest, and it is genuinely unique: there is no other landscape like it in Europe. Come on a weekday morning and you may have the fog and the trees entirely to yourself.`,
    locationSlug: undefined,
    geoCoordinates: { lat: 32.80845, lng: -17.14205 },
    elevationM: 1150,
    type: 'valley',
    viewType: ['forest', 'valley'],
    access: 'car',
    bestTime: 'Morning',
    glassPlatform: false,
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Fanal_%28Madeira%2C_Portugal%29%2C_Lorbeerwald_--_2025_--_1527.jpg/1920px-Fanal_%28Madeira%2C_Portugal%29%2C_Lorbeerwald_--_2025_--_1527.jpg',
    imageAttribution:
      'Photo by Dietmar Rabich, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: [
      'Ancient Til trees in UNESCO forest',
      'Fog-made-fairy-tale atmosphere',
      'Trailhead for PR13 and PR14',
    ],
    featured: false,
  },
]

async function seedViewpoints(): Promise<void> {
  const payload = await getPayload({ config })

  const locations = await payload.find({ collection: 'locations', limit: 100 })
  const locationBySlug = new Map(locations.docs.map((l) => [l.slug, l.id]))

  let okCount = 0

  for (const viewpoint of viewpoints) {
    const { locationSlug, ...rest } = viewpoint
    const locationId = locationSlug ? locationBySlug.get(locationSlug) : undefined

    const data = {
      ...rest,
      ...(locationId ? { location: locationId } : {}),
      status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'viewpoints',
      where: { slug: { equals: viewpoint.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({ collection: 'viewpoints', id: existing.docs[0].id, data })
    } else {
      await payload.create({ collection: 'viewpoints', data })
    }

    okCount++
    console.log(`OK viewpoint ${viewpoint.slug}`)
  }

  console.log(`Done. OK: ${okCount}`)
}

seedViewpoints()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding viewpoints:', error)
    process.exit(1)
  })
