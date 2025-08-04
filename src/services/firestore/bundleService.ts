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
  increment,
  Timestamp
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

export class FirestoreBundleService {
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
        const startDate = bundleData.start_date ? 
          (bundleData.start_date instanceof Timestamp ? 
            bundleData.start_date.toDate() : 
            new Date(bundleData.start_date)) : null;
        const endDate = bundleData.end_date ? 
          (bundleData.end_date instanceof Timestamp ? 
            bundleData.end_date.toDate() : 
            new Date(bundleData.end_date)) : null;
        
        if (startDate && startDate > now) continue;
        if (endDate && endDate < now) continue;
        
        // Get bundle items with product details
        const items = await this.getBundleItems(bundleData.id);
        
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
      const bundleDoc = await getDoc(doc(db, BUNDLES_COLLECTION, bundleId));
      
      if (!bundleDoc.exists()) {
        return null;
      }

      const bundleData = { id: bundleDoc.id, ...bundleDoc.data() } as Bundle;
      
      // Get bundle items with product details
      const items = await this.getBundleItems(bundleId);
      
      // Get bundle categories if it's a mix_and_match bundle
      let categories: BundleCategory[] = [];
      if (bundleData.bundle_type === 'mix_and_match') {
        categories = await this.getBundleCategories(bundleId);
      }

      // Track bundle view
      await this.trackBundleView(bundleId);

