import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// ==================== BITKODE AFFILIATE SYSTEM ====================

export interface AffiliateAttribution {
  id?: string;
  
  // Tracking identifiers
  visitorId: string;           // Browser fingerprint
  sessionId: string;           // Current session
  
  // Attribution info
  referralCode: string;        // Current active referral code
  referrerId: string;          // Affiliate ID who owns the code
  
  // Attribution window (1 day)
  firstClick: string;          // First referral click
  lastClick: string;           // Last referral click (for last-click attribution)
  attributionWindow: string;   // When attribution expires (1 day from last click)
  isActive: boolean;          // Is attribution still valid
  
  // User binding (when user registers/logs in)
  userId?: string;            // Firebase user ID
  userEmail?: string;         // User email
  boundAt?: string;           // When user was bound to this attribution
  
  // Performance tracking
  totalOrders: number;        // Total orders attributed
  totalGMV: number;          // Total Gross Merchandise Value
  totalCommission: number;   // Total commission generated
  
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateOrder {
  id?: string;
  
  // Order information
  orderId: string;
  userId: string;
  userEmail: string;
  
  // Attribution
  attributionId: string;      // Link to AffiliateAttribution record
  referralCode: string;       // Referral code used
  referrerId: string;         // Affiliate who gets commission
  
  // Order details
  orderTotal: number;         // Order total in Yen (including shipping & fees)
  productSubtotal?: number;   // Product subtotal only (base for commission calculation)
  orderDate: string;          // When order was placed
  
  // Commission calculation
  commissionRate: number;     // Commission rate (%) at time of order
  commissionAmount: number;   // Commission amount in Yen (calculated from productSubtotal)
  commissionStatus: 'pending' | 'approved' | 'rejected' | 'paid';
  
  // Verification
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

const ATTRIBUTION_COLLECTION = 'affiliateAttribution';
const AFFILIATE_ORDERS_COLLECTION = 'affiliateOrders';
const ATTRIBUTION_WINDOW_DAYS = 1; // 1 day attribution window

// Generate visitor ID (browser fingerprint)
export const generateVisitorId = (): string => {
  let visitorId = localStorage.getItem('bitkode_visitor_id');
  
  if (!visitorId) {
    // Create unique visitor ID based on browser fingerprint
    const userAgent = navigator.userAgent;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    const fingerprint = `${userAgent}-${screen}-${timezone}-${language}`;
    const hash = btoa(fingerprint).slice(0, 16);
    
    visitorId = `v_${Date.now()}_${hash}`;
    localStorage.setItem('bitkode_visitor_id', visitorId);
  }
  
  return visitorId;
};

// Generate session ID
export const generateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('bitkode_session_id');
  
  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('bitkode_session_id', sessionId);
  }
  
  return sessionId;
};

