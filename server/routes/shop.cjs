// server/routes/shop.cjs - Shop cart routes for Netlify-express proxy
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://yyoxpcsspmjvolteknsn.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3hwY3NzcG1qdm9sdGVrbnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTM5MzAsImV4cCI6MjA3MjI4OTkzMH0.HFFOlmMjiiyQiKAODnz9RAmF3IR7n4KrvGhWp-K_dHM'
);

// Get cart item details
router.post('/cart/details', async (req, res) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array required' });
  }
  
  try {
    // Get available shop items
    const { data: shopItems, error } = await supabase
      .from('shop_item')
      .select('*')
      .eq('available', true);
    
    if (error) throw error;
    
    const cartDetails = [];
    let total = 0;
    
    for (const cartItem of items) {
      const itemId = cartItem.productId || cartItem.id;
      const shopItem = shopItems.find(i => i.id === itemId);
      
      if (!shopItem) {
        return res.status(404).json({ error: `Item not found: ${itemId}` });
      }
      
      const quantity = cartItem.quantity || 1;
      const price = parseFloat(shopItem.price);
      const subtotal = price * quantity;
      
      let images = [];
      try {
        images = JSON.parse(shopItem.images || '[]');
      } catch (e) {
        images = [];
      }
      
      cartDetails.push({
        productId: shopItem.id,
        name: shopItem.name,
        price: price,
        quantity: quantity,
        image: images[0] || null
      });
      
      total += subtotal;
    }
    
    const itemCount = cartDetails.reduce((sum, item) => sum + item.quantity, 0);
    
    res.json({
      items: cartDetails,
      total: total,
      itemCount: itemCount
    });
  } catch (err) {
    console.error('Cart details error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Cart checkout - creates Stripe session
router.post('/cart/checkout', async (req, res) => {
  const { items, customerEmail, successUrl, cancelUrl } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart items required' });
  }
  
  try {
    // Get shop items from Supabase
    const { data: shopItems, error } = await supabase
      .from('shop_item')
      .select('*')
      .eq('available', true);
    
    if (error) throw error;
    
    // Validate and build cart
    const cartDetails = [];
    for (const cartItem of items) {
      const itemId = cartItem.productId || cartItem.id;
      const shopItem = shopItems.find(i => i.id === itemId);
      
      if (!shopItem) {
        return res.status(404).json({ error: `Item not found: ${itemId}` });
      }
      
      let images = [];
      try {
        images = JSON.parse(shopItem.images || '[]');
      } catch (e) {
        images = [];
      }
      
      cartDetails.push({
        productId: shopItem.id,
        name: shopItem.name,
        description: shopItem.description || '',
        price: parseFloat(shopItem.price),
        quantity: cartItem.quantity || 1,
        image: images[0] || null
      });
    }
    
    // Call home server for Stripe checkout
    // In production, this should use the Stripe SDK directly
    const homeServerUrl = process.env.HOME_SERVER_URL || 'http://146.59.145.84:3000';
    
    const response = await fetch(`${homeServerUrl}/api/shop/cart/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartDetails,
        customerEmail,
        successUrl,
        cancelUrl
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Cart checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
