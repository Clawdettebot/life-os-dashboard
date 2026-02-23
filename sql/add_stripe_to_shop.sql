-- Migration: Add Stripe product tracking to shop items
-- Run this in Supabase SQL Editor

-- Add columns for Stripe integration
ALTER TABLE shop_item 
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shop_item_stripe_product 
ON shop_item(stripe_product_id);

-- Update existing items with their Stripe product IDs
UPDATE shop_item SET stripe_product_id = 'prod_U036zob1xJrNPT' WHERE name = 'I ❤️ Adobo Apron';
UPDATE shop_item SET stripe_product_id = 'prod_U036gsOivKdSmn' WHERE name = 'Scam Girl Tour Hoodie';
UPDATE shop_item SET stripe_product_id = 'prod_U036ZJfuhcDwor' WHERE name = 'The Falcon & The Dogg: FLOSS PACK';
UPDATE shop_item SET stripe_product_id = 'prod_U036A1yi9HsVQ7' WHERE name = 'lil guap';
UPDATE shop_item SET stripe_product_id = 'prod_U036CS96nq1QNd' WHERE name = 'SMFWP';

-- Verify updates
SELECT name, stripe_product_id, price FROM shop_item;
