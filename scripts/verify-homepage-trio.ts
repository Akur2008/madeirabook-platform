import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '@playwright/test'

// Reloads the homepage 3x and records which clip each video slot picked,
// then takes desktop + mobile screenshots into tmp-screenshots/.

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:3100'
const OUT_DIR = path.join(process.cwd(), 'tmp-screenshots', 'homepage-trio')

const collect = async (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('video')).map((v) => ({
      src: v.currentSrc || v.src || '',
      readyState: v.readyState,
      paused: v.paused,
      label: v.getAttribute('aria-label') ?? '',
    })),
  )

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()

  for (let i = 1; i <= 3; i++) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${BASE_URL}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 240_000,
    })
    // Trio clips mount on hydration; give posters a moment to paint.
    await page.waitForSelector('section[aria-label="Madeira landscapes"] video', {
      timeout: 120000,
    })
    await page.waitForTimeout(4000)
    const videos = await collect(page)
    console.log(`--- load ${i} ---`)
    videos.forEach((v) =>
      console.log(
        `  ${v.src.split('/').pop()}  readyState=${v.readyState} paused=${v.paused}  "${v.label}"`,
      ),
    )
    await page.screenshot({
      path: path.join(OUT_DIR, `desktop-load-${i}-full.png`),
      fullPage: true,
    })
    await page.close()
  }

  // Mobile pass — 375px, check playback + horizontal overflow.
  const mob = await browser.newPage({ viewport: { width: 375, height: 812 } })
  await mob.goto(`${BASE_URL}/`, {
    waitUntil: 'domcontentloaded',
    timeout: 240_000,
  })
  await mob
    .waitForSelector('section[aria-label="Madeira landscapes"] video', { timeout: 120000 })
    .catch(() => {})
  await mob.waitForTimeout(5000)
  const mobVideos = await collect(mob)
  const overflow = await mob.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  console.log('--- mobile 375px ---')
  mobVideos.forEach((v) =>
    console.log(
      `  ${v.src.split('/').pop()}  readyState=${v.readyState} paused=${v.paused}`,
    ),
  )
  console.log(`  horizontal overflow: ${overflow}px`)
  await mob.screenshot({ path: path.join(OUT_DIR, 'mobile-375-full.png'), fullPage: true })
  await mob.close()

  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
