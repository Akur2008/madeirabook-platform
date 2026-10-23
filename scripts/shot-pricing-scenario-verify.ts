import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '@playwright/test'

// Pricing-scenario verification shots:
//  1. Orquídea map card — no price, no Book button.
//  2. Orquídea detail page — Contact us via Email instead of Book.
//  3. /book search — all three Smoobu apartments with live prices.
//  4. Admin — pricingScenario field + help modal.
const BASE = process.env.VERIFY_URL ?? 'http://localhost:3000'
const OUT_DIR = path.join(process.cwd(), 'tmp-shots')
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'akur2013@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'PilotPass2026!'

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  page.on('pageerror', (err) => console.log('[pageerror]', err.message))

  // --- 1. Orquídea card on /explore -----------------------------------------
  await page.goto(`${BASE}/explore`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  const pin = page.locator('[title="Hotel Orquídea — Funchal Center"]').first()
  await pin.waitFor({ state: 'attached', timeout: 120000 })
  await page.waitForTimeout(4000)
  await pin.dispatchEvent('click')
  await page.waitForTimeout(2000)
  const cardChecks = {
    price: await page.locator('text=/€\\d+/').count(),
    bookBtn: await page.locator('button:has-text("Book")').count(),
    navOffline: await page.locator('button:has-text("Navigate Offline")').count(),
    viewDetails: await page
      .locator('a:has-text("View Details"), a:has-text("View Hotel")')
      .count(),
  }
  console.log('[orquidea card]', JSON.stringify(cardChecks))
  await page.screenshot({ path: path.join(OUT_DIR, 'orquidea-card.png') })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)

  // --- 2. Orquídea detail page ----------------------------------------------
  await page.goto(`${BASE}/p/hotel-orquidea`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  })
  await page.waitForTimeout(2500)
  const detailChecks = {
    contactLink: await page.locator('a[href^="mailto:hello@madeiraoasis.com"]').count(),
    bookDrawerBtn: await page.locator('button:has-text("Book this stay")').count(),
    priceLine: await page.locator('text=/€\\d+\\s*(\\/|per|a )?night/').count(),
  }
  console.log('[orquidea detail]', JSON.stringify(detailChecks))
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUT_DIR, 'orquidea-detail.png') })

  // --- 3. /book search: all three apartments --------------------------------
  await page.goto(`${BASE}/book`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(6000)
  // Pick a future range in the visible month (today is Oct 23, 2026). Retry
  // the clicks until React registers both ends of the range.
  const searchBtn = page.getByRole('button', { name: /^Search$/ })
  for (let i = 0; i < 8; i++) {
    await page
      .locator('button[aria-label*="October 28th, 2026"]')
      .first()
      .click()
      .catch(() => undefined)
    await page.waitForTimeout(500)
    await page
      .locator('button[aria-label*="October 31st, 2026"]')
      .first()
      .click()
      .catch(() => undefined)
    await page.waitForTimeout(800)
    if (!(await searchBtn.isDisabled())) break
    console.log(`[search] range not set yet (attempt ${i + 1})`)
  }
  await searchBtn.click()
  const drawer = page.locator('[data-vaul-drawer]')
  await drawer.waitFor({ state: 'visible', timeout: 120000 })
  await page
    .locator('text=/Penthouse on the Beach Madeira/')
    .first()
    .waitFor({ timeout: 120000 })
    .catch(() => console.log('penthouse not visible in drawer'))
  await page.waitForTimeout(1000)
  const names = await drawer.locator('p.font-medium').allTextContents()
  console.log('[search results]', JSON.stringify(names))
  await page.screenshot({ path: path.join(OUT_DIR, 'search-3-apartments.png') })

  // --- 4. Admin: pricingScenario field + help modal --------------------------
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.fill('#field-email', ADMIN_EMAIL)
  await page.fill('#field-password', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/admin`, { timeout: 30000 })
  console.log('[admin] logged in')

  // find the property id for hotel-orquidea via the admin API
  const res = await page.request.get(
    `${BASE}/api/properties?where[slug][equals]=hotel-orquidea&limit=1`,
  )
  const json = (await res.json()) as { docs?: { id: number }[] }
  const propId = json.docs?.[0]?.id
  console.log('[admin] hotel-orquidea id:', propId)

  await page.goto(`${BASE}/admin/collections/properties/${propId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(3000)
  const field = page.locator('.field-type.select', { hasText: 'Pricing Scenario' }).first()
  await field.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUT_DIR, 'admin-pricing-field.png') })

  const helpBtn = field
    .locator('button[aria-label*="pricing scenario" i], button[aria-label*="help" i]')
    .first()
  if (await helpBtn.count()) {
    await helpBtn.click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(OUT_DIR, 'admin-pricing-modal.png') })
    console.log('[admin] help modal shot taken')
  } else {
    console.log('[admin] help button NOT FOUND; dumping label area')
    console.log(await field.innerHTML().catch(() => 'n/a'))
  }

  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
