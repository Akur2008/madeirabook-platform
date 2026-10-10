import { chromium } from '@playwright/test'

const BASE = 'http://localhost:3001'

const browser = await chromium.launch({
  args: ['--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage()

page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text())
})
page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message))

await page.goto(`${BASE}/audio-test`, { waitUntil: 'networkidle' })
await page.screenshot({ path: '/tmp/audio-test-1-initial.png' })

const stateText = async () =>
  page.locator('p.text-sm.text-gray-400').first().innerText()
const volume = async (name) =>
  page.locator(`div:has(> div:text-is("${name}")) > div.font-mono`).first().innerText()

console.log('initial:', await stateText())
console.log('start button visible:', await page.getByText('▶ Start Engine').isVisible())

// Start engine (real user gesture via click)
await page.getByText('▶ Start Engine').click()
await page.waitForTimeout(500)
console.log('after start:', await stateText())

// Play ambient
await page.getByText('Play Ambient', { exact: true }).click()
await page.waitForTimeout(2500)
console.log('ambient vol:', await volume('globalAmbient'))
console.log('after ambient:', await stateText())

// Play sluice
await page.getByText('Play Sluice').click()
await page.waitForTimeout(500)
console.log('sluice playing:', await page.locator('div:has(> div:text-is("sluiceBuffer"))').innerText())

// Toggle video -> duck
await page.getByText('Toggle Video').click()
await page.waitForTimeout(800)
console.log('ambient vol after duck (expect ~0.05):', await volume('globalAmbient'))

// Toggle video off -> unduck
await page.getByText('Toggle Video').click()
await page.waitForTimeout(800)
console.log('ambient vol after unduck (expect ~0.25):', await volume('globalAmbient'))

// Crossfade
await page.getByText('Crossfade Ambient').click()
await page.waitForTimeout(2000)
console.log('after crossfade:', await page.locator('div:has(> div:text-is("globalAmbient"))').innerText())

// localStorage
const flag = await page.evaluate(() => localStorage.getItem('madeirabook_audio_started'))
console.log('localStorage flag:', flag)

await page.screenshot({ path: '/tmp/audio-test-2-running.png', fullPage: true })

// SoundButton on another page
await page.goto(`${BASE}/legal/privacy`, { waitUntil: 'networkidle' })
const soundBtn = page.locator('button[aria-label*="sound" i]')
console.log('soundbutton on legal page:', await soundBtn.count())
await page.screenshot({ path: '/tmp/audio-test-3-soundbutton.png' })

// Stop all back on test page
await page.goto(`${BASE}/audio-test`, { waitUntil: 'networkidle' })
await page.getByText('Stop All').click()
await page.waitForTimeout(500)
console.log('after stopAll:', await stateText())

await browser.close()
console.log('DONE')
