import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '@playwright/test'

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:3000'
const OUT_DIR = path.join(process.cwd(), 'tmp-shots')

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()

  // 1) Ambassador map — should show only curated pins (9), no gold Oasis stars
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('PAGE ERR:', m.text())
  })
  page.on('pageerror', (e) => console.log('PAGEERR:', e.message))
  await page.goto(`${BASE_URL}/m/merlin_visual`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('.explore-pin', { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(8000)
  await page.screenshot({ path: path.join(OUT_DIR, 'm-merlin_visual.png') })
  const pinCount = await page.locator('.explore-pin').count()
  console.log(`merlin_visual pins: ${pinCount}`)

  // 2) /oasis — should render the map with zero hotel pins
  const page2 = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page2.goto(`${BASE_URL}/oasis`, { waitUntil: 'domcontentloaded' })
  await page2.waitForTimeout(9000)
  await page2.screenshot({ path: path.join(OUT_DIR, 'oasis-empty.png') })
  const oasisPins = await page2.locator('.oasis-pin, .explore-pin').count()
  console.log(`oasis pins: ${oasisPins}`)

  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
