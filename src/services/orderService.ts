import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  where,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Order } from '@/types';
import { createOrUpdateAffiliateUser, getAffiliateByReferralCode, createOrderWithReferral } from '@/services/affiliateService';
import { getCODSettings } from '@/services/codSurchargeService';

const ORDERS_COLLECTION = 'orders';

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const getOrdersByUser = async (userId: string): Promise<Order[]> => {
  try {
    try {
      if (!userId) {
        console.log('No userId provided, returning empty array');
        return [];
      }
  
      console.log('Fetching orders for user:', userId);
      
      const ordersRef = collection(db, ORDERS_COLLECTION);
      
      // Simplified query without orderBy to avoid index issues
      const q = query(
        ordersRef, 
        where('user_id', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      
      // Sort manually on client side to avoid Firebase index requirements
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order)).sort((a, b) => {
        // Sort by created_at descending (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  
      console.log(`Found ${orders.length} orders for user ${userId}`);
      return orders;
    } catch (innerError) {
      console.error('Inner error fetching user orders:', innerError);
      return [];
    }
  } catch (error) {
    console.error('Error fetching user orders:', error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
};

export const getPendingOrders = async (): Promise<Order[]> => {
  try {
    try {
      const ordersRef = collection(db, ORDERS_COLLECTION);
      
      // Simplified query without orderBy to avoid index issues
      const q = query(
        ordersRef,
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      
      // Sort manually on client side
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order)).sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      return orders;
    } catch (innerError) {
      console.error('Inner error fetching pending orders:', innerError);
      return [];
    }
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return [];
  }
};

export const getPendingPaymentOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    
    // Query for orders with pending payment status
    const q = query(
      ordersRef,
      where('payment_status', '==', 'pending')
    );
    
    const snapshot = await getDocs(q);
    
    // Sort manually on client side
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order)).sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    return orders;
  } catch (error) {
    console.error('Error fetching pending payment orders:', error);
    throw error;
  }
};

