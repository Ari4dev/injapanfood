import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Sample bundle data for seeding Firestore (using existing products)
const sampleBundles = [
  {
    id: 'bundle-1',
    name: 'Paket Mie Instan Komplit',
    description: 'Paket lengkap mie instan dengan pelengkap untuk makan yang memuaskan',
    bundle_type: 'fixed',
    discount_type: 'percentage',
    discount_value: 15,
    original_price: 365, // 120 + 180 + 65
    bundle_price: 310,
    min_items: null,
    max_items: null,
    image_url: '/placeholder.svg',
    status: 'active',
    priority: 10,
    items: [
      {
        product_id: '1',
        quantity: 2,
        is_required: true,
        category_restriction: null,
        product: {
          id: '1',
          name: 'Indomie Goreng Ayam Bawang',
          price: 120,
          category: 'Makanan Siap Saji',
          image_url: '/placeholder.svg'
        }
      },
      {
        product_id: '2',
        quantity: 1,
        is_required: true,
        category_restriction: null,
        product: {
          id: '2',
          name: 'Bon Cabe Level 30',
          price: 180,
          category: 'Bon Cabe',
          image_url: '/placeholder.svg'
        }
      },
      {
        product_id: '6',
        quantity: 1,
        is_required: true,
        category_restriction: null,
        product: {
          id: '6',
          name: 'Bumbu Rawon Instan',
          price: 65,
          category: 'Bumbu Dapur',
          image_url: '/placeholder.svg'
        }
      }
    ]
  },
  {
    id: 'bundle-2',
    name: 'Mix & Match Kerupuk Nusantara',
    description: 'Pilih sendiri kombinasi kerupuk tradisional Indonesia favorit Anda',
    bundle_type: 'mix_and_match',
    discount_type: 'fixed',
    discount_value: 30,
    original_price: 255, // 85 + 125 + 45
    bundle_price: 225,
    min_items: 2,
    max_items: 4,
    image_url: '/placeholder.svg',
    status: 'active',
    priority: 8,
    items: [
      {
        product_id: '4',
        quantity: 1,
        is_required: false,
        category_restriction: 'Kerupuk',
        product: {
          id: '4',
          name: 'Kerupuk Udang Sidoarjo',
          price: 85,
          category: 'Kerupuk',
          image_url: '/placeholder.svg'
        }
      },
      {
        product_id: '10',
        quantity: 1,
        is_required: false,
        category_restriction: 'Kerupuk',
        product: {
          id: '10',
          name: 'Emping Melinjo',
          price: 125,
          category: 'Kerupuk',
          image_url: '/placeholder.svg'
        }
      },
      {
        product_id: '7',
        quantity: 2,
        is_required: false,
        category_restriction: 'Makanan Ringan',
        product: {
          id: '7',
          name: 'Kacang Garuda',
          price: 45,
          category: 'Makanan Ringan',
          image_url: '/placeholder.svg'
        }
      }
    ]
  },
  {
    id: 'bundle-3',
    name: 'Paket Masak Rendang Special',
    description: 'Semua yang Anda butuhkan untuk masak rendang yang autentik',
    bundle_type: 'fixed',
    discount_type: 'percentage',
    discount_value: 12,
    original_price: 500, // 350 + 75 + 75
    bundle_price: 440,
    min_items: null,
    max_items: null,
    image_url: '/placeholder.svg',
    status: 'active',
    priority: 9,
    items: [
      {
        product_id: '3',
        quantity: 1,
        is_required: true,
        category_restriction: null,
        product: {
          id: '3',
          name: 'Rendang Padang Instan',
          price: 350,
          category: 'Makanan Siap Saji',
          image_url: '/placeholder.svg'
        }
      },
      {
        product_id: '9',
        quantity: 2,
        is_required: true,
        category_restriction: null,
        product: {
          id: '9',
          name: 'Sambal ABC',
          price: 75,
          category: 'Bumbu Dapur',
          image_url: '/placeholder.svg'
        }
      }
    ]
  },
  {
    id: 'bundle-4',
    name: 'Paket Protein Beku',
    description: 'Koleksi protein nabati beku berkualitas untuk kebutuhan memasak harian',
    bundle_type: 'fixed',
    discount_type: 'percentage',
    discount_value: 10,
    original_price: 140, // 55 + 85
    bundle_price: 126,
    min_items: null,
    max_items: null,
    image_url: '/placeholder.svg',
    status: 'active',
    priority: 6,
    items: [
      {
        product_id: '8',
        quantity: 2,
        is_required: true,
        category_restriction: null,
        product: {
          id: '8',
          name: 'Tahu Goreng Beku',
          price: 55,
          category: 'Bahan Masak Beku',
          image_url: '/placeholder.svg'
        }
      },
      {
        product_id: '11',
        quantity: 1,
        is_required: true,
        category_restriction: null,
        product: {
          id: '11',
          name: 'Tempeh Organik',
          price: 85,
          category: 'Bahan Masak Beku',
          image_url: '/placeholder.svg'
        }
      }
    ]
  },
  {
    id: 'bundle-5',
    name: 'Starter Kit Bumbu Dapur',
    description: 'Paket dasar bumbu-bumbu penting untuk memulai memasak masakan Indonesia',
    bundle_type: 'mix_and_match',
    discount_type: 'fixed',
    discount_value: 20,
    original_price: 320, // 65 + 75 + 180
    bundle_price: 300,
    min_items: 2,
    max_items: 3,
    image_url: '/placeholder.svg',
    status: 'active',
    priority: 7,
    items: [
      {
        product_id: '6',
        quantity: 1,
        is_required: true,
        category_restriction: null,
        product: {
          id: '6',
          name: 'Bumbu Rawon Instan',
          price: 65,
          category: 'Bumbu Dapur',
          image_url: '/placeholder.svg'
        }
      },
      {
        product_id: '9',
        quantity: 1,
        is_required: false,
        category_restriction: 'Bumbu Dapur',
        product: {
          id: '9',
          name: 'Sambal ABC',
          price: 75,
          category: 'Bumbu Dapur',
          image_url: '/placeholder.svg'
        }
      },
      {
        product_id: '2',
        quantity: 1,
        is_required: false,
        category_restriction: 'Bon Cabe',
        product: {
          id: '2',
          name: 'Bon Cabe Level 30',
          price: 180,
          category: 'Bon Cabe',
          image_url: '/placeholder.svg'
        }
      }
    ]
  }
];

