import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '@playwright/test'

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:3000'
const OUT_PATH = path.join(process.cwd(), 'public', 'og', 'explore-map.png')

const run = async () => {
  await mkdir(path.dirname(OUT_PATH), { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.goto(`${BASE_URL}/explore`, { waitUntil: 'domcontentloaded' })
  // Pins render once the lazy leaflet/maplibre init finishes…
  await page.waitForSelector('.explore-pin', { timeout: 30000 })
  // …then base tiles still need a few seconds to stream in.
  await page.waitForTimeout(8000)
  // Zoom in so pins switch to photo mode for the OG image.
  await page.evaluate(() => {
    const map = (window as unknown as {
      __exploreMap?: { setZoom: (zoom: number) => void }
    }).__exploreMap
    map?.setZoom(12)
  })
  await page.waitForSelector('.explore-pin-photo', { timeout: 15000 }).catch(() => {})
  // Photo pins and fresh tiles need a moment to stream in.
  await page.waitForTimeout(8000)
  await page.screenshot({ path: OUT_PATH })
  await browser.close()

  console.log(`Saved ${OUT_PATH}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
