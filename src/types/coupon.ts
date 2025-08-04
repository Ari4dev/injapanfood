export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number; // percentage (0-100) or fixed amount in yen
  minOrderAmount?: number; // minimum order amount to use coupon
  maxDiscountAmount?: number; // maximum discount amount for percentage coupons
  usageLimit?: number; // total usage limit (null = unlimited)
  usedCount: number; // current usage count
  userUsageLimit?: number; // usage limit per user (null = unlimited)
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableProducts?: string[]; // product IDs (null = all products)
  applicableCategories?: string[]; // category IDs (null = all categories)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // admin user ID
}

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  usedAt: Date;
}

export interface CreateCouponRequest {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  userUsageLimit?: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableProducts?: string[];
  applicableCategories?: string[];
}

export interface UpdateCouponRequest extends Partial<CreateCouponRequest> {
  id: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  discountAmount?: number;
  coupon?: Coupon;
}
