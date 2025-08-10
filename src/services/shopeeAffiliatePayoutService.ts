import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// ==================== SHOPEE AFFILIATE PAYOUT SYSTEM ====================

export interface ShopeeAffiliatePayout {
  id?: string;
  affiliateId: string;
  affiliateEmail: string;
  affiliateName: string;
  
  // Payout details
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  
  // Payment method
  method: 'bank_transfer' | 'paypal' | 'other';
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  
  // Commission breakdown
  commissionIds: string[]; // IDs of commissions included in this payout
  totalCommissions: number; // Number of commissions
  
  // Timestamps
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  processedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  
  // Additional info
  notes?: string;
  transactionId?: string; // External payment transaction ID
  
  createdAt: string;
  updatedAt: string;
}

export interface ShopeeAffiliateSettings {
  id?: string;
  commissionRate: number;
  minimumPayout: number;
  attributionWindowDays: number;
  payoutSchedule: 'weekly' | 'monthly' | 'manual';
  autoApprovePayouts: boolean;
  maxPayoutAmount: number;
  
  createdAt: string;
  updatedAt: string;
}

const PAYOUTS_COLLECTION = 'shopee_affiliate_payouts';
const SETTINGS_COLLECTION = 'shopee_affiliate_settings';
const AFFILIATES_COLLECTION = 'shopee_affiliates';
const ORDERS_COLLECTION = 'affiliateOrders';

