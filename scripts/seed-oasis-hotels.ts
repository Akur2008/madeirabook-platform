import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import 'dotenv/config'

// "tenant: oasis" maps to brand = 'madeiraoasis' on the shared Properties
// collection. hotelType is 'hotel' for all 15 showcase entries.

interface OasisHotelSeed {
  title: string
  slug: string
  locationName: string
  locationSlug: string
  lat: number
  lng: number
  category: string
  shortDescription: string
  description: string
  pricePerNight: number
  amenityKeys: string[]
  imageOffset: number
}

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1600&q=80',
]

const AMENITIES: Record<string, { name: string; icon: string }> = {
  oceanView: { name: 'Ocean view', icon: '🌊' },
  spa: { name: 'Spa & wellness', icon: '🧖' },
  infinityPool: { name: 'Infinity pool', icon: '∞' },
  fineDining: { name: 'Fine dining', icon: '🍽' },
  concierge: { name: 'Concierge service', icon: '🛎' },
  transfer: { name: 'Private transfer', icon: '🚘' },
  wine: { name: 'Wine cellar', icon: '🍷' },
  garden: { name: 'Botanical garden', icon: '🌿' },
  seaAccess: { name: 'Direct sea access', icon: '⚓' },
  rooftop: { name: 'Rooftop pool', icon: '☀' },
}

