const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You need to download your service account key from Firebase Console
// and place it in the project root or set the GOOGLE_APPLICATION_CREDENTIALS environment variable

const serviceAccount = require('../serviceAccountKey.json'); // You'll need to add this file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://injapan-food-default-rtdb.firebaseio.com' // Replace with your Firebase project URL
});

const db = admin.firestore();

// Sample bundle data (converted from TypeScript mock data)
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

// Sample categories data
const sampleCategories = [
  {
    id: 'ramen',
    name: 'Ramen',
    slug: 'ramen',
    description: 'Authentic Japanese ramen noodles',
    is_active: true,
    sort_order: 1,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'sushi',
    name: 'Sushi',
    slug: 'sushi',
    description: 'Fresh sushi and sashimi',
    is_active: true,
    sort_order: 2,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'sushi-roll',
    name: 'Sushi Roll',
    slug: 'sushi-roll',
    description: 'Various types of sushi rolls',
    is_active: true,
    sort_order: 3,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'appetizer',
    name: 'Appetizer',
    slug: 'appetizer',
    description: 'Starter dishes and appetizers',
    is_active: true,
    sort_order: 4,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'bento',
    name: 'Bento',
    slug: 'bento',
    description: 'Complete bento box meals',
    is_active: true,
    sort_order: 5,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'dessert',
    name: 'Dessert',
    slug: 'dessert',
    description: 'Japanese desserts and sweets',
    is_active: true,
    sort_order: 6,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'drinks',
    name: 'Drinks',
    slug: 'drinks',
    description: 'Beverages and drinks',
    is_active: true,
    sort_order: 7,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'grilled',
    name: 'Grilled',
    slug: 'grilled',
    description: 'Grilled items like yakitori',
    is_active: true,
    sort_order: 8,
    created_at: new Date(),
    updated_at: new Date()
  }
];

async function populateFirestore() {
  try {
    console.log('Starting Firestore population...');

    // Add categories
    console.log('Adding categories...');
    for (const category of sampleCategories) {
      await db.collection('categories').doc(category.id).set(category);
      console.log(`Added category: ${category.name}`);
    }

    // Add bundles
    console.log('Adding bundles...');
    for (const bundle of sampleBundles) {
      await db.collection('bundles').doc(bundle.id).set(bundle);
      console.log(`Added bundle: ${bundle.name}`);
    }

    console.log('Firestore population completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error populating Firestore:', error);
    process.exit(1);
  }
}

populateFirestore();
