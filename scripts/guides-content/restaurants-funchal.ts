import type { GuideDef } from '../seed-guides.js'

export const guideRestaurants: GuideDef = {
  slug: 'best-restaurants-funchal',
  title: 'The Best Restaurants in Funchal: A Local’s Guide',
  excerpt:
    'Two-Michelin-star dining, old-town taverns the guidebooks miss, and where vegetarians actually eat well — an honest tour of Funchal’s tables.',
  category: 'gastronomy',
  coverFilename: 'quinta-do-furao-restaurant-1.jpg',
  featuredRestaurants: ['il-gallo-doro', 'william-restaurant', 'o-tapassol'],
  seo: {
    title: 'Best Restaurants in Funchal (2026): Michelin, Hidden Gems & Local Picks',
    description:
      'A local guide to the best restaurants in Funchal — from Il Gallo d’Oro’s two Michelin stars to hidden Old Town taverns, seafood and vegetarian options, with prices.',
  },
  faqs: [
    {
      question: 'What are the Michelin-starred restaurants in Funchal?',
      answer:
        'Il Gallo d’Oro at The Cliff Bay holds two Michelin stars — the island’s top table. William at Reid’s Palace and Desarma by Octávio Freitas each hold one. Book 1–2 weeks ahead; tasting menus run roughly €120–€180 before wine.',
    },
    {
      question: 'How much does dinner cost in Funchal?',
      answer:
        'A local tavern dinner with wine runs €20–€35 per person; mid-range restaurants €35–€60; fine dining €80–€150+. Lunch set menus (prato do dia) at neighbourhood spots are often €8–€12.',
    },
    {
      question: 'Do I need to book restaurants in Funchal?',
      answer:
        'For Michelin-starred dining and popular Old Town spots, yes — a few days to two weeks ahead in high season. Most neighbourhood taverns take walk-ins, especially at lunch.',
    },
    {
      question: 'Where do locals eat in Funchal?',
      answer:
        'Away from the marina: the Santa Maria backstreets, the area around the market at lunchtime, and village grills on the city’s edge. Look for handwritten prato do dia boards and espetada on a laurel skewer — our [espetada guide](/guides/madeira-espetada-guide) explains the dish.',
    },
    {
      question: 'Are there vegetarian or vegan restaurants in Funchal?',
      answer:
        'Funchal has improved a lot: MOTYA cafe does plant-based breakfasts and bowls, most fine-dining kitchens offer vegetarian tasting menus on request, and dishes like grilled limpets-free peixe espada sides, milho frito and tomato-onion soup make taverns workable too.',
    },
  ],
  blocks: [
    {
      t: 'p',
      text: 'Funchal’s restaurant scene divides into three worlds that rarely overlap: the hotel dining rooms holding the Michelin stars, the tourist strip along the marina, and the backstreet taverns where Madeirans actually eat. This guide covers all three — and tells you which is worth your money. Prices quoted are honest 2026 ranges; links go to our own pages where we list each place in detail.',
    },
    { t: 'h2', text: 'The summit: Michelin dining' },
    {
      t: 'p',
      text: '**[Il Gallo d’Oro](/restaurants/il-gallo-doro)** at [The Cliff Bay](/p/the-cliff-bay) holds two Michelin stars and has defined fine dining on the island for a decade. Chef Benoît Sinthon’s menus weave Iberian produce with Madeira’s subtropical larder — limpets, scabbard fish, passionfruit — in a dining room overlooking the sea. Tasting menus run ~€150–€180 plus wine pairing; book at least a week out, two in summer.',
    },
    {
      t: 'p',
      text: '**[William](/restaurants/william-restaurant)** at Reid’s Palace holds one star and the best view in the city — the dining room floats above Funchal’s lights. Contemporary European with a lighter touch than Gallo d’Oro; tasting menus ~€120–€150. **[Desarma]**, chef Octávio Freitas’s rooftop restaurant above the city, also holds a star and pushes the most creative cooking on the island. [Kampo](/restaurants/kampo) and [ÁKVA](/restaurants/akva), by chef Júlio Pereira, sit just below star level — inventive, energetic, and easier to book.',
    },
    { t: 'h2', text: 'The local favourites' },
    {
      t: 'p',
      text: '**[O Tapassol](/restaurants/o-tapassol)** on Rua Dom Carlos I is the tavern we send friends to first: candlelit courtyard, grilled fish, espetada done properly — mains €14–€22, packed nightly, so book or arrive at 19:00. **[Terreiro](/restaurants/terreiro)** and **[Dona Amélia](/restaurants/dona-amelia)** serve honest Madeiran cooking a few streets back from the tourist flow; **[Armazém do Sal](/restaurants/armazem-do-sal)**, in a converted salt store on Rua da Alfândega, is the best mid-range room in the Old Town for a slightly dressed-up dinner (mains €16–€24).',
    },
    {
      t: 'p',
      text: 'For the dish itself, skip the marina skewers and read our [espetada guide](/guides/madeira-espetada-guide) — then eat it at a village grill, or at **[Chefe Steak House](/restaurants/chefe-steak-house)** in the Old Town if you want to stay central. **[O Recante](/restaurants/o-recante)** and **[Casa da Quinta](/restaurants/casa-da-quinta)** round out the dependable local tier — the kind of places with paper tablecloths, black scabbard fish with banana, and a bill that feels like 2015.',
    },
    {
      t: 'p',
      text: 'In the hotel-free middle ground, **[Theo’s](/restaurants/theos)** brings chef Júlio Pereira’s casual side to the Lido zone — crowd-pleasing plates done with real technique — while **[Tipografia](/restaurants/tipografia)** near the courthouse and **[Quinta Estação](/restaurants/quinta-estacao)** up the hill serve Mediterranean-leaning menus that locals book for celebrations. [Laranjinha Bistrô](/restaurants/laranjinha-bistro) and [Alfama](/restaurants/alfama) complete the honest-grill tier around the market streets.',
    },
    { t: 'h2', text: 'Seafood and the catch' },
    {
      t: 'p',
      text: 'Order what the island catches: **espada** (black scabbard fish) with banana or passionfruit sauce; **lapas** — grilled limpets with garlic butter; tuna steak; and in season, **gaiado** seared rare. [MaréAlta](/restaurants/marealta) on the edge of town does the freshest fish straightforwardly; [1811 Bistro](/restaurants/1811-bistro) pairs a serious Portuguese wine list with small plates; [Bago](/restaurants/bago) is the wine-lover’s table. For a long, wine-led dinner in an old townhouse, **[Il Vivaldi](/restaurants/il-vivaldi)** remains a classic.',
    },
    { t: 'h2', text: 'Worth the short trip' },
    {
      t: 'p',
      text: 'Two of the island’s best tables sit just outside the city. [Quinta do Furão](/restaurants/quinta-do-furao), thirty minutes northeast in Santana, pairs regional cooking with a cliff-top vineyard — go for lunch, stay for the view (mains €18–€28). In the Calheta hills, [Socalco Nature](/restaurants/socalco-nature) cooks a farm-to-table tasting menu from its own gardens — the most original food on the island outside the Michelin rooms, ~€60–€80. And twenty minutes west in Ribeira Brava, [MareAlta](/restaurants/marealta) remains the local benchmark for simply grilled fish.',
    },
    { t: 'h2', text: 'Vegetarian and lighter tables' },
    {
      t: 'p',
      text: 'Funchal is no longer a desert for non-meat eaters. **[MOTYA cafe](/restaurants/motya-cafe)** does plant-based brunches, bowls and excellent coffee near the market. **[Come Together](/restaurants/come-together)** mixes Portuguese comfort with several veggie mains. **[Favila](/restaurants/favila)** and **[RAZÃO](/restaurants/razao)** offer modern small-plate formats where half the menu is vegetable-led — and every fine-dining kitchen above will do a vegetarian tasting menu with notice. In taverns, lean on *sopa de tomate e cebola* (tomato-onion soup with poached egg), *milho frito* (crispy polenta cubes) and grilled vegetable plates.',
    },
    { t: 'h2', text: 'Breakfasts, cafés and market food' },
    {
      t: 'p',
      text: 'Mornings belong to the *pastelaria* — coffee (a *chinesa*, Madeira’s milky coffee) with a pastel de nata or the local *queijada* cheesecake for under €4. The upper floor of the **Mercado dos Lavradores** hides a handful of lunch counters where market workers eat fresh tuna and espetada sandwiches at honest prices — go before 13:30. For a slow brunch, [MOTYA](/restaurants/motya-cafe) and the cafés around the cathedral square are the reliable picks.',
    },
    { t: 'h2', text: 'Poncha and after dinner' },
    {
      t: 'p',
      text: 'Funchal’s evenings end standing up. **Poncha** — aguardente de cana, honey and lemon — is the island aperitif: €2–€3 in the numbered taverns on Rua de Santa Maria and the fishermen’s bars of Câmara de Lobos, more in cocktail dress. For something slower, the hotel bars of the Lido strip serve the island’s best Madeira wine selection by the glass; a 10-year Malmsey at dusk on a seafront terrace is the cheapest luxury in this guide.',
    },
    { t: 'h2', text: 'What to drink' },
    {
      t: 'p',
      text: 'Madeira wine is the island’s namesake for a reason: start a meal with a dry **Sercial**, finish with a 10-year-old **Bual** or **Malmsey** (~€4–€8 a glass in good bars). At lunch, the local move is a *Brisa Maracujá* (passionfruit soda) or a Coral beer. Poncha — sugar-cane rum, honey, lemon — is the working-class aperitif; the real thing is strong, costs ~€2–€3, and is best drunk standing in a village bar rather than a cocktail menu.',
    },
    { t: 'h2', text: 'Ordering like a local' },
    {
      t: 'p',
      text: 'A few dishes worth knowing by name. **Espada com banana** — black scabbard fish with fried banana — sounds strange and tastes right; the passionfruit-sauce version is the refined take. **Picado** is the shared starter: cubed beef in garlic and wine, eaten with toothpicks and crusty *bolo do caco* bread. **Milho frito** — crispy fried polenta cubes — arrives with every espetada. **Lapas** (limpets in garlic butter) are the bar snack of the gods. And **poncha de maracujá** — the passionfruit version of the fishermen’s drink — is the one to order when regular poncha proves too honest.',
    },
    {
      t: 'p',
      text: 'Lunch is when the bargains live: the *prato do dia* or *menu do dia* at neighbourhood spots is €8–€12 for a full plate with soup and coffee, and it’s what half of Funchal eats. Dinner is when the city dresses up — but nobody dresses much; smart-casual covers every room in this guide except Gallo d’Oro’s tasting evenings, where a jacket is appreciated rather than required.',
    },
    { t: 'h2', text: 'The hotel dining rooms' },
    {
      t: 'p',
      text: 'Beyond the Michelin rooms, the hotel restaurants quietly do some of the city’s most consistent cooking. [Avista](/restaurants/avista) at The Cliff Bay serves Mediterranean-Asian plates on a deck that overhangs the water — go for the Sunday brunch or the sunset slot. [Il Basilico](/restaurants/il-basilico) does the best Italian in town if the group vetoes Portuguese for a night, and [Vista Balancal](/restaurants/vista-balancal) pairs its eponymous view with reliable Mediterranean mains. Hotel prices run a modest premium, but the terraces repay it at dusk.',
    },
    { t: 'h2', text: 'By neighbourhood, quickly' },
    {
      t: 'ul',
      items: [
        '**Old Town (Zona Velha):** O Tapassol, Armazém do Sal, Chefe Steak House — the densest good-eating streets, Rua de Santa Maria and around.',
        '**Centre / market quarter:** Terreiro, O Recante, Tipografia, MOTYA — lunch counters and bistros.',
        '**Lido zone:** Theo’s, Avista at The Cliff Bay, hotel dining rooms — the polished end.',
        '**Marina & harbour:** pretty at sunset, weak on food — drink here, eat elsewhere.',
        '**Just outside:** Quinta do Furão (Santana), Socalco Nature (Calheta) — destination dining worth the drive.',
      ],
    },
    { t: 'h2', text: 'Practical notes' },
    {
      t: 'ul',
      items: [
        '**Hours:** lunch 12:00–15:00, dinner from 19:00; kitchens often close by 22:00. Many restaurants close Sunday or Monday.',
        '**Booking:** essential for Gallo d’Oro, William and O Tapassol; walk-ins fine elsewhere most of the year.',
        '**Tipping:** not obligatory; rounding up or 5–10% for good service is appreciated.',
        '**Prices above are honest 2026 ranges** — hotel restaurants run 20–30% above street level.',
        '**Payment:** cards accepted almost everywhere; carry some cash for village grills and market counters.',
        '**Avoid:** anywhere on the marina strip with picture menus and a tout outside — the kitchen is never the reason they’re full.',
        '**With kids:** hotel restaurants and the market cafés are easiest; O Tapassol’s courtyard works for early family dinners.',
        '**Dress code:** smart-casual everywhere; Gallo d’Oro appreciates a jacket but doesn’t require one.',
      ],
    },
    {
      t: 'p',
      text: 'Eating your way around the island? Our [7-day itinerary](/guides/madeira-itinerary-7-days-quiet-luxury) strings the best tables into a week, and the [where-to-stay guide](/guides/where-to-stay-in-madeira) puts you within walking distance of them. For the definitive local ritual, don’t miss the [espetada guide](/guides/madeira-espetada-guide) — beef, bay laurel, fire, and the island at its most itself.',
    },
  ],
}
