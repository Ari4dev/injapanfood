import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  updateDoc,
  query,
  where,
  runTransaction,
  increment
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AffiliateOrder } from './shopeeAffiliateSystem';

// ==================== AFFILIATE SYNC SERVICE ====================
// Bridges BitKode (new) system with Traditional (old) affiliate system
// Ensures commission data consistency for payouts

/**
 * Sync approved BitKode commission to old system balance
 * Called when BitKode order commission is approved
 */
export const syncBitKodeCommissionToOldSystem = async (
  affiliateOrderId: string
): Promise<void> => {
  try {
    console.log('🔄 [Sync] Starting BitKode to Old System sync for order:', affiliateOrderId);
    
    await runTransaction(db, async (transaction) => {
      // Get BitKode order details
      const orderRef = doc(db, 'affiliateOrders', affiliateOrderId);
      const orderDoc = await transaction.get(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error(`BitKode order ${affiliateOrderId} not found`);
      }
      
      const orderData = orderDoc.data() as AffiliateOrder;
      
      // Only sync approved commissions
      if (orderData.commissionStatus !== 'approved') {
        console.log('⚠️ [Sync] Commission not approved, skipping sync');
        return;
      }
      
      // Check if already synced (prevent double sync)
      if (orderData.syncedToOldSystem) {
        console.log('⚠️ [Sync] Already synced to old system, skipping');
        return;
      }
      
      // Get affiliate in old system
      const affiliatesRef = collection(db, 'affiliates');
      const affiliateQuery = query(
        affiliatesRef,
        where('id', '==', orderData.referrerId)
      );
      const affiliateSnapshot = await getDocs(affiliateQuery);
      
      if (affiliateSnapshot.empty) {
        // Try direct doc reference
        const affiliateDocRef = doc(db, 'affiliates', orderData.referrerId);
        const affiliateDoc = await transaction.get(affiliateDocRef);
        
        if (!affiliateDoc.exists()) {
          throw new Error(`Affiliate ${orderData.referrerId} not found in old system`);
        }
        
        // Update old system balance
        transaction.update(affiliateDocRef, {
          approvedCommission: increment(orderData.commissionAmount),
          totalCommission: increment(orderData.commissionAmount),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Update using found document
        const affiliateDoc = affiliateSnapshot.docs[0];
        const affiliateRef = doc(db, 'affiliates', affiliateDoc.id);
        
        transaction.update(affiliateRef, {
          approvedCommission: increment(orderData.commissionAmount),
          totalCommission: increment(orderData.commissionAmount),
          updatedAt: new Date().toISOString()
        });
      }
      
      // Mark BitKode order as synced
      transaction.update(orderRef, {
        syncedToOldSystem: true,
        syncedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ [Sync] Successfully synced commission:', {
        orderId: affiliateOrderId,
        affiliateId: orderData.referrerId,
        amount: orderData.commissionAmount
      });
    });
    
  } catch (error) {
    console.error('❌ [Sync] Error syncing BitKode commission to old system:', error);
    throw error;
  }
};

/**
 * Approve BitKode commission and auto-sync to old system
 * This replaces direct commission approval
 */
export const approveBitKodeCommission = async (
  affiliateOrderId: string,
  approvedBy?: string
): Promise<void> => {
  try {
    console.log('📝 [Sync] Approving BitKode commission:', affiliateOrderId);
    
    // Update BitKode order status to approved
    const orderRef = doc(db, 'affiliateOrders', affiliateOrderId);
    await updateDoc(orderRef, {
      commissionStatus: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: approvedBy || 'system',
      updatedAt: new Date().toISOString()
    });
    
    // Auto-sync to old system for payout availability
    await syncBitKodeCommissionToOldSystem(affiliateOrderId);
    
    console.log('✅ [Sync] Commission approved and synced successfully');
    
  } catch (error) {
    console.error('❌ [Sync] Error approving BitKode commission:', error);
    throw error;
  }
};

/**
 * Reject BitKode commission
 */
export const rejectBitKodeCommission = async (
  affiliateOrderId: string,
  rejectedBy?: string,
  reason?: string
): Promise<void> => {
  try {
    console.log('❌ [Sync] Rejecting BitKode commission:', affiliateOrderId);
    
    const orderRef = doc(db, 'affiliateOrders', affiliateOrderId);
    await updateDoc(orderRef, {
      commissionStatus: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: rejectedBy || 'system',
      rejectionReason: reason,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ [Sync] Commission rejected successfully');
    
  } catch (error) {
    console.error('❌ [Sync] Error rejecting BitKode commission:', error);
    throw error;
  }
};

/**
 * Bulk sync all approved BitKode commissions to old system
 * Use for initial migration or fixing out-of-sync data
 */
export const bulkSyncBitKodeToOldSystem = async (): Promise<{
  synced: number;
  failed: number;
  skipped: number;
}> => {
  try {
    console.log('🔄 [Sync] Starting bulk sync of BitKode commissions...');
    
    const stats = {
      synced: 0,
      failed: 0,
      skipped: 0
    };
    
    // Get all approved BitKode orders that haven't been synced
    const ordersRef = collection(db, 'affiliateOrders');
    const approvedQuery = query(
      ordersRef,
      where('commissionStatus', '==', 'approved')
    );
    
    const snapshot = await getDocs(approvedQuery);
    console.log(`📊 [Sync] Found ${snapshot.size} approved BitKode orders`);
    
    // Process each order
    for (const orderDoc of snapshot.docs) {
      const orderData = orderDoc.data() as AffiliateOrder;
      
      // Skip if already synced
      if (orderData.syncedToOldSystem) {
        stats.skipped++;
        continue;
      }
      
      try {
        await syncBitKodeCommissionToOldSystem(orderDoc.id);
        stats.synced++;
      } catch (error) {
        console.error(`Failed to sync order ${orderDoc.id}:`, error);
        stats.failed++;
      }
    }
    
    console.log('✅ [Sync] Bulk sync completed:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ [Sync] Error in bulk sync:', error);
    throw error;
  }
};

/**
 * Get combined balance from both systems
 * Useful for displaying accurate total balance
 */
export const getCombinedAffiliateBalance = async (
  affiliateId: string
): Promise<{
  oldSystemBalance: number;
  bitKodeBalance: number;
  totalBalance: number;
  pendingBitKode: number;
}> => {
  try {
    console.log('💰 [Sync] Getting combined balance for affiliate:', affiliateId);
    
    // Get old system balance
    let oldSystemBalance = 0;
    const affiliateRef = doc(db, 'affiliates', affiliateId);
    const affiliateDoc = await getDoc(affiliateRef);
    
    if (affiliateDoc.exists()) {
      oldSystemBalance = affiliateDoc.data().approvedCommission || 0;
    }
    
    // Get BitKode system balance (unsynced approved commissions)
    const ordersRef = collection(db, 'affiliateOrders');
    const approvedQuery = query(
      ordersRef,
      where('referrerId', '==', affiliateId),
      where('commissionStatus', '==', 'approved'),
      where('syncedToOldSystem', '!=', true)
    );
    
    const approvedSnapshot = await getDocs(approvedQuery);
    const bitKodeBalance = approvedSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().commissionAmount || 0),
      0
    );
    
    // Get pending BitKode commissions
    const pendingQuery = query(
      ordersRef,
      where('referrerId', '==', affiliateId),
      where('commissionStatus', '==', 'pending')
    );
    
    const pendingSnapshot = await getDocs(pendingQuery);
    const pendingBitKode = pendingSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().commissionAmount || 0),
      0
    );
    
    const result = {
      oldSystemBalance,
      bitKodeBalance,
      totalBalance: oldSystemBalance + bitKodeBalance,
      pendingBitKode
    };
    
    console.log('✅ [Sync] Combined balance calculated:', result);
    return result;
    
  } catch (error) {
    console.error('❌ [Sync] Error getting combined balance:', error);
    throw error;
  }
};

