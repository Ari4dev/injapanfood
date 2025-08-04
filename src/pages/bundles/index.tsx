import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, SlidersHorizontal, ShoppingCart, Package } from 'lucide-react';
import BundleCard from '@/components/BundleCard';
import { FirestoreBundleService } from '@/services/firestore/bundleService';
import { FirestoreCategoryService, Category } from '@/services/firestore/categoryService';
import { BundleWithItems } from '@/types/bundle';
import { mockBundles } from '@/data/mockBundles';
import { useLanguage } from '@/hooks/useLanguage';

const BundlesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  // Debug logging
  console.log('Current language:', language);
  console.log('Bundle title translation:', t('bundles.title'));
  console.log('Bundle description translation:', t('bundles.description'));
  
  const [bundles, setBundles] = useState<BundleWithItems[]>([]);
  const [filteredBundles, setFilteredBundles] = useState<BundleWithItems[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'under-5000' | '5000-10000' | 'over-10000'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'savings' | 'priority'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);


  // Load bundles and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load bundles and categories in parallel
        const [bundleResult, categoryResult] = await Promise.allSettled([
          FirestoreBundleService.getActiveBundles(),
          FirestoreCategoryService.getActiveCategories()
        ]);
        
        // Handle bundles
        if (bundleResult.status === 'fulfilled') {
          setBundles(bundleResult.value);
          setFilteredBundles(bundleResult.value);
        } else {
          console.warn('Firebase bundles not available, using mock data:', bundleResult.reason);
          setBundles(mockBundles);
          setFilteredBundles(mockBundles);
        }
        
        // Handle categories
        if (categoryResult.status === 'fulfilled') {
          setCategories(categoryResult.value);
        } else {
          console.warn('Firebase categories not available:', categoryResult.reason);
          // Fallback: extract categories from bundles as before
          const categorySet = new Set<string>();
          const bundlesToUse = bundleResult.status === 'fulfilled' ? bundleResult.value : mockBundles;
          bundlesToUse.forEach(bundle => {
            bundle.items?.forEach(item => {
              if (item.product?.category) {
                categorySet.add(item.product.category);
              }
            });
          });
          const fallbackCategories = Array.from(categorySet).map(name => ({ id: name, name } as Category));
          setCategories(fallbackCategories);
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
        // Use mock data as final fallback
        setBundles(mockBundles);
        setFilteredBundles(mockBundles);
        
        // Extract categories from mock bundles
        const categorySet = new Set<string>();
        mockBundles.forEach(bundle => {
          bundle.items?.forEach(item => {
            if (item.product?.category) {
              categorySet.add(item.product.category);
            }
          });
        });
        const fallbackCategories = Array.from(categorySet).map(name => ({ id: name, name } as Category));
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...bundles];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(bundle =>
        bundle.name.toLowerCase().includes(searchLower) ||
        bundle.description?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(bundle =>
        bundle.items?.some(item => item.product?.category === selectedCategory)
      );
    }

    // Price range filter
    if (priceRange !== 'all') {
      filtered = filtered.filter(bundle => {
        const price = bundle.bundle_price;
        switch (priceRange) {
          case 'under-5000':
            return price < 5000;
          case '5000-10000':
            return price >= 5000 && price <= 10000;
          case 'over-10000':
            return price > 10000;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'price':
          aValue = a.bundle_price;
          bValue = b.bundle_price;
          break;
        case 'savings':
          aValue = a.savings || 0;
          bValue = b.savings || 0;
          break;
        case 'priority':
        default:
          aValue = a.priority || 0;
          bValue = b.priority || 0;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    setFilteredBundles(filtered);
  }, [bundles, searchTerm, selectedCategory, priceRange, sortBy, sortOrder]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <Helmet>
        <title>{t('bundles.title')} - InJapanFood</title>
        <meta name="description" content={t('bundles.description')} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('bundles.title')}</h1>
              <p className="text-gray-600">{t('bundles.description')}</p>
            </div>

            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('bundles.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                {/* Mobile Filter Toggle */}
                <div className="lg:hidden mb-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>{t('bundles.filterAndSort')}</span>
                  </button>
                </div>

                <div className={`bg-white p-6 rounded-lg shadow-sm ${showFilters ? 'block' : 'hidden lg:block'}`}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('bundles.categories')}</h3>
                  
                  {/* Category Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('bundles.categories')}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="all">{t('bundles.allCategories')}</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('bundles.priceRange')}
                    </label>
                    <select
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value as any)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="all">{t('bundles.allPrices')}</option>
                      <option value="under-5000">{t('bundles.under5000')}</option>
                      <option value="5000-10000">{t('bundles.5000to10000')}</option>
                      <option value="over-10000">{t('bundles.over10000')}</option>
                    </select>
                  </div>

                  {/* Sort Options */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('bundles.sortBy')}
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="priority">{t('bundles.priority')}</option>
                      <option value="name">{t('bundles.name')}</option>
                      <option value="price">{t('bundles.price')}</option>
                      <option value="savings">{t('bundles.savings')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('bundles.sortOrder')}
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="desc">{t('bundles.highestToLowest')}</option>
                      <option value="asc">{t('bundles.lowestToHighest')}</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                        setPriceRange('all');
                        setSortBy('priority');
                        setSortOrder('desc');
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {t('bundles.resetAllFilters')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bundle Grid */}
            <div className="lg:col-span-3">
              {/* Results Info */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-gray-600">
                  {loading ? t('bundles.loading') : `${t('bundles.showing')} ${filteredBundles.length} ${t('bundles.of')} ${bundles.length} ${t('bundles.bundles')}`}
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
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
              ) : filteredBundles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <Filter className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {t('bundles.noBundlesFound')}
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    {t('bundles.tryDifferentFilter')}
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setPriceRange('all');
                      setSortBy('priority');
                      setSortOrder('desc');
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('bundles.resetFilter')}
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {filteredBundles.map((bundle, index) => (
                      <div key={bundle.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-4">
                          {/* Bundle Image */}
                          <div className="flex-shrink-0">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                              {bundle.image_url ? (
                                <img
                                  src={bundle.image_url}
                                  alt={bundle.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.style.display = 'none';
                                    const fallback = img.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.classList.remove('hidden');
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <Package className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 hidden">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Bundle Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{bundle.name}</h3>
                              
                              {/* Bundle Type Badge */}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                bundle.bundle_type === 'fixed' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : bundle.bundle_type === 'mix_and_match'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {bundle.bundle_type === 'fixed' 
                                  ? t('bundles.bundleTypes.fixed') 
                                  : bundle.bundle_type === 'mix_and_match' 
                                  ? t('bundles.bundleTypes.mixAndMatch') 
                                  : t('bundles.bundleTypes.tiered')
                                }
                              </span>
                              
                              {/* Discount Badge */}
                              {bundle.savings > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {t('bundles.savePercent', { percent: Math.round((bundle.savings / (bundle.original_price || bundle.bundle_price)) * 100) })}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{bundle.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                              <span>{bundle.items?.length || 0} {t('bundles.products')}</span>
                              {bundle.end_date && (
                                <span>{t('bundles.until')} {new Date(bundle.end_date).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'id-ID')}</span>
                              )}
                            </div>
                            
                            {/* Bundle Items Preview */}
                            {bundle.items && bundle.items.length > 0 && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">{t('bundles.contains')}: </span>
                                <span>
                                  {bundle.items.slice(0, 3).map((item, idx) => (
                                    <span key={item.id}>
                                      {item.product?.name || 'Product'}
                                      {item.quantity > 1 && ` (${item.quantity}x)`}
                                      {idx < Math.min(bundle.items.length, 3) - 1 && ', '}
                                    </span>
                                  ))}
                                  {bundle.items.length > 3 && (
                                    <span>, {t('bundles.andMore', { count: bundle.items.length - 3 })}</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Price and Actions */}
                          <div className="flex flex-col items-end space-y-3 ml-6">
                            {/* Price Section */}
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {formatPrice(bundle.bundle_price)}
                              </div>
                              {bundle.savings > 0 && (
                                <div className="flex flex-col items-end">
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatPrice(bundle.original_price)}
                                  </span>
                                  <span className="text-sm text-green-600 font-medium">
                                    {t('bundles.youSave')} {formatPrice(bundle.savings)}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button 
                                onClick={() => navigate(`/bundles/${bundle.id}`)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                {t('bundles.detail')}
                              </button>
                              <button 
                                onClick={() => {
                                  console.log('Add to cart:', bundle);
                                  // Implement add to cart logic
                                }}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                              >
                                <ShoppingCart className="h-3 w-3" />
                                <span>{t('bundles.addToCart')}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BundlesPage;
