import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/config/firebase';

const COD_SETTINGS_COLLECTION = 'cod_settings';
const COD_SETTINGS_DOC_ID = 'default';

export interface CODSettings {
  id: string;
  surchargeAmount: number;
  isEnabled: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Get COD surcharge settings
export const getCODSettings = async (): Promise<CODSettings> => {
  try {
    const settingsRef = doc(db, COD_SETTINGS_COLLECTION, COD_SETTINGS_DOC_ID);
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      // Create default settings if not exists
      const defaultSettings: Omit<CODSettings, 'id'> = {
        surchargeAmount: 250, // ¥250 default
        isEnabled: true,
        description: 'Biaya tambahan untuk pembayaran COD (Cash on Delivery)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(settingsRef, defaultSettings);
      
      return {
        id: COD_SETTINGS_DOC_ID,
        ...defaultSettings
      };
    }
    
    return {
      id: settingsDoc.id,
      ...settingsDoc.data()
    } as CODSettings;
  } catch (error) {
    console.error('Error getting COD settings:', error);
    // Return default settings if error occurs
    return {
      id: COD_SETTINGS_DOC_ID,
      surchargeAmount: 250,
      isEnabled: true,
      description: 'Biaya tambahan untuk pembayaran COD (Cash on Delivery)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
};

// Update COD surcharge settings (admin only)
export const updateCODSettings = async (updates: {
  surchargeAmount?: number;
  isEnabled?: boolean;
  description?: string;
}): Promise<void> => {
  try {
    const settingsRef = doc(db, COD_SETTINGS_COLLECTION, COD_SETTINGS_DOC_ID);
    
    await updateDoc(settingsRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating COD settings:', error);
    throw error;
  }
};

// Calculate total with COD surcharge
export const calculateTotalWithCOD = (
  subtotal: number,
  shippingFee: number,
  paymentMethod: string,
  codSurcharge: number
): {
  subtotal: number;
  shippingFee: number;
  codSurcharge: number;
  total: number;
} => {
  const isCOD = paymentMethod === 'COD (Cash on Delivery)';
  const appliedCODSurcharge = isCOD ? codSurcharge : 0;
  
  return {
    subtotal,
    shippingFee,
    codSurcharge: appliedCODSurcharge,
    total: subtotal + shippingFee + appliedCODSurcharge
  };
};