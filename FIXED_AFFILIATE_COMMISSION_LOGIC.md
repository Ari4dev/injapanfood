# ✅ FIXED: Logika Komisi Affiliate yang Benar

## 🚨 Masalah Sebelumnya

**Masalah**: Komisi affiliate dihitung dari **total order** (termasuk ongkir dan biaya COD), yang menyebabkan kerugian finansial.

### Contoh Masalah:
```
Harga Barang: ¥1,000
Ongkir: ¥500  
Biaya COD: ¥100
Total Order: ¥1,600

❌ SEBELUM (SALAH):
Komisi = ¥1,600 × 10% = ¥160
Profit Margin = ¥1,000 - ¥160 = ¥840 (kerugian karena komisi dari ongkir!)

✅ SETELAH (BENAR):
Komisi = ¥1,000 × 10% = ¥100
Profit Margin = ¥1,000 - ¥100 = ¥900 ✓
```

## ✅ Solusi yang Diterapkan

### 1. **Perubahan Fungsi `processAffiliateOrder`**

**File**: `/src/services/shopeeAffiliateSystem.ts`

```typescript
// OLD - WRONG
const commissionAmount = Math.round((orderTotal * commissionRate) / 100);

// NEW - CORRECT
const commissionBase = productSubtotal || (orderTotal - (shippingFee || 0) - (codSurcharge || 0));
const commissionAmount = Math.round((commissionBase * commissionRate) / 100);
```

### 2. **Update Parameter Function**

```typescript
// BEFORE
export const processAffiliateOrder = async (
  userId: string,
  orderId: string, 
  orderTotal: number
): Promise<void> => { ... }

// AFTER
export const processAffiliateOrder = async (
  userId: string,
  orderId: string, 
  orderTotal: number,
  productSubtotal?: number,    // ✅ NEW: Product subtotal only
  shippingFee?: number,        // ✅ NEW: Shipping fee to exclude
  codSurcharge?: number        // ✅ NEW: COD surcharge to exclude
): Promise<void> => { ... }
```

### 3. **Update Order Service Integration**

**File**: `/src/services/orderService.ts`

```typescript
// Calculate product subtotal (excluding shipping and COD fees)
const productSubtotal = sanitizedOrderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
const shippingFee = sanitizedOrderData.shipping_fee || 0;
const codSurcharge = sanitizedOrderData.cod_surcharge || 0;

await processAffiliateOrder(
  sanitizedOrderData.user_id,
  docRef.id,
  sanitizedOrderData.total_price,
  productSubtotal,  // ✅ Pass product subtotal for commission calculation
  shippingFee,      // ✅ Pass shipping fee (to exclude from commission)
  codSurcharge      // ✅ Pass COD surcharge (to exclude from commission)
);
```

### 4. **Update Interface `AffiliateOrder`**

```typescript
export interface AffiliateOrder {
  // ... existing fields ...
  orderTotal: number;         // Order total in Yen (including shipping & fees)
  productSubtotal?: number;   // ✅ NEW: Product subtotal only (base for commission calculation)
  // ... rest of fields ...
}
```

## 📊 Contoh Perhitungan yang Benar

### Skenario 1: Normal Order
```
Harga Barang: ¥1,000
Ongkir: ¥500
Biaya COD: ¥100
Total Order: ¥1,600
Commission Rate: 10%

✅ COMMISSION CALCULATION:
Base Amount = ¥1,000 (product only)
Commission = ¥1,000 × 10% = ¥100

📊 BUSINESS IMPACT:
- Revenue from Products: ¥1,000
- Commission Paid: ¥100
- Net Revenue: ¥900
- Shipping & COD: ¥600 (pass-through costs, no commission impact)
```

### Skenario 2: Multiple Products
```
Product A: ¥800 × 2 = ¥1,600
Product B: ¥500 × 1 = ¥500
Product Subtotal: ¥2,100
Ongkir: ¥400
Total Order: ¥2,500
Commission Rate: 5%

✅ COMMISSION CALCULATION:
Base Amount = ¥2,100 (products only)
Commission = ¥2,100 × 5% = ¥105

📊 BUSINESS IMPACT:
- Revenue from Products: ¥2,100
- Commission Paid: ¥105
- Net Revenue: ¥1,995
```

