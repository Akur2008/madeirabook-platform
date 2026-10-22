import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '@playwright/test'

const OUT_DIR = path.join(process.cwd(), 'tmp-shots')
const BASE = process.env.SHOT_BASE ?? 'http://localhost:3000'

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()

  // 1. Hotel page — media block with autoplay video under the title
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${BASE}/oasis/hotels/savoy-palace`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  })
  await page.waitForTimeout(8000)
  const videoState = await page.locator('section video').first().evaluate((v) => {
    const el = v as HTMLVideoElement
    return {
      paused: el.paused,
      muted: el.muted,
      loop: el.loop,
      playsInline: el.playsInline,
      currentTime: el.currentTime,
      src: el.currentSrc,
    }
  })
  console.log('hotel page video state:', JSON.stringify(videoState))
  await page.screenshot({ path: path.join(OUT_DIR, 'hotel-video-under-title.png') })

  // 2. Map BottomSheet — click a stay pin (emerald #10b981)
  const map = await browser.newPage({ viewport: { width: 430, height: 900 } })
  await map.goto(`${BASE}/explore`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  })
  await map.waitForSelector('.explore-pin', { timeout: 90000 })
  await map.waitForTimeout(3000)
  const pins = map.locator('.explore-pin')
  console.log(`pins rendered: ${await pins.count()}`)
  // hotel-orquidea is the stay pin carrying the temp test video; dispatch the
  // DOM click directly because neighboring pins can overlap the hit area
  const hotelPin = map.locator('.explore-pin[title*="Orqu"]')
  if (await hotelPin.count()) {
    await hotelPin.first().dispatchEvent('click')
  } else {
    await pins.first().dispatchEvent('click')
  }
  await map.waitForTimeout(4000)
  const sheetVideo = await map
    .locator('[data-vaul-drawer] video, video')
    .first()
    .evaluate((v) => {
      const el = v as HTMLVideoElement
      return { paused: el.paused, muted: el.muted, loop: el.loop, src: el.currentSrc }
    })
    .catch(() => null)
  console.log('sheet video state:', JSON.stringify(sheetVideo))
  await map.screenshot({ path: path.join(OUT_DIR, 'map-bottomsheet-hotel.png') })

  await browser.close()
}
run().catch((err) => {
  console.error(err)
  process.exit(1)
})