// 🔗 Track referral click (BitKode-style)
export const trackAffiliateClick = async (referralCode: string): Promise<void> => {
  try {
    console.log('💻 [BitKode] Tracking affiliate click:', referralCode);
    
    // Get affiliate info
    const { getAffiliateByReferralCode } = await import('@/services/affiliateService');
    const affiliate = await getAffiliateByReferralCode(referralCode);
    
    if (!affiliate) {
      console.error('❌ Affiliate not found for code:', referralCode);
      return;
    }
    
    const visitorId = generateVisitorId();
    const sessionId = generateSessionId();
    const now = new Date();
    const attributionWindow = new Date(now.getTime() + (ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000));
    
    // Check for existing active attribution
    const attributionRef = collection(db, ATTRIBUTION_COLLECTION);
    const existingQuery = query(
      attributionRef,
      where('visitorId', '==', visitorId),
      where('isActive', '==', true)
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      // Update existing attribution (last-click wins)
      const existingDoc = existingSnapshot.docs[0];
      
      await updateDoc(doc(db, ATTRIBUTION_COLLECTION, existingDoc.id), {
        referralCode,                    // Update to new referral code (last-click attribution)
        referrerId: affiliate.id,
        lastClick: now.toISOString(),
        attributionWindow: attributionWindow.toISOString(), // Extend window from last click
        sessionId,                      // Update session
        updatedAt: now.toISOString()
      });
      
      console.log('✅ Updated existing attribution (last-click)');
    } else {
      // Create new attribution
      const attributionData: AffiliateAttribution = {
        visitorId,
        sessionId,
        referralCode,
        referrerId: affiliate.id,
        firstClick: now.toISOString(),
        lastClick: now.toISOString(),
        attributionWindow: attributionWindow.toISOString(),
        isActive: true,
        totalOrders: 0,
        totalGMV: 0,
        totalCommission: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      await addDoc(attributionRef, attributionData);
      console.log('✅ Created new affiliate attribution');
    }
    
    // Store in browser for quick access
    localStorage.setItem('bitkode_referral_code', referralCode);
    localStorage.setItem('bitkode_referral_expires', attributionWindow.toISOString());
    
    console.log('🎯 Attribution window set for 1 day from now');
    
  } catch (error) {
    console.error('❌ Error tracking affiliate click:', error);
  }
};

// 👤 Bind attribution to user (when user registers/logs in)
export const bindAttributionToUser = async (
  userId: string, 
  email: string
): Promise<void> => {
  try {
    console.log('👤 [BitKode] Binding attribution to user:', { userId, email });
    
    const visitorId = generateVisitorId();
    
    // Find active attribution for this visitor
    const attributionRef = collection(db, ATTRIBUTION_COLLECTION);
    const q = query(
      attributionRef,
      where('visitorId', '==', visitorId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No active attribution to bind to user');
      return;
    }
    
    // Check if attribution is still valid
    const attributionDoc = snapshot.docs[0];
    const attribution = attributionDoc.data() as AffiliateAttribution;
    const now = new Date();
    const expiresAt = new Date(attribution.attributionWindow);
    
    if (now > expiresAt) {
      console.log('Attribution expired, cannot bind to user');
      
      // Expire the attribution
      await updateDoc(doc(db, ATTRIBUTION_COLLECTION, attributionDoc.id), {
        isActive: false,
        updatedAt: now.toISOString()
      });
      
      return;
    }
    
    // Bind user to attribution
    await updateDoc(doc(db, ATTRIBUTION_COLLECTION, attributionDoc.id), {
      userId,
      userEmail: email,
      boundAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
    
    console.log('✅ User bound to attribution:', attribution.referralCode);
    
  } catch (error) {
    console.error('❌ Error binding attribution to user:', error);
  }
};

// 💰 Process order with affiliate commission (BitKode-style)
export const processAffiliateOrder = async (
  userId: string,
  orderId: string, 
  orderTotal: number,
  productSubtotal?: number,
  shippingFee?: number,
  codSurcharge?: number
): Promise<void> => {
  try {
    console.log('💰 [BitKode] Processing affiliate order:', {
      userId, orderId, orderTotal, productSubtotal, shippingFee, codSurcharge
    });
    
    // Find active attribution for this user
    const attributionRef = collection(db, ATTRIBUTION_COLLECTION);
    const q = query(
      attributionRef,
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No active attribution for user, no commission attributed');
      return;
    }
    
    const attributionDoc = snapshot.docs[0];
    const attribution = {
      id: attributionDoc.id,
      ...attributionDoc.data()
    } as AffiliateAttribution;
    
    // Check if attribution is still valid
    const now = new Date();
    const expiresAt = new Date(attribution.attributionWindow);
    
    if (now > expiresAt) {
      console.log('Attribution expired, no commission attributed');
      
      // Expire attribution
      await updateDoc(doc(db, ATTRIBUTION_COLLECTION, attributionDoc.id), {
        isActive: false,
        updatedAt: now.toISOString()
      });
      
      return;
    }
    
    // Get commission rate
    const { getAffiliateSettings } = await import('@/services/affiliateService');
    const settings = await getAffiliateSettings();
    const commissionRate = settings?.defaultCommissionRate || 5;
    
    // ⚠️ IMPORTANT: Commission is calculated ONLY from product subtotal, NOT from total order
    // This excludes shipping fees and COD surcharges to prevent financial losses
    const commissionBase = productSubtotal || (orderTotal - (shippingFee || 0) - (codSurcharge || 0));
    const commissionAmount = Math.round((commissionBase * commissionRate) / 100);
    
    console.log('💰 [Commission Calculation]:', {
      orderTotal,
      productSubtotal: commissionBase,
      shippingFee: shippingFee || 0,
      codSurcharge: codSurcharge || 0,
      commissionRate,
      commissionAmount,
      note: 'Commission calculated ONLY from product subtotal (excluding shipping & COD fees)'
    });
    
    // Use transaction to ensure consistency
    await runTransaction(db, async (transaction) => {
      // IMPORTANT: All reads must be done before any writes in a transaction
      
      // First, do all reads
      const affiliateRef = doc(db, 'affiliates', attribution.referrerId);
      const affiliateDoc = await transaction.get(affiliateRef);
      const affiliateData = affiliateDoc.data();
      
      // Now do all writes
      // Create affiliate order record
      const orderData: AffiliateOrder = {
        orderId,
        userId,
        userEmail: attribution.userEmail || '',
        attributionId: attribution.id!,
        referralCode: attribution.referralCode,
        referrerId: attribution.referrerId,
        orderTotal,
        orderDate: now.toISOString(),
        commissionRate,
        commissionAmount,
        productSubtotal: commissionBase, // Store the base amount used for commission calculation
        commissionStatus: 'pending',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      const orderRef = doc(collection(db, AFFILIATE_ORDERS_COLLECTION));
      transaction.set(orderRef, orderData);
      
      // Update attribution statistics
      const attributionRefDoc = doc(db, ATTRIBUTION_COLLECTION, attribution.id!);
      transaction.update(attributionRefDoc, {
        totalOrders: attribution.totalOrders + 1,
        totalGMV: attribution.totalGMV + commissionBase, // GMV based on commission base (product only)
        totalCommission: attribution.totalCommission + commissionAmount,
        updatedAt: now.toISOString()
      });
      
      // Update affiliate statistics
      transaction.update(affiliateRef, {
        totalCommission: (affiliateData?.totalCommission || 0) + commissionAmount,
        pendingCommission: (affiliateData?.pendingCommission || 0) + commissionAmount,
        updatedAt: now.toISOString()
      });
    });
    
    console.log('✅ Affiliate order processed successfully:', {
      orderId,
      referralCode: attribution.referralCode,
      commissionAmount
    });
    
  } catch (error) {
    console.error('❌ Error processing affiliate order:', error);
  }
};

// 📊 Get active attribution for current visitor
export const getActiveAttribution = async (): Promise<AffiliateAttribution | null> => {
  try {
    const visitorId = generateVisitorId();
    
    const attributionRef = collection(db, ATTRIBUTION_COLLECTION);
    const q = query(
      attributionRef,
      where('visitorId', '==', visitorId),
      where('isActive', '==', true),
      orderBy('lastClick', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const attributionDoc = snapshot.docs[0];
    const attribution = {
      id: attributionDoc.id,
      ...attributionDoc.data()
    } as AffiliateAttribution;
    
    // Check if expired
    const now = new Date();
    const expiresAt = new Date(attribution.attributionWindow);
    
    if (now > expiresAt) {
      // Expire attribution
      await updateDoc(doc(db, ATTRIBUTION_COLLECTION, attributionDoc.id), {
        isActive: false,
        updatedAt: now.toISOString()
      });
      
      return null;
    }
    
    return attribution;
  } catch (error) {
    console.error('Error getting active attribution:', error);
    return null;
  }
};

// 🎯 Get referral code for checkout form
export const getReferralCodeForCheckout = async (userId?: string): Promise<string | null> => {
  try {
    const attribution = await getActiveAttribution();
    
    if (!attribution) {
      console.log('No active attribution found for checkout');
      return null;
    }
    
    console.log('✅ Found referral code for checkout:', attribution.referralCode);
    return attribution.referralCode;
  } catch (error) {
    console.error('Error getting referral code for checkout:', error);
    return null;
  }
};
