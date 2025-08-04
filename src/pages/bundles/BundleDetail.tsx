import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ShoppingCart, Heart, Share2, Check, Star, Package, TrendingUp, Users, Clock } from 'lucide-react';
import { FirestoreBundleService } from '@/services/firestore/bundleService';
import { BundleWithItems, BundleItem } from '@/types/bundle';
import { mockBundles } from '@/data/mockBundles';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/hooks/useLanguage';

const BundleDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { addBundleToCart } = useCart();
  const { t } = useLanguage();
  const { id: bundleId } = useParams<{ id: string }>();
  const [bundle, setBundle] = useState<BundleWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: number}>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllItems, setShowAllItems] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAddToCartAnimation, setShowAddToCartAnimation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  // Load bundle details
  useEffect(() => {
    const loadBundle = async () => {
      try {
        setLoading(true);
        let bundleData: BundleWithItems | null = null;
        
        // Try to load from Firebase first, fallback to mock data
        try {
          bundleData = await FirestoreBundleService.getBundleById(bundleId);
          
          // If Firebase returns bundle but no items, fallback to mock
          if (bundleData && (!bundleData.items || bundleData.items.length === 0)) {
            console.warn('Firebase bundle has no items, using mock data');
            bundleData = mockBundles.find(b => b.id === bundleId) || null;
          }
        } catch (firebaseError) {
          console.warn('Firebase data not available, using mock data:', firebaseError);
          // Use mock data as fallback
          bundleData = mockBundles.find(b => b.id === bundleId) || null;
        }
        
        // Final fallback: if no data found, try to use any mock bundle for testing
        if (!bundleData && mockBundles.length > 0) {
          console.warn('No bundle found for ID:', bundleId, 'using first mock bundle for testing');
          bundleData = mockBundles[0];
        }
        
        setBundle(bundleData);
        
        // Debug logging
        console.log('Bundle loaded:', bundleData);
        console.log('Bundle items:', bundleData?.items);
        console.log('Bundle items length:', bundleData?.items?.length);
        
        // Initialize selected items for fixed bundles
        if (bundleData && bundleData.bundle_type === 'fixed') {
          const initialSelection: {[key: string]: number} = {};
          bundleData.items?.forEach(item => {
            if (item.is_required) {
              initialSelection[item.id] = item.quantity;
            }
          });
          setSelectedItems(initialSelection);
        }
      } catch (error) {
        console.error('Error loading bundle:', error);
        // Use mock data as final fallback
        const bundleData = mockBundles.find(b => b.id === bundleId) || null;
        setBundle(bundleData);
      } finally {
        setLoading(false);
      }
    };

    if (bundleId) {
      loadBundle();
    }
  }, [bundleId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateTotalPrice = () => {
    if (!bundle) return 0;
    
    // For fixed bundles, use original_price if available
    if (bundle.bundle_type === 'fixed' && bundle.original_price) {
      return bundle.original_price;
    }
    
    // Calculate based on selected items
    let total = 0;
    Object.entries(selectedItems).forEach(([itemId, quantity]) => {
      const item = bundle.items?.find(i => i.id === itemId);
      if (item && item.product) {
        total += item.product.price * quantity;
      }
    });
    
    // If no selected items, calculate from all bundle items
    if (total === 0 && bundle.items) {
      total = bundle.items.reduce((sum, item) => {
        if (item.product && item.quantity) {
          return sum + (item.product.price * item.quantity);
        }
        return sum;
      }, 0);
    }
    
    return total;
  };

  const calculateSavings = () => {
    return calculateTotalPrice() - bundle?.bundle_price || 0;
  };

  const getTotalSelectedItems = () => {
    return Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);
  };

  const canAddToCart = () => {
    if (!bundle) return false;
    
    const totalItems = getTotalSelectedItems();
    
    if (bundle.min_items && totalItems < bundle.min_items) return false;
    if (bundle.max_items && totalItems > bundle.max_items) return false;
    
    return totalItems > 0;
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: Math.max(0, quantity)
    }));
  };

  const handleAddToCart = async () => {
    if (!bundle || !canAddToCart() || isAddingToCart) return;
    
    setIsAddingToCart(true);
    setShowAddToCartAnimation(true);
    
    // Prepare cart items data
    const cartItems = Object.entries(selectedItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => {
        const item = bundle.items?.find(i => i.id === itemId);
        return {
          itemId,
          quantity,
          product_id: item?.product_id || item?.product?.id,
          name: item?.product?.name,
          product: item?.product
        };
      });
    
    try {
      // Simulate API call delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Actually add bundle to cart using the real cart system
      addBundleToCart(bundle, cartItems);
      
      console.log('Bundle successfully added to cart:', {
        bundleId: bundle.id,
        bundleName: bundle.name,
        items: cartItems,
        totalPrice: bundle.bundle_price
      });
      
      // Show success modal after animation
      setShowAddToCartAnimation(false);
      setShowSuccessModal(true);
      
      // Auto close success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error adding bundle to cart:', error);
      // Hide loading animation and show error
      setShowAddToCartAnimation(false);
      alert('Terjadi kesalahan saat menambahkan bundle ke keranjang.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = bundle?.name || 'Bundle Produk';
    const shareText = `Lihat bundle ${bundle?.name} dengan hemat ${formatPrice(calculateSavings())} di InJapanFood`;

    // Try native share API first (mobile devices)
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        // If user cancels or error occurs, fall through to clipboard
        if (error.name !== 'AbortError') {
          console.log('Share failed:', error);
        }
      }
    }

    // Fallback: copy to clipboard with professional toast
    try {
      await navigator.clipboard.writeText(shareUrl);
      
      // Show success toast
      setShowShareToast(true);
      
      // Auto hide toast after 3 seconds
      setTimeout(() => {
        setShowShareToast(false);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Final fallback - show URL in alert
      alert(`Salin link ini untuk berbagi:\n\n${shareUrl}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="w-full h-96 bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Bundle tidak ditemukan</h1>
          <button
            onClick={() => navigate('/bundles')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Bundle
          </button>
        </div>
      </div>
    );
  }

  // Only use bundle's uploaded images, not product images from items
  const images = bundle.image_url ? [bundle.image_url] : [];
  const displayItems = bundle.items ? (showAllItems ? bundle.items : bundle.items.slice(0, 4)) : [];
  
  // Additional debug logging
  console.log('Bundle image_url:', bundle.image_url);
  console.log('Final images array:', images);
  console.log('Display items:', displayItems);
  console.log('Display items length:', displayItems?.length);

  return (
    <>
      <Helmet>
        <title>{bundle.name} - Bundle Produk InJapanFood</title>
        <meta name="description" content={bundle.description || `Bundle ${bundle.name} dengan harga hemat`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('bundles.back')}</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-white rounded-lg shadow-sm overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[activeImageIndex] || '/images/placeholder.jpg'}
                    alt={bundle.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === activeImageIndex
                          ? 'border-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image || '/images/placeholder.jpg'}
                        alt={`${bundle.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{bundle.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center space-x-1">
                  <Package className="w-4 h-4" />
                  <span>{bundle.items?.length || 0} {t('bundles.products')}</span>
                </span>
                  <span className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{t('bundles.youSave')} {formatPrice(calculateSavings())}</span>
                  </span>
                </div>
                
                {bundle.description && (
                  <p className="text-gray-600 leading-relaxed">{bundle.description}</p>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg text-gray-600">{t('bundles.normalPrice')}</span>
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(calculateTotalPrice())}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-semibold text-gray-900">{t('bundles.bundlePrice')}</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(bundle.bundle_price)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">{t('bundles.youSave')}</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatPrice(calculateSavings())}
                  </span>
                </div>
              </div>

              {/* Bundle Configuration */}
              {bundle.bundle_type === 'mix_and_match' && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('bundles.bundleConfiguration')}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {bundle.min_items && (
                      <p>• {t('bundles.minimalPick', { count: bundle.min_items })}</p>
                    )}
                    {bundle.max_items && (
                      <p>• {t('bundles.maximalPick', { count: bundle.max_items })}</p>
                    )}
                    <p>• {t('bundles.totalPicked', { count: getTotalSelectedItems() })}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart() || isAddingToCart}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform ${
                    canAddToCart() && !isAddingToCart
                      ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } ${isAddingToCart ? 'animate-pulse' : ''}`}
                >
                  {isAddingToCart ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>{t('bundles.addToCartButton')}</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    isWishlisted
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-gray-300 hover:border-gray-400 text-gray-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={handleShare}
                  className="p-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 text-gray-600 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bundle Items */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t('bundles.productsInBundle')}</h2>
              {bundle.items && bundle.items.length > 4 && (
                <button
                  onClick={() => setShowAllItems(!showAllItems)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showAllItems ? t('bundles.showLess') : `${t('bundles.showAll')} (${bundle.items.length})`}
                </button>
              )}
            </div>

            {displayItems && displayItems.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
                {displayItems.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {item.product?.name || t('bundles.noProducts')}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              {item.product?.category && (
                                <span className="text-sm text-gray-500">
                                  {item.product.category}
                                </span>
                              )}
                              {item.is_required && (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                  {t('bundles.required')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {bundle.bundle_type === 'mix_and_match' && !item.is_required ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{t('bundles.quantity')}:</span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleItemQuantityChange(item.id, (selectedItems[item.id] || 0) - 1)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-sm">
                                {selectedItems[item.id] || 0}
                              </span>
                              <button
                                onClick={() => handleItemQuantityChange(item.id, (selectedItems[item.id] || 0) + 1)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500 mr-1" />
                            <span>{t('bundles.qty')}: {item.quantity}</span>
                          </div>
                        )}
                        
                        <div className="text-right">
                          <div className="font-semibold text-blue-600">
                            {item.product?.price ? formatPrice(item.product.price) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('bundles.noProducts')}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t('bundles.noProductsMessage')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Loading Animation Modal */}
        {showAddToCartAnimation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center transform animate-scale-in">
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto relative">
                  {/* Animated Shopping Cart */}
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin">
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-blue-600 animate-bounce" />
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Menambahkan ke Keranjang</h3>
              <p className="text-gray-600 text-sm">Mohon tunggu sebentar...</p>
              
              {/* Progress Bar */}
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-progress"></div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4 text-center transform animate-slide-up">
              {/* Success Animation */}
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                  <div className="relative">
                    <Check className="w-10 h-10 text-green-600 animate-check-mark" />
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Bundle Berhasil Ditambahkan!</h3>
              <p className="text-gray-600 mb-4">
                <span className="font-medium">{bundle?.name}</span> telah ditambahkan ke keranjang Anda
              </p>
              
              {/* Bundle Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Total Item:</span>
                  <span className="font-medium">{getTotalSelectedItems()} produk</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{t('bundles.bundlePrice')}</span>
                  <span className="font-bold text-blue-600">{formatPrice(bundle?.bundle_price || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('bundles.youSave')}</span>
                  <span className="font-bold text-green-600">{formatPrice(calculateSavings())}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Lanjut Belanja
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/cart');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Lihat Keranjang</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Success Toast */}
        {showShareToast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-toast-slide-down">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-sm mx-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Link berhasil disalin!
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Sekarang Anda bisa membagikan bundle ini
                  </p>
                </div>
                <button
                  onClick={() => setShowShareToast(false)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slide-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        
        @keyframes check-mark {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-progress {
          animation: progress 1.5s ease-in-out;
        }
        
        .animate-check-mark {
          animation: check-mark 0.6s ease-out 0.2s both;
        }
        
        @keyframes toast-slide-down {
          0% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        .animate-toast-slide-down {
          animation: toast-slide-down 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default BundleDetailPage;
