-- ============================================
-- TechHaven — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- ===========================================
-- 1. Products Table with Full-Text Search
-- ===========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT,
  tags TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search vector (auto-generated, weighted)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C')
  ) STORED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING gin(search_vector);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_brand_idx ON products(brand);
CREATE INDEX IF NOT EXISTS products_slug_idx ON products(slug);
CREATE INDEX IF NOT EXISTS products_is_active_idx ON products(is_active);
CREATE INDEX IF NOT EXISTS products_is_featured_idx ON products(is_featured);
CREATE INDEX IF NOT EXISTS products_price_idx ON products(price);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- ===========================================
-- 2. Search History (for analytics & recs)
-- ===========================================
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS search_history_session_idx ON search_history(session_id);
CREATE INDEX IF NOT EXISTS search_history_created_idx ON search_history(created_at);


-- ===========================================
-- 3. Product Views (for recommendations)
-- ===========================================
CREATE TABLE IF NOT EXISTS product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_views_session_idx ON product_views(session_id);
CREATE INDEX IF NOT EXISTS product_views_product_idx ON product_views(product_id);
CREATE INDEX IF NOT EXISTS product_views_created_idx ON product_views(created_at);


-- ===========================================
-- 4. Database Functions
-- ===========================================

-- Get popular searches (for analytics & search suggestions)
CREATE OR REPLACE FUNCTION get_popular_searches(search_limit INTEGER DEFAULT 10)
RETURNS TABLE(query TEXT, search_count BIGINT) AS $$
BEGIN
  RETURN QUERY
    SELECT sh.query, COUNT(*) as search_count
    FROM search_history sh
    WHERE sh.created_at > NOW() - INTERVAL '30 days'
    GROUP BY sh.query
    ORDER BY search_count DESC
    LIMIT search_limit;
END;
$$ LANGUAGE plpgsql;


-- Get trending products (most viewed in last 7 days)
CREATE OR REPLACE FUNCTION get_trending_products(trending_limit INTEGER DEFAULT 8)
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
    SELECT p.*
    FROM products p
    INNER JOIN (
      SELECT pv.product_id, COUNT(*) as view_count
      FROM product_views pv
      WHERE pv.created_at > NOW() - INTERVAL '7 days'
      GROUP BY pv.product_id
      ORDER BY view_count DESC
      LIMIT trending_limit
    ) trending ON p.id = trending.product_id
    WHERE p.is_active = true
    ORDER BY trending.view_count DESC;
END;
$$ LANGUAGE plpgsql;


-- ===========================================
-- 5. Storage Bucket for Product Images
-- ===========================================
-- Run this separately or create the bucket via the Supabase Dashboard:
-- Storage > New Bucket > Name: "product-images" > Public: Yes

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated uploads (service role will handle this)
CREATE POLICY "Service role upload access for product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Service role update access for product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

CREATE POLICY "Service role delete access for product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');


