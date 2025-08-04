import React, { useState } from 'react';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const DataPopulator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

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
      bundle_price: 4500,
      original_price: 6000,
      savings: 1500,
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
          price: 2500,
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
          price: 2000,
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
          price: 1500,
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
      bundle_price: 8500,
      original_price: 11000,
      savings: 2500,
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
        }
      ]
    },
    {
      id: '3',
      name: 'Paket Bento Lengkap',
      description: 'Bento box dengan lauk lengkap dan nasi hangat',
      bundle_type: 'fixed',
      bundle_price: 5500,
      original_price: 7500,
      savings: 2000,
      status: 'active',
      priority: 3,
      min_items: 4,
      max_items: 4,
      total_items: 4,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      created_at: new Date(),
      updated_at: new Date(),
      image_url: '/images/bundles/bento-bundle.jpg',
      items: [
        {
          id: '3-1',
          bundle_id: '3',
          product_id: 'bento-1',
          quantity: 1,
          is_required: true,
          product: {
            id: 'teriyaki-chicken',
            name: 'Teriyaki Chicken Bento',
            price: 35000,
            category: 'Bento',
            image_url: '/images/products/teriyaki-chicken-bento.jpg',
            description: 'Bento dengan ayam teriyaki, nasi, dan sayuran'
          }
        },
        {
          id: '3-2',
          bundle_id: '3',
          product_id: 'miso-soup',
          quantity: 1,
          is_required: true,
          product: {
            id: 'miso-soup',
            name: 'Miso Soup',
            price: 15000,
            category: 'Soup',
            image_url: '/images/products/miso-soup.jpg',
            description: 'Sup miso hangat dengan tahu dan rumput laut'
          }
        }
      ]
    }
  ];

  const clearOldData = async () => {
    setLoading(true);
    setResult('');
    
    try {
      let messages: string[] = [];
      let deleteCount = 0;

      // Clear old categories
      messages.push('Clearing old categories...');
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      for (const categoryDoc of categoriesSnapshot.docs) {
        try {
          await deleteDoc(doc(db, 'categories', categoryDoc.id));
          messages.push(`✓ Deleted category: ${categoryDoc.id}`);
          deleteCount++;
        } catch (error) {
          messages.push(`✗ Failed to delete category ${categoryDoc.id}: ${error}`);
        }
      }

      // Clear old bundles
      messages.push('\nClearing old bundles...');
      const bundlesSnapshot = await getDocs(collection(db, 'bundles'));
      for (const bundleDoc of bundlesSnapshot.docs) {
        try {
          await deleteDoc(doc(db, 'bundles', bundleDoc.id));
          messages.push(`✓ Deleted bundle: ${bundleDoc.id}`);
          deleteCount++;
        } catch (error) {
          messages.push(`✗ Failed to delete bundle ${bundleDoc.id}: ${error}`);
        }
      }

      messages.push(`\n🗑️ Data clearing completed! Deleted ${deleteCount} items.`);
      setResult(messages.join('\n'));
    } catch (error) {
      setResult(`❌ Error during data clearing: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const populateData = async () => {
    setLoading(true);
    setResult('');
    
    try {
      let successCount = 0;
      let messages: string[] = [];

      // Add categories
      messages.push('Adding categories...');
      for (const category of sampleCategories) {
        try {
          const categoryRef = doc(db, 'categories', category.id);
          await setDoc(categoryRef, category);
          messages.push(`✓ Added category: ${category.name}`);
          successCount++;
        } catch (error) {
          messages.push(`✗ Failed to add category ${category.name}: ${error}`);
        }
      }

      // Add bundles
      messages.push('\nAdding bundles...');
      for (const bundle of sampleBundles) {
        try {
          const bundleRef = doc(db, 'bundles', bundle.id);
          await setDoc(bundleRef, bundle);
          messages.push(`✓ Added bundle: ${bundle.name}`);
          successCount++;
        } catch (error) {
          messages.push(`✗ Failed to add bundle ${bundle.name}: ${error}`);
        }
      }

      messages.push(`\n🎉 Data population completed! Added ${successCount} items successfully.`);
      setResult(messages.join('\n'));
    } catch (error) {
      setResult(`❌ Error during data population: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAndPopulateData = async () => {
    setLoading(true);
    setResult('');
    
    try {
      let messages: string[] = [];
      let totalCount = 0;

      // First clear old data
      messages.push('🗑️ Step 1: Clearing old data...');
      
      // Clear old categories
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      for (const categoryDoc of categoriesSnapshot.docs) {
        try {
          await deleteDoc(doc(db, 'categories', categoryDoc.id));
          messages.push(`✓ Deleted old category: ${categoryDoc.id}`);
        } catch (error) {
          messages.push(`✗ Failed to delete category ${categoryDoc.id}: ${error}`);
        }
      }

      // Clear old bundles
      const bundlesSnapshot = await getDocs(collection(db, 'bundles'));
      for (const bundleDoc of bundlesSnapshot.docs) {
        try {
          await deleteDoc(doc(db, 'bundles', bundleDoc.id));
          messages.push(`✓ Deleted old bundle: ${bundleDoc.id}`);
        } catch (error) {
          messages.push(`✗ Failed to delete bundle ${bundleDoc.id}: ${error}`);
        }
      }

      messages.push('\n🎯 Step 2: Adding new data...');
      
      // Add new categories
      messages.push('Adding new categories...');
      for (const category of sampleCategories) {
        try {
          const categoryRef = doc(db, 'categories', category.id);
          await setDoc(categoryRef, category);
          messages.push(`✓ Added category: ${category.name}`);
          totalCount++;
        } catch (error) {
          messages.push(`✗ Failed to add category ${category.name}: ${error}`);
        }
      }

      // Add new bundles
      messages.push('\nAdding new bundles...');
      for (const bundle of sampleBundles) {
        try {
          const bundleRef = doc(db, 'bundles', bundle.id);
          await setDoc(bundleRef, bundle);
          messages.push(`✓ Added bundle: ${bundle.name}`);
          totalCount++;
        } catch (error) {
          messages.push(`✗ Failed to add bundle ${bundle.name}: ${error}`);
        }
      }

      messages.push(`\n🎉 Complete! Successfully refreshed data with ${totalCount} new items.`);
      setResult(messages.join('\n'));
    } catch (error) {
      setResult(`❌ Error during data refresh: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Firebase Data Populator</h2>
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Kelola data kategori dan bundle produk di Firestore database Anda.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">Kategori yang akan ditambahkan (10 items):</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
              <div>• Bahan Masakan Beku</div>
              <div>• Bumbu Dapur</div>
              <div>• Elektronik</div>
              <div>• Kerupuk</div>
              <div>• Makanan Ringan</div>
              <div>• Makanan Siap Saji</div>
              <div>• Minuman</div>
              <div>• Obat-obatan</div>
              <div>• Rempah Instan</div>
              <div>• Sayur & Bumbu</div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Bundle yang akan ditambahkan (3 items):</h3>
            <div className="text-sm text-green-800">
              <div>• Paket Hemat Ramen - ¥ 4,500</div>
              <div>• Paket Sushi Deluxe - ¥ 8,500</div>
              <div>• Paket Bento Lengkap - ¥ 5,500</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={populateData}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {loading ? 'Processing...' : 'Add Sample Data'}
          </button>
          
          <button
            onClick={clearOldData}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            } text-white`}
          >
            {loading ? 'Processing...' : 'Clear Old Data'}
          </button>
          
          <button
            onClick={clearAndPopulateData}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {loading ? 'Processing...' : 'Refresh All Data'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-2">Results:</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPopulator;
