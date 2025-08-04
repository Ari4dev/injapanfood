import React from 'react';
import { BundleWithItems } from '@/types/bundle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, Tag, Clock, Star } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { useLanguage } from '@/hooks/useLanguage';

interface BundleCardProps {
  bundle: BundleWithItems;
  onViewDetails?: (bundle: BundleWithItems) => void;
  onAddToCart?: (bundle: BundleWithItems) => void;
  onSavePreference?: (bundleId: string, score: number) => void;
  compact?: boolean;
}

const BundleCard: React.FC<BundleCardProps> = ({
  bundle,
  onViewDetails,
  onAddToCart,
  onSavePreference,
  compact = false
}) => {
  const { t } = useLanguage();
  
  const discountPercentage = bundle.savings > 0 
    ? Math.round((bundle.savings / bundle.original_price) * 100)
    : 0;

  const handleLike = () => {
    onSavePreference?.(bundle.id, 0.8);
  };

  const handleViewDetails = () => {
    onViewDetails?.(bundle);
  };

  const handleAddToCart = () => {
    onAddToCart?.(bundle);
  };

  const getBundleTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed': return t('bundles.bundleTypes.fixed');
      case 'mix_and_match': return t('bundles.bundleTypes.mixAndMatch');
      case 'tiered': return t('bundles.bundleTypes.tiered');
      default: return type;
    }
  };

  const getBundleTypeColor = (type: string) => {
    switch (type) {
      case 'fixed': return 'bg-blue-100 text-blue-800';
      case 'mix_and_match': return 'bg-green-100 text-green-800';
      case 'tiered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get first available product image from bundle items
  const getBundleImage = () => {
    if (bundle.items && bundle.items.length > 0) {
      const firstProductWithImage = bundle.items.find(item => item.product?.image_url);
      if (firstProductWithImage?.product?.image_url) {
        return firstProductWithImage.product.image_url;
      }
    }
    return null;
  };

  const bundleImage = getBundleImage();

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewDetails}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {bundleImage ? (
                <img
                  src={bundleImage}
                  alt={bundle.name}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                    const fallbackDiv = img.nextElementSibling as HTMLElement;
                    if (fallbackDiv) {
                      fallbackDiv.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <div className={`w-16 h-16 object-cover rounded-lg bg-gray-100 flex items-center justify-center ${bundleImage ? 'hidden' : ''}`}>
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              {discountPercentage > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                  -{discountPercentage}%
                </Badge>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-sm line-clamp-1">{bundle.name}</h3>
              <p className="text-xs text-gray-600 line-clamp-1">{bundle.description}</p>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-primary">
                    {formatCurrency(bundle.bundle_price)}
                  </span>
                  {bundle.savings > 0 && (
                    <span className="text-xs text-gray-500 line-through">
                      {formatCurrency(bundle.original_price)}
                    </span>
                  )}
                </div>
                
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
                }}>
                  <ShoppingCart className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Bundle Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <CardTitle className="text-lg font-semibold">{bundle.name}</CardTitle>
              
              {/* Bundle Type Badge */}
              <Badge className={`text-xs ${getBundleTypeColor(bundle.bundle_type)}`}>
                {getBundleTypeLabel(bundle.bundle_type)}
              </Badge>
              
              {/* Discount Badge */}
              {discountPercentage > 0 && (
                <Badge className="bg-red-500 text-white text-xs">
                  {t('bundles.savePercent', { percent: discountPercentage })}
                </Badge>
              )}
            </div>
            
            <CardDescription className="text-sm text-gray-600 mb-3">
              {bundle.description}
            </CardDescription>
            
            {/* Bundle Items Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <div className="flex items-center space-x-1">
                <Package className="h-4 w-4" />
                <span>{bundle.items?.length || 0} {t('bundles.products')}</span>
              </div>
              
              {bundle.end_date && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{t('bundles.until')} {new Date(bundle.end_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            {/* Bundle Items Preview */}
            {bundle.items && bundle.items.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{t('bundles.contains')}: </span>
                <span>
                  {bundle.items.slice(0, 2).map((item, index) => (
                    <span key={item.id}>
                      {item.product?.name || 'Product'}
                      {item.quantity > 1 && ` (${item.quantity}x)`}
                      {index < Math.min(bundle.items.length, 2) - 1 && ', '}
                    </span>
                  ))}
                  {bundle.items.length > 2 && (
                    <span> {t('bundles.andMore', { count: bundle.items.length - 2 })}</span>
                  )}
                </span>
              </div>
            )}
          </div>
          
          {/* Price and Actions */}
          <div className="flex flex-col items-end space-y-3">
            {/* Price Section */}
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(bundle.bundle_price)}
              </div>
              {bundle.savings > 0 && (
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-500 line-through">
                    {formatCurrency(bundle.original_price)}
                  </span>
                  <span className="text-sm text-green-600 font-medium">
                    {t('bundles.youSave')} {formatCurrency(bundle.savings)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs px-3 py-2"
                onClick={handleViewDetails}
              >
                {t('bundles.detail')}
              </Button>
              <Button 
                size="sm"
                className="text-xs px-3 py-2"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                {t('bundles.addToCart')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BundleCard;
