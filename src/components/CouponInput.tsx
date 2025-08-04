import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { couponService } from '@/services/couponService';
import { Coupon, CouponValidationResult } from '@/types/coupon';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { Spinner } from '@/components/ui/loading';

interface CouponInputProps {
  onCouponApplied: (coupon: Coupon, discountAmount: number) => void;
  onCouponRemoved: () => void;
  cartTotal: number;
  productIds?: string[];
  categoryIds?: string[];
  appliedCoupon?: { coupon: Coupon; discountAmount: number } | null;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  onCouponApplied,
  onCouponRemoved,
  cartTotal,
  productIds = [],
  categoryIds = [],
  appliedCoupon
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Masukkan kode kupon');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const validation: CouponValidationResult = await couponService.validateCoupon(
        couponCode.trim().toUpperCase(),
        user?.uid || 'guest',
        cartTotal,
        productIds,
        categoryIds
      );

      if (validation.isValid && validation.coupon) {
        onCouponApplied(validation.coupon, validation.discountAmount || 0);
        setCouponCode('');
        setError(null);
      } else {
        setError(validation.error || 'Kupon tidak valid');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setError('Terjadi kesalahan saat memvalidasi kupon');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setCouponCode('');
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  return (
    <div className="space-y-3">
      {!appliedCoupon ? (
        <>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Masukkan kode kupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={isValidating}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleApplyCoupon}
              disabled={isValidating || !couponCode.trim()}
              className="px-6"
            >
              {isValidating ? <Spinner size="sm" /> : 'Terapkan'}
            </Button>
          </div>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              ✗ {error}
            </div>
          )}
        </>
      ) : (
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-green-800">
                ✓ Kupon "{appliedCoupon.coupon.code}" diterapkan
              </div>
              <div className="text-sm text-green-600">
                {appliedCoupon.coupon.name}
              </div>
              <div className="text-sm font-semibold text-green-700">
                Hemat: ¥{appliedCoupon.discountAmount.toLocaleString()}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveCoupon}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Hapus
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponInput;
