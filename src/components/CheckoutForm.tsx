import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MessageCircle, FileText, CreditCard, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { prefectures } from '@/data/prefectures';
import { CartItem, Order } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useCreateOrder } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useShippingRateByPrefecture } from '@/hooks/useShippingRates';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useLanguage } from '@/hooks/useLanguage';
import { addressService, Address } from '@/services/addressService';
import PaymentMethodInfo from '@/components/PaymentMethodInfo'; 
import { useCODSettings } from '@/hooks/useCODSettings';
import { calculateTotalWithCOD } from '@/services/codSurchargeService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import { ButtonSpinner } from '@/components/ui/loading';
import { validateReferralCode } from '@/services/affiliateService';
import CouponInput from '@/components/CouponInput';
import { Coupon } from '@/types/coupon';
import { useCheckoutReferral } from '@/hooks/useShopeeAffiliate';

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Nama lengkap harus minimal 2 karakter'),
  whatsapp: z.string().min(10, 'Nomor WhatsApp tidak valid').regex(/^[0-9+\-\s]+$/, 'Format nomor tidak valid'),
  email: z.string().email('Format email tidak valid'),
  prefecture: z.string().min(1, 'Silakan pilih prefektur'),
  city: z.string().min(2, 'Area/Kota/Cho/Machi harus minimal 2 karakter'),
  postalCode: z.string().min(7, 'Kode pos harus 7 digit').max(7, 'Kode pos harus 7 digit').regex(/^[0-9]{7}$/, 'Kode pos harus berupa 7 angka'),
  address: z.string().min(10, 'Alamat lengkap harus minimal 10 karakter'),
  notes: z.string().optional(),
  paymentMethod: z.string().min(1, 'Silakan pilih metode pembayaran'),
  referralCode: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  cart: CartItem[];
  total: number;
  onOrderComplete: () => void;
}

