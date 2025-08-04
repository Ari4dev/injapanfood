import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: any;
  updated_at?: any;
}

const CATEGORIES_COLLECTION = 'categories';

export class FirestoreCategoryService {
  // Get all active categories
  static async getActiveCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, CATEGORIES_COLLECTION);
      const q = query(
        categoriesRef,
        where('is_active', '==', true),
        orderBy('sort_order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const categories: Category[] = [];
      
      snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() } as Category);
      });
      
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Get all categories (including inactive ones)
  static async getAllCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, CATEGORIES_COLLECTION);
      const q = query(categoriesRef, orderBy('sort_order', 'asc'));
      
      const snapshot = await getDocs(q);
      const categories: Category[] = [];
      
      snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() } as Category);
      });
      
      return categories;
    } catch (error) {
      console.error('Error fetching all categories:', error);
      throw error;
    }
  }

  // Get parent categories only
  static async getParentCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, CATEGORIES_COLLECTION);
      const q = query(
        categoriesRef,
        where('is_active', '==', true),
        where('parent_id', '==', null),
        orderBy('sort_order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const categories: Category[] = [];
      
      snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() } as Category);
      });
      
      return categories;
    } catch (error) {
      console.error('Error fetching parent categories:', error);
      throw error;
    }
  }

  // Get subcategories by parent ID
  static async getSubcategories(parentId: string): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, CATEGORIES_COLLECTION);
      const q = query(
        categoriesRef,
        where('is_active', '==', true),
        where('parent_id', '==', parentId),
        orderBy('sort_order', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const categories: Category[] = [];
      
      snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() } as Category);
      });
      
      return categories;
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  }
}
