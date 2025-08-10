import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { 
  getAllAffiliates,
  getAffiliateSettings,
  updateAffiliateSettings,
  getAllPayouts,
  processPayout,
  approveCommission,
  rejectCommission
} from '@/services/affiliateService';
import { 
  AffiliateUser, 
  AffiliateSettings,
  AffiliateReferral,
  AffiliateCommission,
  AffiliatePayout
} from '@/types/affiliate';
import { 
  AffiliateAttribution,
  AffiliateOrder
} from '@/services/shopeeAffiliateSystem';
import { collection, query, onSnapshot, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Enhanced interface that includes both old and new systems
interface EnhancedAffiliateAdminContextType {
  // Old system data
  affiliates: AffiliateUser[];
  settings: AffiliateSettings | null;
  referrals: AffiliateReferral[];
  payouts: AffiliatePayout[];
  commissions: AffiliateCommission[];
  
  // New BitKode-style system data
  attributions: AffiliateAttribution[];
  shopeeOrders: AffiliateOrder[];
  
  // Combined stats
  totalStats: {
    totalAffiliates: number;
    totalAttributions: number;
    totalCommissionOld: number;
    totalCommissionNew: number;
    totalCommissionCombined: number;
    totalOrdersOld: number;
    totalOrdersNew: number;
    totalOrdersCombined: number;
    activeAttributions: number;
    pendingCommissions: number;
    pendingCommissionsCount: number;
  };
  
  // UI state
  loading: boolean;
  error: string | null;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableMonths: string[];
  
  // Actions
  updateSettings: (settings: Partial<AffiliateSettings>) => Promise<void>;
  processPayout: (payoutId: string, status: 'processing' | 'completed' | 'rejected', notes?: string) => Promise<void>;
  approveCommission: (commissionId: string) => Promise<void>;
  rejectCommission: (commissionId: string, reason: string) => Promise<void>;
}

const EnhancedAffiliateAdminContext = createContext<EnhancedAffiliateAdminContextType | undefined>(undefined);

export const EnhancedAffiliateAdminProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  // Old system state
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  
  // New BitKode-style system state
  const [attributions, setAttributions] = useState<AffiliateAttribution[]>([]);
  const [shopeeOrders, setShopeeOrders] = useState<AffiliateOrder[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  
  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());

  // Calculate combined stats
  const totalStats = {
    totalAffiliates: affiliates.length,
    totalAttributions: attributions.length,
    totalCommissionOld: commissions.reduce((sum, comm) => sum + (comm.commissionAmount || 0), 0),
    totalCommissionNew: shopeeOrders.reduce((sum, order) => sum + (order.commissionAmount || 0), 0),
    totalCommissionCombined: commissions.reduce((sum, comm) => sum + (comm.commissionAmount || 0), 0) + 
                             shopeeOrders.reduce((sum, order) => sum + (order.commissionAmount || 0), 0),
    totalOrdersOld: commissions.length,
    totalOrdersNew: shopeeOrders.length,
    totalOrdersCombined: commissions.length + shopeeOrders.length,
    activeAttributions: attributions.filter(attr => attr.isActive).length,
    // Calculate total pending commission amount (not count)
    pendingCommissions: commissions.filter(comm => comm.status === 'pending').reduce((sum, comm) => sum + (comm.commissionAmount || 0), 0) + 
                       shopeeOrders.filter(order => order.commissionStatus === 'pending').reduce((sum, order) => sum + (order.commissionAmount || 0), 0),
    // Also include count for display purposes
    pendingCommissionsCount: commissions.filter(comm => comm.status === 'pending').length + 
                            shopeeOrders.filter(order => order.commissionStatus === 'pending').length
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) {
        setLoading(false);
        setError('User not authenticated');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Loading enhanced affiliate admin data...');
        
        // Load old system data
        const [settingsData, affiliatesData, payoutsData] = await Promise.all([
          getAffiliateSettings(),
          getAllAffiliates(),
          getAllPayouts()
        ]);
        
        setSettings(settingsData);
        setAffiliates(affiliatesData);
        setPayouts(payoutsData);
        
        console.log('✅ Old system data loaded:', {
          affiliates: affiliatesData.length,
          payouts: payoutsData.length
        });
        
        // Load old system referrals and commissions
        const referralsRef = collection(db, 'affiliate_referrals');
        const referralsSnapshot = await getDocs(referralsRef);
        const referralsData = referralsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AffiliateReferral));
        setReferrals(referralsData);
        
        const commissionsRef = collection(db, 'affiliate_commissions');
        const commissionsSnapshot = await getDocs(commissionsRef);
        const commissionsData = commissionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AffiliateCommission));
        setCommissions(commissionsData);
        
        console.log('✅ Old system referrals & commissions loaded:', {
          referrals: referralsData.length,
          commissions: commissionsData.length
        });
        
        // Load new BitKode-style system data
        let attributionsData: AffiliateAttribution[] = [];
        let shopeeOrdersData: AffiliateOrder[] = [];
        
        try {
          const attributionsRef = collection(db, 'affiliateAttribution');
          const attributionsSnapshot = await getDocs(attributionsRef);
          attributionsData = attributionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as AffiliateAttribution));
          setAttributions(attributionsData);
          
          const shopeeOrdersRef = collection(db, 'affiliateOrders');
          const shopeeOrdersSnapshot = await getDocs(shopeeOrdersRef);
          shopeeOrdersData = shopeeOrdersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as AffiliateOrder));
          setShopeeOrders(shopeeOrdersData);
          
          console.log('✅ New BitKode system data loaded:', {
            attributions: attributionsData.length,
            shopeeOrders: shopeeOrdersData.length
          });
        } catch (shopeeError) {
          console.warn('⚠️ New BitKode system collections not yet populated:', shopeeError);
          // This is expected if no BitKode-style data exists yet
          // Keep empty arrays as defaults
        }
        
        // Generate available months from all data
        const extractMonths = (items: any[], dateField: string) => {
          return items.map(item => {
            if (!item[dateField]) return null;
            const date = new Date(item[dateField]);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          }).filter(Boolean);
        };
        
        const allMonths = [
          ...extractMonths(payoutsData, 'requestedAt'),
          ...extractMonths(referralsData, 'createdAt'),
          ...extractMonths(commissionsData, 'createdAt'),
          ...extractMonths(attributionsData, 'createdAt'),
          ...extractMonths(shopeeOrdersData, 'createdAt')
        ];
        
        // Remove duplicates and sort
        const uniqueMonths = [...new Set(allMonths)].sort((a, b) => b.localeCompare(a));
        
        // Add current month if not in list
        const currentMonth = getCurrentMonth();
        if (!uniqueMonths.includes(currentMonth)) {
          uniqueMonths.unshift(currentMonth);
        }
        
        setAvailableMonths(uniqueMonths);
        setLoading(false);
        
        console.log('🎉 Enhanced affiliate admin data loaded successfully!', {
          totalStats: {
            affiliates: affiliatesData.length,
            attributions: attributionsData.length,
            oldCommissions: commissionsData.length,
            newOrders: shopeeOrdersData.length,
            availableMonths: uniqueMonths.length
          }
        });
        
      } catch (err) {
        console.error('❌ Error loading enhanced affiliate admin data:', err);
        setError('Failed to load affiliate admin data');
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // Real-time subscriptions for both systems
  useEffect(() => {
    if (!user) return;

    const unsubscribers: (() => void)[] = [];

    try {
      // Subscribe to old system collections
      const affiliatesRef = collection(db, 'affiliates');
      unsubscribers.push(onSnapshot(affiliatesRef, (snapshot) => {
        const affiliatesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AffiliateUser));
        setAffiliates(affiliatesData);
      }));
      
      const commissionsRef = collection(db, 'affiliate_commissions');
      unsubscribers.push(onSnapshot(commissionsRef, (snapshot) => {
        const commissionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AffiliateCommission));
        setCommissions(commissionsData);
      }));

      // Subscribe to new BitKode system collections
      try {
        const attributionsRef = collection(db, 'affiliateAttribution');
        unsubscribers.push(onSnapshot(attributionsRef, (snapshot) => {
          const attributionsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as AffiliateAttribution));
          setAttributions(attributionsData);
        }));
        
        const shopeeOrdersRef = collection(db, 'affiliateOrders');
        unsubscribers.push(onSnapshot(shopeeOrdersRef, (snapshot) => {
          const shopeeOrdersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as AffiliateOrder));
          setShopeeOrders(shopeeOrdersData);
        }));
      } catch (error) {
        console.warn('New BitKode collections not available yet for real-time updates');
      }

    } catch (err) {
      console.error('Error setting up real-time subscriptions:', err);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  // Action functions
  const handleUpdateSettings = async (settingsUpdate: Partial<AffiliateSettings>) => {
    await updateAffiliateSettings(settingsUpdate);
  };

  const handleProcessPayout = async (payoutId: string, status: 'processing' | 'completed' | 'rejected', notes?: string) => {
    await processPayout(payoutId, 'admin-user-id', status, notes); // Replace with actual admin ID
  };

  const handleApproveCommission = async (commissionId: string) => {
    await approveCommission(commissionId, 'admin-user-id'); // Replace with actual admin ID
  };

  const handleRejectCommission = async (commissionId: string, reason: string) => {
    await rejectCommission(commissionId, 'admin-user-id', reason); // Replace with actual admin ID
  };

  const value: EnhancedAffiliateAdminContextType = {
    // Old system data
    affiliates,
    settings,
    referrals,
    payouts,
    commissions,
    
    // New system data
    attributions,
    shopeeOrders,
    
    // Combined stats
    totalStats,
    
    // UI state
    loading,
    error,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    
    // Actions
    updateSettings: handleUpdateSettings,
    processPayout: handleProcessPayout,
    approveCommission: handleApproveCommission,
    rejectCommission: handleRejectCommission,
  };

  return (
    <EnhancedAffiliateAdminContext.Provider value={value}>
      {children}
    </EnhancedAffiliateAdminContext.Provider>
  );
};

export const useEnhancedAffiliateAdmin = () => {
  const context = useContext(EnhancedAffiliateAdminContext);
  if (context === undefined) {
    throw new Error('useEnhancedAffiliateAdmin must be used within an EnhancedAffiliateAdminProvider');
  }
  return context;
};
