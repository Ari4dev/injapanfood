-- Additional functions for bundle system

-- Function to increment bundle views
CREATE OR REPLACE FUNCTION increment_bundle_views(bundle_id_param UUID, date_param DATE)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.bundle_analytics(bundle_id, date, views, purchases, revenue)
  VALUES (bundle_id_param, date_param, 1, 0, 0)
  ON CONFLICT (bundle_id, date)
  DO UPDATE SET
    views = bundle_analytics.views + 1,
    updated_at = now();
END;
$$;

-- Function to increment bundle purchases
CREATE OR REPLACE FUNCTION increment_bundle_purchase(bundle_id_param UUID, date_param DATE, revenue_param INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.bundle_analytics(bundle_id, date, views, purchases, revenue)
  VALUES (bundle_id_param, date_param, 0, 1, revenue_param)
  ON CONFLICT (bundle_id, date)
  DO UPDATE SET
    purchases = bundle_analytics.purchases + 1,
    revenue = bundle_analytics.revenue + revenue_param,
    updated_at = now();
END;
$$;

-- Function to get popular bundles
CREATE OR REPLACE FUNCTION get_popular_bundles(limit_param INTEGER DEFAULT 10)
RETURNS TABLE (
  bundle_id UUID,
  bundle_name TEXT,  
  total_purchases INTEGER,
  total_revenue INTEGER,
  total_views INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    COALESCE(SUM(ba.purchases), 0)::INTEGER as total_purchases,
    COALESCE(SUM(ba.revenue), 0)::INTEGER as total_revenue,
    COALESCE(SUM(ba.views), 0)::INTEGER as total_views
  FROM public.bundles b
  LEFT JOIN public.bundle_analytics ba ON b.id = ba.bundle_id
  WHERE b.status = 'active'
  GROUP BY b.id, b.name
  ORDER BY total_purchases DESC, total_revenue DESC, total_views DESC
  LIMIT limit_param;
END;
$$;

-- Function to get bundle performance summary
CREATE OR REPLACE FUNCTION get_bundle_performance_summary(bundle_id_param UUID, days_param INTEGER DEFAULT 30)
RETURNS TABLE (
  bundle_id UUID,
  total_views INTEGER,
  total_purchases INTEGER,
  total_revenue INTEGER,
  conversion_rate DECIMAL,
  avg_daily_views DECIMAL,
  avg_daily_purchases DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bundle_id_param,
    COALESCE(SUM(ba.views), 0)::INTEGER as total_views,
    COALESCE(SUM(ba.purchases), 0)::INTEGER as total_purchases,
    COALESCE(SUM(ba.revenue), 0)::INTEGER as total_revenue,
    CASE 
      WHEN COALESCE(SUM(ba.views), 0) > 0 
      THEN ROUND((COALESCE(SUM(ba.purchases), 0)::DECIMAL / COALESCE(SUM(ba.views), 1)::DECIMAL) * 100, 2)
      ELSE 0
    END as conversion_rate,
    ROUND(COALESCE(SUM(ba.views), 0)::DECIMAL / days_param::DECIMAL, 2) as avg_daily_views,
    ROUND(COALESCE(SUM(ba.purchases), 0)::DECIMAL / days_param::DECIMAL, 2) as avg_daily_purchases
  FROM public.bundle_analytics ba
  WHERE ba.bundle_id = bundle_id_param
    AND ba.date >= CURRENT_DATE - INTERVAL '1 day' * days_param;
END;
$$;

-- Function to get trending bundles (bundles with increasing popularity)
CREATE OR REPLACE FUNCTION get_trending_bundles(limit_param INTEGER DEFAULT 5)
RETURNS TABLE (
  bundle_id UUID,
  bundle_name TEXT,
  recent_views INTEGER,
  growth_rate DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH recent_stats AS (
    SELECT 
      ba.bundle_id,
      b.name as bundle_name,
      SUM(CASE WHEN ba.date >= CURRENT_DATE - INTERVAL '7 days' THEN ba.views ELSE 0 END) as recent_views,
      SUM(CASE WHEN ba.date >= CURRENT_DATE - INTERVAL '14 days' AND ba.date < CURRENT_DATE - INTERVAL '7 days' THEN ba.views ELSE 0 END) as previous_views
    FROM public.bundle_analytics ba
    JOIN public.bundles b ON ba.bundle_id = b.id
    WHERE b.status = 'active'
      AND ba.date >= CURRENT_DATE - INTERVAL '14 days'
    GROUP BY ba.bundle_id, b.name
  )
  SELECT 
    rs.bundle_id,
    rs.bundle_name,
    rs.recent_views::INTEGER,
    CASE 
      WHEN rs.previous_views > 0 
      THEN ROUND(((rs.recent_views - rs.previous_views)::DECIMAL / rs.previous_views::DECIMAL) * 100, 2)
      ELSE 100
    END as growth_rate
  FROM recent_stats rs
  WHERE rs.recent_views > 0
  ORDER BY growth_rate DESC, rs.recent_views DESC
  LIMIT limit_param;
END;
$$;

-- Function to check if bundle is valid and available
CREATE OR REPLACE FUNCTION is_bundle_available(bundle_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  bundle_record RECORD;
BEGIN
  SELECT * INTO bundle_record 
  FROM public.bundles 
  WHERE id = bundle_id_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if bundle is active
  IF bundle_record.status != 'active' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if bundle is within date range
  IF bundle_record.start_date > now() THEN
    RETURN FALSE;
  END IF;
  
  IF bundle_record.end_date IS NOT NULL AND bundle_record.end_date < now() THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to get bundle categories with item counts
CREATE OR REPLACE FUNCTION get_bundle_categories_summary()
RETURNS TABLE (
  category_name TEXT,
  bundle_count INTEGER,
  total_items INTEGER,
  avg_savings DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH bundle_categories AS (
    SELECT DISTINCT
      p.category,
      bi.bundle_id
    FROM public.bundle_items bi
    JOIN public.products p ON bi.product_id = p.id
    JOIN public.bundles b ON bi.bundle_id = b.id
    WHERE b.status = 'active'
  )
  SELECT 
    bc.category as category_name,
    COUNT(DISTINCT bc.bundle_id)::INTEGER as bundle_count,
    COUNT(bi.id)::INTEGER as total_items,
    ROUND(AVG(calculate_bundle_savings(bc.bundle_id)), 2) as avg_savings
  FROM bundle_categories bc
  JOIN public.bundle_items bi ON bc.bundle_id = bi.bundle_id
  GROUP BY bc.category
  ORDER BY bundle_count DESC, avg_savings DESC;
END;
$$;
