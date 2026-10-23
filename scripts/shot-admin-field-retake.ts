import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const OUT_DIR = path.join(process.cwd(), 'tmp-shots')
const run = async () => {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  for (let i = 0; i < 6; i++) {
    await page
      .goto('http://localhost:3000/admin/login', { waitUntil: 'domcontentloaded', timeout: 150000 })
      .catch(() => undefined)
    const ok = await page
      .locator('#field-email')
      .waitFor({ state: 'visible', timeout: 45000 })
      .then(() => true)
      .catch(() => false)
    if (ok) break
    console.log(`[login] retry ${i + 1}`)
  }
  await page.locator('#field-email').fill('akur2013@gmail.com')
  await page.locator('#field-password').fill('PilotPass2026!')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/admin', { timeout: 90000 })
  await page.goto('http://localhost:3000/admin/collections/properties/27', { waitUntil: 'domcontentloaded', timeout: 150000 })
  await page.waitForTimeout(6000)
  const field = page.locator('#field-pricingScenario').first()
  await field.waitFor({ state: 'visible', timeout: 60000 })
  await field.screenshot({ path: path.join(OUT_DIR, 'admin-pricing-field.png') })
  console.log('field shot retaken')

  // Orquídea detail CTA — scroll to the #book anchor area
  await page.goto('http://localhost:3000/p/hotel-orquidea', { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(3000)
  await page.locator('#book').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' })).catch(() => undefined)
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT_DIR, 'orquidea-detail-cta.png') })
  console.log('cta shot saved')
  await browser.close()
}
run().catch((e) => { console.error(e); process.exit(1) })
