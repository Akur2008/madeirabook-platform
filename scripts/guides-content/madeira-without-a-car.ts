import type { GuideDef } from '../seed-guides.js'

export const guideNoCar: GuideDef = {
  slug: 'madeira-without-a-car',
  title: 'Madeira Without a Car: How to Get Around',
  excerpt:
    'Buses, taxis, Bolt, tours and your own two feet — an honest guide to seeing Madeira without driving, including what genuinely works and what doesn’t.',
  category: 'logistics',
  coverFilename: 'madeira-beach-03.jpg',
  featuredBeaches: ['lido-complex-beach', 'machico-beach'],
  featuredProperties: ['hotel-orquidea', 'barcelo-funchal-oldtown', 'castanheiro-boutique-hotel'],
  seo: {
    title: 'Madeira Without a Car: Buses, Taxis, Tours & Walking (2026)',
    description:
      'How to get around Madeira without a car — Horários do Funchal and SIGA buses, Bolt and taxis, guided levada transfers and day tours, plus realistic itineraries.',
  },
  faqs: [
    {
      question: 'Can you visit Madeira without renting a car?',
      answer:
        'Yes, if you base yourself in Funchal. The city is walkable, buses cover the south coast towns and the airport, Bolt and taxis are cheap, and every levada, viewpoint and coast has guided tours or shuttle transfers. Only the north coast and high peaks are genuinely awkward without wheels.',
    },
    {
      question: 'Do buses run on Sundays in Madeira?',
      answer:
        'Yes, but on a reduced schedule. Urban Horários do Funchal lines run frequently every day; interurban SIGA routes thin out on Sundays and holidays — some villages drop to 2–3 departures. Always check the timetable the night before.',
    },
    {
      question: 'Is there Uber or Bolt in Madeira?',
      answer:
        'Bolt operates in Funchal and the south coast and is usually the cheapest option (~€10–€15 Funchal to Câmara de Lobos, ~€25–€35 to the airport). Uber has limited coverage. Traditional taxis are everywhere, use meters, and agree day-tour rates.',
    },
    {
      question: 'How do I get to levada walks without a car?',
        answer:
        'Two ways: guided walks with hotel pickup (~€40–€60 including a certified mountain guide — the recommended option for first-timers), or DIY using trailhead shuttles run by walking companies like Madeira Free Walks/Loko and similar operators that sell seat-only transfers for popular trails like Pico do Arieiro or 25 Fontes.',
    },
  ],
  blocks: [
    {
      t: 'p',
      text: 'Half of Madeira’s visitors rent a car, and most of the other half wish they had — until they learn the actual options. The truth: without driving you can still see Funchal thoroughly, reach every south-coast town, walk a levada and watch the sunrise from a 1,800-metre peak. You just need the right base and the right tools. Here is the honest map.',
    },
    { t: 'h2', text: 'Rule one: stay in Funchal' },
    {
      t: 'p',
      text: 'Everything below assumes a Funchal base — the only place on the island where car-free life is genuinely easy. Stay central or near the Lido: [Hotel Orquídea](/p/hotel-orquidea) by the marina, [Barceló Funchal Oldtown](/p/barcelo-funchal-oldtown), or [Castanheiro Boutique Hotel](/p/castanheiro-boutique-hotel) put buses, boats, restaurants and the cable car within a walk. See the [where-to-stay guide](/guides/where-to-stay-in-madeira) for the full picture.',
    },
    { t: 'h2', text: 'Buses — the backbone' },
    {
      t: 'p',
      text: 'Three names matter. **Horários do Funchal (HF)** runs the city network — the airport express plus lines covering the whole city, the Lido zone, Monte and Câmara de Lobos. Single tickets bought on board are ~€2.05; a rechargeable *Giro* card drops that to about €1.35. The **SIGA** network groups the interurban companies: Rodoeste serves the west (Calheta, Porto Moniz, São Vicente, Jardim do Mar) and SAM serves the east (Machico, Santa Cruz, Santana, Porto da Cruz). Interurban fares run roughly €3–€7 depending on distance; timetables are on the operators’ sites and at the stops.',
    },
    {
      t: 'p',
      text: 'Realistic bus day trips from Funchal: [Machico Beach](/beaches/machico-beach) (~40 min, frequent), **Câmara de Lobos** (15 min, HF city bus), **Curral das Freiras** in the Nuns’ Valley (HF line 81, ~40 min), **Santana** (~1h30 via SAM). Porto Moniz is doable — ~2h15 each way on Rodoeste — but eat up a whole day; a tour is often a better use of it.',
    },
    {
      t: 'p',
      text: 'From the **airport**, the Aerobus shuttles to Funchal’s hotel strip roughly hourly (~€5); a taxi or Bolt is ~€30–€35 and takes 25 minutes.',
    },
    {
      t: 'p',
      text: 'Practical bus notes: buy tickets on board with cash or a contactless card; front-door boarding, exact change appreciated. Frequencies range from every 15 minutes on the city spine to once or twice daily for remote villages — the difference between an easy day and a stranded one is checking the return timetable **before** you leave. Google Maps covers the HF network reasonably well; for SIGA routes, the printed timetables at stops and the operators’ own sites are more reliable.',
    },
    { t: 'h3', text: 'The useful lines' },
    {
      t: 'ul',
      items: [
        '**HF 1 / 2 / 4 and the coastal spine** — city centre ↔ Lido zone every few minutes; the hotel strip backbone.',
        '**HF 81** — centre ↔ Curral das Freiras (Nuns’ Valley), the easiest car-free mountain trip (~40 min).',
        '**HF 156 / 157** — centre ↔ Câmara de Lobos along the coast (~15–20 min).',
        '**Aerobus** — airport ↔ Funchal hotel zone, roughly hourly (~€5).',
        '**SAM 53 / 113** — Funchal ↔ Machico and on to Caniçal; east-coast beach days.',
        '**Rodoeste 80 / 139** — Funchal ↔ São Vicente and Porto Moniz via Ribeira Brava; the long, scenic west run (~2h15).',
      ],
    },
    { t: 'h2', text: 'Taxis, Bolt and private drivers' },
    {
      t: 'p',
      text: 'Funchal taxis are cream-coloured, metered and honest — city hops run €5–€10, the airport €30–€35. **Bolt** works well in Funchal and along the south coast and is usually a few euros cheaper; coverage thins past Calheta. For a bespoke day, most taxi drivers will quote a day rate (expect ~€120–€180 for a half/full island loop) — agree the route and price before you leave.',
    },
    { t: 'h2', text: 'Tours and trail transfers — the secret weapon' },
    {
      t: 'p',
      text: 'This is how car-free travellers see the mountains. **Minibus island tours** (east tour: Pico do Arieiro, Santana, Porto da Cruz; west tour: Câmara de Lobos, Cabo Girão, Porto Moniz) cost ~€30–€45 with hotel pickup — crowded but efficient. **Guided levada walks** (~€40–€60) include the transfer plus a certified guide, which we’d recommend anyway for a first trail — see the options in our [7-day itinerary](/guides/madeira-itinerary-7-days-quiet-luxury). **Trailhead shuttles** sell seat-only transfers for hikers doing point-to-point walks like Pico do Arieiro → Achada do Teixeira.',
    },
    {
      t: 'p',
      text: 'By sea, the **catamaran trips** from the marina (~€35–€45, dolphins almost guaranteed) need no car at all — and neither does the **cable car to Monte** (€18 return) with the toboggan ride down (~€27.50).',
    },
    { t: 'h2', text: 'Choosing the right tour' },
    {
      t: 'p',
      text: 'The tour market splits three ways. **Big-bus excursions** (40+ seats, ~€25–€35) tick the sights cheaply but move at the pace of the slowest passenger. **Small-group minibus tours** (8–16 seats, ~€35–€50) are the sweet spot — same route, half the waiting. **Private jeep tours** (~€150–€200 for up to 6 people) go off-road to the west’s viewpoints and the Fanal forest, and work out reasonably for a family or two couples. Book through your hotel or the official operators’ sites rather than the marina touts.',
    },
    { t: 'h2', text: 'Walking Funchal itself' },
    {
      t: 'p',
      text: 'Funchal is compact but not flat. The market, Old Town, marina and the seafront promenade to the [Lido bathing complex](/beaches/lido-complex-beach) form a pleasant 4km spine — flat along the water, steep the moment you turn uphill. Comfortable shoes are the only real requirement; cobbles are polished basalt and get slippery in rain.',
    },
    {
      t: 'p',
      text: 'The walk itself is worth a morning: start at the market, drift east through the painted doors of the Old Town, cross the harbour past the yellow São Tiago fort, and return west along the promenade as the fishermen’s quarter wakes up. For hills you’d rather not climb, city buses and Bolt fill the gaps — nothing inside the centre is more than €6 and ten minutes away.',
    },
    {
      t: 'p',
      text: 'One last secret of the car-free life: **hotel transfers**. Many hotels and most tour desks will book shared airport shuttles for ~€10–€15 per person, and several Funchal properties arrange private drivers at rates competitive with street taxis — ask at check-in rather than hailing on departure day.',
    },
    { t: 'h2', text: 'Getting to and from the airport' },
    {
      t: 'p',
      text: 'The airport sits 25 minutes east of Funchal. Options in order of ease: **hotel transfer or taxi** (~€30–€35, door to door), **Bolt** (usually a few euros less), **Aerobus** (~€5, roughly hourly, stops along the hotel strip), or the **SAM public bus** (cheapest at ~€3–€4, slower, best for light packers). Early-morning departures are no problem — taxis run all night and the airport is small enough that 90 minutes before a European flight is generous.',
    },
    { t: 'h2', text: 'A 4-day no-car plan' },
    {
      t: 'ul',
      items: [
        '**Day 1:** Funchal on foot — market, Old Town, Monte by cable car, toboggan down.',
        '**Day 2:** HF bus to Câmara de Lobos + Cabo Girão; promenade swim at the Lido.',
        '**Day 3:** guided east-island tour (Pico do Arieiro, Santana) or SAM bus to Machico beach.',
        '**Day 4:** morning catamaran, afternoon levada transfer or the Monte gardens.',
      ],
    },
    { t: 'h2', text: 'Accessibility and honest warnings' },
    {
      t: 'p',
      text: 'Two honest notes. Funchal’s flat seaside spine is wheelchair- and buggy-friendly, but the hillside streets, cobbles and levada paths are not — the cable car and Monte gardens are the accessible highlight. And while schedules are broadly reliable, Madeiran buses run on island time at the edges of the day: for anything involving a flight or a booked dinner, take the earlier departure.',
    },
    { t: 'h2', text: 'The money math' },
    {
      t: 'p',
      text: 'A rough comparison for a week for two: car rental with fuel and parking ~€250–€350; the equivalent in buses, two guided tours, a catamaran and a handful of Bolts comes to roughly **€300–€400 per person** — more per head, less per couple, and zero parking anxiety. The real trade isn’t money but spontaneity: the car buys the empty waterfall road at 7am that no tour will ever stop at.',
    },
    {
      t: 'p',
      text: 'One more honest option for the determined: **long-distance buses plus walking** will get you to trailheads like Achada do Teixeira (Pico Ruivo’s easy start, SAM to Santana then a taxi for the last climb) and Ribeiro Frio (the classic Balcões viewpoint walk, SAM line 56/103) — ask the driver to drop you at the trailhead stop; they always know it. A Funchal taxi to Ribeiro Frio runs ~€25–€30 each way if the bus times don’t fit.',
    },
    { t: 'h2', text: 'What you’ll miss (honestly)' },
    {
      t: 'p',
      text: 'The spontaneous north-coast road, sunrise-at-the-peak freedom, and tiny villages like Jardim do Mar are hard without wheels. If one day of freedom tempts you, a **24-hour rental** (~€35–€50) picked up and dropped in Funchal covers Porto Moniz and Seixal — no parking stress for the rest of the week. Check the [best time to visit](/guides/best-time-to-visit-madeira) before choosing between a convertible and a bus pass. Either way, the island’s promise holds: slow mornings, long lunches, and an ocean that’s never more than a bus ride away.',
    },
  ],
}
