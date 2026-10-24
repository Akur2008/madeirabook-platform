import React from 'react'
import type { Metadata, Viewport } from 'next'
import './styles.css'
import Footer from './components/Footer'
import { AudioEngineProvider } from '@/audio/AudioEngineProvider'
import GlobalAmbient from '@/components/GlobalAmbient'
import BottomActionBar from '@/components/BottomActionBar'
import WhaleBreathModal from '@/components/WhaleBreathModal'
import AiConciergeWidget from '@/components/AiConciergeWidget'
import CookieConsent from '@/components/CookieConsent'
import AnalyticsWithConsent from '@/components/AnalyticsWithConsent'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.madeirabook.com'),
  alternates: { canonical: 'https://www.madeirabook.com' },
  title: 'Madeirabook — Quiet Luxury & Direct Booking in Madeira',
  description:
    'Book private sanctuaries, ocean-view villas, and quiet retreats in Madeira. Direct booking, no middlemen.',
  manifest: '/manifest.json',
  icons: { icon: '/icon-512.png', apple: '/apple-touch-icon.png' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Madeirabook',
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Madeirabook — Quiet Luxury & Direct Booking in Madeira',
    description:
      'Book private sanctuaries, ocean-view villas, and quiet retreats in Madeira. Direct booking, no middlemen.',
    url: 'https://www.madeirabook.com',
    siteName: 'Madeirabook',
    images: [
      {
        url: 'https://www.madeirabook.com/og-madeirabook.jpg',
        width: 1200,
        height: 630,
        alt: 'Madeira ocean view',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.madeirabook.com/og-madeirabook.jpg'],
  },
}

export const viewport: Viewport = {
  themeColor: '#10b981',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <AudioEngineProvider>
          <GlobalAmbient />
          <main>{children}</main>
          <Footer />
          <AiConciergeWidget hideLauncherButton />
          <BottomActionBar />
          <WhaleBreathModal />
        </AudioEngineProvider>
        <CookieConsent />
        <AnalyticsWithConsent />
      </body>
    </html>
  )
}
