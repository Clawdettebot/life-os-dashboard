const Stripe = require('stripe');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const songs = [
  { name: "Daddy", description: "Digital Download (MP3). Pay what you want to support the art." },
  { name: "Paysexual", description: "Digital Download (MP3). Pay what you want to support the art." },
  { name: "Champagne Showers", description: "Digital Download (MP3). Pay what you want to support the art." }
];

async function createProducts() {
  console.log('💿 Creating Song Products...');

  for (const song of songs) {
    try {
      // 1. Create Product
      const product = await stripe.products.create({
        name: song.name,
        description: song.description,
      });

      console.log(`✅ Product Created: ${product.id} (${song.name})`);

      // 2. Create Price ($1 min, $1 preset)
      const price = await stripe.prices.create({
        currency: 'usd',
        custom_unit_amount: {
          enabled: true,
          minimum: 100, // $1.00
          preset: 100, // $1.00
        },
        product: product.id,
      });

      console.log(`✅ Price Created: ${price.id}`);

      // 3. Create Payment Link
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

      console.log(`🎉 ${song.name} Payment Link: ${paymentLink.url}`);
      console.log('---');

    } catch (e) {
      console.error(`❌ ${song.name} Error:`, e.message);
    }
  }
}

createProducts();