### Skenario 3: High Shipping Cost
```
Harga Barang: ¥500
Ongkir: ¥1,000 (expensive shipping)
Total Order: ¥1,500
Commission Rate: 10%

❌ OLD CALCULATION (WRONG):
Commission = ¥1,500 × 10% = ¥150
Net = ¥500 - ¥150 = ¥350 (loses money on shipping commission!)

✅ NEW CALCULATION (CORRECT):
Commission = ¥500 × 10% = ¥50
Net = ¥500 - ¥50 = ¥450 ✓
```

## 🔍 Monitoring & Debugging

### Console Logs untuk Debugging

```typescript
console.log('💰 [Commission Calculation]:', {
  orderTotal,
  productSubtotal: commissionBase,
  shippingFee: shippingFee || 0,
  codSurcharge: codSurcharge || 0,
  commissionRate,
  commissionAmount,
  note: 'Commission calculated ONLY from product subtotal (excluding shipping & COD fees)'
});
```

### Database Storage

**Collection**: `affiliateOrders`
```json
{
  "orderId": "order_123",
  "orderTotal": 1500,
  "productSubtotal": 1000,    // ✅ NEW: Stored for transparency
  "commissionRate": 10,
  "commissionAmount": 100,    // ✅ Calculated from productSubtotal only
  "commissionStatus": "pending"
}
```

## ⚡ Benefits

### 1. **Financial Protection**
- ✅ No loss from shipping fee commissions
- ✅ No loss from COD surcharge commissions
- ✅ Accurate profit margins

### 2. **Business Sustainability**
- ✅ Sustainable commission structure
- ✅ Prevents commission > product value scenarios
- ✅ Encourages high-value product sales

### 3. **Transparency**
- ✅ Clear commission base calculation
- ✅ Detailed logging for debugging
- ✅ Stored productSubtotal for auditing

### 4. **Scalability**
- ✅ Works with variable shipping costs
- ✅ Works with different COD fees
- ✅ Flexible commission rates per category

## 🧪 Testing Scenarios

### Test Case 1: Basic Commission
```javascript
// Input
productSubtotal: 1000
shippingFee: 500
codSurcharge: 100
commissionRate: 10

// Expected Output
commissionBase: 1000
commissionAmount: 100
```

### Test Case 2: No Shipping
```javascript
// Input
productSubtotal: 2000
shippingFee: 0
codSurcharge: 0
commissionRate: 5

// Expected Output
commissionBase: 2000
commissionAmount: 100
```

### Test Case 3: High Commission Rate
```javascript
// Input
productSubtotal: 500
shippingFee: 800
codSurcharge: 200
commissionRate: 15

// Expected Output
commissionBase: 500
commissionAmount: 75
```

## 🔧 Maintenance

### Regular Checks
1. **Monitor commission rates** - Ensure they're profitable
2. **Audit high-value orders** - Verify commission calculations
3. **Track shipping cost trends** - Ensure they don't affect commissions

### Performance Monitoring
```typescript
// Add to admin dashboard
const commissionEfficiency = (totalCommissions / totalProductRevenue) * 100;
const shippingImpact = totalShippingFees; // Should not affect commissions
```

## 🎯 Hasil Akhir

**Sebelum Fix:**
- Affiliate mendapat komisi dari total order (¥1,500) = ¥150
- Bisnis rugi karena bayar komisi untuk ongkir dan COD

**Setelah Fix:**
- Affiliate mendapat komisi dari harga barang saja (¥1,000) = ¥100
- Bisnis aman, hanya bayar komisi untuk produk yang dijual
- Struktur komisi yang berkelanjutan dan menguntungkan

**📈 Impact**: Menyelamatkan bisnis dari kerugian komisial yang tidak perlu sambil tetap memberikan insentif yang adil kepada affiliate!
