# 🛍️ Implementasi Sistem Affiliate Ala Shopee

Panduan lengkap untuk mengimplementasikan sistem affiliate profesional dengan attribution window 7 hari, last-click attribution, dan multi-order tracking seperti Shopee.

## 📋 Overview Sistem

Sistem ini mengimplementasikan:
- ✅ **7-day Attribution Window** - Komisi berlaku 7 hari setelah klik referral terakhir
- ✅ **Last-Click Attribution** - Referral terakhir yang diklik mendapat komisi
- ✅ **Browser Fingerprinting** - Tracking unique visitor tanpa cookies
- ✅ **Session Management** - Tracking session untuk analytics
- ✅ **Multi-Order Attribution** - Satu referral bisa menghasilkan multiple orders
- ✅ **User Binding** - Link attribution ke user saat register/login
- ✅ **Transaction Integrity** - Menggunakan Firestore transactions

## 🏗️ Struktur Database

### Collection: `affiliateAttribution`
```typescript
{
  visitorId: string,           // Browser fingerprint
  sessionId: string,           // Session ID
  referralCode: string,        // Active referral code
  referrerId: string,          // Affiliate ID
  firstClick: string,          // First click timestamp
  lastClick: string,           // Last click timestamp (last-click attribution)
  attributionWindow: string,   // Expiry (7 days from last click)
  isActive: boolean,          // Attribution status
  userId?: string,            // Bound user ID
  userEmail?: string,         // Bound user email
  boundAt?: string,           // User binding timestamp
  totalOrders: number,        // Orders attributed
  totalGMV: number,          // Gross Merchandise Value
  totalCommission: number,   // Total commission
  createdAt: string,
  updatedAt: string
}
```

### Collection: `affiliateOrders`
```typescript
{
  orderId: string,
  userId: string,
  userEmail: string,
  attributionId: string,      // Link to attribution record
  referralCode: string,
  referrerId: string,
  orderTotal: number,
  orderDate: string,
  commissionRate: number,
  commissionAmount: number,
  commissionStatus: 'pending' | 'approved' | 'rejected' | 'paid',
  approvedAt?: string,
  approvedBy?: string,
  paidAt?: string,
  createdAt: string,
  updatedAt: string
}
```

## 🔧 Implementasi Step-by-Step

### 1. Tracking Referral Clicks

Ketika user mengklik link referral (misalnya: `/ref/ABC123`):

```typescript
import { useShopeeAffiliateIntegration } from '@/hooks/useShopeeAffiliate';

// Di component ReferralLanding atau saat detect referral code
const { trackReferralClick } = useShopeeAffiliateIntegration();

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get('ref');
  
  if (referralCode) {
    trackReferralClick(referralCode);
    
    // Redirect to main page setelah tracking
    window.history.replaceState({}, '', '/');
  }
}, []);
```

### 2. Binding User saat Register/Login

Update `useFirebaseAuth.tsx` untuk bind user ke attribution:

```typescript
import { bindAttributionToUser } from '@/services/shopeeAffiliateSystem';

// Di fungsi signUp setelah user berhasil registrasi
const signUp = async (email: string, password: string, userData: any) => {
  try {
    // ... existing signup logic ...
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Bind user ke attribution (CRITICAL!)
    await bindAttributionToUser(user.uid, email);
    
    // ... rest of signup logic ...
  } catch (error) {
    // ... error handling ...
  }
};

// Di fungsi signIn setelah user berhasil login
const signIn = async (email: string, password: string) => {
  try {
    // ... existing signin logic ...
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Bind user ke attribution jika ada
    await bindAttributionToUser(user.uid, email);
    
    // ... rest of signin logic ...
  } catch (error) {
    // ... error handling ...
  }
};
```

### 3. Processing Orders untuk Commission

Update order processing untuk calculate affiliate commission:

```typescript
import { processAffiliateOrder } from '@/services/shopeeAffiliateSystem';

// Di function yang handle order creation
const createOrder = async (orderData: OrderData) => {
  try {
    // Create order seperti biasa
    const order = await createOrderInFirestore(orderData);
    
    // Process affiliate commission (CRITICAL!)
    if (orderData.userId) {
      await processAffiliateOrder(
        orderData.userId,
        order.id,
        orderData.total
      );
    }
    
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};
```

### 4. Checkout Form Integration

Show referral code di checkout form secara otomatis:

```typescript
import { useCheckoutReferral } from '@/hooks/useShopeeAffiliate';

const CheckoutForm = () => {
  const { referralCode, isLoadingReferralCode } = useCheckoutReferral();
  
  return (
    <form>
      {/* Existing form fields */}
      
      {referralCode && (
        <div className="referral-info">
          <label>Referral Code (Optional)</label>
          <input 
            type="text" 
            value={referralCode} 
            readOnly 
            className="bg-green-50 border-green-200"
          />
          <small className="text-green-600">
            🎉 Using referral code: {referralCode}
          </small>
        </div>
      )}
      
      {/* Rest of form */}
    </form>
  );
};
```

### 5. Debug & Monitoring

Tambahkan debug info di development:

```typescript
import { useShopeeAffiliateIntegration } from '@/hooks/useShopeeAffiliate';

const DebugPanel = () => {
  const {
    activeAttribution,
    visitorId,
    sessionId,
    checkoutReferralCode
  } = useShopeeAffiliateIntegration();
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs">
      <h4>🛍️ Shopee Affiliate Debug</h4>
      <div>Visitor ID: {visitorId}</div>
      <div>Session ID: {sessionId}</div>
      <div>Active Code: {checkoutReferralCode || 'None'}</div>
      <div>Attribution: {activeAttribution?.referralCode || 'None'}</div>
      <div>Expires: {activeAttribution?.attributionWindow || 'N/A'}</div>
    </div>
  );
};
```