      return {
        ...bundleData,
        items,
        categories,
        savings: this.calculateBundleSavings({ ...bundleData, items }),
        total_items: items.length
      };
    } catch (error) {
      console.error('Error fetching bundle by ID:', error);
      throw error;
    }
  }

  // Get bundle items with product details
  static async getBundleItems(bundleId: string): Promise<BundleItem[]> {
    try {
      const itemsRef = collection(db, BUNDLE_ITEMS_COLLECTION);
      const itemsQuery = query(itemsRef, where('bundle_id', '==', bundleId));
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
      
      return items;
    } catch (error) {
      console.error('Error fetching bundle items:', error);
      throw error;
    }
  }

  // Get bundle categories
  static async getBundleCategories(bundleId: string): Promise<BundleCategory[]> {
    try {
      const categoriesRef = collection(db, BUNDLE_CATEGORIES_COLLECTION);
      const categoriesQuery = query(categoriesRef, where('bundle_id', '==', bundleId));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      
      const categories: BundleCategory[] = [];
      categoriesSnapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() } as BundleCategory);
      });
      
      return categories;
    } catch (error) {
      console.error('Error fetching bundle categories:', error);
      throw error;
    }
  }

  // Get bundle recommendations for user
  static async getBundleRecommendations(userId?: string, limitCount = 5): Promise<BundleRecommendation[]> {
    try {
      if (userId) {
        // Get personalized recommendations from user preferences
        const preferencesRef = collection(db, CUSTOMER_PREFERENCES_COLLECTION);
        const preferencesQuery = query(
          preferencesRef, 
          where('user_id', '==', userId),
          orderBy('preference_score', 'desc'),
          limit(limitCount)
        );
        const preferencesSnapshot = await getDocs(preferencesQuery);
        
        const recommendations: BundleRecommendation[] = [];
        for (const prefDoc of preferencesSnapshot.docs) {
          const prefData = prefDoc.data();
          const bundleDoc = await getDoc(doc(db, BUNDLES_COLLECTION, prefData.bundle_id));
          
          if (bundleDoc.exists()) {
            const bundleData = bundleDoc.data();
            recommendations.push({
              bundle_id: bundleDoc.id,
              bundle_name: bundleData.name,
              bundle_price: bundleData.bundle_price,
              savings: 0, // Will be calculated separately
              recommendation_score: prefData.preference_score
            });
          }
        }
        
        return recommendations;
      } else {
        // Generic recommendations based on popularity and priority
        const bundlesRef = collection(db, BUNDLES_COLLECTION);
        const q = query(
          bundlesRef,
          where('status', '==', 'active'),
          orderBy('priority', 'desc'),
          orderBy('created_at', 'desc'),
          limit(limitCount)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            bundle_id: doc.id,
            bundle_name: data.name,
            bundle_price: data.bundle_price,
            savings: 0, // Will be calculated separately
            recommendation_score: data.priority
          };
        });
      }
    } catch (error) {
      console.error('Error fetching bundle recommendations:', error);
      throw error;
    }
  }

  // Create new bundle (admin only)
  static async createBundle(bundleData: CreateBundleData): Promise<Bundle> {
    try {
      const batch = writeBatch(db);
      
      // Create bundle document
      const bundleRef = doc(collection(db, BUNDLES_COLLECTION));
      const bundleToCreate = {
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
        status: 'active',
        start_date: bundleData.start_date ? Timestamp.fromDate(new Date(bundleData.start_date)) : serverTimestamp(),
        end_date: bundleData.end_date ? Timestamp.fromDate(new Date(bundleData.end_date)) : null,
        priority: bundleData.priority || 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      batch.set(bundleRef, bundleToCreate);

      // Add bundle items
      if (bundleData.items && bundleData.items.length > 0) {
        for (const item of bundleData.items) {
          const itemRef = doc(collection(db, BUNDLE_ITEMS_COLLECTION));
          batch.set(itemRef, {
            bundle_id: bundleRef.id,
            product_id: item.product_id,
            quantity: item.quantity,
            is_required: item.is_required,
            category_restriction: item.category_restriction,
            created_at: serverTimestamp()
          });
        }
      }

      // Add bundle categories if it's a mix_and_match bundle
      if (bundleData.bundle_type === 'mix_and_match' && bundleData.categories) {
        for (const category of bundleData.categories) {
          const categoryRef = doc(collection(db, BUNDLE_CATEGORIES_COLLECTION));
          batch.set(categoryRef, {
            bundle_id: bundleRef.id,
            category_name: category.category_name,
            min_selection: category.min_selection,
            max_selection: category.max_selection,
            created_at: serverTimestamp()
          });
        }
      }

      await batch.commit();

      return { id: bundleRef.id, ...bundleToCreate } as Bundle;
    } catch (error) {
      console.error('Error creating bundle:', error);
      throw error;
    }
  }

  // Update bundle (admin only)
  static async updateBundle(bundleData: UpdateBundleData): Promise<Bundle> {
    try {
      const bundleRef = doc(db, BUNDLES_COLLECTION, bundleData.id);
      
      const updateData = {
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
        start_date: bundleData.start_date ? Timestamp.fromDate(new Date(bundleData.start_date)) : null,
        end_date: bundleData.end_date ? Timestamp.fromDate(new Date(bundleData.end_date)) : null,
        priority: bundleData.priority,
        updated_at: serverTimestamp()
      };

      await updateDoc(bundleRef, updateData);

      const updatedDoc = await getDoc(bundleRef);
      return { id: updatedDoc.id, ...updatedDoc.data() } as Bundle;
    } catch (error) {
      console.error('Error updating bundle:', error);
      throw error;
    }
  }

  // Delete bundle (admin only)
  static async deleteBundle(bundleId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Delete bundle
      const bundleRef = doc(db, BUNDLES_COLLECTION, bundleId);
      batch.delete(bundleRef);
      
      // Delete bundle items
      const itemsRef = collection(db, BUNDLE_ITEMS_COLLECTION);
      const itemsQuery = query(itemsRef, where('bundle_id', '==', bundleId));
      const itemsSnapshot = await getDocs(itemsQuery);
      itemsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete bundle categories
      const categoriesRef = collection(db, BUNDLE_CATEGORIES_COLLECTION);
      const categoriesQuery = query(categoriesRef, where('bundle_id', '==', bundleId));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      categoriesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting bundle:', error);
      throw error;
    }
  }

  // Track bundle view for analytics
  static async trackBundleView(bundleId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const analyticsRef = collection(db, BUNDLE_ANALYTICS_COLLECTION);
      const analyticsQuery = query(
        analyticsRef, 
        where('bundle_id', '==', bundleId),
        where('date', '==', today)
      );
      
      const snapshot = await getDocs(analyticsQuery);
      
      if (snapshot.empty) {
        // Create new analytics record
        await addDoc(analyticsRef, {
          bundle_id: bundleId,
          date: today,
          views: 1,
          purchases: 0,
          revenue: 0,
          created_at: serverTimestamp()
        });
      } else {
        // Update existing record
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          views: increment(1),
          updated_at: serverTimestamp()
        });
      }
    } catch (error) {
      console.warn('Error tracking bundle view:', error);
    }
  }

  // Track bundle purchase for analytics
  static async trackBundlePurchase(bundleId: string, revenue: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const analyticsRef = collection(db, BUNDLE_ANALYTICS_COLLECTION);
      const analyticsQuery = query(
        analyticsRef, 
        where('bundle_id', '==', bundleId),
        where('date', '==', today)
      );
      
      const snapshot = await getDocs(analyticsQuery);
      
      if (snapshot.empty) {
        // Create new analytics record
        await addDoc(analyticsRef, {
          bundle_id: bundleId,
          date: today,
          views: 0,
          purchases: 1,
          revenue: revenue,
          created_at: serverTimestamp()
        });
      } else {
        // Update existing record
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          purchases: increment(1),
          revenue: increment(revenue),
          updated_at: serverTimestamp()
        });
      }
    } catch (error) {
      console.warn('Error tracking bundle purchase:', error);
    }
  }

  // Get bundle analytics (admin only)
  static async getBundleAnalytics(bundleId: string, startDate?: string, endDate?: string): Promise<BundleAnalytics[]> {
    try {
      const analyticsRef = collection(db, BUNDLE_ANALYTICS_COLLECTION);
      let q = query(
        analyticsRef,
        where('bundle_id', '==', bundleId),
        orderBy('date', 'desc')
      );

      if (startDate && endDate) {
        q = query(
          analyticsRef,
          where('bundle_id', '==', bundleId),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BundleAnalytics[];
    } catch (error) {
      console.error('Error fetching bundle analytics:', error);
      throw error;
    }
  }

  // Save user bundle preference
  static async saveBundlePreference(userId: string, bundleId: string, score: number): Promise<void> {
    try {
      const preferencesRef = collection(db, CUSTOMER_PREFERENCES_COLLECTION);
      const preferencesQuery = query(
        preferencesRef,
        where('user_id', '==', userId),
        where('bundle_id', '==', bundleId)
      );
      
      const snapshot = await getDocs(preferencesQuery);
      
      if (snapshot.empty) {
        // Create new preference
        await addDoc(preferencesRef, {
          user_id: userId,
          bundle_id: bundleId,
          preference_score: score,
          purchased: false,
          last_viewed: serverTimestamp(),
          created_at: serverTimestamp()
        });
      } else {
        // Update existing preference
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          preference_score: score,
          last_viewed: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving bundle preference:', error);
      throw error;
    }
  }

  // Mark bundle as purchased
  static async markBundlePurchased(userId: string, bundleId: string): Promise<void> {
    try {
      const preferencesRef = collection(db, CUSTOMER_PREFERENCES_COLLECTION);
      const preferencesQuery = query(
        preferencesRef,
        where('user_id', '==', userId),
        where('bundle_id', '==', bundleId)
      );
      
      const snapshot = await getDocs(preferencesQuery);
      
      if (snapshot.empty) {
        // Create new preference as purchased
        await addDoc(preferencesRef, {
          user_id: userId,
          bundle_id: bundleId,
          preference_score: 100,
          purchased: true,
          last_viewed: serverTimestamp(),
          created_at: serverTimestamp()
        });
      } else {
        // Update existing preference
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          purchased: true,
          last_viewed: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }
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
      // First get all active bundles
      const activeBundles = await this.getActiveBundles();
      
      // Filter bundles that contain products from the specified category
      const filteredBundles = activeBundles.filter(bundle => 
        bundle.items?.some(item => 
          item.product?.category === category
        )
      );
      
      return filteredBundles;
    } catch (error) {
      console.error('Error fetching bundles by category:', error);
      throw error;
    }
  }

  // Search bundles by name or description
  static async searchBundles(searchTerm: string): Promise<BundleWithItems[]> {
    try {
      const activeBundles = await this.getActiveBundles();
      
      const searchTermLower = searchTerm.toLowerCase();
      const filteredBundles = activeBundles.filter(bundle => 
        bundle.name.toLowerCase().includes(searchTermLower) ||
        bundle.description?.toLowerCase().includes(searchTermLower)
      );
      
      return filteredBundles;
    } catch (error) {
      console.error('Error searching bundles:', error);
      throw error;
    }
  }
}
