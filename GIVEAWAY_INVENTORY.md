# Giveaway Inventory System

## Overview
Track merch that's NOT for sale - used for stream rewards, fan appreciation, community engagement.

## Categories

### 1. STREAM REWARDS (Active giveaways)
Used during live streams as incentives:
- Highest donor of the stream
- Best song submission (during Nero music streams)
- Chat engagement winners
- Subscriber milestones

### 2. FAN PACKS (Mystery bundles)
Combine 3-5 small/misc items into a "Care Package":
- Loyal community members
- Active Discord participants
- Social media supporters

### 3. DIRECT GIFTS (Personal)
- Collaborators
- Industry connections
- Special occasions

## Database Schema

```sql
-- Giveaway inventory table
CREATE TABLE giveaway_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text, -- 'stream_reward', 'fan_pack', 'direct_gift'
  size text, -- 'S', 'M', 'L', 'XL', '2XL', '3XL', 'misc'
  quantity integer DEFAULT 0,
  condition text DEFAULT 'new', -- 'new', 'minor_defect', 'sample'
  image_url text,
  source_manifest text, -- Reference to original manifest
  status text DEFAULT 'available', -- 'available', 'reserved', 'shipped'
  reserved_for text, -- Who it's being held for
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Giveaway tracking (who got what)
CREATE TABLE giveaway_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id uuid REFERENCES giveaway_inventory(id),
  recipient_name text,
  recipient_email text,
  recipient_address text,
  giveaway_type text, -- 'stream_reward', 'fan_pack', 'direct_gift', 'mystery_box'
  reason text, -- Why they got it
  stream_id text, -- If from a stream
  shipped boolean DEFAULT false,
  tracking_number text,
  created_at timestamp DEFAULT now()
);
```

## Size-Based Strategy

### Standard Sizes (S, M, L, XL)
- **Shop:** If 10+ quantity
- **Giveaway:** If <10 quantity OR odd colors/variations

### Extended Sizes (2XL, 3XL+)
- **Giveaway Priority:** These are harder to sell, perfect for fan appreciation
- **Bundle:** Create "2XL/3XL Mystery Packs" for those size communities

### No Size/Accessories
- **Bundle into Packs:** Stickers, pins, misc items
- **Stream Rewards:** Toss in as bonuses

## Mystery Pack Ideas

### "Golden Ticket Pack" (High Value)
- 1x Random shirt/hoodie
- 1x Accessory (pin, sticker pack)
- 1x Digital download code
- Handwritten note

### "Stream Survivor Pack" (Community)
- For active chat participants
- Mix of small items
- Bragging rights

### "OG Supporter Pack" (Loyalty)
- Long-time followers
- Mix of old/new merch
- Exclusive items

## Integration Ideas

### With Music Streams (Nero Sessions)
- Best song submission = Care Package
- Highest queue donor = Pick from giveaway inventory
- Random drops in chat

### With Shop Sales
- Orders over $100 = Free mystery item from giveaway stock
- Bundle purchases = Chance to win rare giveaway item

### With Social Media
- Engagement contests
- Retweet giveaways
- Comment-to-win

## Tracking

**For you:**
- Update giveaway_inventory when CSV comes in
- Mark items as reserved when allocated
- Track shipments in giveaway_log

**For recipients:**
- Keep addresses in giveaway_log
- Send tracking numbers
- Note any special requests
