import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../src/config/firebase';

// Sample categories data
const sampleCategories = [
  {
    id: 'bahan-masakan-beku',
    name: 'Bahan Masakan Beku',
    slug: 'bahan-masakan-beku',
    description: 'Bahan masakan beku dan frozen food',
    is_active: true,
    sort_order: 1,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'bumbu-dapur',
    name: 'Bumbu Dapur',
    slug: 'bumbu-dapur',
    description: 'Bumbu dan rempah untuk masakan',
    is_active: true,
    sort_order: 2,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'elektronik',
    name: 'Elektronik',
    slug: 'elektronik',
    description: 'Peralatan elektronik dan gadget',
    is_active: true,
    sort_order: 3,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'kerupuk',
    name: 'Kerupuk',
    slug: 'kerupuk',
    description: 'Berbagai jenis kerupuk dan camilan kering',
    is_active: true,
    sort_order: 4,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'makanan-ringan',
    name: 'Makanan Ringan',
    slug: 'makanan-ringan',
    description: 'Snack dan makanan ringan',
    is_active: true,
    sort_order: 5,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'makanan-siap-saji',
    name: 'Makanan Siap Saji',
    slug: 'makanan-siap-saji',
    description: 'Makanan siap saji dan instant food',
    is_active: true,
    sort_order: 6,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'minuman',
    name: 'Minuman',
    slug: 'minuman',
    description: 'Berbagai jenis minuman',
    is_active: true,
    sort_order: 7,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'obat-obatan',
    name: 'Obat-obatan',
    slug: 'obat-obatan',
    description: 'Obat-obatan dan suplemen kesehatan',
    is_active: true,
    sort_order: 8,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'rempah-instan',
    name: 'Rempah Instan',
    slug: 'rempah-instan',
    description: 'Rempah dan bumbu instan',
    is_active: true,
    sort_order: 9,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'sayur-dan-bumbu',
    name: 'Sayur & Bumbu',
    slug: 'sayur-dan-bumbu',
    description: 'Sayuran segar dan bumbu alami',
    is_active: true,
    sort_order: 10,
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Sample bundle data
const sampleBundles = [
  {
    id: '1',
    name: 'Paket Hemat Ramen',
    description: 'Nikmati berbagai varian ramen dengan harga hemat',
    bundle_type: 'fixed',
    bundle_price: 45000,
    original_price: 60000,
    savings: 15000,
    status: 'active',
    priority: 1,
    min_items: 3,
    max_items: 3,
    total_items: 3,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    created_at: new Date(),
    updated_at: new Date(),
    image_url: '/images/bundles/ramen-bundle.jpg',
    items: [
      {
        id: '1-1',
        bundle_id: '1',
        product_id: 'ramen-1',
        quantity: 1,
        is_required: true,
        product: {
          id: 'ramen-1',
          name: 'Ramen Shoyu',
          price: 25000,
          category: 'Ramen',
          image_url: '/images/products/ramen-shoyu.jpg',
          description: 'Ramen dengan kuah shoyu yang gurih'
        }
      },
      {
        id: '1-2',
        bundle_id: '1',
        product_id: 'ramen-2',
        quantity: 1,
        is_required: true,
        product: {
          id: 'ramen-2',
          name: 'Ramen Miso',
          price: 20000,
          category: 'Ramen',
          image_url: '/images/products/ramen-miso.jpg',
          description: 'Ramen dengan kuah miso yang kaya rasa'
        }
      },
      {
        id: '1-3',
        bundle_id: '1',
        product_id: 'gyoza-1',
        quantity: 1,
        is_required: true,
        product: {
          id: 'gyoza-1',
          name: 'Gyoza (5pcs)',
          price: 15000,
          category: 'Appetizer',
          image_url: '/images/products/gyoza.jpg',
          description: 'Gyoza isi daging dengan kulit yang crispy'
        }
      }
    ]
  },
  {
    id: '2',
    name: 'Paket Sushi Deluxe',
    description: 'Pilihan sushi terbaik dengan berbagai varian segar',
    bundle_type: 'mix_and_match',
    bundle_price: 85000,
    original_price: 110000,
    savings: 25000,
    status: 'active',
    priority: 2,
    min_items: 2,
    max_items: 4,
    total_items: 4,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    created_at: new Date(),
    updated_at: new Date(),
    image_url: '/images/bundles/sushi-bundle.jpg',
    items: [
      {
        id: '2-1',
        bundle_id: '2',
        product_id: 'sushi-1',
        quantity: 1,
        is_required: false,
        product: {
          id: 'sushi-1',
          name: 'Salmon Sushi (2pcs)',
          price: 30000,
          category: 'Sushi',
          image_url: '/images/products/salmon-sushi.jpg',
          description: 'Sushi salmon segar dengan nori premium'
        }
      },
      {
        id: '2-2',
        bundle_id: '2',
        product_id: 'sushi-2',
        quantity: 1,
        is_required: false,
        product: {
          id: 'sushi-2',
          name: 'Tuna Sushi (2pcs)',
          price: 35000,
          category: 'Sushi',
          image_url: '/images/products/tuna-sushi.jpg',
          description: 'Sushi tuna segar berkualitas tinggi'
        }
      },
      {
        id: '2-3',
        bundle_id: '2',
        product_id: 'roll-1',
        quantity: 1,
        is_required: false,
        product: {
          id: 'roll-1',
          name: 'California Roll (8pcs)',
          price: 25000,
          category: 'Sushi Roll',
          image_url: '/images/products/california-roll.jpg',
          description: 'California roll dengan alpukat dan kepiting'
        }
      },
      {
        id: '2-4',
        bundle_id: '2',
        product_id: 'roll-2',
        quantity: 1,
        is_required: false,
        product: {
          id: 'roll-2',
          name: 'Spicy Tuna Roll (8pcs)',
          price: 30000,
          category: 'Sushi Roll',
          image_url: '/images/products/spicy-tuna-roll.jpg',
          description: 'Roll tuna pedas dengan mayo spicy'
        }
      }
    ]
  }
];

export async function populateFirestoreData() {
  try {
    console.log('Starting Firestore data population...');

    // Add categories
    console.log('Adding categories...');
    for (const category of sampleCategories) {
      const categoryRef = doc(db, 'categories', category.id);
      await setDoc(categoryRef, category);
      console.log(`Added category: ${category.name}`);
    }

    // Add bundles
    console.log('Adding bundles...');
    for (const bundle of sampleBundles) {
      const bundleRef = doc(db, 'bundles', bundle.id);
      await setDoc(bundleRef, bundle);
      console.log(`Added bundle: ${bundle.name}`);
    }

    console.log('Firestore data population completed successfully!');
    return true;
  } catch (error) {
    console.error('Error populating Firestore:', error);
    throw error;
  }
}

// If running this script directly
if (typeof window === 'undefined') {
  populateFirestoreData()
    .then(() => {
      console.log('Data population completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Data population failed:', error);
      process.exit(1);
    });
}
