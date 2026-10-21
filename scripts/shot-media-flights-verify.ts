import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '@playwright/test'

const OUT_DIR = path.join(process.cwd(), 'tmp-shots')
const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
// The local TRAVELPAYOUTS_TOKEN is stale (upstream 401), so the local route
// 502s. Proxy browser calls to production to verify the UI with real fares.
const PROD_API = 'https://www.madeirabook.com'

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('pageerror', (err) => console.log('[pageerror]', err.message))

  await page.route('**/api/travelpayouts/calendar*', async (route) => {
    const upstream = new URL(route.request().url())
    const res = await route.fetch({
      url: `${PROD_API}${upstream.pathname}${upstream.search}`,
    })
    await route.fulfill({ response: res })
  })

  // --- /flights: calendar grid with live prices ---
  await page.goto(`${BASE}/flights`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.locator('button', { hasText: '€' }).first().waitFor({ timeout: 60000 })
  await page.waitForTimeout(800)
  const priceCells = await page.locator('button', { hasText: '€' }).count()
  console.log(`flights: price cells rendered: ${priceCells}`)
  await page.screenshot({ path: path.join(OUT_DIR, 'flights-calendar.png') })

  // Pick a priced day -> our BottomSheet (no Aviasales redirect).
  await page.locator('button', { hasText: '€' }).first().click()
  const drawer = page.locator('[data-vaul-drawer]')
  await drawer.waitFor({ state: 'visible', timeout: 15000 })
  await page.getByRole('button', { name: /Book on Aviasales/i }).waitFor({ timeout: 10000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT_DIR, 'flights-sheet.png') })
  console.log('flights: sheet opened on date pick, Book on Aviasales CTA present')

  // --- /oasis: video circles hidden, 3 audio tracks ---
  await page.goto(`${BASE}/oasis`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(3000)
  const videoCircles = await page
    .locator('button[aria-label^="Play video"]')
    .count()
  const audioTracks = await page.locator('audio').count()
  console.log(`oasis: video circles = ${videoCircles} (want 0), audio tracks = ${audioTracks} (want 3)`)
  await page.screenshot({ path: path.join(OUT_DIR, 'oasis-hero.png') })

  // --- /oasis/hotels/barcelo-funchal-oldtown: new cover ---
  await page.goto(`${BASE}/oasis/hotels/barcelo-funchal-oldtown`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  })
  const heroImg = page.locator('section img').first()
  await heroImg.waitFor({ state: 'visible', timeout: 30000 })
  const src = await heroImg.getAttribute('src')
  const loaded = await heroImg.evaluate((el: HTMLImageElement) => el.naturalWidth > 0)
  console.log(`barcelo: hero loaded=${loaded} src=${src}`)
  await page.screenshot({ path: path.join(OUT_DIR, 'hotel-barcelo.png'), fullPage: false })

  await browser.close()
}
run().catch((err) => {
  console.error(err)
  process.exit(1)
})
