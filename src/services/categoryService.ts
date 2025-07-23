import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  setDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';

const CATEGORIES_COLLECTION = 'categories';
const PRODUCTS_COLLECTION = 'products';

// Get all categories
export const getAllCategories = async () => {
  try {
    // First check if the categories collection exists and has documents
    try {
      const categoriesRef = collection(db, CATEGORIES_COLLECTION);
      const q = query(categoriesRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      // If we have categories, return them
      if (snapshot.size > 0) {
        console.log(`Found ${snapshot.size} categories in Firestore`);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      // If no categories exist, initialize with default categories
      console.log('No categories found, initializing default categories');
      return getDefaultCategories();
    } catch (innerError) {
      console.error('Error accessing categories collection:', innerError);
      
      // Check for permission errors
      if (innerError?.code === 'permission-denied' || 
          innerError?.message?.includes('Missing or insufficient permissions') ||
          innerError?.message?.includes('permission-denied')) {
        console.warn('Permission denied accessing categories. Using default categories.');
        return getDefaultCategories();
      }
      
      throw innerError;
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    // Return default categories as fallback
    console.warn('Using fallback categories due to error');
    return getDefaultCategories();
  }
};

// Default categories fallback
const getDefaultCategories = () => {
  return [
    { id: 'makanan-ringan', name: 'Makanan Ringan', slug: 'makanan-ringan', icon: '🍿', description: 'Snack dan makanan ringan', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'bumbu-dapur', name: 'Bumbu Dapur', slug: 'bumbu-dapur', icon: '🌶️', description: 'Bumbu dan rempah masakan', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'makanan-siap-saji', name: 'Makanan Siap Saji', slug: 'makanan-siap-saji', icon: '🍱', description: 'Makanan siap konsumsi', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'bahan-masak-beku', name: 'Bahan Masak Beku', slug: 'bahan-masak-beku', icon: '🧊', description: 'Bahan masakan beku', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'sayur-bumbu', name: 'Sayur & Bumbu', slug: 'sayur-bumbu', icon: '🥬', description: 'Sayuran dan bumbu segar', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'kerupuk', name: 'Kerupuk', slug: 'kerupuk', icon: '🍘', description: 'Kerupuk dan keripik', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'minuman', name: 'Minuman', slug: 'minuman', icon: '🥤', description: 'Minuman dan beverage', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'rempah-instan', name: 'Rempah Instan', slug: 'rempah-instan', icon: '🧂', description: 'Rempah dan bumbu instan', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'obat-obatan', name: 'Obat-obatan', slug: 'obat-obatan', icon: '💊', description: 'Obat dan suplemen', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'elektronik', name: 'Elektronik', slug: 'elektronik', icon: '📱', description: 'Perangkat elektronik', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ];
};

// Initialize default categories in Firestore
const initializeDefaultCategories = async () => {
  try {
    console.log('Initializing default categories in Firestore');
    const defaultCategories = getDefaultCategories();
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    
    // Add each default category to Firestore
    const promises = defaultCategories.map(async (category) => {
      try {
        // Use setDoc with merge to avoid duplicates
        await setDoc(doc(db, CATEGORIES_COLLECTION, category.id), category, { merge: true });
        return { ...category, id: category.id };
      } catch (error) {
        console.error(`Error adding category ${category.name}:`, error);
        return category; // Return the category anyway for the UI
      }
    });
    
    const results = await Promise.all(promises);
    console.log(`Initialized ${results.length} default categories`);
    return results;
  } catch (error) {
    console.error('Error initializing default categories:', error);
    // Return default categories even if initialization fails
    return getDefaultCategories();
  }
};

// Get a single category by ID
export const getCategory = async (id: string) => {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
    const categoryDoc = await getDoc(categoryRef);
    
    if (categoryDoc.exists()) {
      return {
        id: categoryDoc.id,
        ...categoryDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

// Add a new category
export const addCategory = async (categoryData: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}) => {
  try {
    // Check if category with same name or slug already exists
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const nameQuery = query(categoriesRef, where('name', '==', categoryData.name));
    const slugQuery = query(categoriesRef, where('slug', '==', categoryData.slug));
    
    const nameSnapshot = await getDocs(nameQuery);
    if (!nameSnapshot.empty) {
      throw new Error('A category with this name already exists');
    }
    
    const slugSnapshot = await getDocs(slugQuery);
    if (!slugSnapshot.empty) {
      throw new Error('A category with this slug already exists');
    }
    
    const timestamp = new Date().toISOString();
    const newCategory = {
      ...categoryData,
      created_at: timestamp,
      updated_at: timestamp
    };
    
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), newCategory);
    return {
      id: docRef.id,
      ...newCategory
    };
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

// Update a category
export const updateCategory = async (
  id: string, 
  updates: {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
  }
) => {
  try {
    // If name is being updated, check if it already exists
    if (updates.name) {
      const categoriesRef = collection(db, CATEGORIES_COLLECTION);
      const nameQuery = query(categoriesRef, where('name', '==', updates.name));
      const nameSnapshot = await getDocs(nameQuery);
      
      // Check if any category with this name exists that isn't the one we're updating
      const conflictingCategory = nameSnapshot.docs.find(doc => doc.id !== id);
      if (conflictingCategory) {
        throw new Error('A category with this name already exists');
      }
    }
    
    // If slug is being updated, check if it already exists
    if (updates.slug) {
      const categoriesRef = collection(db, CATEGORIES_COLLECTION);
      const slugQuery = query(categoriesRef, where('slug', '==', updates.slug));
      const slugSnapshot = await getDocs(slugQuery);
      
      // Check if any category with this slug exists that isn't the one we're updating
      const conflictingCategory = slugSnapshot.docs.find(doc => doc.id !== id);
      if (conflictingCategory) {
        throw new Error('A category with this slug already exists');
      }
    }
    
    const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(categoryRef, {
      ...updates,
      updated_at: new Date().toISOString()
    });
    
    return {
      id,
      ...updates
    };
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete a category
export const deleteCategory = async (id: string) => {
  try {
    // Check if there are products in this category
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, where('category', '==', id));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw new Error('Cannot delete category with associated products');
    }
    
    const categoryRef = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(categoryRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Get product count for a category
export const getCategoryProductCount = async (categoryId: string) => {
  try {
    // First try to get products by category ID
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, where('category', '==', categoryId));
    const snapshot = await getDocs(q);
    
    if (snapshot.size > 0) {
      return snapshot.size;
    }
    
    // If no products found by ID, try to get by category name
    // This is for backward compatibility with existing data
    const categoryDoc = await getDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
    if (categoryDoc.exists()) {
      const categoryName = categoryDoc.data().name;
      const nameQuery = query(productsRef, where('category', '==', categoryName));
      const nameSnapshot = await getDocs(nameQuery);
      return nameSnapshot.size;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting category product count:', error);
    return 0; // Return 0 instead of throwing to prevent UI errors
  }
};

// Get categories with product counts
export const getCategoriesWithProductCounts = async () => {
  try {
    const categories = await getAllCategories();
    
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await getCategoryProductCount(category.id);
        return { ...category, productCount: count };
      })
    );
    
    return categoriesWithCounts;
  } catch (error) {
    console.error('Error fetching categories with product counts:', error);
    throw error;
  }
};

export { initializeDefaultCategories }