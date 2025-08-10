# 💻 Cara Kerja Sistem Affiliate BitKode

## 📋 Overview Sistem

Sistem affiliate BitKode menggunakan teknologi **attribution tracking** modern dengan fitur:

- ✅ **1-day Attribution Window** - Komisi berlaku 1 hari setelah klik terakhir
- ✅ **Last-Click Attribution** - Referral terakhir yang diklik mendapat komisi  
- ✅ **Browser Fingerprinting** - Tracking tanpa cookies
- ✅ **Multi-Order Tracking** - Satu referral bisa menghasilkan banyak order
- ✅ **User Binding** - Link attribution ke user account
- ✅ **Dual System** - Sistem lama + BitKode berjalan bersamaan

---

## 🔄 Flow Lengkap Sistem

### 1. **User Daftar Jadi Affiliate**
```
User → Register → Dapat Referral Code (contoh: JOHN123)
```

### 2. **Affiliate Share Link Referral** 
```
Link: https://yoursite.com/ref/JOHN123
atau: https://yoursite.com/?ref=JOHN123
```

### 3. **Customer Klik Link Referral**
```
Customer klik link → Sistem track click → Buat Attribution Record → 
Redirect ke homepage → Attribution window mulai (1 hari)
```

### 4. **Customer Browse & Belanja**
```
Customer browse produk → Add to cart → Checkout → 
Referral code otomatis muncul di form → Order dibuat
```

### 5. **Sistem Process Komisi**
```
Order selesai → Check attribution → Calculate commission →
Create commission record → Update affiliate stats
```

---

## 🛠️ Detail Teknis Per Step

### **Step 1: Tracking Referral Click**

**Apa yang Terjadi:**
1. Customer klik `https://yoursite.com/ref/JOHN123`
2. Sistem deteksi referral code `JOHN123`
3. Generate visitor ID (browser fingerprint)
4. Generate session ID
5. Cari affiliate dengan code `JOHN123`
6. Buat/update attribution record
7. Set attribution window 1 hari dari sekarang
8. Redirect ke homepage

**Database Yang Dibuat:**
```javascript
// Collection: affiliateAttribution
{
  visitorId: "v_1704543234_abc123def",
  sessionId: "s_1704543234_xyz789",
  referralCode: "JOHN123",
  referrerId: "affiliate-john-id",
  firstClick: "2024-01-06T10:30:00Z",
  lastClick: "2024-01-06T10:30:00Z",
  attributionWindow: "2024-01-07T10:30:00Z", // 1 day later
  isActive: true,
  totalOrders: 0,
  totalCommission: 0,
  createdAt: "2024-01-06T10:30:00Z"
}
```

### **Step 2: Customer Browse (Tracking Berlanjut)**

**Apa yang Terjadi:**
- Customer browse website normal
- Attribution record tetap aktif di background
- Jika customer klik referral link lain, sistem update ke "last-click attribution"

**Contoh Last-Click Attribution:**
```javascript
// Customer klik ref lain: https://yoursite.com/ref/SARAH456
// Attribution update ke referral code terbaru:
{
  referralCode: "SARAH456", // ← Changed!
  referrerId: "affiliate-sarah-id", // ← Changed!
  lastClick: "2024-01-07T15:20:00Z", // ← Updated!
  attributionWindow: "2024-01-08T15:20:00Z" // ← Extended!
}
```

### **Step 3: Customer Register/Login (User Binding)**

**Apa yang Terjadi:**
1. Customer register atau login
2. Sistem bind attribution record ke user account
3. Attribution jadi permanen selama masih dalam window

**Database Update:**
```javascript
// Attribution record di-bind ke user
{
  // ... existing data ...
  userId: "customer-user-id-123",
  userEmail: "customer@email.com", 
  boundAt: "2024-01-06T11:00:00Z"
}
```

### **Step 4: Customer Checkout**

**Apa yang Terjadi:**
1. Customer ke halaman checkout
2. Sistem check active attribution
3. Jika ada, referral code muncul otomatis
4. Customer lihat info: "💻 Menggunakan kode referral: JOHN123"

**UI Display:**
```html
<!-- Auto-filled di checkout form -->
<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h4>💻 Informasi Referral BitKode:</h4>
  <p>Anda menggunakan kode referral: <strong>JOHN123</strong></p>
  <p class="text-sm">🚀 Komisi akan otomatis diberikan kepada affiliate!</p>
</div>
```

### **Step 5: Order Processing & Commission**