export default function CheckoutForm({ cart, total, onOrderComplete }: CheckoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const createOrder = useCreateOrder();
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('');
  const { data: shippingRate, isLoading: isLoadingShippingRate } = useShippingRateByPrefecture(selectedPrefecture);
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [showCurrencyInfo, setShowCurrencyInfo] = useState(false);
  const { data: codSettings } = useCODSettings();
  const [referralCodeInput, setReferralCodeInput] = useState<string>('');
  const [referralCodeValidation, setReferralCodeValidation] = useState<{
    isValidating: boolean;
    isValid: boolean;
    error: string | null;
  }>({
    isValidating: false,
    isValid: false,
    error: null
  });
  
  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  
  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<{ coupon: Coupon; discountAmount: number } | null>(null);

  // 🛍️ Shopee Affiliate System: Get referral code for auto-fill
  const { referralCode: shopeeReferralCode, isLoading: isLoadingShopeeReferral } = useCheckoutReferral();

  // Get affiliate_id only if there's an active referral session
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: '',
      whatsapp: '',
      email: user?.email || '',
      prefecture: '',
      city: '',
      postalCode: '',
      address: '',
      notes: '',
      paymentMethod: '',
      referralCode: '',
    },
  });

  // Get the current payment method
  const paymentMethod = form.watch('paymentMethod');
  
  // Calculate COD surcharge
  const codSurcharge = (paymentMethod === 'COD (Cash on Delivery)' && codSettings?.isEnabled) 
    ? codSettings.surchargeAmount 
    : 0;
  
  // Calculate total with shipping, COD surcharge, and coupon discount
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const totalWithShipping = total + (shippingFee || 0) + codSurcharge - discountAmount;

  // Move the currency converter hook to the top level
  const { convertedRupiah, lastUpdated } = useCurrencyConverter(totalWithShipping, paymentMethod);

  // Helper function to format currency based on payment method
  const formatCurrencyByMethod = (amount: number): string => {
    const isRupiahMethod = paymentMethod === 'Bank Transfer (Rupiah)' || 
                          paymentMethod === 'QRIS / QR Code' ||
                          paymentMethod === 'QR Code';
    
    if (isRupiahMethod && convertedRupiah) {
      const amountInRupiah = Math.round((amount / totalWithShipping) * convertedRupiah);
      return `Rp${amountInRupiah.toLocaleString('id-ID')}`;
    }
    return `¥${amount.toLocaleString()}`;
  };

  // Update shipping fee when prefecture changes
  useEffect(() => {
    if (shippingRate) {
      console.log('Setting shipping fee from rate:', shippingRate);
      setShippingFee(shippingRate.price);
    } else {
      console.log('No shipping rate found, setting fee to null');
      setShippingFee(null);
    }
  }, [shippingRate]);

  // Validate referral code with debounce
  useEffect(() => {
    if (!referralCodeInput || referralCodeInput.length < 3) {
      setReferralCodeValidation({
        isValidating: false,
        isValid: false,
        error: null
      });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setReferralCodeValidation(prev => ({ ...prev, isValidating: true }));
      
      try {
        // Pass current user ID to prevent self-referral
        const isValid = await validateReferralCode(referralCodeInput, user?.uid);
        setReferralCodeValidation({
          isValidating: false,
          isValid,
          error: isValid ? null : 'Kode referral tidak valid atau Anda tidak dapat menggunakan kode referral milik sendiri.'
        });
      } catch (error) {
        setReferralCodeValidation({
          isValidating: false,
          isValid: false,
          error: 'Gagal memvalidasi kode referral'
        });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [referralCodeInput]);

  // Load saved addresses for logged-in users
  useEffect(() => {
    if (user) {
      setIsLoadingAddresses(true);
      addressService.getUserAddresses(user.uid)
        .then((addresses) => {
          setSavedAddresses(addresses);
          // Auto-select default address if available
          const defaultAddress = addresses.find(addr => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            fillFormWithAddress(defaultAddress);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingAddresses(false));
    }
  }, [user]);

  // Function to fill form with selected address
  const fillFormWithAddress = (address: Address) => {
    // Find the prefecture by matching the Japanese name from the saved address
    const prefecture = prefectures.find(p => p.name === address.prefecture);
    const prefectureValue = prefecture ? prefecture.name_en.toLowerCase() : address.prefecture.toLowerCase();
    
    form.setValue('fullName', address.name);
    form.setValue('whatsapp', address.phone);
    // Keep the current user's email - don't overwrite it
    // form.setValue('email', user?.email || ''); // Email stays as is
    form.setValue('prefecture', prefectureValue);
    form.setValue('city', address.city);
    form.setValue('postalCode', address.postalCode);
    form.setValue('address', address.address);
    
    // Update selected prefecture for shipping calculation
    setSelectedPrefecture(prefectureValue);
  };

  // Handle address selection
  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId);
    
    if (addressId === 'new') {
      // Clear form for new address
      form.setValue('fullName', '');
      form.setValue('whatsapp', '');
      form.setValue('prefecture', '');
      form.setValue('city', '');
      form.setValue('postalCode', '');
      form.setValue('address', '');
      setSelectedPrefecture('');
    } else {
      // Fill form with selected address
      const selectedAddress = savedAddresses.find(addr => addr.id === addressId);
      if (selectedAddress) {
        fillFormWithAddress(selectedAddress);
      }
    }
  };

  const generateWhatsAppMessage = (data: CheckoutFormData, convertedRupiahValue?: number) => {
    const productList = cart.map(item => {
      const variants = item.selectedVariants 
        ? Object.entries(item.selectedVariants).map(([type, value]) => `${type}: ${value}`).join(', ') 
        : '';
      
      // Format price based on payment method
      let priceDisplay = `¥${(item.price * item.quantity).toLocaleString()}`;
      
      // Add Rupiah conversion if applicable
      if (convertedRupiahValue && (data.paymentMethod === 'Bank Transfer (Rupiah)' || data.paymentMethod === 'QRIS / QR Code')) {
        const itemRupiah = Math.round((item.price * item.quantity) * (convertedRupiahValue / totalWithShipping));
        priceDisplay = `Rp${itemRupiah.toLocaleString('id-ID')}`;
      }
      
      return `- ${item.name}${variants ? ` | Varian: ${variants}` : ''} | Qty: ${item.quantity} | ${priceDisplay}`;
    }).join('\n');

    const shippingInfo = shippingFee 
      ? `\n*ONGKOS KIRIM:* ${formatCurrencyForWhatsAppMessage(shippingFee, data.paymentMethod, convertedRupiahValue)}` 
      : '';

    // Add affiliate info if available from BitKode Affiliate system
    const affiliateInfo = shopeeReferralCode 
      ? `\n*KODE REFERRAL: ${shopeeReferralCode}*`
      : '';

    // Format total based on payment method
    const totalDisplay = formatCurrencyForWhatsAppMessage(totalWithShipping, data.paymentMethod, convertedRupiahValue);

    const message = `Halo Admin Injapan Food

Saya ingin memesan produk melalui website. Berikut detail pesanan saya:

*INFORMASI PENERIMA:*
Nama penerima: ${data.fullName}
Nomor WhatsApp: ${data.whatsapp}
Email: ${data.email}
Prefektur: ${data.prefecture}
Area/Kota/Cho/Machi: ${data.city}
Kode Pos: ${data.postalCode}
Alamat lengkap: ${data.address}

*METODE PEMBAYARAN:*
${data.paymentMethod}

*DAFTAR PRODUK:*
${productList}

*SUBTOTAL BELANJA:* ${formatCurrencyForWhatsAppMessage(total, data.paymentMethod, convertedRupiahValue)}${shippingInfo}
*TOTAL BELANJA:* ${totalDisplay}${affiliateInfo}

${data.notes ? `Catatan: ${data.notes}` : ''}

${paymentProofFile ? 'Saya sudah mengupload bukti pembayaran melalui website.' : ''}

Mohon konfirmasi pesanan saya. Terima kasih banyak!`;

    return encodeURIComponent(message);
  };

  // Helper function to format currency based on payment method
  const formatCurrencyForWhatsAppMessage = (amount: number, method: string, convertedRupiah?: number): string => {
    if ((method === 'Bank Transfer (Rupiah)' || method === 'QRIS / QR Code') && convertedRupiah) {
      // For Rupiah methods, calculate the proportional amount
      const amountInRupiah = Math.round((amount / totalWithShipping) * convertedRupiah);
      return `Rp${amountInRupiah.toLocaleString('id-ID')}`;
    }
    
    // For Yen methods or when conversion is not available
    return `¥${amount.toLocaleString()}`;
  };

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: t('payment.invalidFormat'),
        description: t('payment.validFormatsMessage'),
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('payment.fileTooLarge'),
        description: t('payment.maxFileSize'),
        variant: "destructive"
      });
      return;
    }

    setPaymentProofFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePaymentProof = () => {
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
  };

  const uploadPaymentProof = async (orderId: string): Promise<string | null> => {
    if (!paymentProofFile) return null;

    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `payment-proofs/${orderId}_${Date.now()}`);
      await uploadBytes(storageRef, paymentProofFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      return null;
    }
  };

  // Coupon handlers
  const handleCouponApplied = (coupon: Coupon, discountAmount: number) => {
    setAppliedCoupon({ coupon, discountAmount });
    toast({
      title: "Kupon berhasil diterapkan!",
      description: `Anda hemat ¥${discountAmount.toLocaleString()} dengan kupon "${coupon.code}"`
    });
  };

  const handleCouponRemoved = () => {
    const previousDiscount = appliedCoupon?.discountAmount || 0;
    setAppliedCoupon(null);
    toast({
      title: "Kupon dihapus",
      description: `Diskon ¥${previousDiscount.toLocaleString()} telah dihapus`
    });
  };

  // Auto-fill referral code from BitKode Affiliate system
  useEffect(() => {
    if (shopeeReferralCode && !form.getValues('referralCode')) {
      form.setValue('referralCode', shopeeReferralCode);
      setReferralCodeInput(shopeeReferralCode);
      console.log('💻 [BitKode] Auto-filled referral code:', shopeeReferralCode);
    }
  }, [shopeeReferralCode, form]);

  // Get product and category IDs from cart for coupon validation
  const productIds = cart.map(item => item.product?.id || item.id.split('-')[0]);
  const categoryIds = cart.map(item => item.product?.category).filter(Boolean);

  const onSubmit = async (data: CheckoutFormData) => {
    if (cart.length === 0) {
      toast({
        title: t('cart.empty'),
        description: t('cart.emptyMessage'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order in Firebase/Firestore
      const orderData = {
        items: cart.map(item => ({
          name: item.name,
          product_id: item.product?.id || item.id.split('-')[0], // Store the product ID for stock updates
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url,
          selectedVariants: item.selectedVariants || {}
        })),
        totalPrice: totalWithShipping,
        customerInfo: {
          name: data.fullName,
          email: data.email,
          phone: data.whatsapp,
          prefecture: data.prefecture,
          city: data.city,
          postal_code: data.postalCode,
          address: data.address,
          notes: data.notes,
          payment_method: data.paymentMethod
        },
        userId: user?.uid,
        shipping_fee: shippingFee || 0,
        manual_referral_code: data.referralCode || null  // Pass manual referral code
      };

      console.log('💻 [BitKode] Creating order - referral code:', data.referralCode);
      
      const orderId = await createOrder.mutateAsync({
        items: orderData.items,
        totalPrice: orderData.totalPrice,
        customerInfo: orderData.customerInfo,
        userId: orderData.userId,
        shipping_fee: orderData.shipping_fee,
        manual_referral_code: orderData.manual_referral_code
      });

      // Upload payment proof if provided
      let paymentProofUrl = null;
      if (paymentProofFile) {
        paymentProofUrl = await uploadPaymentProof(orderId);
        
        // If payment proof was uploaded, update the order with the URL
        if (paymentProofUrl) {
          // Import the function here to avoid circular dependencies
          const { updatePaymentProof } = await import('@/services/orderService');
          await updatePaymentProof(orderId, paymentProofUrl);
        }
      }

      // Show success message
      toast({
        title: "Pesanan Berhasil Dibuat",
        description: t('checkout.orderSaved'),
      });
      
      // Open WhatsApp immediately
      const whatsappMessage = generateWhatsAppMessage(data, convertedRupiah);
      const phoneNumber = '+817084894699'; // Replace with your actual WhatsApp number
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;
      window.open(whatsappUrl, '_blank');
      
      // Clear form and cart
      form.reset();
      onOrderComplete();
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: t('common.error'),
        description: "Gagal membuat pesanan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">{t('checkout.shippingInfo')}</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Saved Addresses Selection (for logged-in users) */}
          {user && savedAddresses.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <FormLabel className="text-base font-medium text-blue-800 mb-3 block">
                📍 {t('checkout.chooseAddress')}
              </FormLabel>
              <Select value={selectedAddressId} onValueChange={handleAddressSelection}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={t('checkout.selectAddressPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  <SelectItem value="new">
                    ➕ {t('checkout.addNewAddress')}
                  </SelectItem>
                  {savedAddresses.map((address) => (
                    <SelectItem key={address.id} value={address.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="font-medium">{address.name}</span>
                          {address.isDefault && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                          <div className="text-sm text-gray-600">
                            {address.city}, {address.prefecture} {address.postalCode}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-blue-600 mt-2">
                💡 {t('checkout.manageAddressTip')}
              </p>
            </div>
          )}
          
          {/* Loading indicator for addresses */}
          {user && isLoadingAddresses && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">{t('checkout.loadingAddresses')}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('checkout.fullName')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('checkout.fullNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('checkout.whatsapp')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('checkout.whatsappPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('checkout.email')} *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={t('checkout.emailPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="prefecture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('checkout.prefecture')} *</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      console.log('Selected prefecture:', value);
                      setSelectedPrefecture(value.toLowerCase());
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white">
                      <SelectValue placeholder={t('checkout.selectPrefecture')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border shadow-lg max-h-60 z-50">
                      {prefectures.map((prefecture) => (
                        <SelectItem key={prefecture.name} value={prefecture.name_en.toLowerCase()}>
                          {prefecture.name} ({prefecture.name_en})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('checkout.city')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('checkout.cityPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('checkout.postalCode')} *</FormLabel>
                <FormControl>
                  <Input placeholder={t('checkout.postalCodePlaceholder')} maxLength={7} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('checkout.address')} *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('checkout.addressPlaceholder')}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('checkout.notes')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('checkout.notesPlaceholder')}
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Kode Referral Field */}
          <FormField
            control={form.control}
            name="referralCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('checkout.referralCode')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('checkout.referralCodePlaceholder')}
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      field.onChange(value);
                      setReferralCodeInput(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
                {referralCodeInput && (
                  <div className="text-sm">
                    {referralCodeValidation.isValidating ? (
                      <span className="text-blue-600">{t('checkout.referralCodeValidating')}</span>
                    ) : referralCodeValidation.isValid ? (
                      <span className="text-green-600">✓ {t('checkout.referralCodeValid')}</span>
                    ) : referralCodeValidation.error ? (
                      <span className="text-red-600">✗ {referralCodeValidation.error}</span>
                    ) : null}
                  </div>
                )}
              </FormItem>
            )}
          />
          {/* Payment Method Selection */}
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('checkout.paymentMethod')} *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={t('checkout.selectPaymentMethodPlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    <SelectItem value="COD (Cash on Delivery)">{t('checkout.cod')}</SelectItem>
                    <SelectItem value="Bank Transfer (Rupiah)">{t('checkout.bankTransferRupiah')}</SelectItem>
                    <SelectItem value="Bank Transfer (Yucho / ゆうちょ銀行)">{t('checkout.bankTransferYucho')}</SelectItem>
                    <SelectItem value="QRIS / QR Code">{t('checkout.qris')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Method Info */}
          {paymentMethod && (
            <PaymentMethodInfo 
              paymentMethod={paymentMethod} 
              totalAmount={totalWithShipping} 
            />
          )}

          {/* Payment Proof Upload (Optional) */}
          {paymentMethod && paymentMethod !== 'COD (Cash on Delivery)' && (
            <div className="space-y-2">
              <FormLabel>{t('checkout.paymentProof')}</FormLabel>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentProofChange}
                  className="mb-2"
                />
                <p className="text-xs text-gray-500">
                  {t('checkout.paymentProofFormats')}
                </p>
                
                {paymentProofPreview && (
                  <div className="mt-3">
                    <div className="relative inline-block">
                      <img 
                        src={paymentProofPreview} 
                        alt="Preview" 
                        className="w-40 h-40 object-contain rounded-md border border-gray-200" 
                      />
                      <button
                        type="button"
                        onClick={removePaymentProof}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                      {t('checkout.paymentProofReady')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Professional Referral Information */}
          {shopeeReferralCode && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Kode Referral Aktif</h4>
                  <p className="text-sm text-gray-700">
                    Kode referral <span className="font-mono font-semibold bg-white px-2 py-0.5 rounded border border-gray-200">{shopeeReferralCode}</span> telah diterapkan pada pesanan Anda.
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Terima kasih telah menggunakan layanan referral kami. Komisi akan diproses secara otomatis.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Coupon Input Section */}
          <div className="space-y-2">
            <FormLabel>Kode Kupon Diskon (Opsional)</FormLabel>
            <CouponInput
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              cartTotal={total}
              productIds={productIds}
              categoryIds={categoryIds}
              appliedCoupon={appliedCoupon}
            />
          </div>

          {/* Order Summary with Shipping Fee */}
          <div className="border-t border-b py-4 my-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t('checkout.productSubtotal')}</span>
              <span>{formatCurrencyByMethod(total)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">{t('checkout.shippingCost')}</span>
              {selectedPrefecture ? (
                isLoadingShippingRate ? (
                  <span className="text-gray-500">{t('checkout.loading')}</span>
                ) : shippingFee !== null ? (
                  <span>{formatCurrencyByMethod(shippingFee)}</span>
                ) : (
                  <span className="text-yellow-600 text-sm">{t('checkout.shippingNotSet')}</span>
                )
              ) : (
                <span className="text-gray-500">{t('checkout.selectPrefecture')}</span>
              )}
            </div>
            
            {/* COD Surcharge */}
            {paymentMethod === 'COD (Cash on Delivery)' && codSettings?.isEnabled && codSurcharge > 0 && (
              <div className="flex justify-between items-center text-orange-600">
                <span className="font-medium">{t('checkout.codSurcharge')}</span>
                <span>{formatCurrencyByMethod(codSurcharge)}</span>
              </div>
            )}
            
            {/* Coupon Discount */}
            {appliedCoupon && (
              <div className="flex justify-between items-center text-green-600">
                <span className="font-medium">Diskon Kupon ({appliedCoupon.coupon.code})</span>
                <span>-{formatCurrencyByMethod(appliedCoupon.discountAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2 mt-2 text-lg font-bold">
              <span>{t('cart.total')}</span>
              <span className="text-primary">{formatCurrencyByMethod(totalWithShipping)}</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              type="submit"
              disabled={isSubmitting || cart.length === 0 || (selectedPrefecture && shippingFee === null)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold flex items-center justify-center space-x-2"
            >
              {isSubmitting && <ButtonSpinner />}
              <MessageCircle className="w-5 h-5" />
              <span>
                {isSubmitting ? t('checkout.processing') : t('checkout.orderViaWhatsApp')}
              </span>
            </Button>
            <p className="text-center text-sm text-gray-600 mt-2">{t('checkout.orderSaved')}</p>
            
            {selectedPrefecture && shippingFee === null && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  {t('checkout.shippingNotConfigured')}
                </p>
              </div>
            )}
            
            {/* COD Information */}
            {paymentMethod === 'COD (Cash on Delivery)' && codSettings?.isEnabled && codSurcharge > 0 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  <strong>{t('checkout.codInformation')}:</strong> Biaya tambahan ¥{codSurcharge.toLocaleString()} akan dikenakan untuk pembayaran COD.
                </p>
              </div>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}