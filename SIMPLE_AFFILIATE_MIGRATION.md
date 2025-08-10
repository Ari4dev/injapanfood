# 🚀 Simple Affiliate Migration Plan

## 🎯 Tujuan: Disable Old System, Enable Shopee System Only

### ✅ Step 1: Disable Old Affiliate Processing in OrderService

Edit `/src/services/orderService.ts`:

```typescript
// COMMENT OUT old affiliate processing (line 236-267)
/*
// OLD SYSTEM - DISABLED
if (affiliate_id && sanitizedOrderData.user_id) {
  try {
    console.log('Processing affiliate commission for order:', docRef.id);
    // ... old affiliate code
  } catch (affiliateError) {
    // ... error handling
  }
}
*/

// KEEP SHOPEE SYSTEM ONLY (line 269-286)
// 🛍️ SHOPEE AFFILIATE SYSTEM: Process order commission
if (sanitizedOrderData.user_id) {
  try {
    console.log('🛍️ [Shopee] Processing affiliate order commission...');
    const { processAffiliateOrder } = await import('./shopeeAffiliateSystem');
    
    await processAffiliateOrder(
      sanitizedOrderData.user_id,
      docRef.id,
      sanitizedOrderData.total_price
    );
    
    console.log('🛍️ [Shopee] Affiliate order processed successfully');
  } catch (shopeeError) {
    console.error('❌ [Shopee] Error processing affiliate order:', shopeeError);
  }
}
```

### ✅ Step 2: Clean Up CheckoutForm

Edit `/src/components/CheckoutForm.tsx`:

```typescript
// REMOVE old affiliate tracking (line 63-64, 88, 178-202, 461-462, 474-484)
// KEEP only Shopee system:

// Keep this (line 86):
const { referralCode: shopeeReferralCode, isLoading: isLoadingShopeeReferral } = useCheckoutReferral();

// Auto-fill (line 411-418) - KEEP THIS
useEffect(() => {
  if (shopeeReferralCode && !form.getValues('referralCode')) {
    form.setValue('referralCode', shopeeReferralCode);
    setReferralCodeInput(shopeeReferralCode);
    console.log('🛍️ [Shopee] Auto-filled referral code:', shopeeReferralCode);
  }
}, [shopeeReferralCode, form]);

// In order creation, REMOVE old fields:
const orderData = {
  items: cart.map(item => ({
    name: item.name,
    product_id: item.product?.id || item.id.split('-')[0],
    price: item.price,
    quantity: item.quantity,
    image_url: item.image_url,
    selectedVariants: item.selectedVariants || {}
  })),
  totalPrice: totalWithShipping,
  customerInfo: {
    // ... customer info
  },
  userId: user?.uid,
  shipping_fee: shippingFee || 0,
  // REMOVE: affiliate_id: affiliateId,
  // REMOVE: visitor_id: visitorId
  manual_referral_code: data.referralCode || null // KEEP for manual input
};
```

### ✅ Step 3: Update App.tsx Integration

Edit `/src/App.tsx`:

```typescript
// REMOVE old affiliate imports and providers
// KEEP only Shopee system:

import { ShopeeAffiliateProvider } from '@/components/affiliate/ShopeeIntegrationExamples';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ShopeeAffiliateProvider>
        <AuthProvider>
          <LanguageProvider>
            {/* Remove AffiliateProvider - use Shopee only */}
            <BrowserRouter>
              <Routes>
                {/* ... routes */}
              </Routes>
            </BrowserRouter>
          </LanguageProvider>
        </AuthProvider>
      </ShopeeAffiliateProvider>
    </QueryClientProvider>
  );
}
```

### ✅ Step 4: Handle Manual Referral Codes

Edit `/src/services/orderService.ts` to process manual referral codes:

```typescript
// Add after Shopee processing:
if (sanitizedOrderData.manual_referral_code && sanitizedOrderData.user_id) {
  try {
    console.log('🎯 Processing manual referral code:', sanitizedOrderData.manual_referral_code);
    
    // Check if it's a valid referral code
    const { getAffiliateByReferralCode } = await import('./affiliateService');
    const affiliate = await getAffiliateByReferralCode(sanitizedOrderData.manual_referral_code);
    
    if (affiliate) {
      // Track this as a manual referral via Shopee system
      const { trackAffiliateClick, bindAttributionToUser, processAffiliateOrder } = 
        await import('./shopeeAffiliateSystem');
      
      // Quick manual processing
      await trackAffiliateClick(sanitizedOrderData.manual_referral_code);
      await bindAttributionToUser(sanitizedOrderData.user_id, orderData.customer_info.email);
      // processAffiliateOrder already called above
    }
  } catch (manualError) {
    console.error('Error processing manual referral:', manualError);
  }
}
```

### ✅ Step 5: Update Auth Integration

Edit `/src/hooks/useFirebaseAuth.tsx`:

```typescript
// KEEP Shopee system integration:
import { bindAttributionToUser } from '@/services/shopeeAffiliateSystem';

// In signUp function:
const signUp = async (email: string, password: string, userData: any) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Shopee system binding
    await bindAttributionToUser(user.uid, email);
    
    // ... rest of signup logic
  } catch (error) {
    // ... error handling
  }
};

// In signIn function:
const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Shopee system binding
    await bindAttributionToUser(user.uid, email);
    
    // ... rest of signin logic
  } catch (error) {
    // ... error handling
  }
};
```

## 🔧 Implementation Steps:

1. **Comment out old affiliate code** in orderService.ts
2. **Clean up CheckoutForm** - remove old tracking variables
3. **Update App.tsx** - use ShopeeAffiliateProvider only
4. **Add manual referral processing** for direct input codes
5. **Test thoroughly** with referral links

## ✅ Benefits:

- ✅ **No double processing**
- ✅ **Single source of truth** (Shopee system)  
- ✅ **Backward compatible** (manual codes still work)
- ✅ **Clean codebase** (no conflicting logic)
- ✅ **Advanced features** (7-day window, last-click attribution)

## 🧪 Testing:

1. Test referral link: `localhost:5173?ref=ABC123`
2. Test manual referral code input in checkout
3. Test user registration with active referral
4. Test order creation with commission calculation
5. Check debug panel in development mode

---

**Result**: Clean, simple, and fully functional Shopee affiliate system! 🚀
