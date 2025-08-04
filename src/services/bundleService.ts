import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  Bundle,
  BundleWithItems,
  BundleItem,
  BundleCategory,
  BundleRecommendation,
  CreateBundleData,
  UpdateBundleData,
  BundleAnalytics,
  CustomerBundlePreference,
  BundleConfiguration
} from '@/types/bundle';

const BUNDLES_COLLECTION = 'bundles';
const BUNDLE_ITEMS_COLLECTION = 'bundle_items';
const BUNDLE_CATEGORIES_COLLECTION = 'bundle_categories';
const BUNDLE_ANALYTICS_COLLECTION = 'bundle_analytics';
const BUNDLE_RECOMMENDATIONS_COLLECTION = 'bundle_recommendations';
const CUSTOMER_PREFERENCES_COLLECTION = 'customer_bundle_preferences';
const PRODUCTS_COLLECTION = 'products';

export class BundleService {
  // Get all active bundles
  static async getActiveBundles(): Promise<BundleWithItems[]> {
    try {
      const bundlesRef = collection(db, BUNDLES_COLLECTION);
      const q = query(
        bundlesRef,
        where('status', '==', 'active'),
        orderBy('priority', 'desc'),
        orderBy('created_at', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const bundles: BundleWithItems[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const bundleData = { id: docSnapshot.id, ...docSnapshot.data() } as Bundle;
        
        // Check date validity
        const now = new Date();
        const startDate = bundleData.start_date ? new Date(bundleData.start_date) : null;
        const endDate = bundleData.end_date ? new Date(bundleData.end_date) : null;
        
        if (startDate && startDate > now) continue;
        if (endDate && endDate < now) continue;
        
        // Get bundle items
        const itemsRef = collection(db, BUNDLE_ITEMS_COLLECTION);
        const itemsQuery = query(itemsRef, where('bundle_id', '==', bundleData.id));
        const itemsSnapshot = await getDocs(itemsQuery);
        
        const items: BundleItem[] = [];
        for (const itemDoc of itemsSnapshot.docs) {
          const itemData = { id: itemDoc.id, ...itemDoc.data() } as BundleItem;
          
          // Get product details
          const productDoc = await getDoc(doc(db, PRODUCTS_COLLECTION, itemData.product_id));
          if (productDoc.exists()) {
            itemData.product = { id: productDoc.id, ...productDoc.data() };
          }
          
          items.push(itemData);
        }
        
        const bundleWithItems: BundleWithItems = {
          ...bundleData,
          items,
          savings: this.calculateBundleSavings({ ...bundleData, items }),
          total_items: items.length
        };
        
        bundles.push(bundleWithItems);
      }
      
      return bundles;
    } catch (error) {
      console.error('Error fetching active bundles:', error);
      throw error;
    }
  }

  // Get bundle by ID with all details
  static async getBundleById(bundleId: string): Promise<BundleWithItems | null> {
    try {
      const { data: bundle, error } = await supabase
        .from('bundles')
        .select(`
          *,
          items:bundle_items(
            *,
            product:products(*)
          ),
          categories:bundle_categories(*)
        `)
        .eq('id', bundleId)
        .single();

      if (error) throw error;
      if (!bundle) return null;

      // Track bundle view
      await this.trackBundleView(bundleId);

      return {
        ...bundle,
        savings: this.calculateBundleSavings(bundle),
        total_items: bundle.items?.length || 0
      };
    } catch (error) {
      console.error('Error fetching bundle by ID:', error);
      throw error;
    }
  }

  // Get bundle recommendations for user
  static async getBundleRecommendations(userId?: string, limit = 5): Promise<BundleRecommendation[]> {
    try {
      if (userId) {
        // Use stored procedure for personalized recommendations
        const { data, error } = await supabase
          .rpc('get_bundle_recommendations', {
            user_id_param: userId,
            limit_param: limit
          });

        if (error) throw error;
        return data || [];
      } else {
        // Generic recommendations based on popularity and priority
        const { data: bundles, error } = await supabase
          .from('bundles')
          .select('id, name, bundle_price, priority')
          .eq('status', 'active')
          .lte('start_date', new Date().toISOString())
          .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return bundles?.map(bundle => ({
          bundle_id: bundle.id,
          bundle_name: bundle.name,
          bundle_price: bundle.bundle_price,
          savings: 0, // Will be calculated separately
          recommendation_score: bundle.priority
        })) || [];
      }
    } catch (error) {
      console.error('Error fetching bundle recommendations:', error);
      throw error;
    }
  }

  // Create new bundle (admin only)
  static async createBundle(bundleData: CreateBundleData): Promise<Bundle> {
    try {
      const { data: bundle, error: bundleError } = await supabase
        .from('bundles')
        .insert({
          name: bundleData.name,
          description: bundleData.description,
          bundle_type: bundleData.bundle_type,
          discount_type: bundleData.discount_type,
          discount_value: bundleData.discount_value,
          original_price: bundleData.original_price,
          bundle_price: bundleData.bundle_price,
          min_items: bundleData.min_items,
          max_items: bundleData.max_items,
          image_url: bundleData.image_url,
          start_date: bundleData.start_date || new Date().toISOString(),
          end_date: bundleData.end_date,
          priority: bundleData.priority || 0,
        })
        .select()
        .single();

      if (bundleError) throw bundleError;

      // Insert bundle items
      if (bundleData.items && bundleData.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('bundle_items')
          .insert(
            bundleData.items.map(item => ({
              bundle_id: bundle.id,
              product_id: item.product_id,
              quantity: item.quantity,
              is_required: item.is_required,
              category_restriction: item.category_restriction,
            }))
          );

        if (itemsError) throw itemsError;
      }

      // Insert bundle categories if it's a mix_and_match bundle
      if (bundleData.bundle_type === 'mix_and_match' && bundleData.categories) {
        const { error: categoriesError } = await supabase
          .from('bundle_categories')
          .insert(
            bundleData.categories.map(category => ({
              bundle_id: bundle.id,
              category_name: category.category_name,
              min_selection: category.min_selection,
              max_selection: category.max_selection,
            }))
          );

        if (categoriesError) throw categoriesError;
      }

      return bundle;
    } catch (error) {
      console.error('Error creating bundle:', error);
      throw error;
    }
  }

  // Update bundle (admin only)
  static async updateBundle(bundleData: UpdateBundleData): Promise<Bundle> {
    try {
      const { data: bundle, error } = await supabase
        .from('bundles')
        .update({
          name: bundleData.name,
          description: bundleData.description,
          bundle_type: bundleData.bundle_type,
          discount_type: bundleData.discount_type,
          discount_value: bundleData.discount_value,
          original_price: bundleData.original_price,
          bundle_price: bundleData.bundle_price,
          min_items: bundleData.min_items,
          max_items: bundleData.max_items,
          image_url: bundleData.image_url,
          status: bundleData.status,
          start_date: bundleData.start_date,
          end_date: bundleData.end_date,
          priority: bundleData.priority,
        })
        .eq('id', bundleData.id)
        .select()
        .single();

      if (error) throw error;
      return bundle;
    } catch (error) {
      console.error('Error updating bundle:', error);
      throw error;
    }
  }

  // Delete bundle (admin only)
  static async deleteBundle(bundleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bundles')
        .delete()
        .eq('id', bundleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bundle:', error);
      throw error;
    }
  }

  // Track bundle view for analytics
  static async trackBundleView(bundleId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('bundle_analytics')
        .upsert({
          bundle_id: bundleId,
          date: today,
          views: 1
        }, {
          onConflict: 'bundle_id,date',
          ignoreDuplicates: false
        });

      if (error) {
        // If upsert fails, try to increment existing record
        const { error: updateError } = await supabase
          .rpc('increment_bundle_views', {
            bundle_id_param: bundleId,
            date_param: today
          });

        if (updateError) {
          console.warn('Could not track bundle view:', updateError);
        }
      }
    } catch (error) {
      console.warn('Error tracking bundle view:', error);
    }
  }

  // Track bundle purchase for analytics
  static async trackBundlePurchase(bundleId: string, revenue: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .rpc('increment_bundle_purchase', {
          bundle_id_param: bundleId,
          date_param: today,
          revenue_param: revenue
        });

      if (error) {
        console.warn('Could not track bundle purchase:', error);
      }
    } catch (error) {
      console.warn('Error tracking bundle purchase:', error);
    }
  }

