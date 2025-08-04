# Sistem Bundling Produk InJapanFood

Sistem bundling produk telah berhasil diimplementasi dengan fitur-fitur lengkap untuk mengelola paket bundling produk di aplikasi InJapanFood.

## 📋 Fitur Utama

### 1. Tipe Bundle
- **Fixed Bundle**: Bundle dengan produk dan jumlah yang sudah ditentukan
- **Mix & Match Bundle**: Customer dapat memilih produk dalam batas minimum/maksimum
- **Tiered Bundle**: Bundle bertingkat dengan opsi upgrade

### 2. Sistem Diskon
- **Percentage Discount**: Diskon berdasarkan persentase
- **Fixed Amount Discount**: Diskon berdasarkan jumlah tetap
- **Buy X Get Y**: Promo beli sejumlah tertentu dapat gratis

### 3. Analitik Bundle
- Tracking view, purchase, dan revenue harian
- Customer preference scoring
- Rekomendasi bundle personal

## 🗂️ Struktur File

```
src/
├── types/bundle.ts                     # TypeScript interfaces
├── services/firestore/bundleService.ts # Firestore service layer
├── hooks/useBundle.tsx                 # React hooks untuk bundle
├── components/bundles/
│   ├── BundleCard.tsx                  # Kartu bundle
│   └── BundleRecommendations.tsx       # Komponen rekomendasi
├── pages/bundles/
│   ├── index.tsx                       # Halaman katalog bundle
│   └── [id].tsx                        # Halaman detail bundle
└── scripts/seedBundleData.ts           # Script seeding data
```

## 🔥 Firestore Collections

### 1. `bundles`
```typescript
{
  id: string
  name: string
  description: string
  bundle_type: 'fixed' | 'mix_and_match' | 'tiered'
  discount_type: 'percentage' | 'fixed' | 'buy_x_get_y'
  discount_value: number
  original_price: number
  bundle_price: number
  min_items?: number
  max_items?: number
  image_url: string
  status: 'active' | 'inactive' | 'draft'
  priority: number
  start_date: Timestamp
  end_date?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}
```

### 2. `bundle_items`
```typescript
{
  id: string
  bundle_id: string
  product_id: string
  quantity: number
  is_required: boolean
  category_restriction?: string
  created_at: Timestamp
}
```

### 3. `bundle_analytics`
```typescript
{
  id: string
  bundle_id: string
  date: string
  views: number
  purchases: number
  revenue: number
  created_at: Timestamp
}
```

### 4. `customer_bundle_preferences`
```typescript
{
  id: string
  user_id: string
  bundle_id: string
  preference_score: number
  purchased: boolean
  last_viewed: Timestamp
  created_at: Timestamp
}
```

## 🛠️ Implementasi

### 1. Bundle Service
Service layer yang mengelola semua operasi bundle dengan Firestore:

```typescript
// Get active bundles
const bundles = await FirestoreBundleService.getActiveBundles();

// Get bundle by ID
const bundle = await FirestoreBundleService.getBundleById('bundle-1');

// Get recommendations
const recommendations = await FirestoreBundleService.getBundleRecommendations(userId);

// Track analytics
await FirestoreBundleService.trackBundleView('bundle-1');
await FirestoreBundleService.trackBundlePurchase('bundle-1', 310);
```

### 2. React Hook
Custom hook untuk kemudahan penggunaan:

```typescript
const {
  bundles,
  loading,
  error,
  getBundleById,
  addToCart,
  trackView
} = useBundle();
```

### 3. Bundle Card Component
Komponen reusable untuk menampilkan bundle:

```typescript
<BundleCard
  bundle={bundle}
  onAddToCart={(bundleId, items) => handleAddToCart(bundleId, items)}
  onViewDetails={(bundleId) => router.push(`/bundles/${bundleId}`)}
  showQuickActions={true}
/>
```

## 📦 Bundle Data Sample

Berikut adalah 5 bundle yang telah dibuat menggunakan produk existing:

### 1. Paket Mie Instan Komplit
- **Type**: fixed
- **Items**: 3 products
- **Original**: Rp 485
- **Bundle**: Rp 310
- **Savings**: Rp 175 (36.1%)
- **Products**: Indomie Goreng Ayam Bawang (2x), Bon Cabe Level 30 (1x), Bumbu Rawon Instan (1x)

