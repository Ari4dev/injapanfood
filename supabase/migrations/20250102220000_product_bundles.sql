-- Product Bundles Migration
-- Create bundles table for product bundling feature

-- Create bundles table
CREATE TABLE public.bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  bundle_type TEXT NOT NULL DEFAULT 'fixed' CHECK (bundle_type IN ('fixed', 'mix_and_match', 'tiered')),
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  original_price INTEGER NOT NULL DEFAULT 0,
  bundle_price INTEGER NOT NULL DEFAULT 0,
  min_items INTEGER DEFAULT 1,
  max_items INTEGER DEFAULT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'scheduled')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bundle_items table (for products included in bundles)
CREATE TABLE public.bundle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT true,
  category_restriction TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bundle_categories table (for mix-and-match bundles)
CREATE TABLE public.bundle_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  min_selection INTEGER DEFAULT 1,
  max_selection INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bundle_analytics table (for tracking bundle performance)
CREATE TABLE public.bundle_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, date)
);

-- Create customer_bundle_preferences table (for personalization)
CREATE TABLE public.customer_bundle_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
  preference_score DECIMAL(3,2) DEFAULT 0,
  last_viewed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  purchased BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_bundles_status ON public.bundles(status);
CREATE INDEX idx_bundles_bundle_type ON public.bundles(bundle_type);
CREATE INDEX idx_bundles_dates ON public.bundles(start_date, end_date);
CREATE INDEX idx_bundle_items_bundle_id ON public.bundle_items(bundle_id);
CREATE INDEX idx_bundle_items_product_id ON public.bundle_items(product_id);
CREATE INDEX idx_bundle_categories_bundle_id ON public.bundle_categories(bundle_id);
CREATE INDEX idx_bundle_analytics_bundle_date ON public.bundle_analytics(bundle_id, date);
CREATE INDEX idx_customer_bundle_preferences_user ON public.customer_bundle_preferences(user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON public.bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundle_analytics_updated_at
  BEFORE UPDATE ON public.bundle_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all bundle tables
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_bundle_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bundles
CREATE POLICY "Public can view active bundles" 
  ON public.bundles 
  FOR SELECT 
  USING (status = 'active' AND (start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can manage bundles" 
  ON public.bundles 
  FOR ALL 
  USING (public.is_admin());

-- RLS Policies for bundle_items
CREATE POLICY "Public can view bundle items" 
  ON public.bundle_items 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage bundle items" 
  ON public.bundle_items 
  FOR ALL 
  USING (public.is_admin());

-- RLS Policies for bundle_categories
CREATE POLICY "Public can view bundle categories" 
  ON public.bundle_categories 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage bundle categories" 
  ON public.bundle_categories 
  FOR ALL 
  USING (public.is_admin());

-- RLS Policies for bundle_analytics
CREATE POLICY "Admins can view bundle analytics" 
  ON public.bundle_analytics 
  FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "Admins can manage bundle analytics" 
  ON public.bundle_analytics 
  FOR ALL 
  USING (public.is_admin());

-- RLS Policies for customer_bundle_preferences
CREATE POLICY "Users can view their own bundle preferences" 
  ON public.customer_bundle_preferences 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own bundle preferences" 
  ON public.customer_bundle_preferences 
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all bundle preferences" 
  ON public.customer_bundle_preferences 
  FOR SELECT 
  USING (public.is_admin());

-- Functions for bundle calculations
CREATE OR REPLACE FUNCTION calculate_bundle_savings(bundle_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  bundle_record RECORD;
  total_original_price INTEGER := 0;
  savings INTEGER := 0;
BEGIN
  -- Get bundle information
  SELECT * INTO bundle_record FROM public.bundles WHERE id = bundle_id_param;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate total original price of all items in bundle
  SELECT COALESCE(SUM(p.price * bi.quantity), 0) INTO total_original_price
  FROM public.bundle_items bi
  JOIN public.products p ON bi.product_id = p.id
  WHERE bi.bundle_id = bundle_id_param;
  
  -- Calculate savings
  savings := total_original_price - bundle_record.bundle_price;
  
  RETURN GREATEST(savings, 0);
END;
$$;

-- Function to get bundle recommendations for a user
CREATE OR REPLACE FUNCTION get_bundle_recommendations(user_id_param UUID, limit_param INTEGER DEFAULT 5)
RETURNS TABLE (
  bundle_id UUID,
  bundle_name TEXT,
  bundle_price INTEGER,
  savings INTEGER,
  recommendation_score DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.bundle_price,
    calculate_bundle_savings(b.id),
    COALESCE(cbp.preference_score, 0) + 
    (CASE WHEN cbp.purchased THEN 0.5 ELSE 0 END) +
    (b.priority::DECIMAL / 100) as recommendation_score
  FROM public.bundles b
  LEFT JOIN public.customer_bundle_preferences cbp ON b.id = cbp.bundle_id AND cbp.user_id = user_id_param
  WHERE b.status = 'active' 
    AND (b.start_date <= now()) 
    AND (b.end_date IS NULL OR b.end_date >= now())
  ORDER BY recommendation_score DESC, b.created_at DESC
  LIMIT limit_param;
END;
$$;

-- Insert sample bundle data
INSERT INTO public.bundles (name, description, bundle_type, discount_type, discount_value, original_price, bundle_price, image_url) VALUES
('Paket Hemat Keluarga', 'Paket hemat berisi makanan ringan pilihan untuk keluarga', 'fixed', 'percentage', 15.00, 5000, 4250, '/placeholder.svg'),
('Mix & Match Bumbu Dapur', 'Pilih 3 bumbu dapur favorit dengan harga spesial', 'mix_and_match', 'fixed_amount', 500, 1800, 1300, '/placeholder.svg'),
('Paket Sehat Sayuran', 'Kombinasi sayuran segar dan beku untuk menu sehat', 'fixed', 'percentage', 20.00, 3500, 2800, '/placeholder.svg'),
('Bundle Makanan Siap Saji', 'Paket lengkap makanan siap saji untuk 2 porsi', 'fixed', 'fixed_amount', 300, 2300, 2000, '/placeholder.svg');

-- Insert sample bundle items
WITH bundle_ids AS (
  SELECT id, name FROM public.bundles 
),
product_samples AS (
  SELECT id, name, category FROM public.products
)
INSERT INTO public.bundle_items (bundle_id, product_id, quantity, is_required)
SELECT 
  b.id,
  p.id,
  1,
  true
FROM bundle_ids b, product_samples p
WHERE 
  (b.name = 'Paket Hemat Keluarga' AND p.category IN ('Makanan Ringan')) OR
  (b.name = 'Mix & Match Bumbu Dapur' AND p.category IN ('Bumbu Dapur')) OR
  (b.name = 'Paket Sehat Sayuran' AND p.category IN ('Sayur Segar/Beku', 'Sayur Beku')) OR
  (b.name = 'Bundle Makanan Siap Saji' AND p.category IN ('Makanan Siap Saji'));

-- Insert sample bundle categories for mix_and_match bundle
INSERT INTO public.bundle_categories (bundle_id, category_name, min_selection, max_selection)
SELECT 
  b.id,
  'Bumbu Dapur',
  3,
  3
FROM public.bundles b
WHERE b.name = 'Mix & Match Bumbu Dapur';
