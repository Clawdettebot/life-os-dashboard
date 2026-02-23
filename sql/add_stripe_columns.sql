-- Add Stripe product ID to shop_item table
ALTER TABLE shop_item 
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shop_item_stripe_product 
ON shop_item(stripe_product_id);
