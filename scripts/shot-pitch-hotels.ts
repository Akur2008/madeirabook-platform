import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '@playwright/test'

const OUT_DIR = path.join(process.cwd(), 'tmp-shots')
const BASE = process.env.BASE_URL || 'http://localhost:3003'

const SLUGS = ['oasis-canico', 'galomar-sentido']

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  // Pre-set cookie consent so the banner never overlaps the sheets
  await ctx.addInitScript(() =>
    window.localStorage.setItem('mb_cookie_consent', 'accepted'),
  )

  for (const slug of SLUGS) {
    await page.goto(`${BASE}/oasis/hotels/${slug}`, {
      waitUntil: 'networkidle',
      timeout: 120000,
    })
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: path.join(OUT_DIR, `pitch-${slug}-hero.png`),
    })
    await page.screenshot({
      path: path.join(OUT_DIR, `pitch-${slug}-full.png`),
      fullPage: true,
    })

    // Verify the directions sheet exposes offline navigation
    // (dispatchEvent: overlay widgets can intercept pointer hit-testing)
    await page
      .locator('button:has-text("Get Directions")')
      .first()
      .dispatchEvent('click')
    await page.waitForSelector('text=Navigate Offline', { timeout: 15000 })
    await page.waitForTimeout(800)
    await page.screenshot({
      path: path.join(OUT_DIR, `pitch-${slug}-navigate-offline.png`),
    })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    console.log(`${slug}: shots done`)
  }

  await browser.close()
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
