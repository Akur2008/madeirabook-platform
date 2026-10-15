import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

const restaurants = [
  {
    name: 'Three House Restaurant',
    slug: 'three-house',
    shortDescription:
      'Creative fusion restaurant in Funchal’s old town, one of the highest-rated tables on TheFork.',
    description: `Three House sits on Rua Brigadeiro Oudinot in Santa Maria Maior, a few steps from Funchal's old town doors. The kitchen works a fusion line — local Atlantic produce reworked with international technique — and it is one of the most-booked restaurants in the city on TheFork.

Book ahead in high season; evenings fill fast with both visitors and locals.`,
    locationSlug: 'funchal',
    address: 'Rua Brigadeiro Oudinot 2, Funchal',
    geoCoordinates: { lat: 32.6494374, lng: -16.903808 },
    cuisine: 'Fusion',
    averagePrice: 35,
    googleRating: 4.65,
    tier: 'modern',
    highlights: ['Creative fusion menu', 'Old Town location', 'TheFork 9.3/10'],
    featured: true,
  },
  {
    name: 'Armazém do Sal',
    slug: 'armazem-do-sal',
    shortDescription:
      'Fusion dining inside a former salt warehouse on Rua da Alfândega — a Funchal classic.',
    description: `Armazém do Sal occupies a converted salt warehouse near the old harbour, with thick stone walls and a quiet courtyard garden. The menu runs Mediterranean fusion — fresh fish, tasting plates and a strong wine list.

It has been a fixture of Funchal dining for years and holds one of the top TheFork scores on the island.`,
    locationSlug: 'funchal',
    address: 'Rua da Alfândega, Funchal',
    geoCoordinates: { lat: 32.6477684, lng: -16.906485 },
    cuisine: 'Fusion',
    averagePrice: 32,
    googleRating: 4.6,
    tier: 'modern',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Trout_%27garden%27_at_Armaz%C3%A9m_do_Sal_%2852893231598%29.jpg/1920px-Trout_%27garden%27_at_Armaz%C3%A9m_do_Sal_%2852893231598%29.jpg',
    imageAttribution: 'Photo by Bex Walton, CC BY 2.0, via Wikimedia Commons',
    highlights: ['Converted salt warehouse', 'Courtyard garden', 'TheFork 9.2/10'],
    featured: true,
  },
  {
    name: 'Kampo by Chef Júlio Pereira',
    slug: 'kampo',
    shortDescription:
      'Júlio Pereira’s open-fire kitchen — dry-aged meats and Atlantic produce in the centre of Funchal.',
    description: `Kampo is the flagship of chef Júlio Pereira, the leading figure of Madeira's new-wave dining. The kitchen is built around fire: dry-aged meats, Josper-grilled fish and vegetables treated with the same precision.

The room is compact and popular — reservations through TheFork are strongly advised.`,
    locationSlug: 'funchal',
    address: 'Rua da Alfândega 74, Funchal',
    geoCoordinates: { lat: 32.6478224, lng: -16.9083268 },
    cuisine: 'European',
    averagePrice: 25,
    googleRating: 4.75,
    tier: 'modern',
    chef: 'Júlio Pereira',
    highlights: ['Dry-aged meats', 'Open-fire kitchen', 'Chef Júlio Pereira'],
    featured: true,
  },
  {
    name: 'ÁKVA by Chef Júlio Pereira',
    slug: 'akva',
    shortDescription:
      'Atlantic seafood and raw bar concept from chef Júlio Pereira, next door to Kampo.',
    description: `ÁKVA is Júlio Pereira's seafood concept on Rua dos Murças — fresh Atlantic catch, crudos and a raw bar, in contrast to Kampo's fire-focused menu a few doors away.

The room fills the ground floor of a restored old-town building; counters face the open kitchen.`,
    locationSlug: 'funchal',
    address: 'Rua dos Murças 6, Funchal',
    geoCoordinates: { lat: 32.6474838, lng: -16.9093783 },
    cuisine: 'European',
    averagePrice: 25,
    googleRating: 4.6,
    tier: 'modern',
    chef: 'Júlio Pereira',
    highlights: ['Atlantic seafood & raw bar', 'Chef Júlio Pereira', 'Old Town'],
    featured: true,
  },
  {
    name: "Theo's by Chef Júlio Pereira",
    slug: 'theos',
    shortDescription:
      'Modern Portuguese plates on Avenida Zarco — the third Júlio Pereira address in Funchal.',
    description: `Theo's completes the Júlio Pereira trio on the edge of Funchal's old town, on Avenida Zarco. Portuguese classics revisited — more casual in tone than Kampo, with the same sourcing discipline.

Good pick for a first dinner in the city: central, moderately priced, reliably full.`,
    locationSlug: 'funchal',
    address: 'Avenida Zarco 2A, Funchal',
    geoCoordinates: { lat: 32.6473881, lng: -16.9094923 },
    cuisine: 'Portuguese',
    averagePrice: 33,
    googleRating: 4.7,
    tier: 'modern',
    chef: 'Júlio Pereira',
    highlights: ['Modern Portuguese cuisine', 'Chef Júlio Pereira', 'Central Funchal'],
    featured: false,
  },
  {
    name: 'Konsai Sushi',
    slug: 'konsai-sushi',
    shortDescription:
      'The island’s benchmark Japanese kitchen — sushi and fusion plates on Avenida Zarco.',
    description: `Konsai holds the highest TheFork score among Funchal's Japanese restaurants. Sushi, sashimi and Japanese-fusion plates in a small room on Avenida Zarco, run with near-Michelin consistency.

Seats are limited — book days ahead in season.`,
    locationSlug: 'funchal',
    address: 'Avenida Zarco, Funchal',
    geoCoordinates: { lat: 32.6473196, lng: -16.9094741 },
    cuisine: 'Japanese',
    averagePrice: 33,
    googleRating: 4.8,
    tier: 'modern',
    highlights: ['Sushi & Japanese fusion', 'TheFork 9.6/10', 'Small room — book ahead'],
    featured: false,
  },
  {
    name: 'Tipografia',
    slug: 'tipografia',
    shortDescription:
      'Mediterranean fine plates in a former print shop on Rua das Pretas.',
    description: `Tipografia ("printing house") occupies an old typographic workshop near São Pedro. Mediterranean cuisine with a tasting format, an edited wine list and one of the most quietly stylish rooms in the centre.`,
    locationSlug: 'funchal',
    address: 'Rua das Pretas 8, Funchal',
    geoCoordinates: { lat: 32.64942, lng: -16.9103089 },
    cuisine: 'Mediterranean',
    averagePrice: 45,
    googleRating: 4.7,
    tier: 'modern',
    highlights: ['Former print shop', 'Mediterranean tasting plates', 'TheFork 9.4/10'],
    featured: false,
  },
  {
    name: 'Il Vivaldi',
    slug: 'il-vivaldi',
    shortDescription:
      'Intimate Italian-Mediterranean restaurant near the Municipal Garden, a TheFork favourite.',
    description: `Il Vivaldi is a small Italian-Mediterranean dining room a short walk from the Municipal Garden — handmade pastas, Atlantic fish and an all-Italian wine list. Long-running and consistently top-rated.`,
    locationSlug: 'funchal',
    address: 'Rua Conselheiro José Silvestre Ribeiro, Funchal',
    geoCoordinates: { lat: 32.6466103, lng: -16.9112921 },
    cuisine: 'Mediterranean',
    averagePrice: 27,
    googleRating: 4.7,
    tier: 'modern',
    highlights: ['Italian-Mediterranean kitchen', 'TheFork 9.4/10', 'Near Municipal Garden'],
    featured: true,
  },
  {
    name: 'Casa Velha',
    slug: 'casa-velha',
    shortDescription:
      'Mediterranean dinner in a traditional quinta house above the centre — quiet, candlelit, classic.',
    description: `Casa Velha ("old house") occupies a Madeiran quinta on Rua Imperatriz Dona Amélia, in the quiet residential ridge above the centre. Mediterranean menu, garden terrace in summer, dining rooms inside the old house in winter.

Note: this restaurant shares its name with the Casa Velha do Palheiro estate in São Gonçalo — they are different places.`,
    locationSlug: 'funchal',
    address: 'Rua Imperatriz Dona Amélia 69, Funchal',
    geoCoordinates: { lat: 32.6440049, lng: -16.9178224 },
    cuisine: 'Mediterranean',
    averagePrice: 22,
    googleRating: 4.7,
    tier: 'heritage',
    highlights: ['Traditional quinta house', 'Garden terrace', 'TheFork 9.4/10'],
    featured: false,
  },
  {
    name: 'Dona Amélia',
    slug: 'dona-amelia',
    shortDescription:
      'The island’s top TheFork score — Mediterranean fine dining inside a 19th-century quinta.',
    description: `Dona Amélia holds the highest TheFork rating in Funchal. The restaurant sits inside a 19th-century quinta on Rua Imperatriz Dona Amélia, serving Mediterranean cuisine with Portuguese produce in an intimate, softly lit setting.`,
    locationSlug: 'funchal',
    address: 'Rua Imperatriz Dona Amélia 83, Funchal',
    geoCoordinates: { lat: 32.6435, lng: -16.9188 },
    cuisine: 'Mediterranean',
    averagePrice: 40,
    googleRating: 4.85,
    tier: 'modern',
    highlights: ['TheFork 9.7/10', '19th-century quinta', 'Romantic dining'],
    featured: false,
  },
  {
    name: 'Terreiro',
    slug: 'terreiro',
    shortDescription:
      'Madeiran home cooking at neighbourhood prices on Rua Imperatriz Dona Amélia.',
    description: `Terreiro is the affordable end of the Imperatriz Dona Amélia restaurant row — straightforward Portuguese and Madeiran dishes, generous portions, local crowd. The kind of place residents actually use.`,
    locationSlug: 'funchal',
    address: 'Rua Imperatriz Dona Amélia 107, Funchal',
    geoCoordinates: { lat: 32.6430089, lng: -16.919797 },
    cuisine: 'Portuguese',
    averagePrice: 15,
    googleRating: 4.65,
    tier: 'heritage',
    highlights: ['Madeiran home cooking', 'Neighbourhood prices', 'Local crowd'],
    featured: false,
  },
  {
    name: 'Favila',
    slug: 'favila',
    shortDescription:
      'Small fusion tasting room in Santa Luzia — one of Funchal’s quiet cult tables.',
    description: `Favila is a compact chef-led restaurant in the Santa Luzia district, working a short fusion menu that changes with the market. Booking is essential — the room seats only a handful of tables.`,
    locationSlug: 'funchal',
    address: 'Rua de João de Deus, Santa Luzia, Funchal',
    geoCoordinates: { lat: 32.6515085, lng: -16.9055481 },
    cuisine: 'Fusion',
    averagePrice: 40,
    googleRating: 4.7,
    tier: 'modern',
    highlights: ['Chef-led tasting menu', 'Tiny dining room', 'TheFork 9.4/10'],
    featured: false,
  },
  {
    name: "Cris's Place",
    slug: 'criss-place',
    shortDescription:
      'International comfort food and warm service in the Casa Branca district.',
    description: `Cris's Place is an independent dining room on Rua da Casa Branca, between the Lido hotel zone and the centre. International menu — grilled meats, fish, vegetarian options — with a following built on personal service.`,
    locationSlug: 'funchal',
    address: 'Rua da Casa Branca, Funchal',
    geoCoordinates: { lat: 32.643199, lng: -16.9267469 },
    cuisine: 'International',
    averagePrice: 30,
    googleRating: 4.65,
    tier: 'modern',
    highlights: ['International menu', 'Personal service', 'Casa Branca district'],
    featured: false,
  },
  {
    name: 'Casa da Quinta Bistro and Winebar',
    slug: 'casa-da-quinta',
    shortDescription:
      'Bistro and wine bar inside the Quinta da Casa Branca estate — garden setting, Portuguese plates.',
    description: `Casa da Quinta is the bistro of Quinta da Casa Branca, a working estate and boutique manor hotel hidden behind the Lido district. Lunch in the garden among old trees, dinner in the wine bar — Portuguese menu, estate atmosphere.`,
    locationSlug: 'funchal',
    address: 'Rua da Casa Branca 7, Funchal',
    geoCoordinates: { lat: 32.6419421, lng: -16.9270683 },
    cuisine: 'Portuguese',
    averagePrice: 33,
    googleRating: 4.75,
    tier: 'modern',
    highlights: ['Inside Quinta da Casa Branca', 'Garden seating', 'Wine bar'],
    featured: false,
  },
  {
    name: 'Alfama',
    slug: 'alfama',
    shortDescription:
      'Portuguese classics inside Hotel Porto Mare — formal dining room, Atlantic fish, local wines.',
    description: `Alfama is the Portuguese restaurant of Hotel Porto Mare in the Lido resort zone. Traditional national repertoire — bacalhau, espetada, Madeiran wines — in a formal dining room with one of the highest TheFork scores on the island.`,
    locationSlug: 'funchal',
    address: 'Rua do Gorgulho 2, Hotel Porto Mare, Funchal',
    geoCoordinates: { lat: 32.637669, lng: -16.9326246 },
    cuisine: 'Portuguese',
    averagePrice: 30,
    googleRating: 4.8,
    tier: 'heritage',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/Hotel_Porto_Mare%2C_Funchal_-_Jan_2012_-_09.jpg/1920px-Hotel_Porto_Mare%2C_Funchal_-_Jan_2012_-_09.jpg',
    imageAttribution: 'Photo by Stephen Colebourne, CC BY 2.0, via Wikimedia Commons',
    highlights: ['Inside Hotel Porto Mare', 'Portuguese classics', 'TheFork 9.6/10'],
    featured: false,
  },
  {
    name: 'Chefe Steak House & Sea Basket',
    slug: 'chefe-steak-house',
    shortDescription:
      'Steaks and seafood baskets on Rua do Gorgulho — the Lido’s reliable grill.',
    description: `Chefe Steak House & Sea Basket serves the Lido hotel district with a split personality: charcoal-grilled steaks on one side, Atlantic seafood baskets on the other. Casual, busy, top-rated.`,
    locationSlug: 'funchal',
    address: 'Rua do Gorgulho, Funchal',
    geoCoordinates: { lat: 32.6363776, lng: -16.9319537 },
    cuisine: 'Portuguese',
    averagePrice: 25,
    googleRating: 4.8,
    tier: 'heritage',
    highlights: ['Charcoal steaks', 'Seafood baskets', 'Lido district'],
    featured: false,
  },
  {
    name: 'O Tapassol Terrace',
    slug: 'o-tapassol',
    shortDescription:
      'Traditional Madeiran dishes on a raised terrace in the Ajuda district.',
    description: `O Tapassol serves the traditional Madeiran repertoire — espetada on laurel skewers, milho frito, grilled limpets — from a covered terrace in Ajuda, above the Lido zone. Slightly off the main strip, which keeps it local.`,
    locationSlug: 'funchal',
    address: 'Rua Velha da Ajuda 12, Funchal',
    geoCoordinates: { lat: 32.6389, lng: -16.9369 },
    cuisine: 'Traditional',
    averagePrice: 29,
    googleRating: 4.65,
    tier: 'heritage',
    highlights: ['Terrace dining', 'Traditional Madeiran menu', 'Ajuda district'],
    featured: false,
  },
  {
    name: 'Il Basilico Funchal',
    slug: 'il-basilico',
    shortDescription:
      'Italian kitchen on the Lido seafront promenade — pasta, pizza and ocean air.',
    description: `Il Basilico is the Lido's long-standing Italian address, now on the Passeio Público Marítimo seafront promenade. Straightforward Italian cooking — fresh pasta, risotto, wood-fired pizza — with sea views.`,
    locationSlug: 'funchal',
    address: 'Passeio Público Marítimo, Lido, Funchal',
    geoCoordinates: { lat: 32.6368942, lng: -16.9336469 },
    cuisine: 'Italian',
    averagePrice: 25,
    googleRating: 4.65,
    tier: 'modern',
    highlights: ['Seafront promenade', 'Wood-fired pizza', 'TheFork 9.3/10'],
    featured: false,
  },
  {
    name: 'Quinta Bela Vista Restaurant',
    slug: 'quinta-bela-vista',
    shortDescription:
      'Fine Mediterranean dining inside the Quinta da Bela Vista manor hotel.',
    description: `The restaurant of Quinta da Bela Vista, a Design Hotels manor above the west end of Funchal. Mediterranean fine dining served in the estate's old dining rooms and veranda — one of the highest TheFork scores in the city.`,
    locationSlug: 'funchal',
    address: 'Caminho do Avista Navios 4, Funchal',
    geoCoordinates: { lat: 32.647607, lng: -16.9359914 },
    cuisine: 'Mediterranean',
    averagePrice: 40,
    googleRating: 4.85,
    tier: 'luxury',
    highlights: ['Manor hotel dining', 'Estate gardens', 'TheFork 9.7/10'],
    featured: false,
  },
  {
    name: 'Quinta Estação',
    slug: 'quinta-estacao',
    shortDescription:
      'Mediterranean menu inside a manor quinta in Santo António — Funchal’s garden-dining classic.',
    description: `Quinta Estação sits inside a walled estate on the hillside of Santo António, above the city. The kitchen runs Mediterranean with Madeiran touches; the draw is dinner under the estate's old trees.`,
    locationSlug: 'funchal',
    address: 'Estrada Comandante Camacho de Freitas, Santo António, Funchal',
    geoCoordinates: { lat: 32.6595379, lng: -16.9415296 },
    cuisine: 'Mediterranean',
    averagePrice: 25,
    googleRating: 4.8,
    tier: 'heritage',
    highlights: ['Walled quinta estate', 'Garden dining', 'TheFork 9.6/10'],
    featured: false,
  },
  {
    name: 'Espettus',
    slug: 'espettus',
    shortDescription:
      'The espetada specialist on Estrada Monumental — beef skewers grilled the Madeiran way.',
    description: `Espettus is dedicated to Madeira's signature dish: espetada — beef cubes rubbed with garlic and salt, skewered on laurel wood and grilled. Casual, crowded, one of the best-rated grill rooms on the hotel strip.`,
    locationSlug: 'funchal',
    address: 'Estrada Monumental, Funchal',
    geoCoordinates: { lat: 32.6392057, lng: -16.9468555 },
    cuisine: 'Portuguese',
    averagePrice: 20,
    googleRating: 4.8,
    tier: 'heritage',
    highlights: ['Espetada specialist', 'Laurel-wood grill', 'TheFork 9.6/10'],
    featured: false,
  },
  {
    name: 'MOTYA cafe',
    slug: 'motya-cafe',
    shortDescription:
      'Specialty coffee and mochi in Funchal’s old town — the island’s cult café.',
    description: `MOTYA is a tiny specialty coffee shop on Rua João Tavira in the old town: single-origin espresso, filter brews and house-made mochi. The closest thing Funchal has to third-wave coffee culture.`,
    locationSlug: 'funchal',
    address: 'Rua João Tavira 8, Funchal',
    geoCoordinates: { lat: 32.6483991, lng: -16.9088937 },
    cuisine: 'Cafe',
    averagePrice: 15,
    tier: 'modern',
    highlights: ['Specialty coffee', 'House-made mochi', 'Old Town'],
    featured: true,
  },
  {
    name: 'Laranjinha Bistrô',
    slug: 'laranjinha-bistro',
    shortDescription:
      'The highest TheFork score in the collection — grilled fish and meat in Caniço.',
    description: `Laranjinha is a grill bistrô on Estrada José Avelino Pinto in Caniço, east of Funchal. Charcoal-grilled fish and meat, no theatrics, and the top TheFork rating of the whole list.`,
    locationSlug: 'canico-de-baixo',
    address: 'Estrada José Avelino Pinto, Caniço',
    geoCoordinates: { lat: 32.6472475, lng: -16.827324 },
    cuisine: 'Grilled',
    averagePrice: 22,
    googleRating: 4.9,
    tier: 'heritage',
    highlights: ['TheFork 9.8/10', 'Charcoal grill', 'Caniço'],
    featured: false,
  },
  {
    name: 'Vista Balancal',
    slug: 'vista-balancal',
    shortDescription:
      'Clubhouse restaurant of Palheiro Golf — Mediterranean plates above the bay.',
    description: `Vista Balancal is the panoramic restaurant of Palheiro Golf in the hills of São Gonçalo. Mediterranean menu on the clubhouse terrace — the view down to Funchal bay is the real signature.`,
    locationSlug: 'funchal',
    address: 'Rua do Balancal 29, Palheiro Golf, São Gonçalo',
    geoCoordinates: { lat: 32.6542834, lng: -16.8661916 },
    cuisine: 'Mediterranean',
    averagePrice: 25,
    googleRating: 4.75,
    tier: 'luxury',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/A_light_swing_in_the_bay_%2841520001864%29.jpg/1920px-A_light_swing_in_the_bay_%2841520001864%29.jpg',
    imageAttribution: 'Photo by Pedro, CC BY 2.0, via Wikimedia Commons',
    highlights: ['Palheiro Golf clubhouse', 'Bay panorama', 'TheFork 9.5/10'],
    featured: false,
  },
  {
    name: 'Rose Garden',
    slug: 'rose-garden',
    shortDescription:
      'International menu in the Piornais area, west end of the Funchal hotel strip.',
    description: `Rose Garden serves the western end of the Estrada Monumental hotel zone — a mixed international menu with Portuguese staples, walk-in friendly and family-oriented.`,
    locationSlug: 'funchal',
    address: 'Estrada Monumental, Piornais, Funchal',
    geoCoordinates: { lat: 32.6414886, lng: -16.9455135 },
    cuisine: 'International',
    averagePrice: 35,
    googleRating: 4.75,
    tier: 'modern',
    highlights: ['Hotel strip west end', 'International menu', 'TheFork 9.5/10'],
    featured: false,
  },
  {
    name: 'Come Together',
    slug: 'come-together',
    shortDescription:
      'Portuguese kitchen on Estrada Monumental — sharing plates and a loyal following.',
    description: `Come Together sits on the Lido stretch of Estrada Monumental. Portuguese dishes built for sharing — petiscos, grilled fish, local wines — in a relaxed room that works equally well for couples and groups.`,
    locationSlug: 'funchal',
    address: 'Estrada Monumental 199, Funchal',
    geoCoordinates: { lat: 32.6383361, lng: -16.9341007 },
    cuisine: 'Portuguese',
    averagePrice: 25,
    googleRating: 4.75,
    tier: 'modern',
    highlights: ['Sharing plates', 'Lido strip', 'TheFork 9.5/10'],
    featured: false,
  },
  {
    name: 'FX Restaurant & Sports Bar',
    slug: 'fx-restaurant',
    shortDescription:
      'Sports bar and international grill on Rua das Fontes — casual, central, lively.',
    description: `FX is the centre's sports-bar option: screens for match days, burgers, steaks and salads at international-standard prices. More relaxed than the TheFork neighbours — a good fallback when everywhere else is booked.`,
    locationSlug: 'funchal',
    address: 'Rua das Fontes, Funchal',
    geoCoordinates: { lat: 32.64666, lng: -16.911154 },
    cuisine: 'International',
    averagePrice: 25,
    googleRating: 4.65,
    tier: 'modern',
    highlights: ['Sports bar', 'International grill', 'City centre'],
    featured: false,
  },
  {
    name: 'O Recante',
    slug: 'o-recante',
    shortDescription:
      'Family-run Portuguese table in Caniçal — grilled fish straight off the harbour.',
    description: `O Recante is a family restaurant in Caniçal, the fishing village at Madeira's eastern tip. The menu is whatever came off the boats — espada, grilled limpets, tuna — plus the standard espetada. Worth the drive after the São Lourenço hike.`,
    address: 'Estrada de São Lourenço 67, Caniçal',
    geoCoordinates: { lat: 32.7427037, lng: -16.739038 },
    cuisine: 'Portuguese',
    averagePrice: 24,
    googleRating: 4.7,
    tier: 'heritage',
    highlights: ['Fishing village table', 'Fresh Atlantic catch', 'After São Lourenço hike'],
    featured: false,
  },
  {
    name: 'Bago',
    slug: 'bago',
    shortDescription:
      'Contemporary Portuguese kitchen in Arco da Calheta — the west coast’s quality address.',
    description: `Bago sits on the regional road through Arco da Calheta, on the sunny southwest slope. Modern Portuguese cooking with island produce — the strongest kitchen on the west coast outside the hotel circuit.`,
    address: 'Estrada Regional 223 nº136, Arco da Calheta',
    geoCoordinates: { lat: 32.7217558, lng: -17.1570082 },
    cuisine: 'Portuguese',
    averagePrice: 40,
    googleRating: 4.55,
    tier: 'heritage',
    highlights: ['West coast kitchen', 'Island produce', 'Arco da Calheta'],
    featured: false,
  },
  {
    name: 'RAZÃO por Octávio Freitas',
    slug: 'razao',
    shortDescription:
      'Octávio Freitas’s flagship in Calheta — tasting menus rooted in Madeiran memory.',
    description: `RAZÃO is the signature restaurant of chef Octávio Freitas in Calheta — tasting menus that rework Madeiran ingredients and food memory through modern technique. The island's reference point for contemporary cuisine outside the Michelin bracket.`,
    address: 'Caminho do Lombo do Salão 13, Calheta',
    geoCoordinates: { lat: 32.7229779, lng: -17.1784963 },
    cuisine: 'International',
    averagePrice: 65,
    googleRating: 4.65,
    tier: 'heritage',
    chef: 'Octávio Freitas',
    highlights: ['Chef Octávio Freitas', 'Tasting menu', 'Madeiran memory cuisine'],
    featured: false,
  },
  {
    name: 'Bar Mare',
    slug: 'bar-mare',
    shortDescription:
      'Seafront snack bar on the Caniço de Baixo promenade — coffee, drinks and ocean.',
    description: `Bar Mare is the simple pleasure entry of the list: a snack bar on the Caniço de Baixo seafront promenade. Coffee, poncha, toasties and a view straight into the Atlantic — a pause on the coastal walk rather than a destination dinner.`,
    locationSlug: 'canico-de-baixo',
    address: 'Rua Dom Francisco Santana, Caniço de Baixo',
    geoCoordinates: { lat: 32.6439035, lng: -16.8296344 },
    cuisine: 'Bar',
    averagePrice: 15,
    tier: 'modern',
    highlights: ['Seafront promenade', 'Poncha & coffee', 'Coastal walk stop'],
    featured: true,
  },
  {
    name: "Il Gallo d'Oro",
    slug: 'il-gallo-doro',
    shortDescription:
      'Two Michelin stars plus a Green Star — Madeira’s fine dining flagship at The Cliff Bay.',
    description: `Il Gallo d'Oro is the gastronomic flagship of Madeira: two Michelin stars and a Green Star under chef Benoît Sinthon, inside PortoBay's The Cliff Bay hotel on the cliff line west of the centre.

The cuisine is French classical school fused with Atlantic aquaculture — fish and shellfish from the surrounding ocean, vegetables, herbs and fruit harvested daily from the chef's private organic garden. Tasting menus only; book weeks ahead and allow a full evening.`,
    locationSlug: 'funchal',
    address: 'The Cliff Bay, Estrada Monumental 147, Funchal',
    geoCoordinates: { lat: 32.6392673, lng: -16.9257335 },
    cuisine: 'French / Fine Dining',
    averagePrice: 150,
    michelinStars: 2,
    michelinGreenStar: true,
    tier: 'michelin',
    chef: 'Benoît Sinthon',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/The_grand_Cliff_Bay_Hotel_in_Funchal%2C_Madeira_Island%2C_Portugal.jpg/1920px-The_grand_Cliff_Bay_Hotel_in_Funchal%2C_Madeira_Island%2C_Portugal.jpg',
    imageAttribution: 'Photo by uggboy, CC BY 2.0, via Wikimedia Commons',
    highlights: ['2★ Michelin + Green Star', 'Chef Benoît Sinthon', 'Own organic garden'],
    featured: true,
  },
  {
    name: 'William Restaurant',
    slug: 'william-restaurant',
    shortDescription:
      'One Michelin star inside Belmond Reid’s Palace — modern Portuguese gastronomy, legendary setting.',
    description: `William is the Michelin-starred restaurant of Belmond Reid's Palace, the 1891 grande dame on the cliffs west of Funchal. Chef Luís Pestana reinterprets Portuguese gastronomy — Atlantic fish and shellfish, island game — through modern technique.

The most atmospheric dining room on the island: dress code in the evening, terrace aperitifs over the sea.`,
    locationSlug: 'funchal',
    address: "Belmond Reid's Palace, Estrada Monumental 139, Funchal",
    geoCoordinates: { lat: 32.640614, lng: -16.9239058 },
    cuisine: 'Portuguese / Fine Dining',
    averagePrice: 130,
    michelinStars: 1,
    tier: 'michelin',
    chef: 'Luís Pestana',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Reids_Hotel_Funchal_Seaside_2016.JPG/1920px-Reids_Hotel_Funchal_Seaside_2016.JPG',
    imageAttribution: 'Photo by Stefan Bellini, CC0, via Wikimedia Commons',
    highlights: ['1★ Michelin', 'Chef Luís Pestana', "Reid's Palace since 1891"],
    featured: true,
  },
  {
    name: 'Nikkei',
    slug: 'nikkei',
    shortDescription:
      'Nikkei fine dining on the 16th floor of Savoy Palace — 360° views over Funchal and the ocean.',
    description: `Nikkei occupies The Reserve floor of Savoy Palace, 16 storeys above the city — the highest restaurant view on the island. Japanese precision meets Peruvian flavour: ceviches, tiraditos, robata grill, sake list.

Come for sunset and stay through dinner — the 360° panorama alone justifies the booking.`,
    locationSlug: 'funchal',
    address: 'Savoy Palace, Avenida do Infante 25, Funchal',
    geoCoordinates: { lat: 32.6436598, lng: -16.9205632 },
    cuisine: 'Japanese / Peruvian',
    averagePrice: 80,
    tier: 'luxury',
    chef: 'Miguel Bértolo',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Savoy_Palace%2C_Funchal_-_2022-02-14_-_DSC07846.jpg/1920px-Savoy_Palace%2C_Funchal_-_2022-02-14_-_DSC07846.jpg',
    imageAttribution: 'Photo by Paulo SP, CC BY-SA 4.0, via Wikimedia Commons',
    highlights: ['360° rooftop view', 'Nikkei fusion', 'Savoy Palace 16th floor'],
    featured: true,
  },
  {
    name: 'Avista Restaurant & Lounges',
    slug: 'avista',
    shortDescription:
      'Michelin-recommended cliffside dining — Josper grill, sharing plates, Asian corner.',
    description: `Avista hangs on the cliff at Les Suites at The Cliff Bay — the sister restaurant of Il Gallo d'Oro, supervised by the same chef, Benoît Sinthon. The concept is sharing: Mediterranean plates, Josper-grilled cuts and a separate Asian menu (Avista Ásia) at the lounge end.

Michelin-recommended and far easier to book than the two-star across the terrace.`,
    locationSlug: 'funchal',
    address: 'Estrada Monumental 191, Funchal',
    geoCoordinates: { lat: 32.6393886, lng: -16.9256166 },
    cuisine: 'Mediterranean / Asian',
    averagePrice: 65,
    michelinRecommended: true,
    tier: 'luxury',
    chef: 'Benoît Sinthon (supervision)',
    highlights: ['Michelin Recommended', 'Josper grill', 'Cliff-edge terrace'],
    featured: true,
  },
  {
    name: 'Oxalis Restaurant',
    slug: 'oxalis',
    shortDescription:
      'Michelin-recommended fine dining inside Casa Velha do Palheiro — Relais & Châteaux.',
    description: `Oxalis is the dining room of Casa Velha do Palheiro, a Relais & Châteaux estate above São Gonçalo — formal service, classic technique, produce from the estate's own gardens and the famous Palheiro parkland around it.

Under chef Gonçalo Bita Bota it holds Michelin Recommended status; the setting inside the 1804 hunting lodge is unmatched.`,
    locationSlug: 'funchal',
    address: 'Casa Velha do Palheiro, Rua da Estalagem 23, São Gonçalo',
    geoCoordinates: { lat: 32.6580699, lng: -16.8673664 },
    cuisine: 'Fine Dining',
    averagePrice: 85,
    michelinRecommended: true,
    tier: 'luxury',
    chef: 'Gonçalo Bita Bota',
    highlights: ['Michelin Recommended', 'Relais & Châteaux', '1804 estate house'],
    featured: true,
  },
  {
    name: 'Socalco Nature Calheta',
    slug: 'socalco-nature',
    shortDescription:
      'Farm-to-table dining on the agricultural terraces of Calheta — menu set by the morning harvest.',
    description: `Socalco Nature is chef Octávio Freitas's farm-to-table project on the terraced slopes of Calheta. The menu is written each day around what the estate beds and island farms delivered that morning — the purest expression of Madeiran seasonal eating.`,
    address: 'Estrada Regional 223, Calheta',
    geoCoordinates: { lat: 32.7229506, lng: -17.1783299 },
    cuisine: 'Farm-to-table',
    averagePrice: 70,
    tier: 'heritage',
    chef: 'Octávio Freitas',
    highlights: ['Farm-to-table', 'Daily harvest menu', 'Agricultural terraces'],
    featured: false,
  },
  {
    name: '1811 Bistro',
    slug: '1811-bistro',
    shortDescription:
      'Wine pairing inside the historic Blandy’s cellars — eno-gastronomy on Avenida Arriaga.',
    description: `1811 Bistro sits inside Blandy's Wine Lodge on Avenida Arriaga — the beating heart of Madeira wine since 1811. The format is eno-gastronomic: Portuguese dishes built around pairings from the Blandy cellars beneath your feet.

Combine with the lodge's cellar tour for the full Madeira-wine afternoon.`,
    locationSlug: 'funchal',
    address: "Blandy's Wine Lodge, Avenida Arriaga 28, Funchal",
    geoCoordinates: { lat: 32.647827, lng: -16.9105783 },
    cuisine: 'Wine / Portuguese',
    averagePrice: 60,
    tier: 'heritage',
    heroImage:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Blandy%27s_Wine_Lodge_-_Funchal_03.jpg/1920px-Blandy%27s_Wine_Lodge_-_Funchal_03.jpg',
    imageAttribution: 'Photo by H. Zell, CC BY-SA 3.0, via Wikimedia Commons',
    highlights: ["Inside Blandy's cellars", 'Madeira wine pairings', 'Est. 1811'],
    featured: false,
  },
  {
    name: 'Quinta do Furão',
    slug: 'quinta-do-furao',
    shortDescription:
      'Regional Madeiran dining on the cliff edge of Santana — the north coast’s iconic table.',
    description: `Quinta do Furão is the restaurant of the eponymous wine estate hotel on the cliffs of Santana, on Madeira's north coast. Regional Portuguese cooking — espetada, espadarte, fava toninha — in a dining room and terrace that hang directly above the Atlantic.

The definitive lunch stop on the north-coast circuit: arrive via the coastal road, leave before dark on mountain routes.`,
    address: 'Estrada do Aeroporto, Santana',
    geoCoordinates: { lat: 32.824085, lng: -16.8849293 },
    cuisine: 'Regional / Portuguese',
    averagePrice: 50,
    tier: 'heritage',
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/f/ff/Quinta_do_Fur%C3%A3o_-_Ilha_da_Madeira_-_Portugal_%28116780654%29.jpg',
    imageAttribution: 'Photo by Vitor Oliveira, CC BY-SA 2.0, via Wikimedia Commons',
    highlights: ['Cliff-edge dining', 'North coast drive', 'Wine estate hotel'],
    featured: false,
  },
]

async function seedRestaurants(): Promise<void> {
  const payload = await getPayload({ config })

  const locations = await payload.find({ collection: 'locations', limit: 100 })
  const locationBySlug = new Map(locations.docs.map((l) => [l.slug, l.id]))

  let okCount = 0

  for (const restaurant of restaurants) {
    const { locationSlug, ...rest } = restaurant
    const locationId = locationSlug ? locationBySlug.get(locationSlug) : undefined

    const data = {
      ...rest,
      ...(locationId ? { location: locationId } : {}),
      status: 'published' as const,
    }

    const existing = await payload.find({
      collection: 'restaurants',
      where: { slug: { equals: restaurant.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({ collection: 'restaurants', id: existing.docs[0].id, data })
    } else {
      await payload.create({ collection: 'restaurants', data })
    }

    okCount++
    console.log(`OK restaurant ${restaurant.slug}`)
  }

  console.log(`Done. OK: ${okCount}`)
}

seedRestaurants()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding restaurants:', error)
    process.exit(1)
  })