const hotels: OasisHotelSeed[] = [
  {
    title: 'The Cliff Bay (PortoBay)',
    slug: 'the-cliff-bay',
    locationName: 'Funchal',
    locationSlug: 'funchal',
    lat: 32.6397,
    lng: -16.9298,
    category: '5★ Luxury Oceanfront Resort',
    shortDescription:
      "Икона гостеприимства Мадейры, возвышающаяся над морем. Прямой доступ к океану, двухзвездочный ресторан Michelin *Il Gallo d'Oro* и безупречный сервис, превращающий отдых в искусство.",
    description: `**Где океан встречается с высшим обществом**
Расположенный на естественной мысовой скале в Фуншале, The Cliff Bay предлагает бескомпромиссный уровень приватности и комфорта. Каждый номер спроектирован так, чтобы открыть перед вами бескрайнюю панораму Атлантики.
**Главные акценты пребывания:**
* **Гастрономия Michelin:** Легендарный ресторан *Il Gallo d'Oro* под руководством шефа Бенуа Синтона.
* **Океанический SPA:** Процедуры на основе натуральных ингредиентов с видом на залив Фуншала.
* **Приватный спуск к воде:** Эксклюзивная платформа для купания в чистейшем океане.

*Забронируйте ваш люкс через Madeira Oasis Concierge и получите привилегированный доступ к лучшим столикам и особенностям размещения.*`,
    pricePerNight: 350,
    amenityKeys: ['oceanView', 'spa', 'fineDining', 'seaAccess', 'concierge', 'transfer'],
    imageOffset: 0,
  },
  {
    title: 'Les Suites at The Cliff Bay',
    slug: 'les-suites-cliff-bay',
    locationName: 'Funchal',
    locationSlug: 'funchal',
    lat: 32.6397,
    lng: -16.9298,
    category: 'Exclusive Boutique Luxury Suites',
    shortDescription:
      'Приватный оазис из 23 эксклюзивных сюит в вековом парке. Уединенность частной виллы с инфраструктурой пятизвездочного курорта.',
    description: `**Приватность, возведенная в абсолют**
Les Suites — это уникальное сочетание двух исторических особняков и современного крыла с роскошными сюитами. Зона закрыта для посторонних, обеспечивая гостям тишину, покой и персональное обслуживание высшего класса.
**Главные акценты пребывания:**
* **Простор и стиль:** Сюиты площадью от 60 кв. м с панорамными балконами и авторским декором.
* **Avista Restaurant:** Гастрономическое пространство с хоспером и блюдами из местной рыбы и выдержанного мяса.
* **Инфинити-бассейн в саду:** Уединенная зона отдыха среди тропической зелени.

*Свяжитесь с Madeira Oasis Concierge для бронирования персонального трансфера и настройки ваучера размещения.*`,
    pricePerNight: 650,
    amenityKeys: ['oceanView', 'infinityPool', 'fineDining', 'garden', 'concierge', 'transfer'],
    imageOffset: 1,
  },
  {
    title: 'Saccharum Resort & Spa',
    slug: 'saccharum-resort',
    locationName: 'Calheta',
    locationSlug: 'calheta',
    lat: 32.7175,
    lng: -17.1754,
    category: 'Design & Wellness Ocean Resort',
    shortDescription:
      'Дизайнерский отель между горными ущельями и океаном. Эстетика сахарного тростника, панорамные спа-комплексы и лучшие закаты юго-западного побережья.',
    description: `**Абсолютный релакс в гармонии с историей острова**
Saccharum — это архитектурный шедевр, интегрированный в величественный пейзаж Кальеты. Дизайн интерьеров, разработанный известным бюро, бережно переосмысляет наследие сахарных плантаций Мадейры через премиальный минимализм.
**Главные акценты пребывания:**
* **Rooftop Infinity Pool:** Бассейн на крыше, сливающийся с горизонтом Атлантического океана.
* **Премиальный спа-центр:** Сауны, турецкие бани, ледяные фонтаны и гидротерапия для полного восстановления.
* **Пляжная локация:** В шаговой доступности от песчаного пляжа Calheta.

*Оформите запрос через наш сервис для получения индивидуального пакета пребывания с включенным SPA-ритуалом.*`,
    pricePerNight: 280,
    amenityKeys: ['oceanView', 'spa', 'rooftop', 'fineDining', 'seaAccess', 'transfer'],
    imageOffset: 2,
  },
  {
    title: 'Pestana Churchill Bay',
    slug: 'pestana-churchill-bay',
    locationName: 'Câmara de Lobos',
    locationSlug: 'camara-de-lobos',
    lat: 32.6499,
    lng: -16.9772,
    category: '4★ Harbour Boutique Hotel',
    shortDescription:
      'Бутик-отель в исторической рыбацкой бухте Камара-де-Лобуш — тот самый вид, который писал Уинстон Черчилль.',
    description: `Бутик-отель в исторической рыбацкой бухте Камара-де-Лобуш — тот самый вид, который писал Уинстон Черчилль.
Панорамный бассейн на крыше смотрит прямо на лодки и вулканические скалы, а вечерняя набережная в двух шагах хранит атмосферу старой Мадейры.`,
    pricePerNight: 190,
    amenityKeys: ['oceanView', 'rooftop', 'fineDining', 'concierge', 'transfer'],
    imageOffset: 3,
  },
  {
    title: "Reid's Palace, A Belmond Hotel",
    slug: 'reids-palace-belmond',
    locationName: 'Funchal',
    locationSlug: 'funchal',
    lat: 32.6397,
    lng: -16.9298,
    category: '5★ Historic Grand Hotel',
    shortDescription:
      'Легендарный гранд-отель на скалах Фуншала: субтропические сады, чай на знаменитой террасе и более века безупречной истории.',
    description: `Легендарный гранд-отель на скалах Фуншала: субтропические сады, чай на знаменитой террасе и более века безупречной истории.
Символ острова со времен эпохи пароходов — сегодня это эталон классического сервиса и место, где останавливались короли, писатели и звезды кино.`,
    pricePerNight: 520,
    amenityKeys: ['oceanView', 'spa', 'fineDining', 'garden', 'seaAccess', 'concierge'],
    imageOffset: 4,
  },
  {
    title: 'Savoy Palace',
    slug: 'savoy-palace',
    locationName: 'Funchal',
    locationSlug: 'funchal',
    lat: 32.6457,
    lng: -16.9326,
    category: '5★ Modern Luxury Hotel',
    shortDescription:
      'Флагман Savoy Signature в сердце Фуншала с авторским дизайном Нини Андраде Силва и одним из самых впечатляющих rooftop-бассейнов Европы.',
    description: `Флагман Savoy Signature в сердце Фуншала с авторским дизайном Нини Андраде Силва и одним из самых впечатляющих rooftop-бассейнов Европы.
Интерьеры вдохновлены историей левад и садов Мадейры, а на верхних этажах — панорама бухты, рестораны и спа уровня мировых столиц.`,
    pricePerNight: 420,
    amenityKeys: ['rooftop', 'spa', 'fineDining', 'infinityPool', 'concierge', 'transfer'],
    imageOffset: 5,
  },
  {
    title: 'Royal Savoy',
    slug: 'royal-savoy',
    locationName: 'Funchal',
    locationSlug: 'funchal',
    lat: 32.6457,
    lng: -16.9326,
    category: '5★ Oceanfront Suite Resort',
    shortDescription:
      'Океан-резорт с просторными сюитами и апартаментами у бухты Фуншала: тихая роскошь, сады и прямой выход к набережной.',
    description: `Океан-резорт с просторными сюитами и апартаментами у бухты Фуншала: тихая роскошь, сады и прямой выход к набережной.
Формат «курорт в городе» — приватные бассейны, спа и сервис для тех, кто ценит пространство и размеренность.`,
    pricePerNight: 380,
    amenityKeys: ['oceanView', 'spa', 'infinityPool', 'seaAccess', 'garden', 'concierge'],
    imageOffset: 6,
  },
  {
    title: 'Quinta da Casa Branca',
    slug: 'quinta-da-casa-branca',
    locationName: 'Funchal',
    locationSlug: 'funchal',
    lat: 32.6439,
    lng: -16.9246,
    category: '5★ Boutique Quinta & Gardens',
    shortDescription:
      'Историческая усадьба в собственном ботаническом саду в двух шагах от центра Фуншала — номера среди вековых деревьев и банановых плантаций.',
    description: `Историческая усадьба в собственном ботаническом саду в двух шагах от центра Фуншала — номера среди вековых деревьев и банановых плантаций.
Редкий формат «загородного дома в городе»: приватность поместья, архитектура модернизма и тишина сада посреди курортной зоны.`,
    pricePerNight: 290,
    amenityKeys: ['garden', 'infinityPool', 'fineDining', 'wine', 'concierge', 'transfer'],
    imageOffset: 7,
  },
  {
    title: 'Enoteca Quinta da Serra',
    slug: 'enoteca-quinta-da-serra',
    locationName: 'Jardim da Serra',
    locationSlug: 'jardim-da-serra',
    lat: 32.7064,
    lng: -16.9768,
    category: '5★ Mountain Wine Retreat',
    shortDescription:
      'Винное поместье высоко в горах Хардин-да-Серра: био-сад, крытый панорамный бассейн и тишина долины над облаками.',
    description: `Винное поместье высоко в горах Хардин-да-Серра: био-сад, крытый панорамный бассейн и тишина долины над облаками.
Уединенное ранчо-усадьба для тех, кто ищет горную Мадейру — собственные виноградники, эко-ферма и вид на долину до океана.`,
    pricePerNight: 220,
    amenityKeys: ['infinityPool', 'spa', 'wine', 'garden', 'fineDining', 'transfer'],
    imageOffset: 8,
  },
  {
    title: 'Aqua Natura Bay',
    slug: 'aqua-natura-bay',
    locationName: 'Porto Moniz',
    locationSlug: 'porto-moniz',
    lat: 32.8679,
    lng: -17.1644,
    category: '4★ Natural Pools Hotel',
    shortDescription:
      'Отель у знаменитых вулканических бассейнов Порту-Мониш — лавовые террасы, Атлантика и лучшие закаты северного побережья.',
    description: `Отель у знаменитых вулканических бассейнов Порту-Мониш — лавовые террасы, Атлантика и лучшие закаты северного побережья.
Настоящая дикая Мадейра: океанский прибой под окнами, натуральные купальни в двух шагах и северное побережье без толп.`,
    pricePerNight: 170,
    amenityKeys: ['oceanView', 'seaAccess', 'spa', 'fineDining', 'concierge'],
    imageOffset: 9,
  },
  {
    title: 'Castanheiro Boutique Hotel',
    slug: 'castanheiro-boutique-hotel',
    locationName: 'Funchal',
    locationSlug: 'funchal',
    lat: 32.6493,
    lng: -16.9086,
    category: '4★ Design Boutique Hotel',
    shortDescription:
      'Дизайн-отель в пяти исторических зданиях старого Фуншала с rooftop-бассейном над красными крышами и живой галереей португальского искусства.',
    description: `Дизайн-отель в пяти исторических зданиях старого Фуншала с rooftop-бассейном над красными крышами и живой галереей португальского искусства.
Каждое крыло — своя эпоха: от XVIII века до модернизма, а на крыше — панорама бухты, бассейн и коктейль-бар.`,
    pricePerNight: 180,
    amenityKeys: ['rooftop', 'spa', 'fineDining', 'wine', 'concierge'],
    imageOffset: 10,
  },
  {
    title: 'Quinta do Furão',
    slug: 'quinta-do-furao',
    locationName: 'Santana',
    locationSlug: 'santana',
    lat: 32.8031,
    lng: -16.8736,
    category: '4★ Wine Estate Hotel',
    shortDescription:
      'Винодельческая усадьба на скалах северного побережья у Сантаны: виноградники, таверна с эспетадой и тропы прямо от порога.',
    description: `Винодельческая усадьба на скалах северного побережья у Сантаны: виноградники, таверна с эспетадой и тропы прямо от порога.
Самая атмосферная кинта острова — скалы, океан, винный погреб и один из лучших региональных ресторанов Мадейры.`,
    pricePerNight: 160,
    amenityKeys: ['oceanView', 'wine', 'fineDining', 'garden', 'transfer'],
    imageOffset: 11,
  },
  {
    title: 'Hotel Suite Eden Mar',
    slug: 'hotel-suite-eden-mar',
    locationName: 'Funchal',
    locationSlug: 'funchal',
    lat: 32.6357,
    lng: -16.935,
    category: '4★ All-Suite Ocean Resort',
    shortDescription:
      'Сьют-курорт у самого океана в курортной зоне Фуншала: просторные апартаменты, тропические сады и инфраструктура PortoBay.',
    description: `Сьют-курорт у самого океана в курортной зоне Фуншала: просторные апартаменты, тропические сады и инфраструктура PortoBay.
Все номера — сюиты с кухнями и террасами; идеальный баланс приватности апартаментов и сервиса курорта.`,
    pricePerNight: 240,
    amenityKeys: ['oceanView', 'infinityPool', 'spa', 'seaAccess', 'garden', 'fineDining'],
    imageOffset: 12,
  },
  {
    title: 'Pestana Promenade',
    slug: 'pestana-promenade',
    locationName: 'Funchal',
    locationSlug: 'funchal',
    lat: 32.6348,
    lng: -16.9363,
    category: '4★ Oceanfront Promenade Hotel',
    shortDescription:
      'Один из самых высоких отелей Фуншала на променаде Лидо — панорамы бухты, пальмовая набережная и закаты над Атлантикой.',
    description: `Один из самых высоких отелей Фуншала на променаде Лидо — панорамы бухты, пальмовая набережная и закаты над Атлантикой.
Классический курортный формат Pestana с большим бассейном, спа и прямым выходом к океанской прогулочной зоне.`,
    pricePerNight: 200,
    amenityKeys: ['oceanView', 'infinityPool', 'spa', 'seaAccess', 'concierge'],
    imageOffset: 13,
  },
  {
    title: 'Estalagem da Ponta do Sol',
    slug: 'estalagem-da-ponta-do-sol',
    locationName: 'Ponta do Sol',
    locationSlug: 'ponta-do-sol',
    lat: 32.6797,
    lng: -17.1022,
    category: '4★ Cliff-Top Design Estalagem',
    shortDescription:
      'Дизайн-эсталагем на скале над Понта-ду-Сол — самой солнечной точкой острова: минимализм, инфинити-бассейн и закаты.',
    description: `Дизайн-эсталагем на скале над Понта-ду-Сол — самой солнечной точкой острова: минимализм, инфинити-бассейн и закаты.
Культовый отель южного побережья для ценителей архитектуры и тишины — строгие линии, бетон, океан и ни одного лишнего звука.`,
    pricePerNight: 230,
    amenityKeys: ['oceanView', 'infinityPool', 'spa', 'fineDining', 'concierge'],
    imageOffset: 14,
  },
]

