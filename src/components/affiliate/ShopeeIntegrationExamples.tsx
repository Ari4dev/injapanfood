import React, { useEffect, useState } from 'react';
import { useShopeeAffiliateIntegration } from '@/hooks/useShopeeAffiliate';

// ==================== BITKODE AFFILIATE INTEGRATION COMPONENTS ====================

// 🔗 1. Referral Landing Page Component
export const ReferralLandingPage = () => {
  const { trackReferralClick, isTrackingClick } = useShopeeAffiliateIntegration();
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    // Check URL for referral code
    const urlParams = new URLSearchParams(window.location.search);
    const pathMatch = window.location.pathname.match(/^\/ref\/(.+)$/);
    
    const referralCode = urlParams.get('ref') || pathMatch?.[1];
    
    if (referralCode && !hasTracked) {
      console.log('💻 Detected referral code:', referralCode);
      
      trackReferralClick(referralCode);
      setHasTracked(true);
      
      // Clean up URL after tracking
      if (pathMatch) {
        window.history.replaceState({}, '', '/');
      } else {
        urlParams.delete('ref');
        const newURL = window.location.pathname + 
          (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newURL);
      }
    }
  }, [trackReferralClick, hasTracked]);

  if (isTrackingClick) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>💻 Processing your referral...</p>
        </div>
      </div>
    );
  }

  return null; // This component only handles tracking
};

// 🎯 2. Checkout Form dengan Auto Referral Code
export const EnhancedCheckoutForm = () => {
  const { checkoutReferralCode, isLoadingReferralCode } = useShopeeAffiliateIntegration();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    referralCode: ''
  });

  // Auto-fill referral code if available
  useEffect(() => {
    if (checkoutReferralCode && !formData.referralCode) {
      setFormData(prev => ({
        ...prev,
        referralCode: checkoutReferralCode
      }));
    }
  }, [checkoutReferralCode, formData.referralCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process order with referral attribution
    try {
      const order = await processOrderWithAttribution({
        ...formData,
        total: 5000 // Example total
      });
      
      console.log('✅ Order processed:', order);
    } catch (error) {
      console.error('❌ Order failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>
      
      {/* Regular form fields */}
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className="w-full p-2 border border-gray-300 rounded"
          rows={3}
          required
        />
      </div>
      
      {/* Referral Code Field dengan Auto-fill */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Referral Code (Optional)
          {isLoadingReferralCode && <span className="text-blue-500 ml-2">Loading...</span>}
        </label>
        <input
          type="text"
          value={formData.referralCode}
          onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value }))}
          className={`w-full p-2 border rounded ${
            checkoutReferralCode 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300'
          }`}
          placeholder="Enter referral code"
        />
        {checkoutReferralCode && (
          <p className="text-green-600 text-sm mt-1">
            🎉 Referral code auto-applied: {checkoutReferralCode}
          </p>
        )}
      </div>
      
      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition-colors"
      >
        Place Order
      </button>
    </form>
  );
};

