import React from 'react'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './styles.css'
import Footer from './components/Footer'
import { AudioEngineProvider } from '@/audio/AudioEngineProvider'
import SoundButton from '@/components/SoundButton'
import WhatsAppConciergeButton from '@/components/WhatsAppConciergeButton'

export const metadata: Metadata = {
  metadataBase: new URL('https://madeirabook-platform.vercel.app'),
  title: 'Madeirabook — Curated escapes to Madeira',
  description:
    'Emotional gateways to Madeira. Two-minute escapes from the city noise.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Madeirabook — Curated escapes to Madeira',
    description:
      'Emotional gateways to Madeira. Two-minute escapes from the city noise.',
    type: 'website',
    url: 'https://madeirabook-platform.vercel.app',
    images: [
      {
        url: 'https://www.madeirabook.com/hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Madeira ocean view',
      },
    ],
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <AudioEngineProvider>
          <main>{children}</main>
          <Footer />
          <WhatsAppConciergeButton />
          <SoundButton />
        </AudioEngineProvider>
        <Analytics />
      </body>
    </html>
  )
}
