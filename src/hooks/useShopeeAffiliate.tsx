import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { toast } from '@/hooks/use-toast';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  requestPayout,
  updateAffiliateBankInfo,
  getAffiliatePayouts,
  getAffiliateSettings,
  ShopeeAffiliatePayout,
  ShopeeAffiliateSettings
} from '@/services/shopeeAffiliatePayoutService';

// Types
export interface ShopeeAffiliate {
  id?: string;
  userId: string;
  email: string;
  displayName: string;
  referralCode: string;
  
  // Stats
  totalClicks: number;
  totalReferrals: number;
  totalOrders: number;
  totalGMV: number;
  
  // Commission tracking
  totalCommission: number;      // All commissions ever earned
  pendingCommission: number;     // Commissions waiting for approval
  approvedCommission: number;    // Commissions approved and available for payout
  paidCommission: number;        // Commissions already paid out
  
  // Bank info for payouts
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  payoutMethod?: 'bank_transfer' | 'paypal' | 'other';
  
  // Additional info
  totalPayouts?: number;
  lastPayoutDate?: string;
  isActive: boolean;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  
  createdAt: string;
  updatedAt: string;
}

export interface ShopeeAffiliateOrder {
  id?: string;
  orderId: string;
  userId: string;
  userEmail: string;
  attributionId: string;
  referralCode: string;
  referrerId: string;
  orderTotal: number;
  orderDate: string;
  commissionRate: number;
  commissionAmount: number;
  commissionStatus: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopeeAffiliateAttribution {
  id?: string;
  visitorId: string;
  sessionId: string;
  referralCode: string;
  referrerId: string;
  firstClick: string;
  lastClick: string;
  attributionWindow: string;
  isActive: boolean;
  userId?: string;
  userEmail?: string;
  boundAt?: string;
  totalOrders: number;
  totalGMV: number;
  totalCommission: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopeeAffiliateFollower {
  id: string;
  affiliateId: string;
  userId: string;
  email: string;
  displayName: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate?: string;
  lastOrderDate?: string;
  createdAt: string;
}

interface ShopeeAffiliateContextType {
  affiliate: ShopeeAffiliate | null;
  loading: boolean;
  error: string | null;
  
  // Data
  referrals: ShopeeAffiliateAttribution[];
  commissions: ShopeeAffiliateOrder[];
  payouts: ShopeeAffiliatePayout[];
  followers: ShopeeAffiliateFollower[];
  settings: ShopeeAffiliateSettings | null;
  
  // Actions
  joinAffiliate: () => Promise<void>;
  updateBankInfo: (bankInfo: { bankName: string; accountNumber: string; accountName: string }) => Promise<void>;
  requestPayout: (amount: number, method: string, bankInfo?: any) => Promise<string>;
  copyReferralLink: () => void;
  
  // Computed
  referralLink: string;
}

const ShopeeAffiliateContext = createContext<ShopeeAffiliateContextType | undefined>(undefined);

export const ShopeeAffiliateProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<ShopeeAffiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<ShopeeAffiliateAttribution[]>([]);
  const [commissions, setCommissions] = useState<ShopeeAffiliateOrder[]>([]);
  const [payouts, setPayouts] = useState<ShopeeAffiliatePayout[]>([]);
  const [followers, setFollowers] = useState<ShopeeAffiliateFollower[]>([]);
  const [settings, setSettings] = useState<ShopeeAffiliateSettings | null>(null);

  // Generate referral link
  const referralLink = affiliate?.referralCode 
    ? `${window.location.origin}/?ref=${affiliate.referralCode}`
    : '';

  // Generate unique referral code
  const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Load affiliate data
  useEffect(() => {
    const loadAffiliateData = async () => {
      if (!user) {
        setAffiliate(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Loading Shopee affiliate data for user:', user.uid);
        
        // Get affiliate user from shopee_affiliates collection
        const affiliatesRef = collection(db, 'shopee_affiliates');
        const q = query(affiliatesRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        
        let affiliateData: ShopeeAffiliate | null = null;
        
        if (!snapshot.empty) {
          affiliateData = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
          } as ShopeeAffiliate;
        }
        
        setAffiliate(affiliateData);
        
        // Get affiliate settings
        const settingsData = await getAffiliateSettings();
        setSettings(settingsData);
        
        // Load related data if affiliate exists
        if (affiliateData) {
          console.log('Loading related data for affiliate:', affiliateData.id);
          
          // Load attributions (referrals)
          try {
            const attributionsRef = collection(db, 'affiliateAttribution');
            const attrQuery = query(
              attributionsRef,
              where('referrerId', '==', affiliateData.id),
              orderBy('createdAt', 'desc')
            );
            const attrSnapshot = await getDocs(attrQuery);
            
            const attributionsData = attrSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as ShopeeAffiliateAttribution[];
            
            console.log('Loaded attributions:', attributionsData.length);
            setReferrals(attributionsData);
            
            // Calculate followers from attributions
            const followersData = attributionsData
              .filter(attr => attr.userId && attr.userEmail)
              .map(attr => ({
                id: attr.id!,
                affiliateId: affiliateData.id!,
                userId: attr.userId!,
                email: attr.userEmail!,
                displayName: attr.userEmail?.split('@')[0] || 'User',
                totalOrders: attr.totalOrders,
                totalSpent: attr.totalGMV,
                firstOrderDate: attr.boundAt,
                lastOrderDate: attr.updatedAt,
                createdAt: attr.createdAt
              }));
            
            setFollowers(followersData);
          } catch (err) {
            console.error('Error loading attributions:', err);
          }
          
          // Load commissions
          try {
            const ordersRef = collection(db, 'affiliateOrders');
            const ordersQuery = query(
              ordersRef,
              where('referrerId', '==', affiliateData.id),
              orderBy('createdAt', 'desc')
            );
            const ordersSnapshot = await getDocs(ordersQuery);
            
            const ordersData = ordersSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as ShopeeAffiliateOrder[];
            
            console.log('Loaded commissions:', ordersData.length);
            setCommissions(ordersData);
          } catch (err) {
            console.error('Error loading commissions:', err);
          }
          
          // Load payouts
          try {
            const payoutsData = await getAffiliatePayouts(affiliateData.id!);
            console.log('Loaded payouts:', payoutsData.length);
            setPayouts(payoutsData);
          } catch (err) {
            console.error('Error loading payouts:', err);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading affiliate data:', err);
        setError('Failed to load affiliate data');
        setLoading(false);
      }
    };

    loadAffiliateData();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user || !affiliate?.id) return;

    console.log('Setting up real-time subscriptions for affiliate:', affiliate.id);

    const unsubscribes: (() => void)[] = [];

    // Subscribe to affiliate stats updates
    const affiliateRef = doc(db, 'shopee_affiliates', affiliate.id);
    const unsubAffiliate = onSnapshot(affiliateRef, (doc) => {
      if (doc.exists()) {
        setAffiliate({
          id: doc.id,
          ...doc.data()
        } as ShopeeAffiliate);
      }
    });
    unsubscribes.push(unsubAffiliate);

    // Subscribe to attributions
    const attributionsRef = collection(db, 'affiliateAttribution');
    const attrQuery = query(
      attributionsRef,
      where('referrerId', '==', affiliate.id),
      orderBy('createdAt', 'desc')
    );
    const unsubAttributions = onSnapshot(attrQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShopeeAffiliateAttribution[];
      setReferrals(data);
      
      // Update followers
      const followersData = data
        .filter(attr => attr.userId && attr.userEmail)
        .map(attr => ({
          id: attr.id!,
          affiliateId: affiliate.id!,
          userId: attr.userId!,
          email: attr.userEmail!,
          displayName: attr.userEmail?.split('@')[0] || 'User',
          totalOrders: attr.totalOrders,
          totalSpent: attr.totalGMV,
          firstOrderDate: attr.boundAt,
          lastOrderDate: attr.updatedAt,
          createdAt: attr.createdAt
        }));
      setFollowers(followersData);
    });
    unsubscribes.push(unsubAttributions);

    // Subscribe to commissions
    const ordersRef = collection(db, 'affiliateOrders');
    const ordersQuery = query(
      ordersRef,
      where('referrerId', '==', affiliate.id),
      orderBy('createdAt', 'desc')
    );
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShopeeAffiliateOrder[];
      setCommissions(data);
    });
    unsubscribes.push(unsubOrders);

    // Subscribe to payouts
    const payoutsRef = collection(db, 'shopee_affiliate_payouts');
    const payoutsQuery = query(
      payoutsRef,
      where('affiliateId', '==', affiliate.id),
      orderBy('createdAt', 'desc')
    );
    const unsubPayouts = onSnapshot(payoutsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShopeeAffiliatePayout[];
      setPayouts(data);
    });
    unsubscribes.push(unsubPayouts);

    return () => {
      unsubscribes.forEach(unsub => unsub());
      console.log('Cleaned up Shopee affiliate subscriptions');
    };
  }, [user, affiliate?.id]);

  // Join affiliate program
  const joinAffiliate = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to join the affiliate program",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check if already an affiliate
      const affiliatesRef = collection(db, 'shopee_affiliates');
      const q = query(affiliatesRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const existing = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        } as ShopeeAffiliate;
        setAffiliate(existing);
        toast({
          title: "Already Joined",
          description: "You are already part of the affiliate program"
        });
        return;
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
      const newAffiliate: Omit<ShopeeAffiliate, 'id'> = {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        referralCode,
        totalClicks: 0,
        totalReferrals: 0,
        totalOrders: 0,
        totalGMV: 0,
        totalCommission: 0,
        pendingCommission: 0,
        approvedCommission: 0,
        paidCommission: 0,
        isActive: true,
        tier: 'bronze',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(affiliatesRef, newAffiliate);
      
      setAffiliate({
        id: docRef.id,
        ...newAffiliate
      });
      
      toast({
        title: "Welcome!",
        description: "You have successfully joined the affiliate program"
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error joining affiliate program:', err);
      setError('Failed to join affiliate program');
      toast({
        title: "Error",
        description: "Failed to join the affiliate program. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  // Update bank info
  const updateBankInfoFn = async (bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) => {
    if (!user || !affiliate?.id) {
      toast({
        title: "Error",
        description: "You must be logged in and joined the affiliate program",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await updateAffiliateBankInfo(affiliate.id, bankInfo);
      
      setAffiliate({
        ...affiliate,
        bankInfo
      });
      
      toast({
        title: "Success",
        description: "Bank information updated successfully"
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error updating bank info:', err);
      setError('Failed to update bank info');
      toast({
        title: "Error",
        description: "Failed to update bank information",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  // Request payout
  const requestPayoutFn = async (amount: number, method: string, bankInfo?: any) => {
    if (!user || !affiliate?.id) {
      toast({
        title: "Error",
        description: "You must be logged in and joined the affiliate program",
        variant: "destructive"
      });
      return "";
    }

    try {
      const payoutId = await requestPayout(
        affiliate.id,
        amount,
        method as any,
        bankInfo
      );
      
      toast({
        title: "Payout Requested",
        description: `Your payout request of ¥${amount.toLocaleString()} has been submitted`
      });
      
      return payoutId;
    } catch (err: any) {
      console.error('Error requesting payout:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to request payout",
        variant: "destructive"
      });
      throw err;
    }
  };

  // Copy referral link
  const copyReferralLink = async () => {
    if (!referralLink) {
      toast({
        title: "Error",
        description: "No referral link available",
        variant: "destructive"
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard"
      });
    } catch (err) {
      console.error('Error copying referral link:', err);
      
      // Fallback method
      try {
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        toast({
          title: "Link Copied!",
          description: "Referral link copied to clipboard"
        });
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
        toast({
          title: "Copy Failed",
          description: "Please copy manually: " + referralLink,
          variant: "destructive"
        });
      }
    }
  };

  return (
    <ShopeeAffiliateContext.Provider
      value={{
        affiliate,
        loading,
        error,
        referrals,
        commissions,
        payouts,
        followers,
        settings,
        joinAffiliate,
        updateBankInfo: updateBankInfoFn,
        requestPayout: requestPayoutFn,
        copyReferralLink,
        referralLink
      }}
    >
      {children}
    </ShopeeAffiliateContext.Provider>
  );
};

export const useShopeeAffiliate = () => {
  const context = useContext(ShopeeAffiliateContext);
  if (context === undefined) {
    throw new Error('useShopeeAffiliate must be used within a ShopeeAffiliateProvider');
  }
  return context;
};

// Hook to get referral code for checkout
export const useCheckoutReferral = () => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkReferralSession = async () => {
      try {
        setIsLoading(true);
        
        // Check for referral code in URL params first
        const urlParams = new URLSearchParams(window.location.search);
        const urlRef = urlParams.get('ref');
        
        if (urlRef) {
          setReferralCode(urlRef);
          setIsLoading(false);
          return;
        }

        // Check sessionStorage for stored referral code
        const storedRef = sessionStorage.getItem('shopee_referral_code');
        if (storedRef) {
          setReferralCode(storedRef);
        }
        
        // Check localStorage as fallback
        const localRef = localStorage.getItem('shopee_referral_code');
        if (localRef && !storedRef) {
          setReferralCode(localRef);
        }
        
      } catch (error) {
        console.error('Error checking referral session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkReferralSession();
  }, []);

  return { referralCode, isLoading };
};

// Comprehensive Shopee Affiliate Integration Hook
export const useShopeeAffiliateIntegration = () => {
  const { user } = useAuth();
  const [visitorId, setVisitorId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [activeAttribution, setActiveAttribution] = useState<ShopeeAffiliateAttribution | null>(null);
  const [isLoadingAttribution, setIsLoadingAttribution] = useState(true);
  const [isTrackingClick, setIsTrackingClick] = useState(false);
  const { referralCode: checkoutReferralCode, isLoading: isLoadingReferralCode } = useCheckoutReferral();

  // Generate or get visitor ID
  useEffect(() => {
    let vId = localStorage.getItem('visitor_id');
    if (!vId) {
      vId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor_id', vId);
    }
    setVisitorId(vId);

    // Generate session ID
    const sId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(sId);
    sessionStorage.setItem('session_id', sId);
  }, []);

  // Load active attribution
  useEffect(() => {
    const loadAttribution = async () => {
      if (!visitorId) return;
      
      try {
        setIsLoadingAttribution(true);
        
        // Check for active attribution in Firestore
        const attributionsRef = collection(db, 'affiliateAttribution');
        const q = query(
          attributionsRef,
          where('visitorId', '==', visitorId),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const attr = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data()
          } as ShopeeAffiliateAttribution;
          
          // Check if attribution is still valid
          const now = new Date();
          const expires = new Date(attr.attributionWindow);
          
          if (expires > now) {
            setActiveAttribution(attr);
            // Store in session for quick access
            sessionStorage.setItem('shopee_referral_code', attr.referralCode);
          } else {
            // Attribution expired, update in Firestore
            const docRef = doc(db, 'affiliateAttribution', attr.id!);
            await updateDoc(docRef, {
              isActive: false,
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error loading attribution:', error);
      } finally {
        setIsLoadingAttribution(false);
      }
    };

    loadAttribution();
  }, [visitorId]);

  // Track referral click
  const trackReferralClick = async (referralCode: string) => {
    if (!visitorId || !sessionId) {
      console.error('Missing visitor or session ID');
      return;
    }

    try {
      setIsTrackingClick(true);
      
      // Find affiliate by referral code
      const affiliatesRef = collection(db, 'shopee_affiliates');
      const q = query(affiliatesRef, where('referralCode', '==', referralCode));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.error('Invalid referral code:', referralCode);
        return;
      }
      
      const affiliate = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as ShopeeAffiliate;
      
      // Create or update attribution
      const attributionsRef = collection(db, 'affiliateAttribution');
      const existingQuery = query(
        attributionsRef,
        where('visitorId', '==', visitorId),
        where('referralCode', '==', referralCode)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      const now = new Date().toISOString();
      const attributionWindow = new Date();
      attributionWindow.setDate(attributionWindow.getDate() + 30); // 30 days attribution
      
      if (existingSnapshot.empty) {
        // Create new attribution
        const newAttribution: Omit<ShopeeAffiliateAttribution, 'id'> = {
          visitorId,
          sessionId,
          referralCode,
          referrerId: affiliate.id!,
          firstClick: now,
          lastClick: now,
          attributionWindow: attributionWindow.toISOString(),
          isActive: true,
          totalOrders: 0,
          totalGMV: 0,
          totalCommission: 0,
          createdAt: now,
          updatedAt: now
        };
        
        const docRef = await addDoc(attributionsRef, newAttribution);
        setActiveAttribution({
          id: docRef.id,
          ...newAttribution
        });
        
        // Update affiliate click count
        const affiliateRef = doc(db, 'shopee_affiliates', affiliate.id!);
        await updateDoc(affiliateRef, {
          totalClicks: (affiliate.totalClicks || 0) + 1,
          updatedAt: now
        });
      } else {
        // Update existing attribution
        const existingDoc = existingSnapshot.docs[0];
        const existingData = existingDoc.data() as ShopeeAffiliateAttribution;
        
        await updateDoc(doc(db, 'affiliateAttribution', existingDoc.id), {
          lastClick: now,
          sessionId,
          isActive: true,
          attributionWindow: attributionWindow.toISOString(),
          updatedAt: now
        });
        
        setActiveAttribution({
          id: existingDoc.id,
          ...existingData,
          lastClick: now,
          sessionId,
          isActive: true,
          attributionWindow: attributionWindow.toISOString(),
          updatedAt: now
        });
      }
      
      // Store in session/local storage
      sessionStorage.setItem('shopee_referral_code', referralCode);
      localStorage.setItem('shopee_referral_code', referralCode);
      
      toast({
        title: "Referral Tracked!",
        description: `You've been referred by an affiliate partner.`,
      });
      
    } catch (error) {
      console.error('Error tracking referral click:', error);
      toast({
        title: "Error",
        description: "Failed to track referral. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTrackingClick(false);
    }
  };

  return {
    // IDs
    visitorId,
    sessionId,
    
    // Attribution
    activeAttribution,
    isLoadingAttribution,
    
    // Tracking
    trackReferralClick,
    isTrackingClick,
    
    // Checkout
    checkoutReferralCode,
    isLoadingReferralCode
  };
};
