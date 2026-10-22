import type { Metadata } from 'next'
import Image from 'next/image'

import AiConciergeWidget from '@/components/AiConciergeWidget'
import SaveAsAppSheet from '@/components/SaveAsAppSheet'
import OasisLink from '../../../../(frontend)/components/OasisLink'
import { ConciergeAskButton } from './V3Actions'
import V3ReelVideo from './V3ReelVideo'

const R2 = 'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev/uploads'

const IMG = {
  hero: `${R2}/quinta-da-serra-v3-hero.jpg`,
  og: `${R2}/quinta-da-serra-v3-og.jpg`,
  estate: `${R2}/quinta-da-serra-v3-estate.jpg`,
  aerial: `${R2}/quinta-da-serra-v3-aerial.jpg`,
  garden: `${R2}/quinta-da-serra-v3-garden.jpg`,
  pool: `${R2}/quinta-da-serra-v3-pool.jpg`,
  pavilion: `${R2}/quinta-da-serra-v3-pavilion.jpg`,
  eucalyptus: `${R2}/quinta-da-serra-v3-eucalyptus.jpg`,
  suite: `${R2}/quinta-da-serra-v3-suite.jpg`,
  valley: `${R2}/quinta-da-serra-v3-valley.jpg`,
  spa: `${R2}/quinta-da-serra-v3-spa.jpg`,
}

const CONTACT_MAILTO = `mailto:hello@madeiraoasis.com?subject=${encodeURIComponent(
  'Inquiry about Quinta da Serra',
)}`

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Quinta da Serra — Bio Luxury Sanctuary | Madeira Oasis'
  const description =
    '5-Star organic retreat nestled at 820m in Madeira mountains.'
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: IMG.og,
          width: 1200,
          height: 630,
          alt: 'Quinta da Serra — Bio Luxury Sanctuary, Madeira',
        },
      ],
      type: 'website',
      url: '/hotels/quinta-da-serra-v3',
    },
    twitter: {
      card: 'summary_large_image',
      images: [IMG.og],
    },
    alternates: { canonical: '/hotels/quinta-da-serra-v3' },
  }
}

