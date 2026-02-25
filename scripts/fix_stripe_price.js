const Stripe = require('stripe');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PRODUCT_ID = 'prod_U2gei9aH6saPPn'; // "A Few Things" product ID from previous run

async function fixPrice() {
  console.log('🔧 Fixing Price for A Few Things...');

  try {
    // 1. Create New Price ($1 min, $1 preset)
    const price = await stripe.prices.create({
      currency: 'usd',
      custom_unit_amount: {
        enabled: true,
        minimum: 100, // $1.00 minimum
        preset: 100,  // $1.00 preset (starts at $1)
      },
      product: PRODUCT_ID,
    });

    console.log(`✅ New Price Created: ${price.id}`);

    // 2. Create New Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: {
          custom_message: 'Thank you for supporting! Check your email for the download link.',
        },
      },
    });

    console.log(`🎉 New Payment Link: ${paymentLink.url}`);

  } catch (e) {
    console.error('❌ Stripe Error:', e.message);
  }
}

fixPrice();