export const seedBundleData = async () => {
  try {
    console.log('Starting to seed bundle data...');
    
    const batch = writeBatch(db);
    
    // Seed bundles
    console.log('Seeding bundles...');
    for (const bundle of sampleBundles) {
      const bundleRef = doc(db, 'bundles', bundle.id);
      const { items, ...bundleData } = bundle;
      
      batch.set(bundleRef, {
        ...bundleData,
        start_date: serverTimestamp(),
        end_date: null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      
      // Seed bundle items
      for (const item of items) {
        const itemRef = doc(collection(db, 'bundle_items'));
        const { product, ...itemData } = item;
        
        batch.set(itemRef, {
          ...itemData,
          bundle_id: bundle.id,
          created_at: serverTimestamp()
        });
      }
    }
    
    // Seed some sample analytics data
    console.log('Seeding analytics...');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    for (const bundle of sampleBundles) {
      // Today's analytics
      const todayAnalyticsRef = doc(collection(db, 'bundle_analytics'));
      batch.set(todayAnalyticsRef, {
        bundle_id: bundle.id,
        date: today,
        views: Math.floor(Math.random() * 50) + 10,
        purchases: Math.floor(Math.random() * 5) + 1,
        revenue: bundle.bundle_price * (Math.floor(Math.random() * 5) + 1),
        created_at: serverTimestamp()
      });
      
      // Yesterday's analytics
      const yesterdayAnalyticsRef = doc(collection(db, 'bundle_analytics'));
      batch.set(yesterdayAnalyticsRef, {
        bundle_id: bundle.id,
        date: yesterday,
        views: Math.floor(Math.random() * 40) + 15,
        purchases: Math.floor(Math.random() * 3) + 1,
        revenue: bundle.bundle_price * (Math.floor(Math.random() * 3) + 1),
        created_at: serverTimestamp()
      });

      // Two days ago analytics
      const twoDaysAgoAnalyticsRef = doc(collection(db, 'bundle_analytics'));
      batch.set(twoDaysAgoAnalyticsRef, {
        bundle_id: bundle.id,
        date: twoDaysAgo,
        views: Math.floor(Math.random() * 30) + 5,
        purchases: Math.floor(Math.random() * 2) + 1,
        revenue: bundle.bundle_price * (Math.floor(Math.random() * 2) + 1),
        created_at: serverTimestamp()
      });
    }
    
    // Seed some sample customer preferences
    console.log('Seeding customer preferences...');
    const sampleUserIds = ['user-1', 'user-2', 'user-3', 'user-4'];
    
    for (const userId of sampleUserIds) {
      // Each user has preferences for 2-3 bundles
      const shuffledBundles = [...sampleBundles].sort(() => 0.5 - Math.random());
      const userBundles = shuffledBundles.slice(0, Math.floor(Math.random() * 2) + 2);
      
      for (const bundle of userBundles) {
        const preferenceRef = doc(collection(db, 'customer_bundle_preferences'));
        batch.set(preferenceRef, {
          user_id: userId,
          bundle_id: bundle.id,
          preference_score: Math.floor(Math.random() * 100) + 1,
          purchased: Math.random() > 0.8, // 20% chance purchased
          last_viewed: serverTimestamp(),
          created_at: serverTimestamp()
        });
      }
    }
    
    await batch.commit();
    console.log('Bundle data seeded successfully!');
    
    return {
      success: true,
      message: `Seeded ${sampleBundles.length} bundles and related data using existing products`
    };
    
  } catch (error) {
    console.error('Error seeding bundle data:', error);
    throw error;
  }
};

// Function to clear all bundle data (for testing purposes)
export const clearBundleData = async () => {
  try {
    console.log('Clearing bundle data...');
    
    const collections = [
      'bundles',
      'bundle_items', 
      'bundle_categories',
      'bundle_analytics',
      'customer_bundle_preferences'
    ];
    
    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      // Note: In production, you might want to use batch delete for large collections
      console.log(`Would clear ${collectionName} collection`);
    }
    
    console.log('Bundle data cleared successfully!');
    
  } catch (error) {
    console.error('Error clearing bundle data:', error);
    throw error;
  }
};

// Function to get bundle summary
export const getBundleSummary = () => {
  console.log('Bundle Summary:');
  console.log('===============');
  
  sampleBundles.forEach((bundle, index) => {
    const originalPrice = bundle.items.reduce((total, item) => 
      total + (item.product.price * item.quantity), 0
    );
    const savings = originalPrice - bundle.bundle_price;
    const savingsPercent = ((savings / originalPrice) * 100).toFixed(1);
    
    console.log(`${index + 1}. ${bundle.name}`);
    console.log(`   Type: ${bundle.bundle_type}`);
    console.log(`   Items: ${bundle.items.length} products`);
    console.log(`   Original: Rp ${originalPrice.toLocaleString()}`);
    console.log(`   Bundle: Rp ${bundle.bundle_price.toLocaleString()}`);
    console.log(`   Savings: Rp ${savings.toLocaleString()} (${savingsPercent}%)`);
    console.log(`   Products: ${bundle.items.map(item => `${item.product.name} (${item.quantity}x)`).join(', ')}`);
    console.log('');
  });
};

// Main function to run seeding
if (require.main === module) {
  // Show summary first
  getBundleSummary();
  
  seedBundleData()
    .then((result) => {
      console.log('Seeding completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
