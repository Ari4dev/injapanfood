import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAffiliate } from '@/hooks/useAffiliate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { DollarSign, CreditCard, AlertTriangle, CheckCircle2, RefreshCw, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

const payoutSchema = z.object({
  amount: z.string()
    .min(1, 'Jumlah wajib diisi')
    .refine(val => !isNaN(Number(val)), {
      message: 'Jumlah harus berupa angka',
    })
    .refine(val => Number(val) > 0, {
      message: 'Jumlah harus lebih dari 0',
    }),
  method: z.string().min(1, 'Metode pembayaran wajib dipilih'),
  bankName: z.string().min(1, 'Nama bank wajib diisi'),
  branchCode: z.string().optional(),
  accountNumber: z.string().min(1, 'Nomor rekening wajib diisi'),
  accountName: z.string().min(1, 'Nama pemilik rekening wajib diisi'),
});

type PayoutFormValues = z.infer<typeof payoutSchema>;

const ModernPayoutRequestForm = () => {
  const { affiliate, settings, requestPayout, commissions } = useAffiliate();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Calculate commissions based on actual status from commissions array for consistency
  const pendingCommissions = commissions.filter(comm => comm.status === 'pending');
  const approvedCommissions = commissions.filter(comm => comm.status === 'approved');
  const paidCommissions = commissions.filter(comm => comm.status === 'paid');
  
  const calculatedPendingCommission = pendingCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
  const calculatedPaidCommission = paidCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
  
  // Use backend's authoritative approved commission value
  const availableCommission = affiliate?.approvedCommission || 0;
  
  // Total commission includes all commissions (lifetime earnings)
  const totalCommission = calculatedPendingCommission + availableCommission + calculatedPaidCommission;
    
  // State for currency conversion
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amountInYen, setAmountInYen] = useState<number>(0);
  
  // Use currency converter hook for IDR conversion
  const { 
    convertedRupiah, 
    isLoading: conversionLoading, 
    error: conversionError,
    lastUpdated,
    refreshRate,
    isRefreshing
  } = useCurrencyConverter(amountInYen * 0.9, selectedMethod === 'Transfer Bank Rupiah (Indonesia)' ? 'Bank Transfer (Rupiah)' : '');

  const form = useForm<PayoutFormValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      amount: '',
      method: '',
      bankName: affiliate?.bankInfo?.bankName || '',
      branchCode: affiliate?.bankInfo?.branchCode || '',
      accountNumber: affiliate?.bankInfo?.accountNumber || '',
      accountName: affiliate?.bankInfo?.accountName || '',
    },
  });
   
  // Watch amount and method fields for currency conversion
  const watchAmount = form.watch('amount');
  const watchMethod = form.watch('method');
  
  // Update amount in yen and selected method when form values change
  useEffect(() => {
    const amount = Number(watchAmount) || 0;
    setAmountInYen(amount);
    setSelectedMethod(watchMethod);
  }, [watchAmount, watchMethod]);

  // Calculate tax amounts
  const grossAmount = Number(watchAmount) || 0;
  const taxAmount = Math.round(grossAmount * 0.1);
  const netAmount = grossAmount - taxAmount;
  const onSubmit = async (data: PayoutFormValues) => {
    if (!affiliate) {
      toast({
        title: 'Error',
        description: 'Anda belum terdaftar sebagai affiliate',
        variant: 'destructive',
      });
      return;
    }

    const amount = Number(data.amount);
    
    // Check if amount is greater than pending commission
    if (amount > availableCommission) {
      toast({
        title: 'Error',
        description: 'Jumlah melebihi komisi yang tersedia untuk pencairan',
        variant: 'destructive',
      });
      return;
    }

    // Check if amount is greater than minimum payout
    if (settings && amount < settings.minPayoutAmount) {
      toast({
        title: 'Error',
        description: `Jumlah minimum pencairan adalah ¥${settings.minPayoutAmount.toLocaleString()}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const bankInfo = {
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        branchCode: data.branchCode || '',
        currency: data.method === 'Transfer Bank Rupiah (Indonesia)' ? 'IDR' : 'JPY',
        conversionRate: data.method === 'Transfer Bank Rupiah (Indonesia)' ? 
          (convertedRupiah && netAmount > 0 ? convertedRupiah / netAmount : null) : null,
        estimatedAmount: data.method === 'Transfer Bank Rupiah (Indonesia)' ? convertedRupiah : null,
        taxAmount: taxAmount,
        netAmount: netAmount
      };
      
      await requestPayout(amount, data.method, bankInfo);
      
      toast({
        title: 'Berhasil',
        description: 'Permintaan pencairan berhasil diajukan',
      });
      
      form.reset({
        amount: '',
        method: data.method,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      });
      
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal mengajukan pencairan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!affiliate || !settings) {
    return null;
  }

  const minAmount = settings.minPayoutAmount;
  const maxAmount = availableCommission;
  const canRequestPayout = maxAmount >= minAmount;
  const approvedCommissionsCount = commissions.filter(comm => comm.status === 'approved').length;
  
  // Calculate progress percentage
  const progressPercentage = Math.min(100, (maxAmount / minAmount) * 100);

  return (
    <Card className="border-primary/10 hover:shadow-md transition-all duration-300 h-full">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <CardTitle className="flex items-center text-xl">
          <DollarSign className="w-5 h-5 mr-2 text-primary" />
          {t('affiliate.requestPayout')}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {!canRequestPayout ? (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-amber-100 p-1.5 rounded-full text-amber-600 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-medium text-amber-800 text-sm">{t('affiliate.notEligibleForPayout')}</h4>
                <p className="text-sm text-amber-700 mt-1">
                  {t('affiliate.payoutNotEligibleMessage', { available: maxAmount.toLocaleString(), minimum: minAmount.toLocaleString() })}
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  {t('affiliate.payoutEligibleNote')}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('affiliate.progressToMinimumPayout')}</span>
                <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>¥0</span>
                <span>¥{minAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
              <h5 className="font-medium text-gray-700 text-sm mb-2">{t('affiliate.commissionBalanceInfo')}</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex justify-between">
                  <span>{t('affiliate.approvedCommissions')}</span>
                  <span className="font-medium">{t('affiliate.commissionsCount', { count: approvedCommissionsCount })}</span>
                </li>
                <li className="flex justify-between">
                  <span>{t('affiliate.availableCommissions')}</span>
                  <span className="font-medium">¥{maxAmount.toLocaleString()}</span>
                </li>
                <li className="flex justify-between">
                  <span>{t('affiliate.minimumPayout')}</span>
                  <span className="font-medium">¥{minAmount.toLocaleString()}</span>
                </li>
                <li className="flex justify-between">
                  <span>{t('affiliate.stillNeeded')}</span>
                  <span className="font-medium text-amber-600">¥{Math.max(0, minAmount - maxAmount).toLocaleString()}</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            {!isFormOpen ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-1.5 rounded-full text-green-600 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800 text-sm">{t('affiliate.qualifiedForPayout')}</h4>
                    <p className="text-sm text-green-700 mt-1">
                      {t('affiliate.availableForWithdrawal', { amount: maxAmount.toLocaleString(), count: approvedCommissionsCount })}
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      {t('affiliate.approvedCommissionNote')}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h5 className="font-medium text-gray-700 text-sm mb-2">{t('affiliate.payoutInfo')}</h5>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex justify-between">
                      <span>{t('affiliate.availableCommissions')}</span>
                      <span className="font-medium">¥{maxAmount.toLocaleString()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>{t('affiliate.totalCommissionLifetime')}</span>
                      <span className="font-medium">¥{totalCommission.toLocaleString()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>{t('affiliate.minimumPayout')}</span>
                      <span className="font-medium">¥{minAmount.toLocaleString()}</span>
                    </li>
                  </ul>
                </div>
                
                <Button 
                  onClick={() => setIsFormOpen(true)}
                  className="w-full"
                >
                  {t('affiliate.requestPayoutNow')}
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('affiliate.payoutAmount')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={minAmount}
                            max={maxAmount}
                            placeholder={`Min: ¥${minAmount.toLocaleString()}`}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          {t('affiliate.availableAmount', { amount: maxAmount.toLocaleString(), minimum: minAmount.toLocaleString() })}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('affiliate.paymentMethod')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('affiliate.selectPaymentMethod')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Transfer Bank Jepang">{t('affiliate.japanBankTransfer')}</SelectItem>
                            <SelectItem value="Transfer Bank Rupiah (Indonesia)">{t('affiliate.indonesiaBankTransfer')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
           
           {/* Tax calculation display for all payment methods */}
           {watchAmount && Number(watchAmount) > 0 && (
             <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-4">
               <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                 <Info className="w-4 h-4 mr-2" />
                 {t('affiliate.taxDeductionDetails')}
               </h4>
               
               <div className="space-y-2">
                 <div className="flex justify-between">
                   <span className="text-yellow-700">{t('affiliate.grossAmount')}</span>
                   <span className="font-medium text-yellow-800">¥{grossAmount.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-yellow-700">{t('affiliate.tax10Percent')}</span>
                   <span className="font-medium text-red-600">-¥{taxAmount.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between border-t border-yellow-200 pt-2">
                   <span className="text-yellow-700 font-medium">{t('affiliate.netAmountReceived')}</span>
                   <span className="font-bold text-green-600">¥{netAmount.toLocaleString()}</span>
                 </div>
               </div>
               
               <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-700">
                 <strong>Catatan:</strong> {t('affiliate.taxNote')}
               </div>
             </div>
           )}

           {/* Currency conversion info for Indonesian Rupiah transfers */}
           {watchMethod === 'Transfer Bank Rupiah (Indonesia)' && watchAmount && Number(watchAmount) > 0 && (
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
               <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                 <Info className="w-4 h-4 mr-2" />
                 {t('affiliate.currencyConversionTitle')}
               </h4>
               
               <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center">
                   {conversionLoading || isRefreshing ? (
                     <div className="flex items-center">
                       <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                       <span className="text-blue-600">{t('affiliate.converting')}</span>
                     </div>
                   ) : (
                     <span className="font-bold text-blue-700 text-xl">
                       Rp {convertedRupiah?.toLocaleString('id-ID') || '-'} {t('affiliate.netAmount')}
                     </span>
                   )}
                 </div>
                 <Button 
                   onClick={() => refreshRate()}
                   variant="outline"
                   size="sm"
                   className="text-blue-600 border-blue-200 hover:bg-blue-50"
                   disabled={isRefreshing}
                 >
                   <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                   {isRefreshing ? t('affiliate.refreshing') : t('affiliate.updateRate')}
                 </Button>
               </div>
               
               {lastUpdated && (
                 <p className="text-xs text-blue-600 flex items-center mb-3">
                   <Info className="w-3 h-3 mr-1" />
                   {t('affiliate.autoRateUpdate', { time: lastUpdated })}
                 </p>
               )}
               
               {conversionError && (
                 <Alert variant="destructive" className="mt-2">
                   <AlertDescription>
                     {conversionError}. Silakan coba lagi atau gunakan metode pembayaran lain.
                   </AlertDescription>
                 </Alert>
               )}
               
               <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
                 <strong>Konversi:</strong> {t('affiliate.conversionRateNote', { amount: netAmount.toLocaleString() })}
               </div>
             </div>
           )}

                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-gray-500 mr-2" /> 
                      <h4 className="font-medium text-gray-700">{t('affiliate.bankInfo')}</h4>
                    </div>
             
             {/* Conditional fields based on payment method */}
             {watchMethod === 'Transfer Bank Jepang' && (
               <div className="space-y-4">
                 <FormField
                   control={form.control}
                   name="bankName"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t('affiliate.japanBankName')}</FormLabel>
                       <FormControl>
                         <Input {...field} placeholder="Contoh: MUFG Bank, Japan Post Bank" />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 
                 <FormField
                   control={form.control}
                   name="branchCode"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t('affiliate.branchCodeLabel')}</FormLabel>
                       <FormControl>
                         <Input {...field} placeholder="Contoh: 001" />
                       </FormControl>
                       <p className="text-xs text-gray-500 mt-1">
                         {t('affiliate.branchCodeNote')}
                       </p>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={form.control}
                   name="accountNumber"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t('affiliate.accountNumberLabel')}</FormLabel>
                       <FormControl>
                         <Input {...field} placeholder={t('affiliate.enterJapanAccount')} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={form.control}
                   name="accountName"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t('affiliate.accountHolderName')}</FormLabel>
                       <FormControl>
                         <Input {...field} placeholder={t('affiliate.enterAccountHolder')} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </div>
             )}
             
             {watchMethod === 'Transfer Bank Rupiah (Indonesia)' && (
               <div className="space-y-4">
                 <FormField
                   control={form.control}
                   name="bankName"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t('affiliate.indonesiaBankName')}</FormLabel>
                       <FormControl>
                         <Input {...field} placeholder="Contoh: BCA, Mandiri, BNI" />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={form.control}
                   name="accountNumber"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t('affiliate.accountNumberLabel')}</FormLabel>
                       <FormControl>
                         <Input {...field} placeholder={t('affiliate.enterIndonesiaAccount')} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={form.control}
                   name="accountName"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t('affiliate.accountHolderName')}</FormLabel>
                       <FormControl>
                         <Input {...field} placeholder={t('affiliate.enterAccountHolder')} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </div>
             )}
             
             {!watchMethod && (
               <div className="text-center py-4 text-gray-500">
                 {t('affiliate.selectPaymentFirst')}
               </div>
             )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsFormOpen(false)}
                      className="flex-1"
                    >
                      {t('affiliate.cancel')}
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isSubmitting || !watchMethod}
                    >
                      {isSubmitting ? t('affiliate.processing') : t('affiliate.submitPayout')}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModernPayoutRequestForm;