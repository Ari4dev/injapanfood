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
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { 
  AffiliateUser, 
  AffiliateReferral, 
  AffiliateCommission, 
  AffiliateSettings,
  AffiliateFollower,
  AffiliatePayout
} from '@/types/affiliate';

// Collection names
const AFFILIATES_COLLECTION = 'affiliates';
const AFFILIATE_REFERRALS_COLLECTION = 'affiliate_referrals';
const AFFILIATE_COMMISSIONS_COLLECTION = 'affiliate_commissions';
const AFFILIATE_SETTINGS_COLLECTION = 'affiliate_settings';
const AFFILIATE_PAYOUTS_COLLECTION = 'affiliate_payouts';

// Generate unique referral code
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create or update affiliate user
export const createOrUpdateAffiliateUser = async (
  userId: string,
  email: string,
  displayName: string
): Promise<AffiliateUser> => {
  try {
    console.log('Creating/updating affiliate user:', { userId, email, displayName });
    
    // Check if affiliate already exists
    const affiliatesRef = collection(db, AFFILIATES_COLLECTION);
    const q = query(affiliatesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Return existing affiliate
      const existingAffiliate = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as AffiliateUser;
      console.log('Affiliate already exists:', existingAffiliate);
      return existingAffiliate;
    }
    
    // Generate unique referral code
    let referralCode = generateReferralCode();
    let isUnique = false;
    
    while (!isUnique) {
      const codeQuery = query(affiliatesRef, where('referralCode', '==', referralCode));
      const codeSnapshot = await getDocs(codeQuery);
      
      if (codeSnapshot.empty) {
        isUnique = true;
      } else {
        referralCode = generateReferralCode();
      }
    }
    
    // Create new affiliate
    const newAffiliate = {
      userId,
      email,
      displayName,
      referralCode,
      totalClicks: 0,
      totalReferrals: 0,
      totalCommission: 0,
      pendingCommission: 0,
      approvedCommission: 0,
      paidCommission: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(affiliatesRef, newAffiliate);
    
    const result = {
      id: docRef.id,
      ...newAffiliate
    };
    
    console.log('New affiliate created:', result);
    return result;
  } catch (error) {
    console.error('Error creating/updating affiliate user:', error);
    throw error;
  }
};

// Get affiliate user by user ID
export const getAffiliateUser = async (userId: string): Promise<AffiliateUser | null> => {
  try {
    console.log('Getting affiliate user for userId:', userId);
    
    const affiliatesRef = collection(db, AFFILIATES_COLLECTION);
    const q = query(affiliatesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No affiliate found for userId:', userId);
      return null;
    }
    
    const affiliate = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as AffiliateUser;
    
    console.log('Found affiliate:', affiliate);
    return affiliate;
  } catch (error) {
    console.error('Error getting affiliate user:', error);
    throw error;
  }
};

// Get affiliate by referral code
export const getAffiliateByReferralCode = async (referralCode: string): Promise<AffiliateUser | null> => {
  try {
    console.log('Getting affiliate by referral code:', referralCode);
    
    const affiliatesRef = collection(db, AFFILIATES_COLLECTION);
    const q = query(affiliatesRef, where('referralCode', '==', referralCode));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No affiliate found for referral code:', referralCode);
      return null;
    }
    
    const affiliate = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as AffiliateUser;
    
    console.log('Found affiliate by referral code:', affiliate);
    return affiliate;
  } catch (error) {
    console.error('Error getting affiliate by referral code:', error);
    throw error;
  }
};

// Track referral click
export const trackReferralClick = async (
  referralCode: string,
  visitorId: string
): Promise<void> => {
  try {
    console.log('Tracking referral click:', { referralCode, visitorId });
    
    // Get affiliate by referral code
    const affiliate = await getAffiliateByReferralCode(referralCode);
    if (!affiliate) {
      console.error('Affiliate not found for referral code:', referralCode);
      return;
    }
    
    // Check if this visitor has already clicked this referral code
    const referralsRef = collection(db, AFFILIATE_REFERRALS_COLLECTION);
    const existingQuery = query(
      referralsRef,
      where('referralCode', '==', referralCode),
      where('visitorId', '==', visitorId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      console.log('Visitor has already clicked this referral code');
      return;
    }
    
    // Create referral record
    const referralData = {
      referralCode,
      referrerId: affiliate.id,
      visitorId,
      status: 'clicked',
      clickedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await addDoc(referralsRef, referralData);
    
    // Update affiliate click count
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, affiliate.id);
    await updateDoc(affiliateRef, {
      totalClicks: affiliate.totalClicks + 1,
      updatedAt: new Date().toISOString()
    });
    
    console.log('Referral click tracked successfully');
  } catch (error) {
    console.error('Error tracking referral click:', error);
    throw error;
  }
};

// Register user with referral
export const registerWithReferral = async (
  referralCode: string,
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> => {
  try {
    console.log('Registering user with referral:', { referralCode, userId, userEmail, userName });
    
    // Get affiliate by referral code
    const affiliate = await getAffiliateByReferralCode(referralCode);
    if (!affiliate) {
      console.error('Affiliate not found for referral code:', referralCode);
      return;
    }
    
    // Check if user is already registered with this referral
    const referralsRef = collection(db, AFFILIATE_REFERRALS_COLLECTION);
    const existingQuery = query(
      referralsRef,
      where('referralCode', '==', referralCode),
      where('referredUserId', '==', userId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      console.log('User already registered with this referral code');
      return;
    }
    
    // Find existing click record or create new one
    const clickQuery = query(
      referralsRef,
      where('referralCode', '==', referralCode),
      where('status', '==', 'clicked')
    );
    const clickSnapshot = await getDocs(clickQuery);
    
    if (!clickSnapshot.empty) {
      // Update existing click record
      const clickDoc = clickSnapshot.docs[0];
      await updateDoc(doc(db, AFFILIATE_REFERRALS_COLLECTION, clickDoc.id), {
        referredUserId: userId,
        referredUserEmail: userEmail,
        referredUserName: userName,
        status: 'registered',
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new referral record
      const referralData = {
        referralCode,
        referrerId: affiliate.id,
        referredUserId: userId,
        referredUserEmail: userEmail,
        referredUserName: userName,
        status: 'registered',
        registeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addDoc(referralsRef, referralData);
    }
    
    // Update affiliate referral count
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, affiliate.id);
    await updateDoc(affiliateRef, {
      totalReferrals: affiliate.totalReferrals + 1,
      updatedAt: new Date().toISOString()
    });
    
    console.log('User registered with referral successfully');
  } catch (error) {
    console.error('Error registering user with referral:', error);
    throw error;
  }
};

// Create order with referral (with duplicate prevention)
export const createOrderWithReferral = async (
  userId: string,
  orderId: string,
  orderTotal: number,
  referralCode: string
): Promise<void> => {
  try {
    console.log('Creating order with referral:', { userId, orderId, orderTotal, referralCode });
    
    // CRITICAL: Check if commission already exists for this order
    const commissionsRef = collection(db, AFFILIATE_COMMISSIONS_COLLECTION);
    const existingCommissionQuery = query(
      commissionsRef,
      where('orderId', '==', orderId)
    );
    const existingCommissionSnapshot = await getDocs(existingCommissionQuery);
    
    if (!existingCommissionSnapshot.empty) {
      console.log('Commission already exists for order:', orderId, '- skipping creation');
      return;
    }
    
    // Get affiliate by referral code
    const affiliate = await getAffiliateByReferralCode(referralCode);
    if (!affiliate) {
      console.error('Affiliate not found for referral code:', referralCode);
      return;
    }
    
    // Get commission rate from settings
    const settings = await getAffiliateSettings();
    const commissionRate = settings?.defaultCommissionRate || 5;
    const commissionAmount = Math.round((orderTotal * commissionRate) / 100);
    
    // Find or create referral record
    const referralsRef = collection(db, AFFILIATE_REFERRALS_COLLECTION);
    const referralQuery = query(
      referralsRef,
      where('referralCode', '==', referralCode),
      where('referredUserId', '==', userId)
    );
    const referralSnapshot = await getDocs(referralQuery);
    
    let referralId = null;
    
    if (!referralSnapshot.empty) {
      // Update existing referral
      const referralDoc = referralSnapshot.docs[0];
      referralId = referralDoc.id;
      
      await updateDoc(doc(db, AFFILIATE_REFERRALS_COLLECTION, referralId), {
        orderId,
        orderTotal,
        commissionAmount,
        status: 'ordered',
        orderedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new referral record
      const referralData = {
        referralCode,
        referrerId: affiliate.id,
        referredUserId: userId,
        orderId,
        orderTotal,
        commissionAmount,
        status: 'ordered',
        orderedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const referralDocRef = await addDoc(referralsRef, referralData);
      referralId = referralDocRef.id;
    }
    
    // Create commission record (only if it doesn't exist)
    const commissionData = {
      affiliateId: affiliate.id,
      referralId,
      orderId,
      orderTotal,
      commissionAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await addDoc(commissionsRef, commissionData);
    
    // Update affiliate stats
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, affiliate.id);
    await updateDoc(affiliateRef, {
      totalCommission: affiliate.totalCommission + commissionAmount,
      pendingCommission: affiliate.pendingCommission + commissionAmount,
      updatedAt: new Date().toISOString()
    });
    
    console.log('Order with referral created successfully');
  } catch (error) {
    console.error('Error creating order with referral:', error);
    throw error;
  }
};

// Approve commission
export const approveCommission = async (
  commissionId: string,
  adminId: string
): Promise<void> => {
  try {
    console.log('Approving commission:', commissionId, 'by admin:', adminId);
    
    const commissionRef = doc(db, AFFILIATE_COMMISSIONS_COLLECTION, commissionId);
    const commissionDoc = await getDoc(commissionRef);
    
    if (!commissionDoc.exists()) {
      throw new Error('Commission not found');
    }
    
    const commissionData = commissionDoc.data() as AffiliateCommission;
    
    // Check if already approved
    if (commissionData.status === 'approved') {
      console.log('Commission already approved:', commissionId);
      return;
    }
    
    // Update commission status
    await updateDoc(commissionRef, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: adminId,
      updatedAt: new Date().toISOString()
    });
    
    // Update referral status if exists
    if (commissionData.referralId) {
      const referralRef = doc(db, AFFILIATE_REFERRALS_COLLECTION, commissionData.referralId);
      await updateDoc(referralRef, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: adminId,
        updatedAt: new Date().toISOString()
      });
    }
    
    // Update affiliate stats - move from pending to approved
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, commissionData.affiliateId);
    const affiliateDoc = await getDoc(affiliateRef);
    
    if (affiliateDoc.exists()) {
      const affiliateData = affiliateDoc.data() as AffiliateUser;
      await updateDoc(affiliateRef, {
        pendingCommission: Math.max(0, affiliateData.pendingCommission - commissionData.commissionAmount),
        approvedCommission: (affiliateData.approvedCommission || 0) + commissionData.commissionAmount,
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log('Commission approved successfully');
  } catch (error) {
    console.error('Error approving commission:', error);
    throw error;
  }
};

// Reject commission
export const rejectCommission = async (
  commissionId: string,
  adminId: string,
  reason: string
): Promise<void> => {
  try {
    console.log('Rejecting commission:', commissionId, 'by admin:', adminId, 'reason:', reason);
    
    const commissionRef = doc(db, AFFILIATE_COMMISSIONS_COLLECTION, commissionId);
    const commissionDoc = await getDoc(commissionRef);
    
    if (!commissionDoc.exists()) {
      throw new Error('Commission not found');
    }
    
    const commissionData = commissionDoc.data() as AffiliateCommission;
    
    // Check if already rejected
    if (commissionData.status === 'rejected') {
      console.log('Commission already rejected:', commissionId);
      return;
    }
    
    // Update commission status
    await updateDoc(commissionRef, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: adminId,
      notes: reason,
      updatedAt: new Date().toISOString()
    });
    
    // Update referral status if exists
    if (commissionData.referralId) {
      const referralRef = doc(db, AFFILIATE_REFERRALS_COLLECTION, commissionData.referralId);
      await updateDoc(referralRef, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: adminId,
        updatedAt: new Date().toISOString()
      });
    }
    
    // Update affiliate stats - remove from pending and total
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, commissionData.affiliateId);
    const affiliateDoc = await getDoc(affiliateRef);
    
    if (affiliateDoc.exists()) {
      const affiliateData = affiliateDoc.data() as AffiliateUser;
      await updateDoc(affiliateRef, {
        pendingCommission: Math.max(0, affiliateData.pendingCommission - commissionData.commissionAmount),
        totalCommission: Math.max(0, affiliateData.totalCommission - commissionData.commissionAmount),
        updatedAt: new Date().toISOString()
      });
    }
    
    console.log('Commission rejected successfully');
  } catch (error) {
    console.error('Error rejecting commission:', error);
    throw error;
  }
};

// Get affiliate settings
export const getAffiliateSettings = async (): Promise<AffiliateSettings | null> => {
  try {
    const settingsRef = doc(db, AFFILIATE_SETTINGS_COLLECTION, 'default');
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      // Create default settings if not exists
      const defaultSettings = {
        defaultCommissionRate: 5,
        minPayoutAmount: 5000,
        payoutMethods: ['Bank Transfer', 'Transfer Bank Rupiah (Indonesia)'],
        termsAndConditions: 'Default terms and conditions for affiliate program.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(settingsRef, defaultSettings);
      
      return {
        id: 'default',
        ...defaultSettings
      };
    }
    
    return {
      id: settingsDoc.id,
      ...settingsDoc.data()
    } as AffiliateSettings;
  } catch (error) {
    console.error('Error getting affiliate settings:', error);
    return null;
  }
};

// Update affiliate settings
export const updateAffiliateSettings = async (
  updates: Partial<AffiliateSettings>
): Promise<void> => {
  try {
    const settingsRef = doc(db, AFFILIATE_SETTINGS_COLLECTION, 'default');
    await updateDoc(settingsRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating affiliate settings:', error);
    throw error;
  }
};

// Subscribe to affiliate stats
export const subscribeToAffiliateStats = (
  affiliateId: string,
  callback: (affiliate: AffiliateUser) => void
): (() => void) => {
  const affiliateRef = doc(db, AFFILIATES_COLLECTION, affiliateId);
  
  return onSnapshot(affiliateRef, (doc) => {
    if (doc.exists()) {
      const affiliate = {
        id: doc.id,
        ...doc.data()
      } as AffiliateUser;
      callback(affiliate);
    }
  }, (error) => {
    console.error('Error in affiliate stats subscription:', error);
  });
};

// Subscribe to affiliate referrals
export const subscribeToAffiliateReferrals = (
  affiliateId: string,
  callback: (referrals: AffiliateReferral[]) => void
): (() => void) => {
  const referralsRef = collection(db, AFFILIATE_REFERRALS_COLLECTION);
  const q = query(referralsRef, where('referrerId', '==', affiliateId));
  
  return onSnapshot(q, (snapshot) => {
    const referrals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AffiliateReferral));
    callback(referrals);
  }, (error) => {
    console.error('Error in referrals subscription:', error);
  });
};

// Subscribe to affiliate commissions
export const subscribeToAffiliateCommissions = (
  affiliateId: string,
  callback: (commissions: AffiliateCommission[]) => void
): (() => void) => {
  const commissionsRef = collection(db, AFFILIATE_COMMISSIONS_COLLECTION);
  const q = query(commissionsRef, where('affiliateId', '==', affiliateId));
  
  return onSnapshot(q, (snapshot) => {
    const commissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AffiliateCommission));
    callback(commissions);
  }, (error) => {
    console.error('Error in commissions subscription:', error);
  });
};

// Subscribe to affiliate payouts
export const subscribeToAffiliatePayouts = (
  affiliateId: string,
  callback: (payouts: AffiliatePayout[]) => void
): (() => void) => {
  const payoutsRef = collection(db, AFFILIATE_PAYOUTS_COLLECTION);
  const q = query(payoutsRef, where('affiliateId', '==', affiliateId));
  
  return onSnapshot(q, (snapshot) => {
    const payouts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AffiliatePayout));
    callback(payouts);
  }, (error) => {
    console.error('Error in payouts subscription:', error);
  });
};

// Get affiliate followers
export const getAffiliateFollowers = async (affiliateId: string): Promise<AffiliateFollower[]> => {
  try {
    // Get referrals that resulted in registrations
    const referralsRef = collection(db, AFFILIATE_REFERRALS_COLLECTION);
    const q = query(
      referralsRef,
      where('referrerId', '==', affiliateId),
      where('status', 'in', ['registered', 'ordered', 'approved'])
    );
    const snapshot = await getDocs(q);
    
    const followers: AffiliateFollower[] = snapshot.docs
      .filter(doc => doc.data().referredUserId && doc.data().referredUserEmail)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          affiliateId,
          userId: data.referredUserId,
          email: data.referredUserEmail,
          displayName: data.referredUserName || data.referredUserEmail.split('@')[0],
          totalOrders: data.status === 'ordered' || data.status === 'approved' ? 1 : 0,
          totalSpent: data.orderTotal || 0,
          firstOrderDate: data.orderedAt || '',
          lastOrderDate: data.orderedAt || '',
          createdAt: data.registeredAt || data.createdAt
        };
      });
    
    return followers;
  } catch (error) {
    console.error('Error getting affiliate followers:', error);
    throw error;
  }
};

// Update affiliate bank info
export const updateAffiliateBankInfo = async (
  affiliateId: string,
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }
): Promise<void> => {
  try {
    const affiliateRef = doc(db, AFFILIATES_COLLECTION, affiliateId);
    await updateDoc(affiliateRef, {
      bankInfo,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating affiliate bank info:', error);
    throw error;
  }
};

// Request payout
export const requestPayout = async (
  affiliateId: string,
  amount: number,
  method: string,
  bankInfo?: any
): Promise<string> => {
  try {
    console.log('Requesting payout:', { affiliateId, amount, method });
    
    const payoutData = {
      affiliateId,
      amount,
      method,
      status: 'pending',
      bankInfo,
      requestedAt: new Date().toISOString()
    };
    
    const payoutsRef = collection(db, AFFILIATE_PAYOUTS_COLLECTION);
    const docRef = await addDoc(payoutsRef, payoutData);
    
    console.log('Payout request created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error requesting payout:', error);
    throw error;
  }
};

// Process payout (admin function)
export const processPayout = async (
  payoutId: string,
  adminId: string,
  status: 'processing' | 'completed' | 'rejected' | 'paid',
  notes?: string
): Promise<void> => {
  try {
    console.log('Processing payout:', { payoutId, status, adminId });
    
    const payoutRef = doc(db, AFFILIATE_PAYOUTS_COLLECTION, payoutId);
    const payoutDoc = await getDoc(payoutRef);
    
    if (!payoutDoc.exists()) {
      throw new Error('Payout not found');
    }
    
    const payoutData = payoutDoc.data() as AffiliatePayout;
    
    // Update payout status
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (status === 'processing') {
      updateData.processedAt = new Date().toISOString();
      updateData.processedBy = adminId;
    } else if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
      updateData.completedBy = adminId;
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date().toISOString();
      updateData.rejectedBy = adminId;
    } else if (status === 'paid') {
      updateData.paidAt = new Date().toISOString();
      updateData.paidBy = adminId;
    }
    
    if (notes) {
      updateData.notes = notes;
    }
    
    await updateDoc(payoutRef, updateData);
    
    // CRITICAL FIX: Update affiliate commission balance when payout is completed or paid
    if (status === 'completed' || status === 'paid') {
      const affiliateRef = doc(db, AFFILIATES_COLLECTION, payoutData.affiliateId);
      const affiliateDoc = await getDoc(affiliateRef);
      
      if (affiliateDoc.exists()) {
        const affiliateData = affiliateDoc.data() as AffiliateUser;
        
        // Reduce approved commission by the payout amount
        const newApprovedCommission = Math.max(0, (affiliateData.approvedCommission || 0) - payoutData.amount);
        
        // Update paid commission
        const newPaidCommission = (affiliateData.paidCommission || 0) + payoutData.amount;
        
        console.log('Updating affiliate balance:', {
          affiliateId: payoutData.affiliateId,
          payoutAmount: payoutData.amount,
          oldApprovedCommission: affiliateData.approvedCommission,
          newApprovedCommission,
          newPaidCommission
        });
        
        await updateDoc(affiliateRef, {
          approvedCommission: newApprovedCommission,
          paidCommission: newPaidCommission,
          updatedAt: new Date().toISOString()
        });
        
        console.log('Affiliate balance updated successfully');
      }
    }
    
    console.log('Payout processed successfully');
  } catch (error) {
    console.error('Error processing payout:', error);
    throw error;
  }
};
// Admin functions
export const getAllAffiliates = async (): Promise<AffiliateUser[]> => {
  try {
    const affiliatesRef = collection(db, AFFILIATES_COLLECTION);
    const snapshot = await getDocs(affiliatesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AffiliateUser));
  } catch (error) {
    console.error('Error getting all affiliates:', error);
    throw error;
  }
};

export const getAllPayouts = async (): Promise<AffiliatePayout[]> => {
  try {
    const payoutsRef = collection(db, AFFILIATE_PAYOUTS_COLLECTION);
    const snapshot = await getDocs(payoutsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AffiliatePayout));
  } catch (error) {
    console.error('Error getting all payouts:', error);
    throw error;
  }
};
