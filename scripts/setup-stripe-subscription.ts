import Stripe from 'stripe'
import 'dotenv/config'

const PRODUCT_NAME = 'Madeirabook PMS'
const MONTHLY_PRICE_CENTS = 3000
const CURRENCY = 'eur'

// Finds or creates the "Madeirabook PMS" product and its recurring €30/mo
// price, then prints the price id for STRIPE_SUBSCRIPTION_PRICE_ID.
async function run(): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  const stripe = new Stripe(key)

  const found = await stripe.products.search({
    query: `name:"${PRODUCT_NAME}"`,
    limit: 1,
  })
  let product = found.data[0]
  if (!product) {
    product = await stripe.products.create({
      name: PRODUCT_NAME,
      description:
        'Monthly subscription to the Madeirabook owner cabinet (PMS management).',
    })
    console.log(`Created product ${product.id} ("${PRODUCT_NAME}")`)
  } else {
    console.log(`Found product ${product.id} ("${PRODUCT_NAME}")`)
  }

  // Reuse an existing active €30/mo price if one is already attached.
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100,
  })
  let price = prices.data.find(
    (p) =>
      p.recurring?.interval === 'month' &&
      p.recurring.interval_count === 1 &&
      p.unit_amount === MONTHLY_PRICE_CENTS &&
      p.currency === CURRENCY,
  )
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: CURRENCY,
      unit_amount: MONTHLY_PRICE_CENTS,
      recurring: { interval: 'month', interval_count: 1 },
    })
    console.log(`Created price ${price.id} (€30.00/month)`)
  } else {
    console.log(`Reusing price ${price.id} (€30.00/month)`)
  }

  console.log('')
  console.log(`STRIPE_SUBSCRIPTION_PRICE_ID=${price.id}`)
  process.exit(0)
}

run().catch((error) => {
  console.error('Setup error:', error)
  process.exit(1)
})
