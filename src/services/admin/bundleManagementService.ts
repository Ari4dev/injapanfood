import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  arrayUnion, 
  arrayRemove,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { BundleWithItems } from '@/types/bundle';

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  quantity: number;
  is_required: boolean;
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    image_url?: string;
    description?: string;
  };
}

export interface CreateBundleData {
  name: string;
  description: string;
  bundle_type: 'fixed' | 'mix_and_match';
  bundle_price: number;
  original_price: number;
  savings: number;
  status: 'active' | 'inactive';
  priority: number;
  min_items: number;
  max_items: number;
  start_date: Date;
  end_date: Date;
  image_url?: string;
}

export class BundleManagementService {
  // Get all bundles for admin
  static async getAllBundles(): Promise<BundleWithItems[]> {
    try {
      const bundlesRef = collection(db, 'bundles');
      const q = query(bundlesRef, orderBy('priority', 'desc'));
      
      const snapshot = await getDocs(q);
      const bundles: BundleWithItems[] = [];
      
      snapshot.forEach(doc => {
        bundles.push({ id: doc.id, ...doc.data() } as BundleWithItems);
      });
      
      return bundles;
    } catch (error) {
      console.error('Error fetching all bundles:', error);
      throw error;
    }
  }

  // Get single bundle by ID
  static async getBundleById(bundleId: string): Promise<BundleWithItems | null> {
    try {
      const bundleRef = doc(db, 'bundles', bundleId);
      const bundleDoc = await getDoc(bundleRef);
      
      if (bundleDoc.exists()) {
        return { id: bundleDoc.id, ...bundleDoc.data() } as BundleWithItems;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching bundle:', error);
      throw error;
    }
  }

  // Create new bundle
  static async createBundle(bundleData: CreateBundleData): Promise<string> {
    try {
      const bundleId = doc(collection(db, 'bundles')).id;
      const bundleRef = doc(db, 'bundles', bundleId);
      
      const newBundle = {
        ...bundleData,
        id: bundleId,
        items: [],
        total_items: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      await setDoc(bundleRef, newBundle);
      return bundleId;
    } catch (error) {
      console.error('Error creating bundle:', error);
      throw error;
    }
  }

  // Update bundle
  static async updateBundle(bundleId: string, bundleData: Partial<CreateBundleData>): Promise<void> {
    try {
      const bundleRef = doc(db, 'bundles', bundleId);
      
      await updateDoc(bundleRef, {
        ...bundleData,
        updated_at: new Date(),
      });
    } catch (error) {
      console.error('Error updating bundle:', error);
      throw error;
    }
  }

  // Delete bundle
  static async deleteBundle(bundleId: string): Promise<void> {
    try {
      const bundleRef = doc(db, 'bundles', bundleId);
      await deleteDoc(bundleRef);
    } catch (error) {
      console.error('Error deleting bundle:', error);
      throw error;
    }
  }

  // Add product to bundle
  static async addProductToBundle(bundleId: string, productData: BundleItem): Promise<void> {
    try {
      // Save to separate bundle_items collection
      const bundleItemRef = doc(collection(db, 'bundle_items'));
      const bundleItemData = {
        bundle_id: bundleId,
        product_id: productData.product_id,
        quantity: productData.quantity,
        is_required: productData.is_required,
        created_at: new Date(),
      };
      
      await setDoc(bundleItemRef, bundleItemData);
      
      // Update bundle total_items count
      const bundleRef = doc(db, 'bundles', bundleId);
      const bundle = await this.getBundleById(bundleId);
      
      if (bundle) {
        await updateDoc(bundleRef, {
          total_items: (bundle.total_items || 0) + 1,
          updated_at: new Date(),
        });
      }
    } catch (error) {
      console.error('Error adding product to bundle:', error);
      throw error;
    }
  }

  // Remove product from bundle
  static async removeProductFromBundle(bundleId: string, itemToRemove: BundleItem): Promise<void> {
    try {
      const bundleRef = doc(db, 'bundles', bundleId);
      const bundle = await this.getBundleById(bundleId);
      
      if (!bundle) {
        throw new Error('Bundle not found');
      }

      await updateDoc(bundleRef, {
        items: arrayRemove(itemToRemove),
        total_items: Math.max((bundle.items?.length || 1) - 1, 0),
        updated_at: new Date(),
      });
    } catch (error) {
      console.error('Error removing product from bundle:', error);
      throw error;
    }
  }

  // Update bundle item
  static async updateBundleItem(bundleId: string, oldItem: BundleItem, newItem: BundleItem): Promise<void> {
    try {
      // Remove old item and add new item
      await this.removeProductFromBundle(bundleId, oldItem);
      await this.addProductToBundle(bundleId, newItem);
    } catch (error) {
      console.error('Error updating bundle item:', error);
      throw error;
    }
  }

  // Calculate bundle savings
  static calculateSavings(originalPrice: number, bundlePrice: number): number {
    return Math.max(originalPrice - bundlePrice, 0);
  }

  // Validate bundle data
  static validateBundleData(bundleData: CreateBundleData): string[] {
    const errors: string[] = [];

    if (!bundleData.name?.trim()) {
      errors.push('Nama bundle harus diisi');
    }

    if (!bundleData.description?.trim()) {
      errors.push('Deskripsi bundle harus diisi');
    }

    if (bundleData.bundle_price <= 0) {
      errors.push('Harga bundle harus lebih dari 0');
    }

    if (bundleData.original_price <= 0) {
      errors.push('Harga asli harus lebih dari 0');
    }

    if (bundleData.bundle_price >= bundleData.original_price) {
      errors.push('Harga bundle harus lebih kecil dari harga asli');
    }

    if (bundleData.min_items <= 0) {
      errors.push('Minimum item harus lebih dari 0');
    }

    if (bundleData.max_items < bundleData.min_items) {
      errors.push('Maximum item harus lebih besar atau sama dengan minimum item');
    }

    if (bundleData.start_date >= bundleData.end_date) {
      errors.push('Tanggal mulai harus sebelum tanggal berakhir');
    }

    return errors;
  }
}