// 👤 3. User Dashboard dengan Attribution Info
export const UserDashboardWithAttribution = () => {
  const { 
    activeAttribution, 
    isLoadingAttribution,
    visitorId,
    sessionId 
  } = useShopeeAffiliateIntegration();

  const getAttributionStatus = () => {
    if (!activeAttribution) return null;

    const now = new Date();
    const expires = new Date(activeAttribution.attributionWindow);
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return { status: 'expired', daysLeft: 0 };
    }

    return { status: 'active', daysLeft };
  };

  const attributionStatus = getAttributionStatus();

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Account Dashboard</h2>
      
      {/* Regular user info */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Account Information</h3>
        {/* Existing user info content */}
      </div>
      
      {/* Referral Attribution Status */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">💻 BitKode Referral Status</h3>
        
        {isLoadingAttribution ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span>Loading attribution info...</span>
          </div>
        ) : attributionStatus ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-green-600 font-semibold">✅ Active BitKode Referral</span>
            </div>
            <div className="space-y-1 text-sm">
              <p><strong>Referral Code:</strong> {activeAttribution.referralCode}</p>
              <p><strong>Days Remaining:</strong> {attributionStatus.daysLeft} days</p>
              <p><strong>Orders Attributed:</strong> {activeAttribution.totalOrders}</p>
              {activeAttribution.totalCommission > 0 && (
                <p><strong>Total Commission Generated:</strong> ¥{activeAttribution.totalCommission.toLocaleString()}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600">No active referral attribution</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 📊 4. Debug Panel untuk Development - Minimal Version
export const BitKodeAffiliateDebugPanel = () => {
  const {
    activeAttribution,
    checkoutReferralCode,
    visitorId,
    sessionId,
    isLoadingAttribution,
    isLoadingReferralCode
  } = useShopeeAffiliateIntegration();

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  // Minimal collapsed state
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 bg-black text-white rounded-full w-12 h-12 flex items-center justify-center z-30 cursor-pointer hover:bg-gray-800 transition-colors"
           onClick={() => setIsExpanded(true)}
           title="BitKode Debug">
        <span className="text-xs">💻</span>
      </div>
    );
  }

  // Expanded state with essential info only
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs font-mono max-w-xs z-30 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold">💻 Debug</h4>
        <div className="flex gap-1">
          <button 
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-white text-xs w-5 h-5 flex items-center justify-center"
            title="Minimize"
          >
            −
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-red-400 hover:text-red-300 text-xs w-5 h-5 flex items-center justify-center"
            title="Hide"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Code:</span> 
          <span className={checkoutReferralCode ? 'text-green-400' : 'text-gray-500'}>
            {checkoutReferralCode || 'None'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span> 
          <span className={activeAttribution?.isActive ? 'text-green-400' : 'text-red-400'}>
            {activeAttribution?.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        {activeAttribution?.totalOrders !== undefined && (
          <div className="flex justify-between">
            <span>Orders:</span> 
            <span className="text-blue-400">{activeAttribution.totalOrders}</span>
          </div>
        )}
        
        <div className="border-t border-gray-600 pt-2 mt-2 text-xs">
          <button 
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="text-red-400 hover:text-red-300 underline"
          >
            Clear & Reload
          </button>
        </div>
      </div>
    </div>
  );
};

// 🛠️ Helper function untuk process order dengan attribution
const processOrderWithAttribution = async (orderData: any) => {
  // Import dari service yang sudah ada
  const { processAffiliateOrder } = await import('@/services/shopeeAffiliateSystem');
  const { useAuth } = await import('@/hooks/useFirebaseAuth');
  
  try {
    // Create order (menggunakan function existing)
    const order = await createOrderInFirestore({
      ...orderData,
      userId: useAuth().user?.uid,
      timestamp: new Date().toISOString()
    });
    
    // Process affiliate commission jika ada user
    if (useAuth().user?.uid) {
      await processAffiliateOrder(
        useAuth().user.uid,
        order.id,
        orderData.total || 0
      );
    }
    
    return order;
  } catch (error) {
    console.error('Error processing order with attribution:', error);
    throw error;
  }
};

// Dummy function - ganti dengan implementasi actual
const createOrderInFirestore = async (orderData: any) => {
  // Implementation depends on your existing order system
  return {
    id: `order_${Date.now()}`,
    ...orderData,
    createdAt: new Date().toISOString()
  };
};

// 🎯 Main Integration Component
export const BitKodeAffiliateProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {/* Referral tracking component */}
      <ReferralLandingPage />
      
      {/* Debug panel for development */}
      <BitKodeAffiliateDebugPanel />
      
      {/* Your app content */}
      {children}
    </>
  );
};

// Keep the old export for backward compatibility
export const ShopeeAffiliateProvider = BitKodeAffiliateProvider;