-- ===========================================
-- 6. Row Level Security (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Products: Public read, service-role write
CREATE POLICY "Public read access for products"
ON products FOR SELECT
USING (true);

CREATE POLICY "Service role full access for products"
ON products FOR ALL
USING (true)
WITH CHECK (true);

-- Search history: service-role only
CREATE POLICY "Service role access for search_history"
ON search_history FOR ALL
USING (true)
WITH CHECK (true);

-- Product views: service-role only
CREATE POLICY "Service role access for product_views"
ON product_views FOR ALL
USING (true)
WITH CHECK (true);


-- ===========================================
-- 7. Seed Data — Sample Products
-- ===========================================
INSERT INTO products (name, slug, description, price, sale_price, category, subcategory, brand, tags, specifications, stock, is_featured, rating, review_count, images) VALUES

-- Mobile Accessories
('Premium Tempered Glass Screen Protector', 'premium-tempered-glass-screen-protector',
 'Ultra-clear 9H hardness tempered glass with oleophobic coating. Anti-fingerprint and scratch-resistant. Compatible with most smartphone models.',
 12.99, 8.99, 'Mobile Accessories', 'Screen Protectors', 'TechShield',
 ARRAY['screen protector', 'tempered glass', 'phone accessories'],
 '{"Hardness": "9H", "Material": "Tempered Glass", "Coating": "Oleophobic", "Compatibility": "Universal"}',
 150, false, 4.3, 89, ARRAY[]::TEXT[]),

('Fast Charging USB-C Cable (6ft)', 'fast-charging-usb-c-cable-6ft',
 'Durable braided nylon USB-C to USB-C cable supporting 100W PD fast charging and 480Mbps data transfer. Perfect for smartphones, tablets, and laptops.',
 14.99, NULL, 'Mobile Accessories', 'Cables & Chargers', 'ChargePro',
 ARRAY['usb-c', 'fast charging', 'cable', 'braided'],
 '{"Length": "6ft / 1.8m", "Material": "Braided Nylon", "Power": "100W PD", "Data Speed": "480Mbps"}',
 200, false, 4.6, 156, ARRAY[]::TEXT[]),

('MagSafe Compatible Phone Mount for Car', 'magsafe-phone-mount-car',
 'Strong magnetic car mount with 360° rotation. One-hand operation, MagSafe compatible. Fits all air vents with reinforced clip design.',
 24.99, 19.99, 'Mobile Accessories', 'Mounts & Holders', 'AutoGrip',
 ARRAY['car mount', 'magsafe', 'phone holder', 'magnetic'],
 '{"Mount Type": "Air Vent", "Rotation": "360°", "Compatibility": "MagSafe & Universal", "Material": "Aircraft-grade Aluminum"}',
 80, true, 4.7, 203, ARRAY[]::TEXT[]),

-- Earbuds & Airpods
('ProBass Elite Wireless Earbuds', 'probass-elite-wireless-earbuds',
 'Premium true wireless earbuds with Active Noise Cancellation, 40-hour total battery life, and Hi-Res Audio certification. IPX5 water resistant with touch controls.',
 79.99, 59.99, 'Earbuds & Airpods', 'True Wireless', 'ProBass',
 ARRAY['earbuds', 'wireless', 'anc', 'noise cancelling', 'bluetooth'],
 '{"Driver": "13mm Dynamic", "ANC": "Yes - Hybrid", "Battery": "8h + 32h case", "Bluetooth": "5.3", "Water Resistance": "IPX5", "Audio": "Hi-Res LDAC"}',
 120, true, 4.8, 342, ARRAY[]::TEXT[]),

('Crystal Clear Sport Earbuds', 'crystal-clear-sport-earbuds',
 'Lightweight sport earbuds with ear hooks for secure fit. 30-hour battery, IPX7 waterproof. Perfect for gym and outdoor activities.',
 34.99, NULL, 'Earbuds & Airpods', 'Sport Earbuds', 'SoundFit',
 ARRAY['sport earbuds', 'waterproof', 'gym', 'wireless'],
 '{"Driver": "10mm", "Battery": "7h + 23h case", "Bluetooth": "5.2", "Water Resistance": "IPX7", "Weight": "5.2g per earbud"}',
 90, false, 4.4, 178, ARRAY[]::TEXT[]),

('UltraPods Pro Max', 'ultrapods-pro-max',
 'Flagship wireless earbuds with spatial audio, adaptive transparency mode, and premium Knowles balanced armature drivers. MagSafe charging case included.',
 129.99, 99.99, 'Earbuds & Airpods', 'Premium Earbuds', 'UltraAudio',
 ARRAY['premium earbuds', 'spatial audio', 'anc', 'airpods alternative'],
 '{"Driver": "Knowles BA + Dynamic", "ANC": "Adaptive", "Battery": "6h + 30h case", "Bluetooth": "5.3", "Spatial Audio": "Yes", "Charging": "MagSafe + USB-C"}',
 60, true, 4.9, 89, ARRAY[]::TEXT[]),

-- Smart Watches
('FitTrack Pro Smartwatch', 'fittrack-pro-smartwatch',
 'Advanced fitness smartwatch with AMOLED display, heart rate monitoring, blood oxygen tracking, GPS, and 14-day battery life. 100+ workout modes.',
 149.99, 119.99, 'Smart Watches', 'Fitness Watches', 'FitTrack',
 ARRAY['smartwatch', 'fitness tracker', 'gps', 'heart rate', 'health'],
 '{"Display": "1.43\" AMOLED", "Battery": "14 days", "Water Resistance": "5ATM", "GPS": "Built-in", "Sensors": "HR, SpO2, Stress", "Workout Modes": "100+"}',
 75, true, 4.7, 267, ARRAY[]::TEXT[]),

('ClassicTime Hybrid Smartwatch', 'classictime-hybrid-smartwatch',
 'Elegant hybrid smartwatch combining classic analog design with smart features. Notification alerts, step tracking, and 6-month battery with real watch hands.',
 89.99, NULL, 'Smart Watches', 'Hybrid Watches', 'ClassicTime',
 ARRAY['hybrid watch', 'analog', 'smart notifications', 'elegant'],
 '{"Display": "Analog + E-ink", "Battery": "6 months", "Water Resistance": "3ATM", "Features": "Notifications, Steps, Sleep"}',
 45, false, 4.2, 98, ARRAY[]::TEXT[]),

-- Electronic Gadgets
('Mini Portable Projector HD', 'mini-portable-projector-hd',
 'Compact 1080p portable projector with built-in speaker, WiFi casting, and 200 ANSI lumens. Projects up to 120" screen. Perfect for movies and presentations.',
 199.99, 159.99, 'Electronic Gadgets', 'Projectors', 'ViewMax',
 ARRAY['projector', 'portable', 'hd', 'mini projector', 'home theater'],
 '{"Resolution": "1080p Full HD", "Brightness": "200 ANSI Lumens", "Screen Size": "40-120\"", "Connectivity": "WiFi, HDMI, USB", "Speaker": "Built-in 5W", "Battery": "2.5 hours"}',
 35, true, 4.5, 134, ARRAY[]::TEXT[]),

('Smart Digital Photo Frame 10"', 'smart-digital-photo-frame-10',
 'WiFi-enabled digital photo frame with IPS touchscreen. Share photos instantly via app. Auto-rotate, slideshow, and video playback support.',
 69.99, NULL, 'Electronic Gadgets', 'Smart Home', 'FrameVue',
 ARRAY['digital frame', 'photo frame', 'smart home', 'wifi'],
 '{"Display": "10\" IPS Touchscreen", "Resolution": "1280x800", "Storage": "16GB + Cloud", "Connectivity": "WiFi", "Features": "Auto-rotate, Slideshow, Video"}',
 55, false, 4.3, 76, ARRAY[]::TEXT[]),

-- Flashlights & Searchlights
('HyperBeam X1 Tactical Flashlight', 'hyperbeam-x1-tactical-flashlight',
 'Military-grade tactical flashlight with 10,000 lumens, 5 lighting modes, and rechargeable battery. Aircraft-grade aluminum body with IPX8 waterproofing.',
 49.99, 39.99, 'Flashlights & Searchlights', 'Tactical', 'HyperBeam',
 ARRAY['flashlight', 'tactical', 'high power', 'rechargeable', 'searchlight'],
 '{"Lumens": "10,000", "Modes": "5 (High, Med, Low, Strobe, SOS)", "Battery": "5000mAh Rechargeable", "Material": "Aircraft Aluminum", "Water Resistance": "IPX8", "Beam Distance": "500m"}',
 100, true, 4.8, 312, ARRAY[]::TEXT[]),

('SolarFlare Camping Lantern', 'solarflare-camping-lantern',
 'Solar-powered camping lantern with USB charging, 3 brightness modes, and emergency SOS. Collapsible design for easy storage.',
 29.99, 22.99, 'Flashlights & Searchlights', 'Lanterns', 'SolarFlare',
 ARRAY['camping lantern', 'solar', 'emergency', 'outdoor'],
 '{"Power": "Solar + USB", "Lumens": "1,000", "Modes": "3 + SOS", "Weight": "280g", "Collapsible": "Yes"}',
 65, false, 4.4, 145, ARRAY[]::TEXT[]),

('ProSearch 5000 Rechargeable Searchlight', 'prosearch-5000-searchlight',
 'Long-range rechargeable searchlight with 50,000 lumens peak output. Handle grip design, perfect for security, hunting, and marine use.',
 89.99, 74.99, 'Flashlights & Searchlights', 'Searchlights', 'ProSearch',
 ARRAY['searchlight', 'high power', 'long range', 'rechargeable', 'security'],
 '{"Lumens": "50,000 peak", "Range": "1,500m", "Battery": "10,000mAh", "Charge Time": "4 hours", "Runtime": "6-12 hours", "Weight": "1.2kg"}',
 40, true, 4.6, 89, ARRAY[]::TEXT[]),

-- TV Boxes
('StreamBox 4K Ultra', 'streambox-4k-ultra',
 'Android 13 TV box with 4K HDR streaming, 4GB RAM, 64GB storage. Supports Netflix, YouTube, Disney+. Voice remote included.',
 59.99, 49.99, 'TV Boxes', 'Android TV Box', 'StreamBox',
 ARRAY['tv box', 'android', '4k', 'streaming', 'smart tv'],
 '{"OS": "Android 13", "RAM": "4GB", "Storage": "64GB", "Resolution": "4K HDR", "WiFi": "Dual-band AC", "Ports": "HDMI 2.1, USB 3.0, Ethernet"}',
 85, true, 4.5, 234, ARRAY[]::TEXT[]),

('MediaPro HD Streaming Box', 'mediapro-hd-streaming-box',
 'Compact HD streaming box with all major apps pre-installed. Simple setup, parental controls, and Dolby Audio support.',
 34.99, NULL, 'TV Boxes', 'HD TV Box', 'MediaPro',
 ARRAY['tv box', 'hd', 'streaming', 'media player'],
 '{"Resolution": "1080p Full HD", "RAM": "2GB", "Storage": "16GB", "Audio": "Dolby Digital", "Apps": "Netflix, YouTube, Prime Video pre-installed"}',
 110, false, 4.2, 167, ARRAY[]::TEXT[]),

-- Televisions
('VisionMax 55" 4K Smart LED TV', 'visionmax-55-4k-smart-led-tv',
 'Stunning 55-inch 4K UHD LED TV with HDR10+, Dolby Vision, and built-in smart OS. Ultra-slim bezel, 120Hz refresh rate. Perfect for movies and gaming.',
 499.99, 399.99, 'Televisions', 'LED TV', 'VisionMax',
 ARRAY['led tv', '4k', 'smart tv', 'hdr', 'dolby vision', '55 inch'],
 '{"Screen Size": "55\"", "Resolution": "4K UHD (3840x2160)", "HDR": "HDR10+ & Dolby Vision", "Refresh Rate": "120Hz", "Smart OS": "Built-in", "Sound": "20W Dolby Atmos", "Ports": "3x HDMI 2.1, 2x USB"}',
 25, true, 4.7, 189, ARRAY[]::TEXT[]),

('SmartView 43" Android TV', 'smartview-43-android-tv',
 'Google-certified 43-inch Android TV with built-in Chromecast, Google Assistant, and access to thousands of apps. Crystal-clear Full HD display.',
 299.99, 249.99, 'Televisions', 'Android TV', 'SmartView',
 ARRAY['android tv', 'google tv', 'chromecast', '43 inch', 'smart tv'],
 '{"Screen Size": "43\"", "Resolution": "Full HD (1920x1080)", "OS": "Android TV 12", "Chromecast": "Built-in", "Voice Assistant": "Google Assistant", "Sound": "16W", "Ports": "2x HDMI, 1x USB"}',
 40, true, 4.4, 156, ARRAY[]::TEXT[]),

('CinemaView 32" HD LED TV', 'cinemaview-32-hd-led-tv',
 'Affordable 32-inch HD LED TV with vibrant colors and wide viewing angles. HDMI and USB connectivity. Great for bedrooms and small spaces.',
 159.99, 129.99, 'Televisions', 'LED TV', 'CinemaView',
 ARRAY['led tv', '32 inch', 'hd', 'affordable', 'bedroom tv'],
 '{"Screen Size": "32\"", "Resolution": "HD (1366x768)", "Refresh Rate": "60Hz", "Sound": "10W", "Ports": "2x HDMI, 1x USB, 1x AV"}',
 60, false, 4.1, 234, ARRAY[]::TEXT[]),

-- Bluetooth Soundbars & Audio
('ThunderBar Pro 2.1 Soundbar', 'thunderbar-pro-21-soundbar',
 'Premium 2.1 channel soundbar with wireless subwoofer. 300W total output, Dolby Atmos, and Bluetooth 5.3. Wall-mountable with sleek design.',
 199.99, 169.99, 'Bluetooth Soundbars & Audio', 'Soundbars', 'ThunderBar',
 ARRAY['soundbar', 'bluetooth', 'dolby atmos', 'subwoofer', 'home theater'],
 '{"Channels": "2.1", "Power": "300W", "Subwoofer": "Wireless 8\"", "Audio": "Dolby Atmos", "Bluetooth": "5.3", "Connectivity": "HDMI ARC, Optical, AUX, USB"}',
 50, true, 4.8, 198, ARRAY[]::TEXT[]),

('BassBoost Compact Soundbar', 'bassboost-compact-soundbar',
 'Slim compact soundbar with built-in subwoofer. 120W output, Bluetooth and HDMI ARC. Perfect TV companion under 40 inches.',
 79.99, 64.99, 'Bluetooth Soundbars & Audio', 'Soundbars', 'BassBoost',
 ARRAY['soundbar', 'compact', 'bluetooth', 'tv speaker'],
 '{"Channels": "2.0", "Power": "120W", "Subwoofer": "Built-in", "Bluetooth": "5.0", "Connectivity": "HDMI ARC, Optical, AUX"}',
 70, false, 4.3, 145, ARRAY[]::TEXT[]),

('AquaSound Portable Bluetooth Speaker', 'aquasound-portable-bluetooth-speaker',
 'Rugged waterproof portable speaker with 360° sound, 24-hour battery, and IPX7 rating. Links with other speakers for stereo pairing.',
 44.99, NULL, 'Bluetooth Soundbars & Audio', 'Portable Speakers', 'AquaSound',
 ARRAY['bluetooth speaker', 'portable', 'waterproof', 'outdoor'],
 '{"Power": "30W", "Battery": "24 hours", "Water Resistance": "IPX7", "Bluetooth": "5.3", "Features": "360° Sound, Stereo Pairing, Built-in Mic"}',
 95, false, 4.6, 267, ARRAY[]::TEXT[]);
