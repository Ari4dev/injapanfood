import { useState, useRef, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCartAnimation } from '@/hooks/useCartAnimation';
import { useLanguage } from '@/hooks/useLanguage';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FlyingProductAnimation from '@/components/FlyingProductAnimation';
import { Product } from '@/types';
import { getCategoryIcon, getCategoryTranslation } from '@/utils/categoryVariants';
import { getAllCategories } from '@/services/categoryService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton, ProductCardSkeleton, ErrorState } from '@/components/ui/loading';

const Products = () => {
  const { data: products = [], isLoading, isError, error } = useProducts();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const {
    animatingProduct,
    startPosition,
    targetPosition,
    isAnimating,
    shouldAnimateCart,
    triggerAnimation,
    resetAnimation
  } = useCartAnimation();

  // Fetch categories from database
  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories
  });

  // Combine database categories with hardcoded categories for backward compatibility
  const legacyCategories = ['Makanan Ringan', 'Bumbu Dapur', 'Makanan Siap Saji', 'Bahan Masak Beku', 'Sayur & Bumbu', 'Kerupuk'];
  const allCategoryNames = categoriesLoading 
    ? legacyCategories 
    : [...new Set([...categoriesData.map(c => c.name), ...legacyCategories])];

  // Enhanced scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product, position: { x: number; y: number }) => {
    // Get cart icon position (approximate)
    const cartPosition = {
      x: window.innerWidth - 100,
      y: 80
    };
    
    triggerAnimation(product, position, cartPosition);
  };

  // Show error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ErrorState 
          title={t('common.error')}
          message={error?.message || t('common.loadingError')}
          onRetry={() => window.location.reload()}
        />
        <Footer />
      </div>
    );
  }

  // Show loading state with skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>

          {/* Search and Filter Skeleton */}
          <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
            <div className="flex-1">
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <div className="md:w-48">
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Category Pills Skeleton */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Array(6).fill(0).map((_, index) => (
              <div key={index} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            ))}
          </div>

          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6 px-4">
            {Array(12).fill(0).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header shouldAnimateCart={shouldAnimateCart} />
      
      {/* Flying Product Animation */}
      <FlyingProductAnimation
        product={animatingProduct}
        startPosition={startPosition}
        targetPosition={targetPosition}
        isAnimating={isAnimating}
        onComplete={resetAnimation}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('products.catalog')}</h1>
          <p className="text-xl text-gray-600">{t('products.description')}</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('products.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="md:w-48">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('categories.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center space-x-2">
                    <span>🔍</span>
                    <span>{t('categories.all')}</span>
                  </div>
                </SelectItem>
                {categoriesLoading ? (
                  <div className="p-2 text-center">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full inline-block mr-2"></div>
                    <span>{t('common.loading')}</span>
                  </div>
                ) : (
                  allCategoryNames.map(category => {
                    // Find category object if it exists in categoriesData
                    const categoryObj = categoriesData.find(c => c.name === category);
                    const icon = categoryObj?.icon || getCategoryIcon(category);
                    
                    return (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center space-x-2">
                          <span>{icon}</span>
                          <span>{getCategoryTranslation(category, language)}</span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')} 
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center space-x-1">
              <span>🔍</span>
              <span>{t('categories.all')}</span>
            </span>
          </button>
          {!categoriesLoading && allCategoryNames.map(category => {
            // Find category object if it exists in categoriesData
            const categoryObj = categoriesData.find(c => c.name === category);
            const icon = categoryObj?.icon || getCategoryIcon(category);
            
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                  selectedCategory === category 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{icon}</span>
                <span>{getCategoryTranslation(category, language)}</span>
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6 px-4">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            {products.length === 0 ? (
              <>
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('products.noProducts')}</h2>
                <p className="text-gray-600">{t('products.comingSoon')}</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('products.notFound')}</h2>
                <p className="text-gray-600">{t('products.tryDifferent')}</p>
              </>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Products;