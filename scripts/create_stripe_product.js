const Stripe = require('stripe');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function createProduct() {
  console.log('💿 Creating Product: A Few Things...');

  try {
    // 1. Create Product
    const product = await stripe.products.create({
      name: "A Few Things (feat. Jai'len Josey)",
      description: "Digital Download (MP3). Pay what you want to support the art.",
      images: ['https://yyoxpcsspmjvolteknsn.supabase.co/storage/v1/object/public/akeems%20admin/music/Projects/Handsome/cover.jpg'], // Placeholder or use Supabase URL if valid
    });

    console.log(`✅ Product Created: ${product.id}`);

    // 2. Create Price (Pay What You Want)
    // Custom amount needs a Price with `custom_unit_amount` enabled
    const price = await stripe.prices.create({
      currency: 'usd',
      custom_unit_amount: {
        enabled: true,
        minimum: 100, // $1.00 minimum
        preset: 500,  // $5.00 suggested
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
      // allow_promotion_codes: true, // Disabled for custom_unit_amount
    });

    console.log(`🎉 Payment Link: ${paymentLink.url}`);

  } catch (e) {
    console.error('❌ Stripe Error:', e.message);
  }
}

createProduct();
