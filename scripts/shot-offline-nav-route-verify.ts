import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { chromium, devices } from '@playwright/test'

const OUT_DIR = path.join(process.cwd(), 'tmp-shots')
const BASE = process.env.VERIFY_BASE ?? 'http://localhost:3100'

// Mocked guest position — central Funchal.
const GUEST = { latitude: 32.6669, longitude: -16.9241 }

const collectLogs = (logs: string[]) => (msg: { text: () => string }) => {
  const t = msg.text()
  if (t.includes('[OfflineNav]')) logs.push(t)
}

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()

  const openSheet = async (page: import('@playwright/test').Page) => {
    await page.goto(`${BASE}/explore`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    })
    await page.waitForSelector('.explore-pin', { timeout: 60000 })
    await page
      .locator('button:has-text("Decline")')
      .first()
      .click({ timeout: 5000 })
      .catch(() => undefined)
    await page.waitForTimeout(1500)
    await page.locator('.explore-pin').first().dispatchEvent('click')
    await page.waitForSelector('text=Navigate Offline', { timeout: 10000 })
    await page.waitForTimeout(600)
  }

  // ── 1. Geolocation granted → om://route deep link ────────────────
  {
    const ctx = await browser.newContext({
      ...devices['iPhone 13'],
      viewport: { width: 390, height: 844 },
      geolocation: GUEST,
      permissions: ['geolocation'],
    })
    // Slow the fix down so the "Getting your location…" state is visible.
    await ctx.addInitScript(() => {
      const orig =
        navigator.geolocation.getCurrentPosition.bind(navigator.geolocation)
      navigator.geolocation.getCurrentPosition = (success, error, opts) =>
        orig((pos) => setTimeout(() => success(pos), 1200), error, opts)
    })
    const page = await ctx.newPage()
    const logs: string[] = []
    page.on('console', collectLogs(logs))

    await openSheet(page)
    await page.locator('button:has-text("Navigate Offline")').click()

    // The locating indicator must appear while the fix is pending.
    await page.waitForSelector('text=Getting your location', { timeout: 3000 })
    await page.screenshot({
      path: path.join(OUT_DIR, 'offline-nav-locating.png'),
    })
    console.log('locating indicator shown: true')

    // Wait for the deep link attempt + install-modal fallback.
    await page.waitForTimeout(3200)
    const routeLog = logs.find((l) => l.includes('om://route'))
    console.log('route deep link:', routeLog ?? 'MISSING')

    const expected = `sll=${GUEST.latitude},${GUEST.longitude}`
    const routeOk =
      !!routeLog &&
      routeLog.includes('om://route?') &&
      routeLog.includes(expected) &&
      routeLog.includes('&saddr=MyLocation') &&
      routeLog.includes('&dll=') &&
      routeLog.includes('&daddr=') &&
      routeLog.includes('&type=vehicle')
    console.log(`route link well-formed: ${routeOk}`)

    const modalCount = await page
      .locator('text=Get offline navigation')
      .count()
    console.log(`install modal after failed handoff: ${modalCount > 0}`)
    await page.screenshot({
      path: path.join(OUT_DIR, 'offline-nav-route-modal.png'),
    })
    await ctx.close()
  }

  // ── 2. Geolocation denied → om://map pin-only fallback ───────────
  {
    const ctx = await browser.newContext({
      ...devices['iPhone 13'],
      viewport: { width: 390, height: 844 },
    })
    const page = await ctx.newPage()
    const logs: string[] = []
    page.on('console', collectLogs(logs))

    await openSheet(page)
    await page.locator('button:has-text("Navigate Offline")').click()
    await page.waitForTimeout(2600)

    const pinLog = logs.find((l) => l.includes('om://map'))
    const geoWarn = logs.find((l) => l.includes('geolocation failed'))
    console.log('pin fallback link:', pinLog ?? 'MISSING')
    console.log('geo failure logged:', geoWarn ?? 'MISSING')
    const pinOk =
      !!pinLog &&
      pinLog.includes('om://map?v=1&ll=') &&
      !pinLog.includes('om://route')
    console.log(`pin link well-formed: ${pinOk}`)
    await page.screenshot({
      path: path.join(OUT_DIR, 'offline-nav-pin-modal.png'),
    })
    await ctx.close()
  }

  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
