// Unique SEO copy per escape page. Placeholders are filled from the
// `cities` collection doc at render time: {name}, {airportCode},
// {duration} ("3h 30m"), {price} ("27") and {currencySymbol} ("€").
export type EscapeCopy = {
  meta: string
  paragraphs: string[]
}

export const ESCAPE_SEO: Record<string, EscapeCopy> = {
  lisbon: {
    meta: 'Direct Lisbon → Madeira flights in ~{duration}, from {currencySymbol}{price}. The island is Portugal\'s quiet luxury escape — book your sanctuary.',
    paragraphs: [
      'From Lisbon, Madeira is closer than most weekend trips. TAP Air Portugal, easyJet and Ryanair fly direct from Humberto Delgado ({airportCode}) to Funchal (FNC) in about {duration}, with one-way fares often starting at {currencySymbol}{price}. Several departures a day mean you can leave after lunch and swim in the Atlantic before dinner.',
      'Lisbon summers push past 35°C; Madeira holds a gentler 24–26°C thanks to the ocean breeze. In winter the contrast flips: while the capital turns grey and damp, the island stays at +20°C with blue-sky mornings. For Lisboetas, October to May is the sweet spot — and spring brings the Flower Festival.',
      'Madeira is where Portugal keeps its wild side. Instead of resort strips you get UNESCO-listed laurel forest, natural volcanic pools in Porto Moniz and levada paths that walk above the clouds. It is quiet luxury in the truest sense: dramatic nature, honest food and space to breathe.',
      'Book your sanctuary direct — curated ocean-front stays, transparent prices, no middlemen between you and the island.',
    ],
  },
  porto: {
    meta: 'Direct Porto → Madeira flights in ~{duration}, from {currencySymbol}{price}. Trade Atlantic drizzle for eternal spring — book your quiet luxury sanctuary.',
    paragraphs: [
      'Porto\'s Francisco Sá Carneiro airport ({airportCode}) connects to Funchal (FNC) in about {duration} on direct easyJet, Ryanair and TAP flights, with fares from around {currencySymbol}{price} one way. It is the easiest winter-sun escape in Portugal — no connections, no stress.',
      'If you know Porto\'s Atlantic drizzle and long grey winters, Madeira feels like switching planets: +20°C in January, ocean you can actually swim in, and sunshine that shows up almost every day. November to April is when the contrast is sharpest and flights are cheapest.',
      'The island trades flat promenades for drama: levada trails carved into cliffs, natural lava pools, banana terraces and a laurel forest older than most cities. Quiet luxury here means a private terrace over the ocean, not a lobby full of tourists.',
      'Book a sanctuary on madeirabook — direct booking with the people who run the stays, honest prices, no mass tourism.',
    ],
  },
  london: {
    meta: 'Direct London → Madeira flights in ~{duration}, from {currencySymbol}{price}. Swap grey skies for +20°C ocean air — book a quiet luxury sanctuary.',
    paragraphs: [
      'London Gatwick ({airportCode}) runs direct flights to Funchal (FNC) on easyJet, British Airways and TUI in about {duration}, with one-way fares from around {currencySymbol}{price}. Leave after a morning meeting and you can be watching the sunset over the Atlantic the same evening.',
      'When London sits at 6°C with the sky the colour of wet concrete, Madeira holds +20°C and ocean light. Winter (November–March) is the classic escape window — cheap fares, empty levada trails, and New Year\'s fireworks over Funchal bay that rival any capital\'s.',
      'Madeira is quiet luxury for people tired of curated crowds: no strip of identical resorts, just cliff-top villages, natural swimming pools carved by lava, and a laurel forest that predates the country itself. The island rewards early risers and slow walkers.',
      'Book your sanctuary direct on madeirabook — curated stays, honest prices, none of the middlemen. Your escape starts before you board.',
    ],
  },
  manchester: {
    meta: 'Direct Manchester → Madeira flights in ~{duration}, from {currencySymbol}{price}. Eternal spring, no mass tourism — book your quiet luxury escape.',
    paragraphs: [
      'Manchester Airport ({airportCode}) flies direct to Funchal (FNC) in about {duration} on Jet2, easyJet and Ryanair, with fares from around {currencySymbol}{price} one way. It is one of the longest direct hops the island offers — and still shorter than a train to London on a bad day.',
      'Manchester sees roughly 140 rainy days a year. Madeira sees almost none between May and September, and even its "rainy" winter sits at +20°C. The best value window is November to February: low fares, warm ocean, and the island at its greenest.',
      'This is the anti-package-holiday island. Instead of wristbands and buffets you get cliff-top pools, whale watching on a quiet boat, espetada cooked over laurel wood and levada walks where the only sound is water. Quiet luxury, honestly priced.',
      'Book a sanctuary direct — no middlemen, no hidden fees. Just you, the Atlantic and a week that feels like a month.',
    ],
  },
  edinburgh: {
    meta: 'Direct Edinburgh → Madeira flights in ~{duration}, from {currencySymbol}{price}. Trade the northern dark for Atlantic light — book a sanctuary.',
    paragraphs: [
      'From Edinburgh ({airportCode}), Jet2 flies direct to Funchal (FNC) in about {duration}, with fares from around {currencySymbol}{price} one way. It is Scotland\'s cleanest line to real winter warmth — no Heathrow connections, no overnight layovers.',
      'When Edinburgh goes dark at half past three in December, Madeira is still on +20°C and eight hours of sun. January to March is the sweet spot for Scots: the island is quiet, the ocean is swimmable and the levadas are empty.',
      'If you love Scotland\'s drama but not its weather, Madeira is the same landscape philosophy at +15 degrees warmer — cliffs, mist, green mountains, ocean. Add natural lava pools, subtropical gardens and food built on the catch of the day, and you have quiet luxury without the performance.',
      'Book your sanctuary on madeirabook — curated stays booked direct, honest prices, no mass tourism.',
    ],
  },
  paris: {
    meta: 'Direct Paris → Madeira flights in ~{duration}, from {currencySymbol}{price}. From Haussmann grey to Atlantic green — book a quiet luxury escape.',
    paragraphs: [
      'Paris Charles de Gaulle ({airportCode}) connects to Funchal (FNC) in about {duration} on easyJet and Transavia, with one-way fares from around {currencySymbol}{price}. It is the shortest line between the Parisian grind and genuine subtropical air.',
      'Parisian winters are beautiful for a week and grey for four months. Madeira answers with +20°C, ocean pools and a spring that arrives in January. Autumn and winter are also when fares drop and the island exhales — the best season for a quiet escape.',
      'Parisians who prefer a hidden courtyard to a boulevard will recognise Madeira\'s rhythm: a laurel forest older than Notre-Dame, tiny wine lodges, espetada under the vines, levada paths with nobody on them. Quiet luxury, the way the French understand it.',
      'Book your sanctuary direct on madeirabook — curated ocean-front stays, transparent prices, no middlemen.',
    ],
  },
  frankfurt: {
    meta: 'Direct Frankfurt → Madeira flights in ~{duration}, from {currencySymbol}{price}. The exhale after the trade fair — book your quiet luxury sanctuary.',
    paragraphs: [
      'Frankfurt Airport ({airportCode}) runs direct Lufthansa and Condor flights to Funchal (FNC) in about {duration}, with fares from around {currencySymbol}{price} one way. For Germany\'s busiest hub, it is one of the easiest escapes into genuine quiet.',
      'Frankfurt\'s winter is business-grey: fog, 4°C, dark by five. Madeira counters with +20°C, blooming flowers in January and ocean light until dinner. December to March is peak contrast — and the island\'s best-kept secret is that summer here is never too hot.',
      'After the trade-fair treadmill, Madeira offers a different kind of order: levada paths that keep perfect contour lines for 2,500 km, natural pools cleaned by the tide, and dinners where the fish was caught that morning. Quiet luxury as the Germans like it — quality without noise.',
      'Book a sanctuary direct on madeirabook — curated stays, honest prices, direct contact with the people who run them.',
    ],
  },
  munich: {
    meta: 'Direct Munich → Madeira flights in ~{duration}, from {currencySymbol}{price}. From Alpine cold to ocean pools — book a quiet luxury escape.',
    paragraphs: [
      'Munich Airport ({airportCode}) flies direct to Funchal (FNC) on Lufthansa and Condor in about {duration}, with fares from around {currencySymbol}{price} one way. Bavaria\'s most civilised escape route runs straight to the Atlantic.',
      'While Munich waits out Föhn headaches and minus temperatures, Madeira sits at +20°C under a sky that stays blue for months. October to April is when Münchners get the most from the island — winter warmth, empty trails and the flower displays arriving early.',
      'Bavarians know mountains; Madeira offers the same vertical world wrapped in ocean. Levada hikes start above the clouds and end at natural lava pools. Dinner is espetada over laurel wood, not a tent with 6,000 strangers. Quiet luxury — mountain DNA, island pace.',
      'Book your sanctuary direct — curated stays, transparent prices, no mass tourism. The Atlantic version of a Berghütte, with better weather.',
    ],
  },
  zurich: {
    meta: 'Direct Zurich → Madeira flights in ~{duration}, from {currencySymbol}{price}. Swiss calm meets Atlantic warmth — book a quiet luxury sanctuary.',
    paragraphs: [
      'Zurich Airport ({airportCode}) connects to Funchal (FNC) in about {duration} on Edelweiss Air, with fares from around {currencySymbol}{price} one way. One direct hop trades the lake for the ocean.',
      'Zurich does winter elegantly — and then keeps doing it until April. Madeira answers with +20°C, jacaranda trees in bloom and water warm enough to swim most of the year. The best window is November to March, when Switzerland fogs in and the island opens up.',
      'Swiss travellers appreciate quality that does not announce itself — which is Madeira\'s entire philosophy. Cliff-side quintas, levada paths maintained for centuries, natural pools carved by lava, wine made on terraces you can only reach on foot. Quiet luxury as a landscape.',
      'Book a sanctuary direct on madeirabook — curated stays, transparent prices, no intermediaries.',
    ],
  },
  vienna: {
    meta: 'Direct Vienna → Madeira flights in ~{duration}, from {currencySymbol}{price}. From imperial fog to eternal spring — book your quiet luxury escape.',
    paragraphs: [
      'Vienna Airport ({airportCode}) flies direct to Funchal (FNC) on Austrian Airlines in about {duration}, with fares from around {currencySymbol}{price} one way. The Habsburg winter has a direct antidote, and it lands on a runway built over the sea.',
      'Vienna\'s November fog can hold for weeks. Madeira\'s November looks like a Viennese May — +20°C, gardens in bloom, ocean swims after lunch. December to February offers the sharpest contrast and the softest fares.',
      'Vienna understands slow pleasure: coffee that takes an afternoon, walks that end somewhere worth seeing. Madeira is that temperament made landscape — levada strolls, botanical gardens, poncha at a village bar, a laurel forest that has been growing since before Schönbrunn existed.',
      'Book your sanctuary on madeirabook — quiet luxury, direct booking, honest prices.',
    ],
  },
  amsterdam: {
    meta: 'Direct Amsterdam → Madeira flights in ~{duration}, from {currencySymbol}{price}. Canals for cliffs — book a quiet luxury Atlantic sanctuary.',
    paragraphs: [
      'Schiphol ({airportCode}) runs direct Transavia and TUI fly flights to Funchal (FNC) in about {duration}, with fares from around {currencySymbol}{price} one way. Amsterdam\'s fastest route to real warmth skips the Mediterranean entirely.',
      'Dutch winters are famously mild and famously miserable — 7°C, wind, and a sky that never quite commits to daylight. Madeira trades that for +20°C and sun that actually shows up. October to April is the classic Dutch escape window.',
      'The Dutch instinct for the honest version of things finds its match here: no mega-resorts, just cliff villages, natural pools, levada trails and fish restaurants with chalkboard menus. Quiet luxury — or as Amsterdam would put it, just really well made.',
      'Book a sanctuary direct — curated ocean-front stays, honest prices, no middlemen.',
    ],
  },
  brussels: {
    meta: 'Direct Brussels → Madeira flights in ~{duration}, from {currencySymbol}{price}. The EU quarter\'s antidote — book a quiet luxury escape.',
    paragraphs: [
      'Brussels Airport ({airportCode}) connects to Funchal (FNC) in about {duration} on TUI fly Belgium and Brussels Airlines, with fares from around {currencySymbol}{price} one way. The quarter\'s best exit strategy is a direct line to the Atlantic.',
      'Brussels\' winter is a long grey negotiation with the sky. Madeira ends the talks at +20°C with actual sun, from November through March — precisely when fares drop and the island is at its quietest.',
      'Belgians who have done the Ardennes a hundred times will find the same forest instinct at Atlantic scale: a laurel forest that predates Belgium, levada trails, hidden pools, and restaurants where the menu depends on the morning\'s catch. Quiet luxury, no conference lanyards.',
      'Book your sanctuary on madeirabook — curated stays booked direct, transparent prices, no mass tourism.',
    ],
  },
  madrid: {
    meta: 'Direct Madrid → Madeira flights in ~{duration}, from {currencySymbol}{price}. Escape the summer furnace for Atlantic spring — book a sanctuary.',
    paragraphs: [
      'From Madrid-Barajas ({airportCode}), Funchal (FNC) is about {duration} away on direct Iberia services, with frequent one-stop options via Lisbon on TAP. Fares start around {currencySymbol}{price} one way — Madrid\'s cheapest route to a swimmable winter.',
      'Madrid\'s August furnace sends the whole city to the coast; Madeira answers with a permanent 24–26°C and ocean pools that never feel crowded. In winter the roles flip — Madrid drops to single digits while the island holds +20°C.',
      'Madrileños who think they know islands will find Madeira is the un-Ciudad: no chiringuito rows, just laurel forest, cliff villages, levada walks above the clouds and espetada nights. Quiet luxury — the interior Spain understands, transplanted to the Atlantic.',
      'Book your sanctuary direct on madeirabook — curated stays, honest prices, no middlemen.',
    ],
  },
  barcelona: {
    meta: 'Direct Barcelona → Madeira flights in ~{duration}, from {currencySymbol}{price}. Trade Mediterranean crowds for Atlantic quiet — book a sanctuary.',
    paragraphs: [
      'El Prat ({airportCode}) reaches Funchal (FNC) in about {duration} on seasonal direct services, with easy one-stop connections via Lisbon or Porto on Vueling and TAP. Fares start around {currencySymbol}{price} one way.',
      'Barcelona\'s summer is a beautiful traffic jam: 30°C, humidity and every cove full. Madeira holds the same temperature without the crowds — and in winter, when the city turns cool and the beaches empty, the island still offers +20°C and real swimming.',
      'For a city drowning in its own popularity, Madeira is the counter-argument: cliff trails where you meet nobody for an hour, lava pools instead of beach clubs, village restaurants instead of tasting menus. Quiet luxury the Mediterranean forgot how to do.',
      'Book a sanctuary direct — curated ocean-front stays, transparent prices, no mass tourism.',
    ],
  },
  dublin: {
    meta: 'Direct Dublin → Madeira flights in ~{duration}, from {currencySymbol}{price}. Swap the drizzle for eternal spring — book your quiet luxury escape.',
    paragraphs: [
      'Dublin Airport ({airportCode}) flies direct to Funchal (FNC) on Ryanair in about {duration}, with fares from around {currencySymbol}{price} one way. Ireland\'s simplest line to winter warmth requires exactly one flight and zero patience.',
      'The Irish drizzle has its charms; so does escaping it. Madeira offers +20°C in January, ocean swims and sun that lasts past 6pm — while Dublin is still deciding whether it rained or just threatened to. October to April is the window.',
      'Ireland and Madeira share cliff-and-green DNA, but the island adds what Ireland cannot: warmth, lava pools, subtropical gardens and a laurel forest UNESCO protects. Quiet luxury for people who already love dramatic coastlines — just with swimming.',
      'Book your sanctuary on madeirabook — curated stays, direct booking, honest prices, no mass tourism.',
    ],
  },
}
