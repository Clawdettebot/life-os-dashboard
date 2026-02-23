-- Subscriptions table for premium members
CREATE TABLE subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL,
  status text DEFAULT 'active', -- active, canceled, past_due
  plan_type text DEFAULT 'premium', -- premium, etc
  price decimal(10,2) DEFAULT 5.99,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  canceled_at timestamp with time zone
);

-- Music tracks for individual sale (pay what you want)
CREATE TABLE music_tracks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  artist text DEFAULT 'Guapdad 4000',
  album text,
  duration text, -- e.g., "3:45"
  audio_url text NOT NULL, -- Full song URL
  preview_url text, -- 30-second preview
  cover_art text,
  bpm integer,
  key text,
  genre text,
  lyrics text,
  is_premium boolean DEFAULT false, -- Only for subscribers?
  min_price decimal(10,2) DEFAULT 1.00, -- Minimum $1
  suggested_price decimal(10,2) DEFAULT 2.00, -- Suggested $2
  stripe_product_id text,
  is_active boolean DEFAULT true,
  release_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Track individual song purchases (pay what you want)
CREATE TABLE track_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid REFERENCES music_tracks(id),
  customer_email text NOT NULL,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  amount_paid decimal(10,2) NOT NULL, -- What they actually paid
  download_url text, -- Signed URL for download
  download_count integer DEFAULT 0,
  expires_at timestamp with time zone, -- Download link expiration
  created_at timestamp with time zone DEFAULT now()
);

-- Update blog_post table to add premium flag
ALTER TABLE blog_post ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE blog_post ADD COLUMN IF NOT EXISTS required_tier text DEFAULT 'free'; -- free, premium

-- Index for faster queries
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_email ON subscriptions(user_email);
CREATE INDEX idx_track_purchases_email ON track_purchases(customer_email);
CREATE INDEX idx_track_purchases_track ON track_purchases(track_id);
CREATE INDEX idx_music_tracks_active ON music_tracks(is_active);
