import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerCarousel from '@/components/BannerCarousel';
import { useProducts } from '@/hooks/useProducts';
import { useLanguage } from '@/hooks/useLanguage';
import { useQuery } from '@tanstack/react-query';
import { getCategoryIcon, getCategoryUrlPath, getCategoryTranslation } from '@/utils/categoryVariants';
import { getAllCategories } from '@/services/categoryService';
import { Skeleton, ProductCardSkeleton, CategoryCardSkeleton, ErrorState } from '@/components/ui/loading';
const Index = () => {
  const { data: products = [], isLoading: productsLoading, isError: productsError } = useProducts();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch categories from database
  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories
  });

  // Combine database categories with hardcoded categories for backward compatibility
  const legacyCategories = ['Makanan Ringan', 'Bumbu Dapur', 'Makanan Siap Saji', 'Bahan Masak Beku', 'Sayur & Bumbu', 'Kerupuk'];
  const categories = categoriesLoading 
    ? legacyCategories 
    : [...new Set([...categoriesData.map(c => c.name), ...legacyCategories])];

  // Check for referral code in URL and redirect to registration
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      console.log('Referral code detected in URL:', refCode);
      
      // Always process new referral code from URL (overrides any existing session)
      import('@/utils/referralUtils').then(({ clearReferralCode }) => {
        // Clear any existing referral data first
        clearReferralCode();
        console.log('Cleared existing referral data for new referral code');

        navigate(`/auth?tab=signup&ref=${refCode}`);
      });
    }
  }, [location.search, navigate]);

  // Enhanced scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const featuredProducts = products.slice(0, 8);

  // Show error state if there's an error
  if (productsError) {
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

  // Show loading with modern loader
  if (productsLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50">
          {/* Hero Section Skeleton */}
          <section className="bg-gradient-to-br from-red-600 via-red-700 to-orange-600 text-white w-full">
            <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20 lg:py-24">
              <div className="max-w-4xl mx-auto text-center">
                <Skeleton className="h-12 sm:h-16 md:h-20 w-3/4 mx-auto mb-6 bg-white/20" />
                <Skeleton className="h-6 sm:h-8 w-2/3 mx-auto mb-8 bg-white/20" />
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Skeleton className="h-12 w-48 bg-white/20" />
                  <Skeleton className="h-12 w-48 bg-white/20" />
                </div>
              </div>
            </div>
          </section>
          
          {/* Categories Section Skeleton */}
          <section className="py-12 sm:py-16 bg-gray-50 w-full">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8 sm:mb-12">
                <Skeleton className="h-8 w-64 mx-auto mb-4" />
                <Skeleton className="h-6 w-96 mx-auto" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 max-w-6xl mx-auto">
                {Array(6).fill(0).map((_, index) => (
                  <CategoryCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </section>
          
          {/* Featured Products Section Skeleton */}
          <section className="py-12 sm:py-16 bg-white w-full">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8 sm:mb-12">
                <Skeleton className="h-8 w-64 mx-auto mb-4" />
                <Skeleton className="h-6 w-96 mx-auto" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto mb-8 sm:mb-12">
                {Array(8).fill(0).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </section>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 via-red-700 to-orange-600 text-white w-full">
        <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              {t('homepage.mainTitle')}<br />
              <span className="text-yellow-300">{t('homepage.subTitle')}</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed px-4">
              {t('homepage.mainDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Link
                to="/products"
                className="w-full sm:w-auto bg-white text-red-600 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg text-center"
              >
                {t('homepage.shopNow')}
              </Link>
              <Link
                to="/how-to-buy"
                className="w-full sm:w-auto border-2 border-white text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-white hover:text-red-600 transition-all duration-200 text-center"
              >
                {t('homepage.howToBuy')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Carousel Section */}
      <BannerCarousel />

      {/* Categories Section */}
      <section className="py-12 sm:py-16 bg-gray-50 w-full">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{t('homepage.categoriesTitle')}</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              {t('homepage.categoriesDescription')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 max-w-6xl mx-auto">
            {categoriesLoading ? (
              // Show loading skeletons for categories
              Array(6).fill(0).map((_, index) => (
                <div key={index} className="bg-white p-4 sm:p-6 rounded-xl text-center border border-gray-100 shadow-sm animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 sm:mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              ))
            ) : (
              categories.map((category) => {
                // Find category object if it exists in categoriesData
                const categoryObj = categoriesData.find(c => c.name === category);
                const icon = categoryObj?.icon || getCategoryIcon(category);
                const slug = categoryObj?.slug || getCategoryUrlPath(category);
                
                return (
                  <Link
                    key={category}
                    to={`/kategori/${slug}`}
                    className="bg-white hover:bg-red-50 hover:border-red-200 p-4 sm:p-6 rounded-xl text-center transition-all duration-200 transform hover:scale-105 border border-gray-100 shadow-sm group"
                  >
                    <div className="text-2xl sm:text-3xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200">
                      {icon}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-xs sm:text-sm leading-tight group-hover:text-red-600 transition-colors">
                      {getCategoryTranslation(category, language)}
                    </h3>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 sm:py-16 bg-white w-full">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{t('homepage.featuredTitle')}</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              {t('homepage.featuredDescription')}
            </p>
          </div>
          
          {featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto mb-8 sm:mb-12">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="text-center px-4">
                <Link
                  to="/products"
                  className="inline-flex items-center bg-red-600 text-white font-semibold py-3 px-6 sm:px-8 rounded-full hover:bg-red-700 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                >
                  {t('products.viewAllProducts')}
                  <svg className="ml-2 w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('products.noProducts')}</h3>
              <p className="text-gray-600">{t('products.comingSoon')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 sm:py-16 bg-gray-50 w-full">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{t('homepage.whyChooseTitle')}</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              {t('homepage.whyChooseDescription')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-xl text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">🚚</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{t('whyChoose.fastDelivery')}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {t('whyChoose.fastDeliveryDesc')}
              </p>
            </div>
            
            <div className="bg-white p-6 sm:p-8 rounded-xl text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">✅</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{t('whyChoose.qualityGuaranteed')}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {t('whyChoose.qualityGuaranteedDesc')}
              </p>
            </div>
            
            <div className="bg-white p-6 sm:p-8 rounded-xl text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">💬</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{t('whyChoose.support247')}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {t('whyChoose.support247Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-red-600 text-white w-full">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">{t('homepage.readyTitle')}</h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90 leading-relaxed px-4">{t('homepage.readyDescription')}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Link
                to="/products"
                className="w-full sm:w-auto bg-white text-red-600 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 text-center"
              >
                {t('cta.startShopping')}
              </Link>
              <Link
                to="/how-to-buy"
                className="w-full sm:w-auto border-2 border-white text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-white hover:text-red-600 transition-all duration-200 text-center"
              >
                {t('cta.howToBuy')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;