const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe integration for guap.dad merch
const stripeAPI = {
  // Products
  async createProduct(name, description, images = []) {
    try {
      const product = await stripe.products.create({
        name,
        description,
        images: images.slice(0, 8), // Stripe allows max 8 images
      });
      return { success: true, product };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async updateProduct(productId, updates) {
    try {
      const product = await stripe.products.update(productId, updates);
      return { success: true, product };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async listProducts(limit = 10) {
    try {
      const products = await stripe.products.list({ limit });
      return { success: true, products: products.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Prices
  async createPrice(productId, amount, currency = 'usd') {
    try {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(amount * 100), // Convert to cents
        currency,
      });
      return { success: true, price };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Checkout Sessions
  async createCheckoutSession(items, successUrl, cancelUrl) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: items.map(item => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              description: item.description,
              images: item.images || [],
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity || 1,
        })),
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Cart checkout with multiple items
  async createCartCheckout(cartItems, customerEmail, successUrl, cancelUrl) {
    try {
      const lineItems = cartItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description || '',
            images: item.image ? [item.image] : [],  // Single image per frontend spec
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity || 1,
      }));

      const session = await stripe.checkout.sessions.create({
        customer_email: customerEmail,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          type: 'shop_purchase',  // Matches frontend spec
          items: JSON.stringify(cartItems.map(i => ({ productId: i.productId, qty: i.quantity }))),
        }
      });
      
      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Inventory/Stock tracking via metadata
  async updateStock(productId, stockCount) {
    try {
      const product = await stripe.products.update(productId, {
        metadata: { stock: String(stockCount) },
      });
      return { success: true, product };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Webhook handling
  async constructEvent(payload, signature, secret) {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, secret);
      return { success: true, event };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ═══ SUBSCRIPTIONS ($5.99/month Premium) ═══

  async createSubscriptionProduct(name = 'GuapDad Premium', description = 'Access to exclusive blog content and music') {
    try {
      const product = await stripe.products.create({
        name,
        description,
        type: 'service',
      });
      return { success: true, product };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async createSubscriptionPrice(productId, amount = 5.99, interval = 'month') {
    try {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(amount * 100),
        currency: 'usd',
        recurring: { interval }, // month or year
      });
      return { success: true, price };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async createSubscriptionCheckout(customerEmail, priceId, successUrl, cancelUrl) {
    try {
      const session = await stripe.checkout.sessions.create({
        customer_email: customerEmail,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          trial_period_days: 7, // Optional: 7-day free trial
        },
      });
      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async createCustomerPortalSession(customerId, returnUrl) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return { success: true, subscription };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return { success: true, subscription };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ═══ PAY-WHAT-YOU-WANT MUSIC ($1 min) ═══

  async createMusicProduct(title, artist = 'Guapdad 4000', coverArt = null) {
    try {
      const product = await stripe.products.create({
        name: `${title} - ${artist}`,
        description: 'Digital download - Pay what you want (minimum $1)',
        images: coverArt ? [coverArt] : [],
        type: 'service',
        metadata: {
          type: 'music_track',
          artist,
          title,
        },
      });
      return { success: true, product };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Create a checkout session where customer chooses amount (min $1)
  async createPayWhatYouWantCheckout(productId, customerEmail, trackInfo, successUrl, cancelUrl) {
    try {
      // Custom amount checkout - customer enters amount on Stripe page
      const session = await stripe.checkout.sessions.create({
        customer_email: customerEmail,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product: productId,
            unit_amount: 100, // Default $1.00 (100 cents) - minimum
          },
          adjustable_quantity: {
            enabled: false,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        custom_text: {
          submit: { message: 'Thank you for supporting the music! 🎵' },
        },
        metadata: {
          track_id: trackInfo.trackId,
          track_title: trackInfo.title,
          type: 'track_purchase',
        },
      });

      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Alternative: Create with custom amount field (requires Stripe Elements on frontend)
  async createPaymentIntentWithAmount(amount, customerEmail, trackInfo) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        receipt_email: customerEmail,
        metadata: {
          track_id: trackInfo.trackId,
          track_title: trackInfo.title,
          type: 'track_purchase',
          customer_price: String(amount),
        },
      });
      return { success: true, clientSecret: paymentIntent.client_secret };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ═══ CUSTOMER MANAGEMENT ═══

  async createCustomer(email, name = null) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
      });
      return { success: true, customer };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getCustomer(customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      return { success: true, customer };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Test connection
  async testConnection() {
    try {
      const account = await stripe.account.retrieve();
      return { 
        success: true, 
        account: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

module.exports = { stripe, stripeAPI };
