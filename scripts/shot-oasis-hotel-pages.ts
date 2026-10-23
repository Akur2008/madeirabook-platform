import { chromium } from '@playwright/test'

const run = async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  })
  // Emulate the madeiraoasis.com host so /hotels/<slug> resolves through the
  // same middleware path used in production.
  await ctx.setExtraHTTPHeaders({})
  const p = await ctx.newPage()

  for (const slug of ['savoy-palace', 'pestana-casino-park']) {
    await p.goto(`http://localhost:3000/oasis/hotels/${slug}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    })
    await p.waitForTimeout(6000)
    await p.screenshot({ path: `tmp-shots/oasis-${slug}-hero.png` })
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await p.waitForTimeout(2500)
    await p.screenshot({ path: `tmp-shots/oasis-${slug}-mid.png` })
    console.log(`shot ${slug}: title=${await p.title()}`)
  }

  // Offline navigator: Get Directions -> Navigate Offline button exists.
  const dir = p.locator('button:has-text("Get Directions")').first()
  await dir.scrollIntoViewIfNeeded()
  await dir.dispatchEvent('click')
  const navBtn = p.locator('button:has-text("Navigate Offline")')
  await navBtn.waitFor({ timeout: 15000 })
  await p.screenshot({ path: 'tmp-shots/oasis-directions-sheet.png' })
  await navBtn.click()
  await p.locator('text=Get offline navigation').waitFor({ timeout: 15000 })
  await p.screenshot({ path: 'tmp-shots/oasis-offline-nav-modal.png' })
  console.log('offline navigator: OK')
  await browser.close()
}
run().catch((e) => {
  console.error(e)
  process.exit(1)
})