### 2. Mix & Match Kerupuk Nusantara
- **Type**: mix_and_match
- **Items**: 3 products
- **Original**: Rp 300
- **Bundle**: Rp 225
- **Savings**: Rp 75 (25.0%)
- **Products**: Kerupuk Udang Sidoarjo (1x), Emping Melinjo (1x), Kacang Garuda (2x)

### 3. Paket Masak Rendang Special
- **Type**: fixed
- **Items**: 2 products
- **Original**: Rp 500
- **Bundle**: Rp 440
- **Savings**: Rp 60 (12.0%)
- **Products**: Rendang Padang Instan (1x), Sambal ABC (2x)

### 4. Paket Protein Beku
- **Type**: fixed
- **Items**: 2 products
- **Original**: Rp 195
- **Bundle**: Rp 126
- **Savings**: Rp 69 (35.4%)
- **Products**: Tahu Goreng Beku (2x), Tempeh Organik (1x)

### 5. Starter Kit Bumbu Dapur
- **Type**: mix_and_match
- **Items**: 3 products
- **Original**: Rp 320
- **Bundle**: Rp 300
- **Savings**: Rp 20 (6.3%)
- **Products**: Bumbu Rawon Instan (1x), Sambal ABC (1x), Bon Cabe Level 30 (1x)

## 🚀 Cara Menggunakan

### 1. Seeding Data
Jalankan script untuk mengisi data bundle:

```bash
# Run seeding script
node -e "require('./src/scripts/seedBundleData.ts').seedBundleData()"
```

### 2. Menampilkan Bundle di Homepage
```typescript
import BundleRecommendations from '@/components/bundles/BundleRecommendations';

function HomePage() {
  return (
    <div>
      <BundleRecommendations
        userId="user-123"
        title="Bundle Rekomendasi"
        maxItems={6}
        showViewAll={true}
      />
    </div>
  );
}
```

### 3. Halaman Katalog Bundle
Akses `/bundles` untuk melihat semua bundle dengan fitur:
- Search dan filter
- Sort berdasarkan harga, nama, savings
- Responsive design
- Pagination/infinite scroll

### 4. Halaman Detail Bundle
Akses `/bundles/[id]` untuk melihat detail bundle dengan fitur:
- Informasi lengkap bundle
- Kustomisasi untuk mix & match bundle
- Add to cart functionality
- Share bundle
- Related bundles

## 🎨 UI/UX Features

### 1. Bundle Card
- Gambar produk utama
- Informasi harga dan diskon
- Badge untuk tipe bundle
- Quick actions (Add to Cart, View Details)
- Loading states dan error handling

### 2. Bundle Recommendations
- Carousel untuk desktop
- Grid responsive
- Statistik bundle (jumlah, rata-rata hemat, rating)
- Personalized recommendations

### 3. Bundle Catalog
- Advanced filtering dan sorting
- Search functionality
- Mobile-friendly filters
- Empty states dan loading skeletons

### 4. Bundle Detail
- Image gallery
- Interactive product selection untuk mix & match
- Price calculation real-time
- Bundle rules validation
- Social sharing

## 📊 Analytics & Tracking

Sistem tracking yang komprehensif untuk:
- Bundle views (page views)
- Bundle purchases (conversion)
- Revenue per bundle
- Customer preferences
- Popular bundles
- Bundle performance metrics

## 🔧 Maintenance

### Adding New Bundle Types
1. Update `BundleType` enum in `types/bundle.ts`
2. Add validation logic in `FirestoreBundleService`
3. Update UI components untuk handle tipe baru
4. Test dengan data sample

### Bundle Analytics
Data analytics tersimpan harian dan dapat digunakan untuk:
- Dashboard admin
- A/B testing bundle
- Optimisasi harga dan produk
- Customer behavior analysis

## 🎯 Next Steps

1. **Admin Panel**: Interface untuk CRUD bundle
2. **Advanced Analytics**: Dashboard dengan charts dan metrics
3. **A/B Testing**: Testing different bundle configurations
4. **Email Marketing**: Bundle recommendations via email
5. **Inventory Integration**: Auto disable bundle jika produk out of stock
6. **Dynamic Pricing**: Pricing berdasarkan demand dan inventory

## 📱 Mobile Support

Semua komponen telah dioptimasi untuk mobile dengan:
- Responsive design
- Touch-friendly interactions
- Mobile-specific layouts
- Performance optimization

Sistem bundling ini siap untuk digunakan dan dapat dengan mudah dikembangkan lebih lanjut sesuai kebutuhan bisnis InJapanFood.
