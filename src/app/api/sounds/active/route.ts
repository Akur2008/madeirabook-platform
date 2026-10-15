import { NextResponse } from 'next/server'

// Stub: single default ambient track from R2.
// Later: resolve per-page sound from a Payload `sounds` collection.
const AMBIENT_URL =
  'https://pub-f74fa992eaf9435c83af63e8d0b4fc51.r2.dev/sounds/ocean-ambient.m4a'

export function GET() {
  return NextResponse.json(
    { url: AMBIENT_URL },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  )
}
