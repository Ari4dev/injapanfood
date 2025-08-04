import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService } from '@/services/couponService';
import { 
  Coupon, 
  CreateCouponRequest, 
  UpdateCouponRequest,
  CouponValidationResult,
  CouponUsage 
} from '@/types/coupon';
import { useToast } from './use-toast';

export const useCoupons = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all coupons
  const {
    data: coupons = [],
    isLoading: isLoadingCoupons,
    error: couponsError,
    refetch: refetchCoupons
  } = useQuery({
    queryKey: ['coupons'],
    queryFn: couponService.getCoupons,
  });

  // Get active coupons for public use
  const {
    data: activeCoupons = [],
    isLoading: isLoadingActiveCoupons,
    error: activeCouponsError,
    refetch: refetchActiveCoupons
  } = useQuery({
    queryKey: ['activeCoupons'],
    queryFn: couponService.getActiveCoupons,
  });

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: ({ couponData, userId }: { couponData: CreateCouponRequest; userId: string }) =>
      couponService.createCoupon(couponData, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['activeCoupons'] });
      toast({
        title: 'Berhasil',
        description: 'Kupon berhasil dibuat',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal membuat kupon',
        variant: 'destructive',
      });
    },
  });

  // Update coupon mutation
  const updateCouponMutation = useMutation({
    mutationFn: (couponData: UpdateCouponRequest) =>
      couponService.updateCoupon(couponData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['activeCoupons'] });
      toast({
        title: 'Berhasil',
        description: 'Kupon berhasil diperbarui',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memperbarui kupon',
        variant: 'destructive',
      });
    },
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) => couponService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['activeCoupons'] });
      toast({
        title: 'Berhasil',
        description: 'Kupon berhasil dihapus',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus kupon',
        variant: 'destructive',
      });
    },
  });

  return {
    // Data
    coupons,
    activeCoupons,
    
    // Loading states
    isLoadingCoupons,
    isLoadingActiveCoupons,
    isCreatingCoupon: createCouponMutation.isPending,
    isUpdatingCoupon: updateCouponMutation.isPending,
    isDeletingCoupon: deleteCouponMutation.isPending,
    
    // Errors
    couponsError,
    activeCouponsError,
    
    // Actions
    createCoupon: createCouponMutation.mutate,
    updateCoupon: updateCouponMutation.mutate,
    deleteCoupon: deleteCouponMutation.mutate,
    refetchCoupons,
    refetchActiveCoupons,
  };
};

// Hook for coupon validation
export const useCouponValidation = () => {
  const [validationResult, setValidationResult] = useState<CouponValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateCoupon = async (
    code: string,
    userId: string,
    orderAmount: number,
    productIds?: string[],
    categoryIds?: string[]
  ) => {
    if (!code.trim()) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      const result = await couponService.validateCoupon(
        code,
        userId,
        orderAmount,
        productIds,
        categoryIds
      );
      setValidationResult(result);
      return result;
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: 'Terjadi kesalahan saat memvalidasi kupon'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const clearValidation = () => {
    setValidationResult(null);
  };

  return {
    validationResult,
    isValidating,
    validateCoupon,
    clearValidation,
  };
};

// Hook for single coupon
export const useCoupon = (id: string) => {
  const {
    data: coupon,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['coupon', id],
    queryFn: () => couponService.getCouponById(id),
    enabled: !!id,
  });

  return {
    coupon,
    isLoading,
    error,
    refetch,
  };
};

// Hook for coupon by code
export const useCouponByCode = (code: string) => {
  const {
    data: coupon,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['couponByCode', code],
    queryFn: () => couponService.getCouponByCode(code),
    enabled: !!code && code.length >= 3, // Only search if code has minimum length
  });

  return {
    coupon,
    isLoading,
    error,
    refetch,
  };
};

// Hook for coupon usage history
export const useCouponUsageHistory = (couponId: string) => {
  const {
    data: usageHistory = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['couponUsage', couponId],
    queryFn: () => couponService.getCouponUsageHistory(couponId),
    enabled: !!couponId,
  });

  return {
    usageHistory,
    isLoading,
    error,
    refetch,
  };
};
