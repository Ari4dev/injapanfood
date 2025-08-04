import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight, Package, TrendingUp, Star, ShoppingCart } from 'lucide-react';
import { BundleCard } from './BundleCard';
import { FirestoreBundleService } from '@/services/firestore/bundleService';
import { BundleWithItems } from '@/types/bundle';

interface BundleRecommendationsProps {
  userId?: string;
  title?: string;
  subtitle?: string;
  maxItems?: number;
  showViewAll?: boolean;
  className?: string;
}

export const BundleRecommendations: React.FC<BundleRecommendationsProps> = ({
  userId,
  title = 'Bundle Rekomendasi',
  subtitle = 'Paket bundling pilihan terbaik untuk Anda',
  maxItems = 6,
  showViewAll = true,
  className = ''
}) => {
  const router = useRouter();
  const [bundles, setBundles] = useState<BundleWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load bundle recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get bundle recommendations
        const recommendations = await FirestoreBundleService.getBundleRecommendations(userId, maxItems);
        
        // Get full bundle details for each recommendation
        const bundleDetails: BundleWithItems[] = [];
        for (const rec of recommendations) {
          const bundle = await FirestoreBundleService.getBundleById(rec.bundle_id);
          if (bundle) {
            bundleDetails.push(bundle);
          }
        }
        
        setBundles(bundleDetails);
      } catch (err) {
        console.error('Error loading bundle recommendations:', err);
        setError('Gagal memuat rekomendasi bundle');
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [userId, maxItems]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Handle carousel navigation
  const itemsToShow = 3; // Number of items to show at once
  const maxIndex = Math.max(0, bundles.length - itemsToShow);

  const goToPrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex(Math.min(maxIndex, currentIndex + 1));
  };

  const handleAddToCart = (bundleId: string, items: any[]) => {
    console.log('Add bundle to cart:', bundleId, items);
    // Implement cart logic here
    alert('Bundle ditambahkan ke keranjang!');
  };

  const handleViewDetails = (bundleId: string) => {
    router.push(`/bundles/${bundleId}`);
  };

  const handleViewAll = () => {
    router.push('/bundles');
  };

  if (loading) {
    return (
      <div className={`py-8 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-8 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Gagal Memuat Bundle</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (bundles.length === 0) {
    return (
      <div className={`py-8 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Bundle</h3>
            <p className="text-gray-500 mb-4">Saat ini belum ada bundle yang tersedia</p>
            <button
              onClick={handleViewAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Lihat Produk Lainnya
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-8 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          
          {showViewAll && (
            <button
              onClick={handleViewAll}
              className="hidden md:flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bundle Cards */}
        {bundles.length <= itemsToShow ? (
          // Show all items if less than or equal to itemsToShow
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                onAddToCart={handleAddToCart}
                onViewDetails={handleViewDetails}
                showQuickActions={true}
              />
            ))}
          </div>
        ) : (
          // Show carousel if more than itemsToShow
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-colors ${
                currentIndex === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={goToNext}
              disabled={currentIndex >= maxIndex}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-colors ${
                currentIndex >= maxIndex
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Cards Container */}
            <div className="overflow-hidden px-12">
              <div
                className="flex transition-transform duration-300 ease-in-out gap-6"
                style={{
                  transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`
                }}
              >
                {bundles.map((bundle) => (
                  <div key={bundle.id} className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3">
                    <BundleCard
                      bundle={bundle}
                      onAddToCart={handleAddToCart}
                      onViewDetails={handleViewDetails}
                      showQuickActions={true}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{bundles.length}+</h3>
            <p className="text-gray-600">Bundle Tersedia</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatPrice(
                bundles.reduce((total, bundle) => total + (bundle.savings || 0), 0) / bundles.length
              )}
            </h3>
            <p className="text-gray-600">Rata-rata Hemat</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">4.8</h3>
            <p className="text-gray-600">Rating Bundle</p>
          </div>
        </div>

        {/* View All Button (Mobile) */}
        {showViewAll && (
          <div className="md:hidden mt-8 text-center">
            <button
              onClick={handleViewAll}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Lihat Semua Bundle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleRecommendations;