async function seedOasisHotels(): Promise<void> {
  const payload = await getPayload({ config })

  // --- Locations: ensure a document per city (geoCoordinates is required) ---
  const locationBySlug = new Map<string, number>()
  for (const h of hotels) {
    if (locationBySlug.has(h.locationSlug)) continue
    const existing = await payload.find({
      collection: 'locations',
      where: { slug: { equals: h.locationSlug } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      locationBySlug.set(h.locationSlug, existing.docs[0].id)
    } else {
      const created = await payload.create({
        collection: 'locations',
        data: {
          name: h.locationName,
          slug: h.locationSlug,
          geoCoordinates: { lat: h.lat, lng: h.lng },
        },
      })
      locationBySlug.set(h.locationSlug, created.id)
      console.log(`OK location ${h.locationSlug}`)
    }
  }

  // --- Amenities: ensure a document per key ---
  const amenityByKey = new Map<string, number>()
  for (const [key, amenity] of Object.entries(AMENITIES)) {
    const existing = await payload.find({
      collection: 'amenities',
      where: { name: { equals: amenity.name } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      amenityByKey.set(key, existing.docs[0].id)
    } else {
      const created = await payload.create({
        collection: 'amenities',
        data: { name: amenity.name, icon: amenity.icon },
      })
      amenityByKey.set(key, created.id)
      console.log(`OK amenity ${amenity.name}`)
    }
  }

  // --- Media: one document per image URL (dedupe) ---
  const mediaByUrl = new Map<string, number>()
  const ensureMedia = async (url: string, alt: string) => {
    const cached = mediaByUrl.get(url)
    if (cached) return cached
    const existing = await payload.find({
      collection: 'media',
      where: { url: { equals: url } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      mediaByUrl.set(url, existing.docs[0].id)
      return existing.docs[0].id
    }
    const created = await payload.create({
      collection: 'media',
      data: { url, alt, mimeType: 'image/jpeg', width: 1600, height: 900 },
    })
    mediaByUrl.set(url, created.id)
    return created.id
  }

  let okCount = 0

  for (const h of hotels) {
    const urls = [0, 1, 2, 3, 4].map(
      (k) => IMAGE_POOL[(h.imageOffset + k) % IMAGE_POOL.length],
    )
    const mediaIds = await Promise.all(
      urls.map((u) => ensureMedia(u, `${h.title} — Madeira Oasis`)),
    )

    const data = {
      title: h.title,
      slug: h.slug,
      brand: 'madeiraoasis' as const,
      hotelType: 'hotel' as const,
      status: 'published' as const,
      pricingScenario: 'display_only' as const,
      category: h.category,
      shortDescription: h.shortDescription,
      description: h.description,
      pricePerNight: h.pricePerNight,
      geoCoordinates: { lat: h.lat, lng: h.lng },
      location: locationBySlug.get(h.locationSlug),
      amenities: h.amenityKeys
        .map((k) => amenityByKey.get(k))
        .filter((id): id is number => id != null),
      media: mediaIds.map((id) => ({ image: id })),
    }

    const existing = await payload.find({
      collection: 'properties',
      where: { slug: { equals: h.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'properties',
        id: existing.docs[0].id,
        data,
      })
    } else {
      await payload.create({ collection: 'properties', data })
    }

    okCount++
    console.log(`OK hotel ${h.slug}`)
  }

  console.log(`Done. OK: ${okCount}`)
}

seedOasisHotels()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding oasis hotels:', error)
    process.exit(1)
  })