## 🚀 Migration dari Sistem Lama

### 1. Update URL Structure

Ganti sistem URL referral lama:

```typescript
// LAMA: domain.com?ref=ABC123
// BARU: domain.com/ref/ABC123 atau domain.com?ref=ABC123

// Di router atau URL handler
const handleReferralURL = () => {
  // Handle both old and new formats
  const pathRef = window.location.pathname.match(/^\/ref\/(.+)$/)?.[1];
  const queryRef = new URLSearchParams(window.location.search).get('ref');
  
  const referralCode = pathRef || queryRef;
  
  if (referralCode) {
    trackReferralClick(referralCode);
  }
};
```

### 2. Preserve Existing Data

Jika ada data referral lama, migrate secara bertahap:

```typescript
// Helper untuk migrate data lama
const migrateOldReferralData = async (userId: string) => {
  try {
    // Check if user has old referral data
    const oldReferralData = await getOldReferralData(userId);
    
    if (oldReferralData) {
      // Create attribution record for historical data
      await createHistoricalAttribution(userId, oldReferralData);
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
};
```

## 📊 Analytics & Reporting

### 1. Real-time Attribution Status

```typescript
const useAttributionStatus = () => {
  const { activeAttribution } = useShopeeAffiliateIntegration();
  
  const status = useMemo(() => {
    if (!activeAttribution) return 'no_attribution';
    
    const now = new Date();
    const expires = new Date(activeAttribution.attributionWindow);
    
    if (now > expires) return 'expired';
    
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      status: 'active',
      daysLeft,
      referralCode: activeAttribution.referralCode,
      totalOrders: activeAttribution.totalOrders
    };
  }, [activeAttribution]);
  
  return status;
};
```

### 2. Commission Dashboard

```typescript
const CommissionDashboard = () => {
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    // Fetch affiliate orders for current user
    const fetchCommissionData = async () => {
      const affiliateOrders = await query(
        collection(db, 'affiliateOrders'),
        where('referrerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      // ... process results
    };
    
    fetchCommissionData();
  }, []);
  
  return (
    <div>
      <h2>Commission Dashboard</h2>
      {/* Commission statistics */}
      {/* Orders list */}
      {/* Performance charts */}
    </div>
  );
};
```

## 🔒 Security & Edge Cases

### 1. Validation

```typescript
// Validate referral codes
const validateReferralCode = (code: string): boolean => {
  return /^[A-Z0-9]{6,12}$/.test(code);
};

// Prevent self-referrals
const preventSelfReferral = async (referralCode: string, userId: string) => {
  const affiliate = await getAffiliateByReferralCode(referralCode);
  return affiliate?.userId !== userId;
};
```

### 2. Rate Limiting

```typescript
const rateLimitTracking = (() => {
  const trackingCounts = new Map();
  
  return (visitorId: string) => {
    const now = Date.now();
    const windowStart = now - (60 * 1000); // 1 minute window
    
    const counts = trackingCounts.get(visitorId) || [];
    const recentCounts = counts.filter(time => time > windowStart);
    
    if (recentCounts.length >= 10) { // Max 10 clicks per minute
      return false;
    }
    
    recentCounts.push(now);
    trackingCounts.set(visitorId, recentCounts);
    
    return true;
  };
})();
```

## 🧪 Testing

### 1. Integration Tests

```typescript
describe('Shopee Affiliate System', () => {
  it('should track referral click and create attribution', async () => {
    await trackAffiliateClick('TEST123');
    const attribution = await getActiveAttribution();
    
    expect(attribution?.referralCode).toBe('TEST123');
    expect(attribution?.isActive).toBe(true);
  });
  
  it('should bind user to attribution on signup', async () => {
    // Setup referral click
    await trackAffiliateClick('TEST123');
    
    // User signs up
    await bindAttributionToUser('user123', 'test@example.com');
    
    const attribution = await getActiveAttribution();
    expect(attribution?.userId).toBe('user123');
  });
  
  it('should process order commission correctly', async () => {
    // Setup attribution
    await trackAffiliateClick('TEST123');
    await bindAttributionToUser('user123', 'test@example.com');
    
    // Process order
    await processAffiliateOrder('user123', 'order123', 1000);
    
    // Check commission was created
    const orders = await getDocs(query(
      collection(db, 'affiliateOrders'),
      where('orderId', '==', 'order123')
    ));
    
    expect(orders.size).toBe(1);
    expect(orders.docs[0].data().commissionAmount).toBeGreaterThan(0);
  });
});
```

## 🚀 Deployment Checklist

- [ ] Sistem tracking referral clicks
- [ ] User binding pada register/login
- [ ] Order processing dengan commission calculation
- [ ] Checkout form integration
- [ ] Debug panel untuk development
- [ ] Rate limiting dan security measures
- [ ] Database indexes untuk performance
- [ ] Analytics dashboard
- [ ] Testing coverage
- [ ] Documentation lengkap

## 📈 Performance Optimization

1. **Database Indexes**:
   ```
   affiliateAttribution: visitorId, isActive, userId
   affiliateOrders: referrerId, userId, orderId, commissionStatus
   ```

2. **Caching Strategy**:
   - Cache active attribution di localStorage
   - Cache referral code di sessionStorage
   - Use React Query untuk server state management

3. **Background Jobs**:
   - Cleanup expired attributions
   - Calculate commission statistics
   - Send commission notifications

---

**🎯 Hasil**: Sistem affiliate profesional seperti Shopee dengan tracking akurat, commission calculation otomatis, dan analytics lengkap!
