import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { Banner } from '@/types';

const BANNERS_COLLECTION = 'banners';
const STORAGE_FOLDER = 'banner-images';

// Get all active banners for public display
export const getActiveBanners = async (): Promise<Banner[]> => {
  try {
    const bannersRef = collection(db, BANNERS_COLLECTION);
    // First get all banners, then filter and sort on client side
    // This avoids the need for composite index
    const snapshot = await getDocs(bannersRef);
    
    const allBanners = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Banner));
    
    // Filter active banners and sort by order
    return allBanners
      .filter(banner => banner.is_active === true)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error('Error fetching active banners:', error);
    throw error;
  }
};

// Get all banners for admin management
export const getAllBanners = async (): Promise<Banner[]> => {
  try {
    const bannersRef = collection(db, BANNERS_COLLECTION);
    const q = query(bannersRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Banner));
  } catch (error) {
    console.error('Error fetching all banners:', error);
    throw error;
  }
};

// Upload banner image to Firebase Storage
export const uploadBannerImage = async (file: File): Promise<string> => {
  try {
    console.log('Starting banner image upload...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    const fileExt = file.name.split('.').pop();
    const fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const storageRef = ref(storage, `${STORAGE_FOLDER}/${fileName}`);
    
    console.log('Uploading to storage path:', `${STORAGE_FOLDER}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    console.log('Upload successful, getting download URL...');
    
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading banner image:', error);
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      serverResponse: error?.serverResponse
    });
    throw error;
  }
};

// Add new banner
export const addBanner = async (bannerData: Omit<Banner, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    // Check if adding this banner would exceed the limit of 5 active banners
    if (bannerData.is_active) {
      const activeBanners = await getActiveBanners();
      if (activeBanners.length >= 5) {
        throw new Error('Maksimal 5 banner aktif diperbolehkan');
      }
    }
    
    const bannersRef = collection(db, BANNERS_COLLECTION);
    const docRef = await addDoc(bannersRef, {
      ...bannerData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding banner:', error);
    throw error;
  }
};

// Update banner
export const updateBanner = async (id: string, updates: Partial<Banner>): Promise<void> => {
  try {
    // Check if activating this banner would exceed the limit
    if (updates.is_active === true) {
      const activeBanners = await getActiveBanners();
      const currentBanner = await getBanner(id);
      
      // If banner is currently inactive and we're trying to activate it
      if (currentBanner && !currentBanner.is_active && activeBanners.length >= 5) {
        throw new Error('Maksimal 5 banner aktif diperbolehkan');
      }
    }
    
    const bannerRef = doc(db, BANNERS_COLLECTION, id);
    await updateDoc(bannerRef, {
      ...updates,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    throw error;
  }
};

// Delete banner
export const deleteBanner = async (id: string): Promise<void> => {
  try {
    const banner = await getBanner(id);
    
    // Delete image from storage if it exists
    if (banner && banner.image_url) {
      try {
        const imageRef = ref(storage, banner.image_url);
        await deleteObject(imageRef);
      } catch (storageError) {
        console.warn('Error deleting banner image from storage:', storageError);
        // Continue with banner deletion even if image deletion fails
      }
    }
    
    const bannerRef = doc(db, BANNERS_COLLECTION, id);
    await deleteDoc(bannerRef);
  } catch (error) {
    console.error('Error deleting banner:', error);
    throw error;
  }
};

// Get single banner
export const getBanner = async (id: string): Promise<Banner | null> => {
  try {
    const bannerRef = doc(db, BANNERS_COLLECTION, id);
    const snapshot = await getDoc(bannerRef);
    
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Banner;
    }
    return null;
  } catch (error) {
    console.error('Error fetching banner:', error);
    throw error;
  }
};

// Get count of active banners
export const getActiveBannersCount = async (): Promise<number> => {
  try {
    const activeBanners = await getActiveBanners();
    return activeBanners.length;
  } catch (error) {
    console.error('Error getting active banners count:', error);
    return 0;
  }
};