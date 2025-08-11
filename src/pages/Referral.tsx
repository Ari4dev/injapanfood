import { useState, useEffect } from 'react';
import { useShopeeAffiliate, ShopeeAffiliateProvider } from '@/hooks/useShopeeAffiliate';
import { useLanguage } from '@/hooks/useLanguage';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UserBankInformationManager from '@/components/affiliate/UserBankInformationManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Wallet,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  Shield,
  CreditCard,
  Info,
  Receipt
} from 'lucide-react';

const AffiliateContent = () => {
  const { 
    affiliate, 
    loading, 
    commissions, 
    referrals,
    payouts,
    followers,
    settings,
    joinAffiliate,
    updateBankInfo,
    requestPayout,
    copyReferralLink,
    referralLink
  } = useShopeeAffiliate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [processingFee, setProcessingFee] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState('JPY');
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchCode: '',
    swiftCode: ''
  });

  // Currency converter hook for Indonesia bank
  const requestedAmount = parseFloat(payoutAmount) || 0;
  const { 
    convertedRupiah, 
    isLoading: isLoadingRate,
    isRefreshing,
    lastUpdated: rateLastUpdated,
    refreshRate 
  } = useCurrencyConverter(requestedAmount, paymentMethod === 'indonesia_bank' ? 'Transfer Bank Rupiah (Indonesia)' : '');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // If not an affiliate yet, show join card
  if (!affiliate && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {t('affiliate.joinProgram')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                {t('affiliate.startEarningMessage') || 'Start earning commissions by referring customers to our store!'}
              </p>
              <ul className="text-left max-w-md mx-auto space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  {t('affiliate.earnCommissionOnSale', { rate: settings?.commissionRate || 10 })}
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  {t('affiliate.realTimeTracking') || 'Real-time tracking and analytics'}
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  {t('affiliate.fastReliablePayouts') || 'Fast and reliable payouts'}
                </li>
              </ul>
              <Button 
                onClick={joinAffiliate} 
                size="lg"
                className="mt-6"
              >
                {t('affiliate.joinNow') || 'Join Now'}
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Calculate commission stats
  const pendingCommissions = commissions.filter(comm => comm.commissionStatus === 'pending');
  const approvedCommissions = commissions.filter(comm => comm.commissionStatus === 'approved');
  const paidCommissions = commissions.filter(comm => comm.commissionStatus === 'paid');
  
  const totalLifetimeCommission = affiliate?.totalCommission || 0;
  const availableCommission = affiliate?.approvedCommission || 0;
  const pendingAmount = affiliate?.pendingCommission || 0;

  // Handle payment method change
  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
    
    // Apply 10% tax for all bank transfers (government regulation)
    setTaxRate(0.1); // 10% tax for all countries
    setProcessingFee(0); // No additional processing fee
    
    // Set display currency based on payment method
    if (value === 'indonesia_bank') {
      setDisplayCurrency('IDR');
    } else {
      setDisplayCurrency('JPY');
    }
  };

  // Calculate net payout amount
  const calculateNetAmount = () => {
    const amount = parseFloat(payoutAmount) || 0;
    const taxAmount = amount * taxRate;
    const netAmount = amount - taxAmount - processingFee;
    return netAmount;
  };

  // Calculate net amount in Rupiah
  const calculateNetAmountInRupiah = () => {
    if (!convertedRupiah) return 0;
    const taxAmount = convertedRupiah * taxRate;
    const netAmount = convertedRupiah - taxAmount;
    return Math.round(netAmount);
  };

  // Format currency based on selected payment method
  const formatCurrency = (amount: number, currency: string = displayCurrency) => {
    if (currency === 'IDR') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    return `¥${amount.toLocaleString()}`;
  };

  // Handle payout request
  const handlePayoutRequest = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    
    if (!paymentMethod) {
      return;
    }
    
    try {
      await requestPayout(amount, paymentMethod, bankInfo);
      setPayoutAmount('');
      setPaymentMethod('');
      setBankInfo({
        bankName: '',
        accountName: '',
        accountNumber: '',
        branchCode: '',
        swiftCode: ''
      });
    } catch (err) {
      console.error('Payout request failed:', err);
    }
  };

  // Handle bank info update
  const handleBankInfoUpdate = async () => {
    if (!bankInfo.bankName || !bankInfo.accountName || !bankInfo.accountNumber) {
      return;
    }
    await updateBankInfo(bankInfo);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('affiliate.dashboard')}</h1>
          <p className="text-gray-600">{t('affiliate.manageProgramDesc')}</p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('affiliate.totalEarnings') || 'Total Earnings'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{totalLifetimeCommission.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.allTimeEarnings') || 'All time earnings'}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('affiliate.availableBalance') || 'Available Balance'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">¥{availableCommission.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.readyForPayout') || 'Ready for payout'}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('affiliate.pendingCommission') || 'Pending Commission'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">¥{pendingAmount.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.awaitingApproval') || 'Awaiting approval'}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('affiliate.totalReferrals') || 'Total Referrals'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{affiliate?.totalReferrals || 0}</div>
              <p className="text-xs text-gray-500 mt-1">{t('affiliate.successfulReferrals') || 'Successful referrals'}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">{t('affiliate.dashboardTab')}</TabsTrigger>
            <TabsTrigger value="referrals">{t('affiliate.referralsTab')}</TabsTrigger>
            <TabsTrigger value="commissions">{t('affiliate.commissionsTab')}</TabsTrigger>
            <TabsTrigger value="payouts">{t('affiliate.payoutsTab')}</TabsTrigger>
            <TabsTrigger value="pencairan">{t('affiliate.bankManagementTab', 'Bank Management')}</TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Referral Link Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('affiliate.yourReferralLink')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input 
                        value={referralLink} 
                        readOnly 
                        className="flex-1"
                      />
                      <Button onClick={copyReferralLink} variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('affiliate.shareThisLinkToEarn', { rate: settings?.commissionRate || 10 })}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Payout Request Card - Modern */}
              <Card className="border-2 border-gray-100 hover:border-green-200 transition-colors">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-green-600" />
                    {t('affiliate.requestPayout')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Available Balance Display */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">{t('affiliate.availableBalance')}</p>
                          <p className="text-2xl font-bold text-green-600">
                            ¥{availableCommission.toLocaleString()}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
                      </div>
                    </div>

                    {/* Minimum Payout Notice */}
                    {availableCommission < 1000 && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          {t('affiliate.minimumPayoutNotice') || 'Minimum payout amount is ¥1,000. Keep earning!'}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Payment Method Selection */}
                    {(
                      <div>
                        <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          {t('affiliate.paymentMethod')}
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            onClick={() => handlePaymentMethodChange('japan_bank')}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              paymentMethod === 'japan_bank' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">🇯🇵</span>
                                <div className="text-left">
                                  <p className="font-medium">{t('affiliate.japanBankTransfer')}</p>
                                  <p className="text-xs text-gray-500">{t('affiliate.taxApplies') || 'Tax applies'}</p>
                                </div>
                              </div>
                              {paymentMethod === 'japan_bank' && (
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePaymentMethodChange('indonesia_bank')}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              paymentMethod === 'indonesia_bank' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">🇮🇩</span>
                                <div className="text-left">
                                  <p className="font-medium">{t('affiliate.indonesiaBankTransfer')}</p>
                                  <p className="text-xs text-gray-500">{t('affiliate.taxApplies') || 'Tax applies'}</p>
                                </div>
                              </div>
                              {paymentMethod === 'indonesia_bank' && (
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Amount Input */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">{t('affiliate.payoutAmount')}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                        <Input 
                          type="number"
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          placeholder="0"
                          className="pl-8 text-lg font-semibold"
                          max={availableCommission}
                          disabled={!paymentMethod}
                        />
                      </div>
                      {payoutAmount && parseFloat(payoutAmount) > availableCommission && (
                        <p className="text-xs text-red-600 mt-1">
                          {t('affiliate.amountExceedsBalance')}
                        </p>
                      )}
                    </div>

                    {/* Quick Amount Buttons */}
                    {paymentMethod && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPayoutAmount('1000')}
                          className="flex-1"
                        >
                          {t('affiliate.minAmount')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPayoutAmount(Math.floor(availableCommission / 2).toString())}
                          className="flex-1"
                        >
                          50%
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPayoutAmount(availableCommission.toString())}
                          className="flex-1"
                        >
                          {t('affiliate.max')}
                        </Button>
                      </div>
                    )}
                    
                    {/* Professional Tax Notice */}
                    {paymentMethod && (
                      <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-900">
                          <strong>{t('affiliate.taxInformation')}:</strong> {t('affiliate.taxNotice')}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Exchange Rate Info for Indonesia Bank */}
                    {paymentMethod === 'indonesia_bank' && convertedRupiah && (
                      <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-900">
                          <div className="flex items-center justify-between">
                            <div>
                              <strong>{t('affiliate.realtimeExchangeRate')}</strong>
                              <span className="text-xs block text-blue-700 mt-1">
                                1 JPY = Rp {convertedRupiah && requestedAmount > 0 ? Math.round(convertedRupiah / requestedAmount).toLocaleString('id-ID') : '...'}
                              </span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={refreshRate}
                              disabled={isRefreshing}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {isRefreshing ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2" />
                                  {t('affiliate.updating')}
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="w-4 h-4 mr-1" />
                                  {t('affiliate.refresh')}
                                </>
                              )}
                            </Button>
                          </div>
                          {rateLastUpdated && (
                            <p className="text-xs text-blue-600 mt-2">{t('affiliate.lastUpdated')}: {rateLastUpdated}</p>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Payout Summary */}
                    {payoutAmount && parseFloat(payoutAmount) > 0 && paymentMethod && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-sm">
                        <h4 className="font-semibold text-base text-blue-900 flex items-center gap-2 mb-4">
                          <Receipt className="w-5 h-5" />
                          {t('affiliate.payoutCalculation')}
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-700 font-medium">{t('affiliate.requestedAmount')}</span>
                            <div className="text-right">
                              <span className="font-bold text-lg">¥{parseFloat(payoutAmount).toLocaleString()}</span>
                              {paymentMethod === 'indonesia_bank' && convertedRupiah && (
                                <span className="text-sm text-gray-600 block">
                                  ≈ Rp {convertedRupiah.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="border-t border-blue-200 pt-3">
                            <div className="flex justify-between items-center py-2 bg-red-50 -mx-5 px-5 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs text-red-600 font-bold">-</span>
                                </div>
                                <div>
                                  <span className="text-gray-700 font-medium">{t('affiliate.withholdingTax')}</span>
                                  <span className="text-xs text-gray-500 block">{t('affiliate.governmentRegulation')}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-red-600 font-bold">-¥{(parseFloat(payoutAmount) * 0.1).toLocaleString()}</span>
                                {paymentMethod === 'indonesia_bank' && convertedRupiah && (
                                  <span className="text-sm text-red-500 block">
                                    -Rp {Math.round(convertedRupiah * 0.1).toLocaleString('id-ID')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {processingFee > 0 && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-gray-600">{t('affiliate.processingFee')}</span>
                              <span className="text-red-600">-¥{processingFee.toLocaleString()}</span>
                            </div>
                          )}
                          
                          <div className="border-t-2 border-blue-300 pt-3 mt-3">
                            <div className="flex justify-between items-center bg-green-50 -mx-5 px-5 py-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-gray-800">{t('affiliate.amountYouWillReceive')}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-green-600">
                                  {paymentMethod === 'indonesia_bank' && convertedRupiah ? (
                                    <>Rp {calculateNetAmountInRupiah().toLocaleString('id-ID')}</>
                                  ) : (
                                    <>¥{calculateNetAmount().toLocaleString()}</>
                                  )}
                                </span>
                                {paymentMethod === 'indonesia_bank' && convertedRupiah && (
                                  <span className="text-sm text-green-600 block">
                                    (¥{calculateNetAmount().toLocaleString()} {t('affiliate.equivalent')})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-blue-100/50 rounded-lg">
                          <p className="text-xs text-blue-800">
                            <Info className="w-3 h-3 inline mr-1" />
                            {t('affiliate.transferNotice')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Bank Details Section */}
                    {paymentMethod && (!affiliate?.bankInfo || !affiliate.bankInfo.bankName) && (
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                          <Building2 className="w-4 h-4" />
                          {t('affiliate.bankAccountDetails')}
                        </h4>
                        <div>
                          <Label className="text-sm">{t('affiliate.bankName')} *</Label>
                          <Input 
                            value={bankInfo.bankName}
                            onChange={(e) => setBankInfo({...bankInfo, bankName: e.target.value})}
                            placeholder={paymentMethod === 'japan_bank' ? 'e.g., Mitsubishi UFJ' : 'e.g., Bank Mandiri'}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">{t('affiliate.accountHolderName')} *</Label>
                          <Input 
                            value={bankInfo.accountName}
                            onChange={(e) => setBankInfo({...bankInfo, accountName: e.target.value})}
                            placeholder={t('affiliate.fullNameAsOnAccount')}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">{t('affiliate.accountNumber')} *</Label>
                          <Input 
                            value={bankInfo.accountNumber}
                            onChange={(e) => setBankInfo({...bankInfo, accountNumber: e.target.value})}
                            placeholder={t('affiliate.enterAccountNumber')}
                            className="mt-1"
                          />
                        </div>
                        {paymentMethod === 'japan_bank' && (
                          <div>
                            <Label className="text-sm">{t('affiliate.branchCode')}</Label>
                            <Input 
                              value={bankInfo.branchCode}
                              onChange={(e) => setBankInfo({...bankInfo, branchCode: e.target.value})}
                            placeholder={t('affiliate.threedigitBranchCode')}
                              className="mt-1"
                            />
                          </div>
                        )}
                        {paymentMethod === 'indonesia_bank' && (
                          <div>
                            <Label className="text-sm">{t('affiliate.swiftCode')}</Label>
                            <Input 
                              value={bankInfo.swiftCode}
                              onChange={(e) => setBankInfo({...bankInfo, swiftCode: e.target.value})}
                            placeholder={t('affiliate.bankSwiftCode')}
                              className="mt-1"
                            />
                          </div>
                        )}
                        <Button 
                          onClick={handleBankInfoUpdate}
                          variant="outline"
                          className="w-full mt-3"
                          size="sm"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          {t('affiliate.saveBankDetails')}
                        </Button>
                      </div>
                    )}

                    {/* Saved Bank Info Display */}
                    {paymentMethod && affiliate?.bankInfo?.bankName && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">{t('affiliate.bankAccountVerified')}</p>
                            <p className="text-xs text-blue-700 mt-1">
                              {affiliate.bankInfo.bankName} - ***{affiliate.bankInfo.accountNumber?.slice(-4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Submit Button */}
                    <Button 
                      onClick={handlePayoutRequest}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!payoutAmount || !paymentMethod || parseFloat(payoutAmount) <= 0}
                      size="lg"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {t('affiliate.requestPayout')}
                    </Button>

                    {/* Info Notice */}
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 text-xs">
                        {t('affiliate.payoutsProcessedMessage')}
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t('affiliate.referralActivity')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">{t('affiliate.date')}</th>
                          <th className="text-left py-2">{t('affiliate.visitorId')}</th>
                          <th className="text-left py-2">{t('affiliate.status')}</th>
                          <th className="text-left py-2">{t('affiliate.orders')}</th>
                          <th className="text-left py-2">{t('affiliate.totalGmv')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((referral) => (
                          <tr key={referral.id} className="border-b">
                            <td className="py-2">
                              {new Date(referral.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2 font-mono text-sm">
                              {referral.visitorId.slice(0, 12)}...
                            </td>
                            <td className="py-2">
                              {referral.userId ? (
                                <span className="text-green-600">{t('affiliate.registered')}</span>
                              ) : (
                                <span className="text-gray-500">{t('affiliate.visitor')}</span>
                              )}
                            </td>
                            <td className="py-2">{referral.totalOrders}</td>
                            <td className="py-2">¥{referral.totalGMV.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t('affiliate.followers')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">{t('affiliate.email')}</th>
                          <th className="text-left py-2">{t('affiliate.orders')}</th>
                          <th className="text-left py-2">{t('affiliate.totalSpent')}</th>
                          <th className="text-left py-2">{t('affiliate.joined')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {followers.map((follower) => (
                          <tr key={follower.id} className="border-b">
                            <td className="py-2">{follower.email}</td>
                            <td className="py-2">{follower.totalOrders}</td>
                            <td className="py-2">¥{follower.totalSpent.toLocaleString()}</td>
                            <td className="py-2">
                              {new Date(follower.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle>{t('affiliate.commissionHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                          <th className="text-left py-2">{t('affiliate.date')}</th>
                          <th className="text-left py-2">{t('affiliate.orderId')}</th>
                          <th className="text-left py-2">{t('affiliate.orderTotal')}</th>
                          <th className="text-left py-2">{t('affiliate.commission')}</th>
                          <th className="text-left py-2">{t('affiliate.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((commission) => (
                        <tr key={commission.id} className="border-b">
                          <td className="py-2">
                            {new Date(commission.orderDate).toLocaleDateString()}
                          </td>
                          <td className="py-2 font-mono text-sm">
                            {commission.orderId.slice(0, 12)}...
                          </td>
                          <td className="py-2">¥{commission.orderTotal.toLocaleString()}</td>
                          <td className="py-2 font-semibold">
                            ¥{commission.commissionAmount.toLocaleString()}
                          </td>
                          <td className="py-2">
                            {commission.commissionStatus === 'pending' && (
                              <span className="flex items-center text-yellow-600">
                                <Clock className="w-4 h-4 mr-1" />
                                {t('affiliate.pending')}
                              </span>
                            )}
                            {commission.commissionStatus === 'approved' && (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {t('affiliate.approved')}
                              </span>
                            )}
                            {commission.commissionStatus === 'paid' && (
                              <span className="flex items-center text-blue-600">
                                <Wallet className="w-4 h-4 mr-1" />
                                {t('affiliate.paid')}
                              </span>
                            )}
                            {commission.commissionStatus === 'rejected' && (
                              <span className="flex items-center text-red-600">
                                <XCircle className="w-4 h-4 mr-1" />
                                {t('affiliate.rejected')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>{t('affiliate.payoutHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                          <th className="text-left py-2">{t('affiliate.date')}</th>
                          <th className="text-left py-2">{t('affiliate.amount')}</th>
                          <th className="text-left py-2">{t('affiliate.method')}</th>
                          <th className="text-left py-2">{t('affiliate.status')}</th>
                          <th className="text-left py-2">{t('affiliate.notes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="border-b">
                          <td className="py-2">
                            {new Date(payout.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="py-2 font-semibold">
                            ¥{payout.amount.toLocaleString()}
                          </td>
                          <td className="py-2">
                            {payout.method === 'bank_transfer' ? t('affiliate.bankTransfer') : payout.method}
                          </td>
                          <td className="py-2">
                            {payout.status === 'pending' && (
                              <span className="flex items-center text-yellow-600">
                                <Clock className="w-4 h-4 mr-1" />
                                {t('affiliate.pending')}
                              </span>
                            )}
                            {payout.status === 'approved' && (
                              <span className="flex items-center text-blue-600">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {t('affiliate.approved')}
                              </span>
                            )}
                            {payout.status === 'processing' && (
                              <span className="flex items-center text-indigo-600">
                                <Clock className="w-4 h-4 mr-1" />
                                {t('affiliate.processing')}
                              </span>
                            )}
                            {payout.status === 'completed' && (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {t('affiliate.completed')}
                              </span>
                            )}
                            {payout.status === 'rejected' && (
                              <span className="flex items-center text-red-600">
                                <XCircle className="w-4 h-4 mr-1" />
                                {t('affiliate.rejected')}
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-sm text-gray-600">
                            {payout.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Pencairan Tab - Bank Information Management */}
          <TabsContent value="pencairan">
            <UserBankInformationManager />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

const Referral = () => {
  return (
    <ShopeeAffiliateProvider>
      <AffiliateContent />
    </ShopeeAffiliateProvider>
  );
};

export default Referral;