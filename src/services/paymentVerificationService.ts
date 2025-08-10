import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { approveBitKodeCommission } from './affiliateSyncService';

/**
 * Enhanced payment verification that auto-approves BitKode commission
 * when payment is verified
 */
export const verifyPaymentWithCommission = async (
  orderId: string,
  orderStatus: string = 'confirmed',
  paymentStatus: string = 'verified'
): Promise<void> => {
  try {
    console.log('💰 [Payment] Verifying payment for order:', orderId);
    
    // Step 1: Update order status
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: orderStatus,
      payment_status: paymentStatus,
      payment_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log('✅ [Payment] Order status updated to:', { orderStatus, paymentStatus });
    
    // Step 2: If payment is verified, auto-approve BitKode commission
    if (paymentStatus === 'verified') {
      console.log('🔄 [Payment] Checking for BitKode commission to approve...');
      
      // Find BitKode commission for this order
      const commissionsRef = collection(db, 'affiliateOrders');
      const q = query(commissionsRef, where('orderId', '==', orderId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const commissionDoc = snapshot.docs[0];
        const commissionData = commissionDoc.data();
        
        console.log('📝 [Payment] Found BitKode commission:', {
          id: commissionDoc.id,
          status: commissionData.commissionStatus,
          amount: commissionData.commissionAmount
        });
        
        // Only approve if status is pending
        if (commissionData.commissionStatus === 'pending') {
          console.log('🎯 [Payment] Auto-approving BitKode commission...');
          
          // This will approve AND sync to old system automatically
          await approveBitKodeCommission(commissionDoc.id, 'system-auto-approval');
          
          console.log('✅ [Payment] Commission approved and synced to old system!');
        } else {
          console.log('ℹ️ [Payment] Commission already processed, status:', commissionData.commissionStatus);
        }
      } else {
        console.log('ℹ️ [Payment] No BitKode commission found for this order');
        
        // Check if there's old system commission
        const oldCommissionsRef = collection(db, 'affiliate_commissions');
        const oldQ = query(oldCommissionsRef, where('orderId', '==', orderId));
        const oldSnapshot = await getDocs(oldQ);
        
        if (!oldSnapshot.empty) {
          console.log('📝 [Payment] Found old system commission, may need manual processing');
        }
      }
    }
    
    console.log('✅ [Payment] Payment verification completed successfully');
    
  } catch (error) {
    console.error('❌ [Payment] Error in payment verification:', error);
    throw error;
  }
};

/**
 * Reject payment and also reject associated commission
 */
export const rejectPaymentWithCommission = async (
  orderId: string,
  orderStatus: string = 'cancelled',
  paymentStatus: string = 'rejected'
): Promise<void> => {
  try {
    console.log('❌ [Payment] Rejecting payment for order:', orderId);
    
    // Step 1: Update order status
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: orderStatus,
      payment_status: paymentStatus,
      payment_rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log('✅ [Payment] Order status updated to:', { orderStatus, paymentStatus });
    
    // Step 2: Also reject BitKode commission if exists
    const commissionsRef = collection(db, 'affiliateOrders');
    const q = query(commissionsRef, where('orderId', '==', orderId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const commissionDoc = snapshot.docs[0];
      const commissionData = commissionDoc.data();
      
      if (commissionData.commissionStatus === 'pending') {
        console.log('🔄 [Payment] Auto-rejecting BitKode commission...');
        
        await updateDoc(doc(db, 'affiliateOrders', commissionDoc.id), {
          commissionStatus: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectedBy: 'system-auto-rejection',
          rejectionReason: 'Payment rejected',
          updatedAt: new Date().toISOString()
        });
        
        console.log('✅ [Payment] Commission rejected');
      }
    }
    
    console.log('✅ [Payment] Payment rejection completed');
    
  } catch (error) {
    console.error('❌ [Payment] Error in payment rejection:', error);
    throw error;
  }
};

/**
 * Check if order has pending commission that needs approval
 */
export const checkPendingCommission = async (orderId: string): Promise<{
  hasPendingCommission: boolean;
  commissionId?: string;
  commissionAmount?: number;
  system: 'bitkode' | 'old' | 'none';
}> => {
  try {
    // Check BitKode system first
    const bitKodeRef = collection(db, 'affiliateOrders');
    const bitKodeQuery = query(
      bitKodeRef, 
      where('orderId', '==', orderId),
      where('commissionStatus', '==', 'pending')
    );
    const bitKodeSnapshot = await getDocs(bitKodeQuery);
    
    if (!bitKodeSnapshot.empty) {
      const doc = bitKodeSnapshot.docs[0];
      return {
        hasPendingCommission: true,
        commissionId: doc.id,
        commissionAmount: doc.data().commissionAmount,
        system: 'bitkode'
      };
    }
    
    // Check old system
    const oldRef = collection(db, 'affiliate_commissions');
    const oldQuery = query(
      oldRef,
      where('orderId', '==', orderId),
      where('status', '==', 'pending')
    );
    const oldSnapshot = await getDocs(oldQuery);
    
    if (!oldSnapshot.empty) {
      const doc = oldSnapshot.docs[0];
      return {
        hasPendingCommission: true,
        commissionId: doc.id,
        commissionAmount: doc.data().commissionAmount,
        system: 'old'
      };
    }
    
    return {
      hasPendingCommission: false,
      system: 'none'
    };
    
  } catch (error) {
    console.error('Error checking pending commission:', error);
    return {
      hasPendingCommission: false,
      system: 'none'
    };
  }
};

export default {
  verifyPaymentWithCommission,
  rejectPaymentWithCommission,
  checkPendingCommission
};