  // Get bundle analytics (admin only)
  static async getBundleAnalytics(bundleId: string, startDate?: string, endDate?: string): Promise<BundleAnalytics[]> {
    try {
      let query = supabase
        .from('bundle_analytics')
        .select('*')
        .eq('bundle_id', bundleId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bundle analytics:', error);
      throw error;
    }
  }

  // Save user bundle preference
  static async saveBundlePreference(userId: string, bundleId: string, score: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('customer_bundle_preferences')
        .upsert({
          user_id: userId,
          bundle_id: bundleId,
          preference_score: score,
          last_viewed: new Date().toISOString()
        }, {
          onConflict: 'user_id,bundle_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving bundle preference:', error);
      throw error;
    }
  }

  // Mark bundle as purchased
  static async markBundlePurchased(userId: string, bundleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customer_bundle_preferences')
        .upsert({
          user_id: userId,
          bundle_id: bundleId,
          purchased: true,
          last_viewed: new Date().toISOString()
        }, {
          onConflict: 'user_id,bundle_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking bundle as purchased:', error);
      throw error;
    }
  }

  // Calculate bundle savings
  private static calculateBundleSavings(bundle: any): number {
    if (!bundle.items || bundle.items.length === 0) return 0;
    
    const totalOriginalPrice = bundle.items.reduce((total: number, item: any) => {
      const productPrice = item.product?.price || 0;
      return total + (productPrice * item.quantity);
    }, 0);

    return Math.max(totalOriginalPrice - bundle.bundle_price, 0);
  }

  // Validate bundle configuration
  static validateBundleConfiguration(bundle: Bundle, selectedItems: any[]): boolean {
    if (bundle.bundle_type === 'fixed') {
      // For fixed bundles, all required items must be selected
      return true; // Simplified validation
    }

    if (bundle.bundle_type === 'mix_and_match') {
      // Validate based on bundle categories
      if (bundle.min_items && selectedItems.length < bundle.min_items) {
        return false;
      }
      if (bundle.max_items && selectedItems.length > bundle.max_items) {
        return false;
      }
    }

    return true;
  }

  // Get bundles by category
  static async getBundlesByCategory(category: string): Promise<BundleWithItems[]> {
    try {
      const { data: bundles, error } = await supabase
        .from('bundles')
        .select(`
          *,
          items:bundle_items!inner(
            *,
            product:products!inner(*)
          )
        `)
        .eq('status', 'active')
        .eq('items.product.category', category)
        .lte('start_date', new Date().toISOString())
        .or('end_date.is.null,end_date.gte.' + new Date().toISOString());

      if (error) throw error;

      return bundles?.map(bundle => ({
        ...bundle,
        savings: this.calculateBundleSavings(bundle),
        total_items: bundle.items?.length || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching bundles by category:', error);
      throw error;
    }
  }
}
