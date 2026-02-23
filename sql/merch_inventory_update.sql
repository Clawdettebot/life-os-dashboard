-- Add inventory tracking columns to shop_item table
ALTER TABLE shop_item 
ADD COLUMN IF NOT EXISTS inventory_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

-- Update Adobo Apron count
UPDATE shop_item 
SET inventory_count = 65, 
    updated_at = NOW() 
WHERE name = 'I ❤️ Adobo Apron';

-- Create giveaway inventory table for non-shop items
CREATE TABLE IF NOT EXISTS giveaway_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text CHECK (category IN ('stream_reward', 'fan_pack', 'direct_gift', 'mystery_pack')),
  size text,
  quantity integer DEFAULT 0,
  condition text DEFAULT 'new',
  image_url text,
  source_manifest text,
  status text DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'shipped')),
  reserved_for text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_giveaway_category ON giveaway_inventory(category);
CREATE INDEX IF NOT EXISTS idx_giveaway_status ON giveaway_inventory(status);

-- Create giveaway log to track who received what
CREATE TABLE IF NOT EXISTS giveaway_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id uuid REFERENCES giveaway_inventory(id),
  recipient_name text,
  recipient_email text,
  recipient_address text,
  giveaway_type text,
  reason text,
  stream_id text,
  shipped boolean DEFAULT false,
  tracking_number text,
  created_at timestamp with time zone DEFAULT now()
);

-- Verify updates
SELECT name, inventory_count, available 
FROM shop_item 
WHERE name = 'I ❤️ Adobo Apron';
