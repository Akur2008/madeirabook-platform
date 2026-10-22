import { chromium } from '@playwright/test'

// Golden-card verification: Orquídea pin -> BottomSheet on both maps.
const run = async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'])
  const page = await ctx.newPage()
  const PIN = '[title="Hotel Orquídea — Funchal Center"]'

  const clickPinAndCheck = async (label: string, shot: string, expectedHref: string) => {
    await page.locator(PIN).first().waitFor({ state: 'visible', timeout: 120000 })
    await page.locator(PIN).first().dispatchEvent("click")
    await page.waitForTimeout(1800)
    const texts = {
      title: await page.locator('h2:has-text("Hotel Orquídea")').count(),
      navOffline: await page.locator('button:has-text("Navigate Offline")').count(),
      copyBtn: await page.locator('button:has-text("Copy for Maps")').count(),
      stepNote: await page.locator('text=/Step 1: Download Organic Maps/').count(),
      viewHotel: await page.locator('a:has-text("View Hotel")').count(),
    }
    const href = await page.locator('a:has-text("View Hotel")').first().getAttribute('href').catch(() => null)
    console.log(`\n[${label}]`, JSON.stringify(texts), '| href:', href, '| expect:', expectedHref, href === expectedHref ? 'OK' : 'MISMATCH')
    await page.screenshot({ path: `tmp-shots/${shot}`, timeout: 15000 }).catch(() => console.log('shot failed', shot))
    await page.locator('button:has-text("Copy for Maps")').first().click().catch(() => undefined)
    await page.waitForTimeout(400)
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => 'DENIED'))
    console.log(`[${label}] clipboard:`, clip)
  }

  // 1. madeirabook homepage map
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.locator(PIN).first().waitFor({ state: 'attached', timeout: 120000 })
  await page.locator('#map').scrollIntoViewIfNeeded()
  await page.waitForTimeout(2500)
  await clickPinAndCheck('madeirabook / homepage map', 'orq-card-madeirabook.png', '/p/hotel-orquidea')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)

  // 2. /explore map
  await page.goto('http://localhost:3000/explore', { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(4000)
  await clickPinAndCheck('madeirabook /explore', 'orq-card-explore.png', '/p/hotel-orquidea')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)

  // 3. Oasis map (localhost serves /oasis; madeiraoasis.com serves it at /)
  await page.goto('http://localhost:3000/oasis', { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(4000)
  await page.locator('button[aria-label="Open the hotel map"]').first().click()
  await page.waitForTimeout(5000)
  await clickPinAndCheck('oasis map modal', 'orq-card-oasis.png', '/oasis/hotels/hotel-orquidea')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)

  // 4. Fallback modal (desktop click -> modal directly)
  await page.locator('button:has-text("Navigate Offline")').first().click().catch(() => undefined)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'tmp-shots/orq-offline-modal.png', timeout: 15000 }).catch(() => undefined)
  console.log('modal step text:', await page.locator('text=/1. Download the app/').count())

  // 5. Hotel pages status
  for (const url of ['/p/hotel-orquidea', '/oasis/hotels/hotel-orquidea']) {
    const r = await page.goto(`http://localhost:3000${url}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
    console.log(`${url} ->`, r?.status())
    await page.waitForTimeout(1500)
  }
  await page.screenshot({ path: 'tmp-shots/orq-oasis-hotel-page.png', timeout: 15000 }).catch(() => undefined)

  await browser.close()
}
run().catch((e) => { console.error(e); process.exit(1) })
