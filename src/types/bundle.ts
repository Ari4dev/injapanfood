export interface Bundle {
  id: string;
  name: string;
  description?: string;
  bundle_type: 'fixed' | 'mix_and_match' | 'tiered';
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  original_price: number;
  bundle_price: number;
  min_items?: number;
  max_items?: number;
  image_url?: string;
  status: 'active' | 'inactive' | 'scheduled';
  start_date: string;
  end_date?: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  quantity: number;
  is_required: boolean;
  category_restriction?: string;
  created_at: string;
  // Populated data
  product?: Product;
}

export interface BundleCategory {
  id: string;
  bundle_id: string;
  category_name: string;
  min_selection: number;
  max_selection?: number;
  created_at: string;
}

export interface BundleAnalytics {
  id: string;
  bundle_id: string;
  date: string;
  views: number;
  purchases: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerBundlePreference {
  id: string;
  user_id?: string;
  bundle_id: string;
  preference_score: number;
  last_viewed: string;
  purchased: boolean;
  created_at: string;
}

export interface BundleWithItems extends Bundle {
  items: BundleItem[];
  categories?: BundleCategory[];
  savings: number;
  total_items: number;
}

export interface BundleRecommendation {
  bundle_id: string;
  bundle_name: string;
  bundle_price: number;
  savings: number;
  recommendation_score: number;
}

export interface BundleConfiguration {
  bundle: Bundle;
  selected_items: {
    product_id: string;
    quantity: number;
    variant_selections?: Record<string, string>;
  }[];
  total_price: number;
  total_savings: number;
}

export interface CreateBundleData {
  name: string;
  description?: string;
  bundle_type: 'fixed' | 'mix_and_match' | 'tiered';
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  original_price: number;
  bundle_price: number;
  min_items?: number;
  max_items?: number;
  image_url?: string;
  start_date?: string;
  end_date?: string;
  priority?: number;
  items: {
    product_id: string;
    quantity: number;
    is_required: boolean;
    category_restriction?: string;
  }[];
  categories?: {
    category_name: string;
    min_selection: number;
    max_selection?: number;
  }[];
}

export interface UpdateBundleData extends Partial<CreateBundleData> {
  id: string;
  status?: 'active' | 'inactive' | 'scheduled';
}

// Import Product type (assuming it exists)
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  stock: number;
  status: string;
  variants: any[];
  created_at: string;
  updated_at: string;
}
