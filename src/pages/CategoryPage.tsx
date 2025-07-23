import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useLanguage } from '@/hooks/useLanguage';
import { useQuery } from '@tanstack/react-query';
import { useCartAnimation } from '@/hooks/useCartAnimation';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FlyingProductAnimation from '@/components/FlyingProductAnimation';
import { Product } from '@/types';
import { getCategoryIcon, getCategoryTranslation, getCategoryUrlPath } from '@/utils/categoryVariants';
import { getAllCategories } from '@/services/categoryService';
import { ProductCardSkeleton, ErrorState } from '@/components/ui/loading';

const CategoryPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { data: products = [], isLoading, isError } = useProducts();
  const { t, language } = useLanguage();
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories
  });
  const navigate = useNavigate();
  
  const {
    animatingProduct,
    startPosition,
    targetPosition,
    isAnimating,
    shouldAnimateCart,
    triggerAnimation,
    resetAnimation
  } = useCartAnimation();

  // Enhanced scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [categorySlug]);

  // Find category object by slug or name
  const categoryObj = categoriesData.find(c => 
    c.slug === categorySlug || 
    getCategoryUrlPath(c.name) === categorySlug ||
    c.name.toLowerCase().replace(/\s+/g, '-') === categorySlug
  );
  
  // If not found in database, try to match with legacy categories
  const legacyCategories = ['Makanan Ringan', 'Bumbu Dapur', 'Makanan Siap Saji', 'Sayur & Bahan Segar', 'Bahan Masak Beku', 'Sayur & Bumbu', 'Kerupuk'];
  const legacyCategory = legacyCategories.find(cat => getCategoryUrlPath(cat) === categorySlug);
  
  const categoryName = categoryObj?.name || legacyCategory || categorySlug?.replace(/-/g, ' ') || 'Unknown Category';
  const categoryIcon = categoryObj?.icon || getCategoryIcon(categoryName);
  const categoryDescription = categoryObj?.description || '';

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
          message={t('common.loadingError')}
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
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>

          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6 px-4">
            {Array(8).fill(0).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Filter products by the specified category - moved here after loading checks
  const categoryProducts = products.filter(product => product.category === categoryName);

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
          <div className="text-4xl mb-4">{categoryIcon}</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{getCategoryTranslation(categoryName, language)}</h1>
          {categoryDescription ? (
            <p className="text-xl text-gray-600">{categoryDescription}</p>
          ) : (
            <p className="text-xl text-gray-600">
              {language === 'en' 
                ? `Find your favorite ${getCategoryTranslation(categoryName, language).toLowerCase()} products`
                : `Temukan produk ${categoryName.toLowerCase()} favorit Anda`
              }
            </p>
          )}
        </div>

        {/* Products Grid */}
        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6 px-4">
            {categoryProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Produk Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">Belum ada produk dalam kategori ini. Silakan coba kategori lain.</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
            >
              Lihat Semua Produk
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CategoryPage;