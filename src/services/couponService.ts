import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  Coupon, 
  CouponUsage, 
  CreateCouponRequest, 
  UpdateCouponRequest,
  CouponValidationResult 
} from '@/types/coupon';

const COUPONS_COLLECTION = 'coupons';
const COUPON_USAGE_COLLECTION = 'couponUsage';

// Convert Firestore timestamp to Date
const convertTimestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Convert Date to Firestore timestamp
const convertDateToTimestamp = (date: Date) => {
  return Timestamp.fromDate(date);
};

export const couponService = {
  // Get all coupons
  async getCoupons(): Promise<Coupon[]> {
    try {
      const couponsRef = collection(db, COUPONS_COLLECTION);
      const q = query(couponsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validFrom: convertTimestampToDate(doc.data().validFrom),
        validUntil: convertTimestampToDate(doc.data().validUntil),
        createdAt: convertTimestampToDate(doc.data().createdAt),
        updatedAt: convertTimestampToDate(doc.data().updatedAt),
      })) as Coupon[];
    } catch (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
  },

  // Get coupon by ID
  async getCouponById(id: string): Promise<Coupon | null> {
    try {
      const couponRef = doc(db, COUPONS_COLLECTION, id);
      const snapshot = await getDoc(couponRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      const data = snapshot.data();
      return {
        id: snapshot.id,
        ...data,
        validFrom: convertTimestampToDate(data.validFrom),
        validUntil: convertTimestampToDate(data.validUntil),
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      } as Coupon;
    } catch (error) {
      console.error('Error fetching coupon:', error);
      throw error;
    }
  },

  // Get coupon by code
  async getCouponByCode(code: string): Promise<Coupon | null> {
    try {
      const couponsRef = collection(db, COUPONS_COLLECTION);
      const q = query(couponsRef, where('code', '==', code.toUpperCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        validFrom: convertTimestampToDate(data.validFrom),
        validUntil: convertTimestampToDate(data.validUntil),
        createdAt: convertTimestampToDate(data.createdAt),
        updatedAt: convertTimestampToDate(data.updatedAt),
      } as Coupon;
    } catch (error) {
      console.error('Error fetching coupon by code:', error);
      throw error;
    }
  },

  // Create new coupon
  async createCoupon(couponData: CreateCouponRequest, userId: string): Promise<string> {
    try {
      // Check if code already exists
      const existingCoupon = await this.getCouponByCode(couponData.code);
      if (existingCoupon) {
        throw new Error('Kode kupon sudah digunakan');
      }

      const couponsRef = collection(db, COUPONS_COLLECTION);
      const docRef = await addDoc(couponsRef, {
        ...couponData,
        code: couponData.code.toUpperCase(),
        usedCount: 0,
        validFrom: convertDateToTimestamp(couponData.validFrom),
        validUntil: convertDateToTimestamp(couponData.validUntil),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating coupon:', error);
      throw error;
    }
  },

  // Update coupon
  async updateCoupon(couponData: UpdateCouponRequest): Promise<void> {
    try {
      const { id, ...updateData } = couponData;
      const couponRef = doc(db, COUPONS_COLLECTION, id);
      
      // Check if code already exists (exclude current coupon)
      if (updateData.code) {
        const existingCoupon = await this.getCouponByCode(updateData.code);
        if (existingCoupon && existingCoupon.id !== id) {
          throw new Error('Kode kupon sudah digunakan');
        }
        updateData.code = updateData.code.toUpperCase();
      }

      const updatePayload: any = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      // Convert dates to timestamps if provided
      if (updateData.validFrom) {
        updatePayload.validFrom = convertDateToTimestamp(updateData.validFrom);
      }
      if (updateData.validUntil) {
        updatePayload.validUntil = convertDateToTimestamp(updateData.validUntil);
      }

      await updateDoc(couponRef, updatePayload);
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  },

  // Delete coupon
  async deleteCoupon(id: string): Promise<void> {
    try {
      const couponRef = doc(db, COUPONS_COLLECTION, id);
      await deleteDoc(couponRef);
    } catch (error) {
      console.error('Error deleting coupon:', error);
      throw error;
    }
  },

  // Validate coupon for order
  async validateCoupon(
    code: string, 
    userId: string, 
    orderAmount: number,
    productIds?: string[],
    categoryIds?: string[]
  ): Promise<CouponValidationResult> {
    try {
      const coupon = await this.getCouponByCode(code);
      
      if (!coupon) {
        return { isValid: false, error: 'Kode kupon tidak ditemukan' };
      }

      // Check if coupon is active
      if (!coupon.isActive) {
        return { isValid: false, error: 'Kupon tidak aktif' };
      }

      const now = new Date();
      
      // Check validity period
      if (now < coupon.validFrom) {
        return { isValid: false, error: 'Kupon belum berlaku' };
      }
      
      if (now > coupon.validUntil) {
        return { isValid: false, error: 'Kupon sudah kedaluwarsa' };
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return { isValid: false, error: 'Kupon sudah mencapai batas penggunaan' };
      }

      // Check user usage limit
      if (coupon.userUsageLimit) {
        const userUsageCount = await this.getUserCouponUsageCount(coupon.id, userId);
        if (userUsageCount >= coupon.userUsageLimit) {
          return { isValid: false, error: 'Anda sudah mencapai batas penggunaan kupon ini' };
        }
      }

      // Check minimum order amount
      if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
        return { 
          isValid: false, 
          error: `Minimal pembelian ¥${coupon.minOrderAmount.toLocaleString()} untuk menggunakan kupon ini` 
        };
      }

      // Check applicable products (if specified)
      if (coupon.applicableProducts && coupon.applicableProducts.length > 0 && productIds) {
        const hasApplicableProduct = productIds.some(id => 
          coupon.applicableProducts!.includes(id)
        );
        if (!hasApplicableProduct) {
          return { isValid: false, error: 'Kupon tidak berlaku untuk produk yang dipilih' };
        }
      }

      // Check applicable categories (if specified)
      if (coupon.applicableCategories && coupon.applicableCategories.length > 0 && categoryIds) {
        const hasApplicableCategory = categoryIds.some(id => 
          coupon.applicableCategories!.includes(id)
        );
        if (!hasApplicableCategory) {
          return { isValid: false, error: 'Kupon tidak berlaku untuk kategori produk yang dipilih' };
        }
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (coupon.type === 'percentage') {
        discountAmount = (orderAmount * coupon.value) / 100;
        // Apply maximum discount limit if specified
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else {
        discountAmount = Math.min(coupon.value, orderAmount);
      }

      return {
        isValid: true,
        discountAmount,
        coupon
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { isValid: false, error: 'Terjadi kesalahan saat memvalidasi kupon' };
    }
  },

  // Get user coupon usage count
  async getUserCouponUsageCount(couponId: string, userId: string): Promise<number> {
    try {
      const usageRef = collection(db, COUPON_USAGE_COLLECTION);
      const q = query(
        usageRef, 
        where('couponId', '==', couponId),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting user coupon usage count:', error);
      return 0;
    }
  },

  // Record coupon usage
  async recordCouponUsage(
    couponId: string,
    userId: string,
    orderId: string,
    discountAmount: number
  ): Promise<void> {
    try {
      // Add usage record
      const usageRef = collection(db, COUPON_USAGE_COLLECTION);
      await addDoc(usageRef, {
        couponId,
        userId,
        orderId,
        discountAmount,
        usedAt: serverTimestamp(),
      });

      // Increment coupon used count
      const couponRef = doc(db, COUPONS_COLLECTION, couponId);
      await updateDoc(couponRef, {
        usedCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error recording coupon usage:', error);
      throw error;
    }
  },

  // Get coupon usage history
  async getCouponUsageHistory(couponId: string): Promise<CouponUsage[]> {
    try {
      const usageRef = collection(db, COUPON_USAGE_COLLECTION);
      const q = query(
        usageRef, 
        where('couponId', '==', couponId),
        orderBy('usedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        usedAt: convertTimestampToDate(doc.data().usedAt),
      })) as CouponUsage[];
    } catch (error) {
      console.error('Error fetching coupon usage history:', error);
      throw error;
    }
  },

  // Get active coupons for public use
  async getActiveCoupons(): Promise<Coupon[]> {
    try {
      const couponsRef = collection(db, COUPONS_COLLECTION);
      const now = Timestamp.now();
      const q = query(
        couponsRef,
        where('isActive', '==', true),
        where('validFrom', '<=', now),
        where('validUntil', '>=', now),
        orderBy('validFrom', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          validFrom: convertTimestampToDate(doc.data().validFrom),
          validUntil: convertTimestampToDate(doc.data().validUntil),
          createdAt: convertTimestampToDate(doc.data().createdAt),
          updatedAt: convertTimestampToDate(doc.data().updatedAt),
        }))
        .filter(coupon => {
          // Additional filtering for usage limits
          if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return false;
          }
          return true;
        }) as Coupon[];
    } catch (error) {
      console.error('Error fetching active coupons:', error);
      throw error;
    }
  }
};