// Get affiliate settings
export const getAffiliateSettings = async (): Promise<ShopeeAffiliateSettings> => {
  try {
    const settingsRef = collection(db, SETTINGS_COLLECTION);
    const snapshot = await getDocs(settingsRef);
    
    if (!snapshot.empty) {
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as ShopeeAffiliateSettings;
    }
    
    // Return default settings if none exist
    return {
      commissionRate: 10,
      minimumPayout: 1000, // ¥1000 minimum
      attributionWindowDays: 1,
      payoutSchedule: 'manual',
      autoApprovePayouts: false,
      maxPayoutAmount: 100000, // ¥100,000 maximum
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting affiliate settings:', error);
    throw error;
  }
};

// Update affiliate bank info
export const updateAffiliateBankInfo = async (
  affiliateId: string,
  bankInfo: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  }
): Promise<void> => {
  try {
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, affiliateId);
    
    await updateDoc(affiliateRef, {
      bankInfo,
      payoutMethod: 'bank_transfer',
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Updated affiliate bank info');
  } catch (error) {
    console.error('Error updating bank info:', error);
    throw error;
  }
};

// Request payout
export const requestPayout = async (
  affiliateId: string,
  amount: number,
  method: 'bank_transfer' | 'paypal' | 'other' = 'bank_transfer',
  bankInfo?: any
): Promise<string> => {
  try {
    console.log('💰 Requesting payout:', { affiliateId, amount, method });
    
    // Get affiliate info
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, affiliateId);
    const affiliateSnap = await getDoc(affiliateRef);
    
    if (!affiliateSnap.exists()) {
      throw new Error('Affiliate not found');
    }
    
    const affiliate = affiliateSnap.data();
    
    // Get settings
    const settings = await getAffiliateSettings();
    
    // Validate minimum payout amount
    if (amount < settings.minimumPayout) {
      throw new Error(`Minimum payout amount is ¥${settings.minimumPayout}`);
    }
    
    // Validate maximum payout amount
    if (amount > settings.maxPayoutAmount) {
      throw new Error(`Maximum payout amount is ¥${settings.maxPayoutAmount}`);
    }
    
    // Check available balance
    const availableBalance = affiliate.approvedCommission || 0;
    if (amount > availableBalance) {
      throw new Error(`Insufficient balance. Available: ¥${availableBalance}`);
    }
    
    // Get approved commission IDs for this payout
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const commissionsQuery = query(
      ordersRef,
      where('referrerId', '==', affiliateId),
      where('commissionStatus', '==', 'approved'),
      orderBy('createdAt', 'asc'),
      limit(100) // Get up to 100 commissions for this payout
    );
    
    const commissionsSnapshot = await getDocs(commissionsQuery);
    const commissionIds = commissionsSnapshot.docs.map(doc => doc.id);
    
    // Create payout request
    const payoutData: Omit<ShopeeAffiliatePayout, 'id'> = {
      affiliateId,
      affiliateEmail: affiliate.email || '',
      affiliateName: affiliate.displayName || affiliate.email || '',
      amount,
      currency: 'JPY',
      status: settings.autoApprovePayouts ? 'approved' : 'pending',
      method,
      bankInfo: bankInfo || affiliate.bankInfo,
      commissionIds,
      totalCommissions: commissionIds.length,
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (settings.autoApprovePayouts) {
      payoutData.approvedAt = new Date().toISOString();
      payoutData.approvedBy = 'system';
    }
    
    // Use transaction to ensure consistency
    const payoutId = await runTransaction(db, async (transaction) => {
      // Create payout document
      const payoutRef = doc(collection(db, PAYOUTS_COLLECTION));
      transaction.set(payoutRef, payoutData);
      
      // Update affiliate balance
      transaction.update(affiliateRef, {
        approvedCommission: availableBalance - amount,
        updatedAt: new Date().toISOString()
      });
      
      // Mark commissions as being processed for payout
      for (const commissionId of commissionIds) {
        const commissionRef = doc(db, ORDERS_COLLECTION, commissionId);
        transaction.update(commissionRef, {
          commissionStatus: 'paid',
          payoutId: payoutRef.id,
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      return payoutRef.id;
    });
    
    console.log('✅ Payout request created:', payoutId);
    return payoutId;
    
  } catch (error) {
    console.error('Error requesting payout:', error);
    throw error;
  }
};

// Get affiliate payouts
export const getAffiliatePayouts = async (
  affiliateId: string
): Promise<ShopeeAffiliatePayout[]> => {
  try {
    const payoutsRef = collection(db, PAYOUTS_COLLECTION);
    const q = query(
      payoutsRef,
      where('affiliateId', '==', affiliateId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ShopeeAffiliatePayout[];
    
  } catch (error) {
    console.error('Error getting affiliate payouts:', error);
    throw error;
  }
};

// Approve payout (admin function)
export const approvePayout = async (
  payoutId: string,
  adminId: string
): Promise<void> => {
  try {
    const payoutRef = doc(db, PAYOUTS_COLLECTION, payoutId);
    
    await updateDoc(payoutRef, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: adminId,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Payout approved:', payoutId);
  } catch (error) {
    console.error('Error approving payout:', error);
    throw error;
  }
};

// Process payout (mark as being processed)
export const processPayout = async (
  payoutId: string,
  transactionId?: string
): Promise<void> => {
  try {
    const payoutRef = doc(db, PAYOUTS_COLLECTION, payoutId);
    
    const updateData: any = {
      status: 'processing',
      processedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (transactionId) {
      updateData.transactionId = transactionId;
    }
    
    await updateDoc(payoutRef, updateData);
    
    console.log('✅ Payout being processed:', payoutId);
  } catch (error) {
    console.error('Error processing payout:', error);
    throw error;
  }
};

// Complete payout
export const completePayout = async (
  payoutId: string,
  transactionId?: string,
  notes?: string
): Promise<void> => {
  try {
    const payoutRef = doc(db, PAYOUTS_COLLECTION, payoutId);
    const payoutSnap = await getDoc(payoutRef);
    
    if (!payoutSnap.exists()) {
      throw new Error('Payout not found');
    }
    
    const payout = payoutSnap.data();
    
    // Update payout status
    const updateData: any = {
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (transactionId) {
      updateData.transactionId = transactionId;
    }
    
    if (notes) {
      updateData.notes = notes;
    }
    
    await runTransaction(db, async (transaction) => {
      // Update payout
      transaction.update(payoutRef, updateData);
      
      // Update affiliate's total payouts
      const affiliateRef = doc(db, AFFILIATES_COLLECTION, payout.affiliateId);
      const affiliateSnap = await transaction.get(affiliateRef);
      
      if (affiliateSnap.exists()) {
        const affiliate = affiliateSnap.data();
        transaction.update(affiliateRef, {
          totalPayouts: (affiliate.totalPayouts || 0) + payout.amount,
          lastPayoutDate: new Date().toISOString(),
          paidCommission: (affiliate.paidCommission || 0) + payout.amount,
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    console.log('✅ Payout completed:', payoutId);
  } catch (error) {
    console.error('Error completing payout:', error);
    throw error;
  }
};

// Reject payout
export const rejectPayout = async (
  payoutId: string,
  adminId: string,
  reason: string
): Promise<void> => {
  try {
    const payoutRef = doc(db, PAYOUTS_COLLECTION, payoutId);
    const payoutSnap = await getDoc(payoutRef);
    
    if (!payoutSnap.exists()) {
      throw new Error('Payout not found');
    }
    
    const payout = payoutSnap.data();
    
    await runTransaction(db, async (transaction) => {
      // Update payout status
      transaction.update(payoutRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: adminId,
        notes: reason,
        updatedAt: new Date().toISOString()
      });
      
      // Restore affiliate balance
      const affiliateRef = doc(db, AFFILIATES_COLLECTION, payout.affiliateId);
      const affiliateSnap = await transaction.get(affiliateRef);
      
      if (affiliateSnap.exists()) {
        const affiliate = affiliateSnap.data();
        transaction.update(affiliateRef, {
          approvedCommission: (affiliate.approvedCommission || 0) + payout.amount,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Restore commission statuses
      for (const commissionId of payout.commissionIds || []) {
        const commissionRef = doc(db, ORDERS_COLLECTION, commissionId);
        transaction.update(commissionRef, {
          commissionStatus: 'approved',
          payoutId: null,
          paidAt: null,
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    console.log('✅ Payout rejected:', payoutId);
  } catch (error) {
    console.error('Error rejecting payout:', error);
    throw error;
  }
};

// Get payout statistics for admin
export const getPayoutStats = async (): Promise<{
  totalPayouts: number;
  pendingPayouts: number;
  completedPayouts: number;
  totalAmount: number;
  pendingAmount: number;
}> => {
  try {
    const payoutsRef = collection(db, PAYOUTS_COLLECTION);
    const snapshot = await getDocs(payoutsRef);
    
    let totalPayouts = 0;
    let pendingPayouts = 0;
    let completedPayouts = 0;
    let totalAmount = 0;
    let pendingAmount = 0;
    
    snapshot.docs.forEach(doc => {
      const payout = doc.data();
      totalPayouts++;
      
      if (payout.status === 'pending' || payout.status === 'approved') {
        pendingPayouts++;
        pendingAmount += payout.amount;
      }
      
      if (payout.status === 'completed') {
        completedPayouts++;
        totalAmount += payout.amount;
      }
    });
    
    return {
      totalPayouts,
      pendingPayouts,
      completedPayouts,
      totalAmount,
      pendingAmount
    };
    
  } catch (error) {
    console.error('Error getting payout stats:', error);
    throw error;
  }
};