**Apa yang Terjadi:**
1. Customer submit order → Order tersimpan di database
2. Sistem check attribution record untuk user ini
3. Jika masih dalam window (1 hari), process commission:
   - Calculate commission (contoh: 5% dari total order)
   - Buat commission record
   - Update attribution stats
   - Update affiliate stats

**Commission Calculation:**
```javascript
// Contoh order ¥10,000 dengan commission rate 5%
const orderTotal = 10000;
const commissionRate = 5; // 5%
const commissionAmount = Math.round((orderTotal * commissionRate) / 100);
// Result: ¥500 commission

// Database records dibuat:
// 1. affiliateOrders collection
{
  orderId: "order_123456",
  userId: "customer-user-id",
  attributionId: "attribution-record-id",
  referralCode: "JOHN123",
  referrerId: "affiliate-john-id",
  orderTotal: 10000,
  commissionRate: 5,
  commissionAmount: 500,
  commissionStatus: "pending",
  orderDate: "2024-01-06T12:00:00Z"
}

// 2. Attribution record di-update
{
  // ... existing data ...
  totalOrders: 1,
  totalGMV: 10000,
  totalCommission: 500
}

// 3. Affiliate stats di-update
{
  // ... existing affiliate data ...
  totalCommission: (existing) + 500,
  pendingCommission: (existing) + 500
}
```

---

## 🎯 Contoh Real Case

### **Scenario:** John adalah affiliate, Sarah adalah customer

**Day 1 (Jan 6):**
- Sarah klik link John: `website.com/ref/JOHN123`
- Attribution window: Jan 6 - Jan 7 (1 hari)
- Sarah browse-browse, belum beli

**Day 1 Evening (Jan 6, 8pm):**
- Sarah register account
- Attribution di-bind ke Sarah's account
- Sarah checkout ¥15,000
- Commission untuk John: ¥750 (5%)
- Status: Pending approval

**Day 2 (Jan 7, 2pm):**
- Sarah beli lagi ¥8,000
- Masih dalam window (expired Jan 7 10:30am)? ❌ EXPIRED
- No commission untuk John

### **Attribution Window Rules:**

✅ **Dalam Window (≤1 hari):** Commission diberikan
❌ **Lewat Window (>1 hari):** No commission
🔄 **Klik Referral Lain:** Window di-reset, ganti affiliate

---

## 👨‍💼 Admin Management

Admin bisa manage semua ini di **Enhanced Affiliate Management**:

### **Dashboard Overview:**
- Total affiliate aktif
- Total attribution records
- Combined revenue (sistem lama + BitKode)
- Attribution window yang aktif

### **Attribution Tracking Table:**
- Semua click records
- Status (Active/Expired/Bound/Unbound)
- Commission generated per attribution
- Remaining time dalam window

### **Commission Management:**
- Approve/reject pending commissions
- Bulk payout processing
- Commission status tracking

---

## 🔍 Debug Mode (Development)

Dalam development mode, ada debug panel yang show:

```
💻 BitKode Affiliate Debug
Visitor ID: v_1704543234_abc123def
Session ID: s_1704543234_xyz789

Active Code: JOHN123
Attribution Code: JOHN123  
Status: Active
Expires: Jan 7, 2024 10:30:00
Orders: 0
```

---

## ⚡ Keunggulan Sistem BitKode

### **Vs Sistem Affiliate Tradisional:**

| Feature | Sistem Lama | BitKode Style |
|---------|-------------|---------------|
| Tracking | Manual referral code | Browser fingerprinting |
| Window | Permanent/Manual | 1-day automatic |
| Attribution | First-click | Last-click |
| Multi-order | ❌ | ✅ |
| User binding | ❌ | ✅ |
| Analytics | Basic | Advanced |

### **Benefits:**
- ✅ **Lebih Akurat**: Tidak bergantung pada cookies
- ✅ **User-Friendly**: Referral code otomatis muncul
- ✅ **Fair**: Last-click attribution lebih adil
- ✅ **Scalable**: Bisa handle traffic besar
- ✅ **Analytics**: Data lengkap untuk optimization

---

## 🚀 Hasil Akhir

**Untuk Affiliate:**
- Link sharing lebih mudah 
- Commission tracking real-time
- Stats lengkap di dashboard

**Untuk Customer:**
- Experience seamless
- Tidak perlu manual input referral code
- Transparant tentang commission

**Untuk Business:**
- Attribution akurat
- Analytics mendalam  
- Management tools lengkap
- ROI tracking yang proper

Sistem ini mengkombinasikan yang terbaik dari affiliate marketing modern dengan implementasi yang robust dan user-friendly! 💪