/**
 * Check sync status for monitoring
 */
export const getSyncStatus = async (): Promise<{
  totalBitKodeOrders: number;
  approvedOrders: number;
  syncedOrders: number;
  unsyncedOrders: number;
  pendingSync: number;
}> => {
  try {
    const ordersRef = collection(db, 'affiliateOrders');
    
    // Total orders
    const allOrders = await getDocs(ordersRef);
    const totalBitKodeOrders = allOrders.size;
    
    // Approved orders
    const approvedQuery = query(ordersRef, where('commissionStatus', '==', 'approved'));
    const approvedSnapshot = await getDocs(approvedQuery);
    const approvedOrders = approvedSnapshot.size;
    
    // Synced orders
    const syncedQuery = query(
      ordersRef,
      where('commissionStatus', '==', 'approved'),
      where('syncedToOldSystem', '==', true)
    );
    const syncedSnapshot = await getDocs(syncedQuery);
    const syncedOrders = syncedSnapshot.size;
    
    // Calculate unsynced
    const unsyncedOrders = approvedOrders - syncedOrders;
    
    return {
      totalBitKodeOrders,
      approvedOrders,
      syncedOrders,
      unsyncedOrders,
      pendingSync: unsyncedOrders
    };
    
  } catch (error) {
    console.error('❌ [Sync] Error getting sync status:', error);
    throw error;
  }
};

// Auto-sync when BitKode order is processed
export const processAffiliateOrderWithSync = async (
  userId: string,
  orderId: string,
  orderTotal: number
): Promise<void> => {
  try {
    // Import the original function
    const { processAffiliateOrder } = await import('./shopeeAffiliateSystem');
    
    // Process order normally
    await processAffiliateOrder(userId, orderId, orderTotal);
    
    // Note: Auto-sync happens when admin approves the commission
    // Not immediately on order creation (commission needs approval first)
    
    console.log('📝 [Sync] Order processed. Commission pending approval for sync.');
    
  } catch (error) {
    console.error('❌ [Sync] Error processing order with sync:', error);
    throw error;
  }
};

export default {
  syncBitKodeCommissionToOldSystem,
  approveBitKodeCommission,
  rejectBitKodeCommission,
  bulkSyncBitKodeToOldSystem,
  getCombinedAffiliateBalance,
  getSyncStatus,
  processAffiliateOrderWithSync
};
