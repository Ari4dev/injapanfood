import React, { useState, useEffect } from 'react';
import { useBundle, useBundleCart } from '@/hooks/useBundle';
import { BundleWithItems, BundleRecommendation } from '@/types/bundle';
import BundleCard from '@/components/BundleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  Search, 
  Filter, 
  SortAsc, 
  Package, 
  Star, 
  TrendingUp,
  ShoppingCart,
  Sparkles
} from 'lucide-react';

const Bundles: React.FC = () => {
  const { 
    bundles, 
    loading, 
    error, 
    fetchActiveBundles,
    getBundleRecommendations,
    saveBundlePreference,
    trackBundleView,
    getBundlesByCategory 
  } = useBundle();
  
  const { addBundleToCart, getBundleCartTotal, selectedBundles } = useBundleCart();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  
  // Debug logging
  console.log('Current language:', language);
  console.log('Bundle title translation:', t('bundles.title'));
  console.log('Bundle description translation:', t('bundles.description'));

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBundleType, setSelectedBundleType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [filteredBundles, setFilteredBundles] = useState<BundleWithItems[]>([]);
  const [recommendations, setRecommendations] = useState<BundleRecommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Filter and sort bundles
  useEffect(() => {
    let filtered = [...bundles];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(bundle =>
        bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bundle.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(bundle =>
        bundle.items?.some(item => item.product?.category === selectedCategory)
      );
    }

    // Bundle type filter
    if (selectedBundleType !== 'all') {
      filtered = filtered.filter(bundle => bundle.bundle_type === selectedBundleType);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.bundle_price - b.bundle_price;
        case 'price_high':
          return b.bundle_price - a.bundle_price;
        case 'savings':
          return b.savings - a.savings;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'priority':
        default:
          return b.priority - a.priority;
      }
    });

    setFilteredBundles(filtered);
  }, [bundles, searchTerm, selectedCategory, selectedBundleType, sortBy]);

  // Load recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const recs = await getBundleRecommendations(3);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      }
    };

    loadRecommendations();
  }, [getBundleRecommendations]);

  const handleViewDetails = (bundle: BundleWithItems) => {
    trackBundleView(bundle.id);
    // Navigate to bundle detail page (implement routing)
    console.log('View bundle details:', bundle.id);
  };

  const handleAddToCart = (bundle: BundleWithItems) => {
    // For fixed bundles, add all required items
    const selectedItems = bundle.items?.filter(item => item.is_required).map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      product: item.product
    })) || [];

    addBundleToCart(bundle, selectedItems);
    
    toast({
      title: t('bundles.bundleAddedSuccess'),
      description: `${bundle.name} ${t('bundles.addedToCart')}`,
    });
  };

  const handleSavePreference = (bundleId: string, score: number) => {
    saveBundlePreference(bundleId, score);
    toast({
      title: t('bundles.preferenceSaved'),
      description: t('bundles.feedbackThanks'),
    });
  };

  const categories = [
    'Makanan Ringan',
    'Bumbu Dapur',
    'Makanan Siap Saji',
    'Bahan Masak Beku',
    'Sayur Segar/Beku',
    'Sayur Beku'
  ];

  const bundleTypes = [
    { value: 'fixed', label: t('bundles.bundleTypes.fixed') },
    { value: 'mix_and_match', label: t('bundles.bundleTypes.mixAndMatch') },
    { value: 'tiered', label: t('bundles.bundleTypes.tiered') }
  ];

  const sortOptions = [
    { value: 'priority', label: t('bundles.priority') },
    { value: 'newest', label: t('misc.new') },
    { value: 'price_low', label: t('bundles.lowestToHighest') },
    { value: 'price_high', label: t('bundles.highestToLowest') },
    { value: 'savings', label: t('bundles.savings') },
    { value: 'name', label: t('bundles.name') }
  ];

  if (loading && bundles.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex space-x-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          <Package className="inline-block mr-3 h-10 w-10 text-primary" />
          {t('bundles.title')}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('bundles.description')}
        </p>
      </div>

      {/* Cart Summary */}
      {selectedBundles.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {selectedBundles.length} {t('bundles.bundlesInCart')}
              </span>
            </div>
            <div className="text-lg font-bold text-primary">
              Total: ¥{getBundleCartTotal().toLocaleString('ja-JP')}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Sparkles className="mr-2 h-6 w-6 text-yellow-500" />
              {t('bundles.recommendationsForYou')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRecommendations(false)}
            >
              {t('misc.hide')}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec) => {
              const bundle = bundles.find(b => b.id === rec.bundle_id);
              if (!bundle) return null;
              
              return (
                <BundleCard
                  key={rec.bundle_id}
                  bundle={bundle}
                  onViewDetails={handleViewDetails}
                  onAddToCart={handleAddToCart}
                  onSavePreference={handleSavePreference}
                  compact
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('bundles.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder={t('bundles.allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('bundles.allCategories')}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bundle Type Filter */}
          <Select value={selectedBundleType} onValueChange={setSelectedBundleType}>
            <SelectTrigger>
              <SelectValue placeholder={t('bundles.allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('bundles.allCategories')}</SelectItem>
              {bundleTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {searchTerm && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm('')}>
              {t('misc.search')}: "{searchTerm}" ×
            </Badge>
          )}
          {selectedCategory !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedCategory('all')}>
              {t('categories.title')}: {selectedCategory} ×
            </Badge>
          )}
          {selectedBundleType !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedBundleType('all')}>
              {t('bundles.type')}: {bundleTypes.find(type => type.value === selectedBundleType)?.label} ×
            </Badge>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('bundles.showing')} {filteredBundles.length} {t('bundles.bundles')}
          </h2>
          
          {filteredBundles.length > 0 && (
            <div className="text-sm text-gray-600">
              {t('bundles.savings')}: ¥{filteredBundles.reduce((total, bundle) => total + bundle.savings, 0).toLocaleString('ja-JP')}
            </div>
          )}
        </div>
      </div>

      {/* Bundle Grid */}
      {filteredBundles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              onViewDetails={handleViewDetails}
              onAddToCart={handleAddToCart}
              onSavePreference={handleSavePreference}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('bundles.noBundlesFound')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('bundles.tryDifferentFilter')}
          </p>
          <Button onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
            setSelectedBundleType('all');
          }}>
            {t('bundles.resetAllFilters')}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={fetchActiveBundles}>
            {t('errors.tryAgain')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Bundles;
