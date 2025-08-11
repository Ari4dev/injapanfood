import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  country: 'ID' | 'JP';
  currency: 'IDR' | 'JPY';
  isActive: boolean;
  isDefault: boolean;
  branch?: string;
  swiftCode?: string;
  bankCode?: string;
  branchCode?: string;
  createdAt: string;
  updatedAt: string;
}

interface BankAccountFilters {
  isActive?: boolean;
  country?: 'ID' | 'JP';
  currency?: 'IDR' | 'JPY';
  isDefault?: boolean;
}

/**
 * Fetch bank accounts with optional filtering
 * @param filters - Optional filters to apply
 * @returns Promise<BankAccount[]>
 */
export const getBankAccounts = async (filters?: BankAccountFilters): Promise<BankAccount[]> => {
  try {
    console.log('🏦 [BankService] Fetching bank accounts with filters:', filters);
    
    let q = query(collection(db, 'admin_bank_accounts'));
    
    // Apply filters if provided
    if (filters?.isActive !== undefined) {
      q = query(q, where('isActive', '==', filters.isActive));
    }
    
    if (filters?.country) {
      q = query(q, where('country', '==', filters.country));
    }
    
    if (filters?.currency) {
      q = query(q, where('currency', '==', filters.currency));
    }
    
    if (filters?.isDefault !== undefined) {
      q = query(q, where('isDefault', '==', filters.isDefault));
    }
    
    // Order by creation date (newest first)
    q = query(q, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    const accounts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BankAccount[];
    
    console.log(`✅ [BankService] Retrieved ${accounts.length} bank accounts`);
    return accounts;
    
  } catch (error) {
    console.error('❌ [BankService] Error fetching bank accounts:', error);
    return [];
  }
};

/**
 * Get active bank accounts for a specific country/payment method
 * @param paymentMethod - Payment method to determine country
 * @returns Promise<BankAccount[]>
 */
export const getBankAccountsForPayment = async (paymentMethod: string): Promise<BankAccount[]> => {
  const country = getCountryFromPaymentMethod(paymentMethod);
  
  return getBankAccounts({
    isActive: true,
    country: country
  });
};

/**
 * Get the default bank account for a specific country
 * @param country - Country code ('ID' or 'JP')
 * @returns Promise<BankAccount | null>
 */
export const getDefaultBankAccount = async (country: 'ID' | 'JP'): Promise<BankAccount | null> => {
  const accounts = await getBankAccounts({
    isActive: true,
    country: country,
    isDefault: true
  });
  
  return accounts.length > 0 ? accounts[0] : null;
};

/**
 * Helper function to determine country from payment method
 * @param paymentMethod - Payment method string
 * @returns 'ID' | 'JP'
 */
export const getCountryFromPaymentMethod = (paymentMethod: string): 'ID' | 'JP' => {
  if (paymentMethod.includes('Rupiah') || paymentMethod.includes('QRIS')) {
    return 'ID';
  } else if (paymentMethod.includes('Yucho') || paymentMethod.includes('ゆうちょ')) {
    return 'JP';
  }
  
  // Default to Indonesia for unknown payment methods
  return 'ID';
};

/**
 * Get currency from payment method
 * @param paymentMethod - Payment method string
 * @returns 'IDR' | 'JPY'
 */
export const getCurrencyFromPaymentMethod = (paymentMethod: string): 'IDR' | 'JPY' => {
  const country = getCountryFromPaymentMethod(paymentMethod);
  return country === 'ID' ? 'IDR' : 'JPY';
};
