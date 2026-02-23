# Inventory Update SQL
# Run this in Supabase SQL Editor to add tracking columns

-- Add inventory tracking to shop_item
ALTER TABLE shop_item 
ADD COLUMN IF NOT EXISTS inventory_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS item_category TEXT DEFAULT 'shop';

-- Update all shop items with their inventory counts from manifest
UPDATE shop_item SET inventory_count = 552, item_category = 'shop' WHERE name = 'GUAP ARCH HOLO STICKERS';
UPDATE shop_item SET inventory_count = 126, item_category = 'shop' WHERE name = 'FLOSSIN KEY CHAIN';
UPDATE shop_item SET inventory_count = 92, item_category = 'shop' WHERE name = 'Chicken Adobo Apron Red';
UPDATE shop_item SET inventory_count = 10, item_category = 'shop' WHERE name = 'Chicken Adobo Apron Black';
UPDATE shop_item SET inventory_count = 70, item_category = 'shop' WHERE name = 'GUAP SQUISH ATMS';
UPDATE shop_item SET inventory_count = 38, item_category = 'shop' WHERE name = 'RIOT LOOT FACE MASK';
UPDATE shop_item SET inventory_count = 25, item_category = 'shop' WHERE name = 'Lil Guap Plushy';
UPDATE shop_item SET inventory_count = 25, item_category = 'shop' WHERE name = 'Identity Tee L';
UPDATE shop_item SET inventory_count = 20, item_category = 'shop' WHERE name = '(FOR WHITE PEOPLE TO WEAR) TEE XL';
UPDATE shop_item SET inventory_count = 15, item_category = 'shop' WHERE name = 'Handsome Hoodie XL';
UPDATE shop_item SET inventory_count = 14, item_category = 'shop' WHERE name = 'Scam Boy Mesh Shorts L';
UPDATE shop_item SET inventory_count = 12, item_category = 'shop' WHERE name = 'GUAP TEE Large';
UPDATE shop_item SET inventory_count = 11, item_category = 'shop' WHERE name = 'Scam Girl Crop Top Jacket L';
UPDATE shop_item SET inventory_count = 11, item_category = 'shop' WHERE name = 'ETHIKA FALCON BOXERS X-Large';
UPDATE shop_item SET inventory_count = 65, item_category = 'shop' WHERE name = 'I ❤️ Adobo Apron';

-- Create giveaway inventory table
CREATE TABLE IF NOT EXISTS giveaway_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  sku text,
  qty integer DEFAULT 0,
  size text,
  category text DEFAULT 'giveaway',
  status text DEFAULT 'available',
  reserved_for text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Insert giveaway items (qty <= 10 from manifest)
INSERT INTO giveaway_inventory (name, sku, qty, size, category, notes) VALUES
('Scam Boy Mesh Shorts XL', 'GUAP4042S', 9, 'XL', 'giveaway', 'Stream reward'),
('Steal Money From White People Hoodie S', 'GUAP-STEALMONEY-HD-S', 9, 'S', 'giveaway', 'Stream reward'),
('BLACK FRIDAY TEE 2X-Large', 'DRM-GUAP-BFT-BLK-SH-2XL', 9, '2XL', 'giveaway', 'Mystery pack candidate'),
('1176 BLK Sweatpants X-Large', 'GUAP4076S', 8, 'XL', 'giveaway', 'Stream reward'),
('Identity Tee M', 'GUAP4018S', 8, 'M', 'giveaway', 'Stream reward'),
('MINI TROPHIES', 'DRM-GUAP-TRPH-MIS', 8, 'OS', 'giveaway', 'Mystery pack item'),
('Moto-X-Jersey 2X', 'GUAP4032S', 8, '2XL', 'giveaway', 'Mystery pack candidate'),
('Moto-X-Jersey XL', 'GUAP4031S', 8, 'XL', 'giveaway', 'Stream reward'),
('Scam Boy Mesh Shorts 2XL', 'GUAP4043S', 8, '2XL', 'giveaway', 'Mystery pack candidate'),
('Arch Hat', 'GUAP4090S', 6, 'OS', 'giveaway', 'Mystery pack item'),
('Hairless Horseman Snapback', 'GUAP4137S', 5, 'OS', 'giveaway', 'Mystery pack item'),
('LIL SCAMMER BUCKET HAT', 'DRM-GUAP-LSCM-BKT-HT', 2, 'OS', 'giveaway', 'Mystery pack item'),
('GUAP RHINESTONE HAT', 'DRM-GUAP-RHST-BLK-HT', 2, 'OS', 'giveaway', 'Mystery pack item'),
('Body Pillow', 'GUAP4108S', 5, 'OS', 'giveaway', 'Special stream reward');

-- Verify
SELECT item_category, COUNT(*) as count, SUM(inventory_count) as total_units 
FROM shop_item 
GROUP BY item_category;
