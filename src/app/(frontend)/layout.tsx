import React from 'react'
import './styles.css'
import Footer from './components/Footer'
import { AudioEngineProvider } from '@/audio/AudioEngineProvider'
import SoundButton from '@/components/SoundButton'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <AudioEngineProvider>
          <main>{children}</main>
          <Footer />
          <SoundButton />
        </AudioEngineProvider>
      </body>
    </html>
  )
}
