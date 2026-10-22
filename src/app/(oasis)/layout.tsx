import React from 'react'
import type { Metadata, Viewport } from 'next'
import { AudioEngineProvider } from '@/audio/AudioEngineProvider'
import AiConciergeWidget from '@/components/AiConciergeWidget'
import GlobalAmbient from '@/components/GlobalAmbient'
import SoundButton from '@/components/SoundButton'
import WhatsAppConciergeButton, {
  OASIS_WA_BASE,
} from '@/components/WhatsAppConciergeButton'
import OasisLink from '../(frontend)/components/OasisLink'
import './oasis.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.madeiraoasis.com'),
  alternates: { canonical: 'https://www.madeiraoasis.com' },
  title: 'Madeira Oasis — A private collection of Madeira’s finest hotels',
  description:
    'Fifteen hand-picked luxury addresses across Madeira. Oceanfront resorts, historic quintas and boutique suites — booked through the Madeira Oasis concierge.',
  manifest: '/manifest-oasis.json',
  icons: { icon: '/icon-512.png', apple: '/apple-touch-icon.png' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Madeira Oasis',
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Madeira Oasis',
    description:
      'A private collection of Madeira’s finest hotels, booked through one concierge.',
    url: 'https://www.madeiraoasis.com',
    siteName: 'Madeira Oasis',
    images: [
      {
        url: 'https://www.madeiraoasis.com/og-madeiraoasis.jpg',
        width: 1200,
        height: 630,
        alt: 'Madeira Oasis — a private collection of Madeira’s finest hotels',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.madeiraoasis.com/og-madeiraoasis.jpg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#D4AF37',
}

export default function OasisLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        {/* Playfair Display for headings; falls back to serif if the CDN is unreachable */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap"
        />

        {/* z-[1100] keeps the header above Leaflet's stacked panes on the map page */}
        <header className="fixed inset-x-0 top-0 z-[1100] border-b border-[#1c1a16]/10 bg-[#fdfbf7]/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <OasisLink
              href="/"
              className="font-serif text-xl font-semibold tracking-tight text-[#1c1a16]"
            >
              Madeira <span className="text-[#b8952e]">Oasis</span>
            </OasisLink>
            <a
              href="mailto:hello@madeiraoasis.com?subject=Stay%20request%20%E2%80%94%20Madeira%20Oasis"
              className="inline-flex items-center justify-center rounded-full border border-[#d4af37] bg-[#d4af37] px-4 py-2 text-xs font-semibold tracking-wide text-[#1c1a16] transition-colors hover:bg-transparent hover:text-[#8a7020] sm:px-6 sm:py-2.5 sm:text-sm"
            >
              Request a Stay
            </a>
          </div>
        </header>

        <AudioEngineProvider>
          <GlobalAmbient />
          <main>{children}</main>
          <WhatsAppConciergeButton waBase={OASIS_WA_BASE} />
          <AiConciergeWidget />
          <SoundButton />
        </AudioEngineProvider>
      </body>
    </html>
  )
}