export default function QuintaDaSerraV3Page() {
  return (
    <div
      data-ambient="off"
      className="min-h-dvh bg-[#fdfbf7] text-[#1a1a1a]"
    >
      {/* A/B test marker — visible only on the v3 variant */}
      <div className="fixed left-4 top-20 z-50 rounded-full bg-[#1a1a1a] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#d4af37] shadow-lg">
        V3 Preview
      </div>

      {/* Hero — full viewport */}
      <section className="relative flex h-dvh min-h-[560px] w-full items-end overflow-hidden">
        <Image
          src={IMG.hero}
          alt="Quinta da Serra manor house above the gardens of Jardim da Serra"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/80 via-[#1a1a1a]/30 to-[#1a1a1a]/10" />
        <div className="relative mx-auto w-full max-w-5xl px-6 pb-16 md:pb-24">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
            820m Altitude • Bio Hotel 5★
          </p>
          <h1 className="font-serif mt-5 max-w-3xl text-4xl font-medium leading-[1.1] text-white md:text-6xl">
            Quinta da Serra — Bio Luxury Sanctuary
          </h1>
          <p className="mt-5 max-w-xl text-lg font-light leading-relaxed text-white/85">
            An oasis above the clouds on the edge of the Laurisilva forest.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <ConciergeAskButton
              message="I'm interested in a stay at Quinta da Serra — what can you tell me about it?"
              className="cursor-pointer rounded-full bg-[#d4af37] px-7 py-3.5 text-sm font-semibold tracking-wide text-[#1a1a1a] transition-colors hover:bg-[#c29c2e]"
            >
              Inquire via AI Concierge
            </ConciergeAskButton>
            <a
              href={CONTACT_MAILTO}
              className="rounded-full border border-white/50 px-7 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              Contact via Email
            </a>
          </div>
        </div>
      </section>

      {/* Architectural narrative — sticky image + editorial copy */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <figure className="self-start lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-2xl">
              <Image
                src={IMG.estate}
                alt="The monumental Eucalyptus globulus at the entrance of Quinta da Serra"
                width={1707}
                height={2560}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-auto w-full object-cover"
              />
            </div>
            <figcaption className="mt-4 text-xs tracking-wide text-[#1a1a1a]/50">
              Eucalyptus globulus — circa 64 metres, the tallest recorded tree on
              Madeira, planted over two centuries ago.
            </figcaption>
          </figure>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a7020]">
              The Estate — Jardim da Serra, 820m
            </p>
            <h2 className="font-serif mt-4 text-3xl font-medium leading-tight md:text-5xl">
              A nineteenth-century manor above the clouds
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-[#1a1a1a]/75">
              Founded in the 19th century by the British consul Henry Veitch,
              Quinta da Serra began as an experiment in botany — a mountainside
              estate where species gathered from distant continents were planted
              beside Madeira&rsquo;s own laurel forest. The original manor still
              stands at its heart, presiding over gardens that have matured for
              generations.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-[#1a1a1a]/75">
              Fourteen hectares of grounds unfold around the house: century-old
              camellias, organic orchards, kitchen gardens and vines of Sercial —
              one of the noble grapes behind Madeira wine. More than 25,000&nbsp;m²
              are cultivated under certified organic practice, supplying the
              estate&rsquo;s own table.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-[#1a1a1a]/75">
              Eight of the twelve monumental trees classified in Câmara de Lobos
              grow on this land. At the gate stands a Eucalyptus globulus of
              roughly 64 metres — the tallest tree recorded on Madeira — a living
              monument whose shade has gathered two centuries of silence.
            </p>
            <p className="font-serif mt-8 border-l-2 border-[#d4af37] pl-6 text-xl italic leading-relaxed text-[#1b3b2b]">
              Local memory holds that Napoleon Bonaparte, bound for exile on
              Saint Helena, received the consul aboard his ship — and that the
              old consul alone kept addressing him as &ldquo;Your
              Majesty&rdquo;.
            </p>
            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-[#1a1a1a]/10 pt-10 sm:grid-cols-4">
              {[
                ['820m', 'Altitude'],
                ['14 ha', 'Gardens & farm'],
                ['64m', 'Tallest tree'],
                ['19th c.', 'Estate founded'],
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col">
                  <dt className="order-2 mt-2 text-xs uppercase tracking-[0.2em] text-[#1a1a1a]/50">
                    {label}
                  </dt>
                  <dd className="font-serif order-1 text-3xl font-medium text-[#1b3b2b]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Reel — full-viewport video with toggleable mountain ambient */}
      <V3ReelVideo />

      {/* Key pillars — deep forest green band */}
      <section className="bg-[#1b3b2b] text-[#fdfbf7]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
            Three Pillars of the Stay
          </p>
          <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-10">
            {[
              {
                n: '01',
                title: 'Bio Farm-to-Table',
                body: 'Certified-organic cuisine at Mendel\u2019s restaurant — vegetables, orchard fruit and Sercial wine grown on the estate itself.',
              },
              {
                n: '02',
                title: 'Laurisilva Sanctuary',
                body: 'Direct access to UNESCO-listed levadas and ancient trails threading the laurel forest above C\u00e2mara de Lobos.',
              },
              {
                n: '03',
                title: 'High-Altitude Wellness',
                body: 'A heated indoor pool beneath the glass pavilion, sauna and organic spa therapies at 820 metres.',
              },
            ].map((pillar) => (
              <div
                key={pillar.n}
                className="border-t border-[#d4af37]/40 pt-6"
              >
                <p className="text-sm tracking-[0.3em] text-[#d4af37]">
                  {pillar.n}
                </p>
                <h3 className="font-serif mt-4 text-2xl font-medium">
                  {pillar.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-[#fdfbf7]/70">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery — editorial masonry */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a7020]">
          Atmosphere
        </p>
        <h2 className="font-serif mt-4 text-3xl font-medium md:text-4xl">
          Fireplaces, glasshouse pool, organic gardens
        </h2>
        <div className="oasis-masonry mt-12 columns-2 md:columns-3">
          {[
            { src: IMG.aerial, alt: 'Aerial view of the manor in the valley', w: 1900, h: 1069 },
            { src: IMG.pool, alt: 'Heated indoor pool under the glass pavilion', w: 1900, h: 1267 },
            { src: IMG.eucalyptus, alt: 'Trunk of the monumental eucalyptus', w: 1707, h: 2560 },
            { src: IMG.suite, alt: 'Manor house suite with classic furnishings', w: 1024, h: 683 },
            { src: IMG.garden, alt: 'Formal topiary gardens from above', w: 1900, h: 1069 },
            { src: IMG.spa, alt: 'Organic spa therapy', w: 1280, h: 960 },
            { src: IMG.pavilion, alt: 'Pool pavilion set in the gardens', w: 1900, h: 1267 },
            { src: IMG.valley, alt: 'Valley view towards the Atlantic', w: 1900, h: 1069 },
          ].map((img) => (
            <figure key={img.src} className="overflow-hidden rounded-xl">
              <Image
                src={img.src}
                alt={img.alt}
                width={img.w}
                height={img.h}
                sizes="(max-width: 768px) 50vw, 33vw"
                className="h-auto w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </figure>
          ))}
        </div>
      </section>

      {/* AI Concierge */}
      <section
        id="concierge"
        className="border-t border-[#1a1a1a]/10 bg-white/60"
      >
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a7020]">
            Madeira Oasis Concierge
          </p>
          <h2 className="font-serif mt-4 text-3xl font-medium md:text-4xl">
            Ask the estate anything
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#1a1a1a]/60">
            The AI concierge answers instantly — rooms with fireplaces, the
            organic menu at Mendel&rsquo;s, levada walks from the gate, or the
            best season to wake above the clouds.
          </p>
          <ConciergeAskButton
            message="Tell me about the room fireplaces and the organic menu at Quinta da Serra."
            className="mt-8 cursor-pointer rounded-full border border-[#1b3b2b] px-7 py-3.5 text-sm font-semibold tracking-wide text-[#1b3b2b] transition-colors hover:bg-[#1b3b2b] hover:text-[#fdfbf7]"
          >
            Ask AI Concierge about room fireplaces or organic menu at Quinta da
            Serra
          </ConciergeAskButton>
          <p className="mt-4 text-xs text-[#1a1a1a]/40">
            Or open the chat in the lower-right corner.
          </p>
        </div>
      </section>

      {/* Back to v1 */}
      <div className="border-t border-[#1a1a1a]/10">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center">
          <OasisLink
            href="/hotels/quinta-da-serra"
            className="text-sm font-medium text-[#8a7020] transition-colors hover:text-[#1a1a1a]"
          >
            ← Back to V1
          </OasisLink>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a]/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[#1a1a1a]/50 sm:flex-row">
          <OasisLink
            href="/"
            className="transition-colors hover:text-[#1a1a1a]"
          >
            ← Back to the collection
          </OasisLink>
          <a
            href="https://www.madeirabook.com"
            className="transition-colors hover:text-[#1a1a1a]"
          >
            Powered by Madeirabook
          </a>
          <SaveAsAppSheet variant="light" />
        </div>
      </footer>

      <AiConciergeWidget />
    </div>
  )
}
