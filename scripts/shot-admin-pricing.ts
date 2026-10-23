import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const BASE = process.env.VERIFY_URL ?? 'http://localhost:3000'
const OUT_DIR = path.join(process.cwd(), 'tmp-shots')
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'akur2013@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'PilotPass2026!'

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 160)))

  // The Neon connection is flaky in dev — retry navigation until the
  // login form actually renders an email input.
  for (let i = 0; i < 6; i++) {
    await page
      .goto(`${BASE}/admin/login`, {
        waitUntil: 'domcontentloaded',
        timeout: 150000,
      })
      .catch((e) => console.log('[goto]', e.message.split('\n')[0]))
    for (let j = 0; j < 20; j++) {
      if ((await page.locator('input[type="email"], input[name="email"], #field-email').count()) > 0) break
      await page.waitForTimeout(1500)
    }
    if ((await page.locator('input').count()) > 0) break
    console.log(`[login] no form yet (attempt ${i + 1}), reloading`)
  }
  const inputs = await page
    .locator('input')
    .evaluateAll((els) =>
      els.map((e) => {
        const i = e as HTMLInputElement
        return `${i.type} id="${i.id}" name="${i.name}"`
      }),
    )
  console.log('[login] inputs:', inputs.join(' | '))

  const emailInput = page.locator('input[type="email"], input[name="email"], #field-email').first()
  const passInput = page.locator('input[type="password"], input[name="password"], #field-password').first()
  await emailInput.fill(ADMIN_EMAIL)
  await passInput.fill(ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/admin`, { timeout: 90000 })
  console.log('[admin] logged in')

  const res = await page.request.get(
    `${BASE}/api/properties?where[slug][equals]=hotel-orquidea&limit=1`,
  )
  const json = (await res.json()) as { docs?: { id: number }[] }
  const propId = json.docs?.[0]?.id
  console.log('[admin] hotel-orquidea id:', propId)

  await page.goto(`${BASE}/admin/collections/properties/${propId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 150000,
  })
  await page.waitForTimeout(5000)
  const field = page.locator('#field-pricingScenario').first()
  await field.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUT_DIR, 'admin-pricing-field.png') })
  console.log('[admin] field shot saved')

  const helpBtn = field
    .locator('button[aria-label*="pricing scenario" i]')
    .first()
  if (await helpBtn.count()) {
    await helpBtn.click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(OUT_DIR, 'admin-pricing-modal.png') })
    console.log('[admin] modal shot saved')
  } else {
    console.log('[admin] help button NOT FOUND')
    console.log((await field.innerHTML().catch(() => 'n/a')).slice(0, 800))
  }
  await browser.close()
}
run().catch((e) => {
  console.error(e)
  process.exit(1)
})
