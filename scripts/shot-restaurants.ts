import { chromium } from '@playwright/test'

const run = async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto('http://localhost:3000/restaurants', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  })
  await page.waitForTimeout(8000)
  await page.screenshot({ path: 'tmp-shots/restaurants-top.png' })
  await page.evaluate(() => window.scrollTo(0, 1600))
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'tmp-shots/restaurants-mid.png' })
  await page.screenshot({ path: 'tmp-shots/restaurants-full.png', fullPage: true })
  await browser.close()
}
run()
