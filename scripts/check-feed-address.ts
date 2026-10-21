import 'dotenv/config'
import { generateHotelCenterFeed, toHotelCenterXml } from '../src/lib/googleHotelCenter'

async function main() {
  const feed = await generateHotelCenterFeed({
    checkin: '2026-11-19',
    checkout: '2026-11-24',
    hotels: ['hotel-orquidea'],
  })
  if (!feed || !feed.hotels.length) {
    console.log('feed null')
    process.exit(1)
  }
  console.log('address:', JSON.stringify(feed.hotels[0].property.address))
  const addrBlock = toHotelCenterXml(feed).match(/<Address>[\s\S]*<\/Address>/)
  console.log(addrBlock ? addrBlock[0] : 'NO ADDRESS BLOCK')
  process.exit(0)
}
main().catch((e) => {
  console.error('ERR:', e)
  process.exit(1)
})