export const createOrder = async (orderData: {
  user_id?: string;
  customer_info: {
    name: string;
    email: string;
    prefecture: string;
    postal_code: string;
    address: string;
    phone: string;
    notes?: string;
    payment_method?: string;
    city?: string;
  };
  items: any[];
  total_price: number;
  status?: string;
  shipping_fee?: number;
  payment_proof_url?: string;
  affiliate_id?: string;
  visitor_id?: string;
  manual_referral_code?: string;
}) => {
  try {
    console.log('Creating order with data:', orderData);
    console.log('Affiliate ID provided:', orderData.affiliate_id);
    
    // Get COD settings to calculate surcharge
    const codSettings = await getCODSettings();
    const isCOD = orderData.customer_info.payment_method === 'COD (Cash on Delivery)';
    const codSurcharge = (isCOD && codSettings.isEnabled) ? codSettings.surchargeAmount : 0;
    
    // Check if this is a Rupiah payment method
    const isRupiahPayment = orderData.customer_info.payment_method === 'Bank Transfer (Rupiah)' || 
                           orderData.customer_info.payment_method === 'QRIS / QR Code' ||
                           orderData.customer_info.payment_method === 'QR Code';
    
    // Store the total price and currency information
    const finalTotalPrice = orderData.total_price;
    
    // Ensure we're not passing undefined values to Firestore
    const sanitizedOrderData = {
      ...orderData,
      total_price: finalTotalPrice,
      user_id: orderData.user_id || null, // Convert undefined to null
      shipping_fee: orderData.shipping_fee || 0,
      payment_proof_url: orderData.payment_proof_url || null,
      affiliate_id: orderData.affiliate_id || null,
      visitor_id: orderData.visitor_id || null,
      cod_surcharge: codSurcharge
    };
    
    // Only use affiliate_id if explicitly provided (from active session)
    let affiliate_id = sanitizedOrderData.affiliate_id || null;
    
    // Don't automatically pull from storage - only use if explicitly provided
    if (!affiliate_id) {
      console.log('No affiliate_id provided - this is a direct/organic order');
    }
    
    console.log('Using affiliate_id for order:', affiliate_id);
    
    const timestamp = new Date().toISOString();
    
    // Set payment status based on payment method
    let payment_status = 'pending';
    if (sanitizedOrderData.customer_info.payment_method === 'COD (Cash on Delivery)') {
      payment_status = 'verified'; // COD doesn't need verification
    }
    
    const orderDoc = {
      user_id: sanitizedOrderData.user_id,
      customer_info: sanitizedOrderData.customer_info,
      items: sanitizedOrderData.items,
      total_price: sanitizedOrderData.total_price,
      status: sanitizedOrderData.status || 'pending',
      payment_status: payment_status,
      shipping_fee: sanitizedOrderData.shipping_fee,
      cod_surcharge: sanitizedOrderData.cod_surcharge,
      payment_proof_url: sanitizedOrderData.payment_proof_url,
      affiliate_id: affiliate_id,
      visitor_id: sanitizedOrderData.visitor_id,
      currency: isRupiahPayment ? 'IDR' : 'JPY',
      is_rupiah_payment: isRupiahPayment,
      manual_referral_code: sanitizedOrderData.manual_referral_code,
      created_at: timestamp,
      updated_at: timestamp
    };
    
    // Create the order document
    const ordersRef = collection(db, ORDERS_COLLECTION);
    // Add error handling for the addDoc operation
    let docRef;
    try {
      docRef = await addDoc(ordersRef, orderDoc);
      console.log('Order created successfully with ID:', docRef.id);
    } catch (addDocError) {
      console.error('Error adding order document:', addDocError);
      throw new Error(`Failed to create order: ${addDocError.message}`);
    }
    
    /*
    // OLD AFFILIATE SYSTEM - DISABLED
    // Process affiliate commission if applicable
    if (affiliate_id && sanitizedOrderData.user_id) {
      try {
        console.log('Processing affiliate commission for order:', docRef.id);
        
        // Check if commission already exists to prevent duplicates
        const { collection: firestoreCollection, query: firestoreQuery, where: firestoreWhere, getDocs: firestoreGetDocs } = await import('firebase/firestore');
        const commissionsRef = firestoreCollection(db, 'affiliate_commissions');
        const existingCommissionQuery = firestoreQuery(
          commissionsRef,
          firestoreWhere('orderId', '==', docRef.id)
        );
        const existingCommissionSnapshot = await firestoreGetDocs(existingCommissionQuery);
        
        if (existingCommissionSnapshot.empty) {
          // Process the affiliate commission only if it doesn't exist
          await createOrderWithReferral(
            sanitizedOrderData.user_id,
            docRef.id,
            sanitizedOrderData.total_price,
            affiliate_id
          );
        } else {
          console.log('Commission already exists for order:', docRef.id, '- skipping creation');
        }
        console.log('Affiliate commission processed for order:', docRef.id);
      } catch (affiliateError) {
        console.error('Error processing affiliate commission:', affiliateError);
        // Log the error but don't fail the order creation
        console.error('Affiliate processing failed, but order was created successfully');
      }
    }
    */
    
    // 🛍️ SHOPEE AFFILIATE SYSTEM: Process order commission
    if (sanitizedOrderData.user_id) {
      try {
        console.log('🛍️ [Shopee] Processing affiliate order commission...');
        const { processAffiliateOrder } = await import('./shopeeAffiliateSystem');
        
        // Calculate product subtotal (excluding shipping and COD fees)
        const productSubtotal = sanitizedOrderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingFee = sanitizedOrderData.shipping_fee || 0;
        const codSurcharge = sanitizedOrderData.cod_surcharge || 0;
        
        console.log('💰 [Commission Base Calculation]:', {
          totalPrice: sanitizedOrderData.total_price,
          productSubtotal,
          shippingFee,
          codSurcharge,
          note: 'Commission will be calculated from productSubtotal only'
        });
        
        await processAffiliateOrder(
          sanitizedOrderData.user_id,
          docRef.id,
          sanitizedOrderData.total_price,
          productSubtotal,  // ✅ Pass product subtotal for commission calculation
          shippingFee,      // ✅ Pass shipping fee (to exclude from commission)
          codSurcharge      // ✅ Pass COD surcharge (to exclude from commission)
        );
        
        console.log('🛍️ [Shopee] Affiliate order processed successfully');
      } catch (shopeeError) {
        console.error('❌ [Shopee] Error processing affiliate order:', shopeeError);
        // Log the error but don't fail the order creation
      }
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string, 
  status: string, 
  paymentStatus?: string
) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };
    
    // Update payment status if provided
    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
    }
    
    await updateDoc(orderRef, updateData);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const updatePaymentProof = async (orderId: string, paymentProofUrl: string) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      payment_proof_url: paymentProofUrl,
      payment_status: 'pending', // Set to pending for verification
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating payment proof:', error);
    throw error;
  }
};

export const getOrder = async (id: string): Promise<Order | null> => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, id);
    const snapshot = await getDoc(orderRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Order;
    }
    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};