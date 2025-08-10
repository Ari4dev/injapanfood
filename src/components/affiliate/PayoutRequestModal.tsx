import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  Wallet,
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle2,
  Info,
  Lock,
  DollarSign,
  Receipt,
  TrendingUp,
} from 'lucide-react';

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliateData: {
    id: string;
    email: string;
    displayName: string;
    approvedCommission: number;
    tier?: string;
  };
  onSuccess?: () => void;
}

interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode?: string;
  swiftCode?: string;
}

interface PaymentMethod {
  id: string;
  type: 'japan_bank' | 'indonesia_bank';
  country: string;
  flag: string;
  bankAccount?: BankAccount;
}

const PayoutRequestModal: React.FC<PayoutRequestModalProps> = ({
  isOpen,
  onClose,
  affiliateData,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [bankDetails, setBankDetails] = useState<BankAccount>({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchCode: '',
    swiftCode: '',
  });
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<PaymentMethod[]>([]);
  const [useSavedMethod, setUseSavedMethod] = useState(false);
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<string>('');
  const [minimumPayout, setMinimumPayout] = useState(1000);
  const [taxRate, setTaxRate] = useState(0);
  const [processingFee, setProcessingFee] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadSavedPaymentMethods();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'bitkode_affiliate_settings', 'config'));
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        setMinimumPayout(settings.minPayout || 1000);
        
        // Set tax rate based on payment method
        if (paymentMethod === 'japan_bank') {
          setTaxRate(settings.taxWithholding?.japan || 0.1);
        } else if (paymentMethod === 'indonesia_bank') {
          setTaxRate(settings.taxWithholding?.indonesia || 0);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadSavedPaymentMethods = async () => {
    try {
      const paymentMethodsDoc = await getDoc(
        doc(db, 'affiliate_payment_methods', affiliateData.id)
      );
      if (paymentMethodsDoc.exists()) {
        const methods = paymentMethodsDoc.data().methods || [];
        setSavedPaymentMethods(methods);
      }
    } catch (error) {
      console.error('Error loading saved payment methods:', error);
    }
  };

  const calculateNetAmount = () => {
    const requestAmount = parseFloat(amount) || 0;
    const taxAmount = requestAmount * taxRate;
    const feeAmount = processingFee;
    return requestAmount - taxAmount - feeAmount;
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setAmount(value);
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
    
    // Update tax rate based on country
    if (value === 'japan_bank') {
      setTaxRate(0.1); // 10% for Japan
      setProcessingFee(300); // ¥300 processing fee
    } else if (value === 'indonesia_bank') {
      setTaxRate(0); // No tax for Indonesia
      setProcessingFee(0); // No processing fee
    }
  };

  const handleSubmit = async () => {
    // Validation
    const requestAmount = parseFloat(amount);
    
    if (!requestAmount || requestAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (requestAmount < minimumPayout) {
      toast({
        title: 'Below Minimum',
        description: `Minimum payout amount is ¥${minimumPayout.toLocaleString()}`,
        variant: 'destructive',
      });
      return;
    }

    if (requestAmount > affiliateData.approvedCommission) {
      toast({
        title: 'Insufficient Balance',
        description: 'Amount exceeds available balance',
        variant: 'destructive',
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: 'Payment Method Required',
        description: 'Please select a payment method',
        variant: 'destructive',
      });
      return;
    }

    if (!useSavedMethod) {
      if (!bankDetails.bankName || !bankDetails.accountName || !bankDetails.accountNumber) {
        toast({
          title: 'Bank Details Required',
          description: 'Please fill in all required bank details',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setLoading(true);

      // Get the bank details to use
      let finalBankDetails = bankDetails;
      if (useSavedMethod && selectedSavedMethod) {
        const savedMethod = savedPaymentMethods.find(m => m.id === selectedSavedMethod);
        if (savedMethod?.bankAccount) {
          finalBankDetails = savedMethod.bankAccount;
        }
      }

      // Calculate amounts
      const netAmount = calculateNetAmount();
      const taxAmount = requestAmount * taxRate;

      // Create payout request
      const payoutData = {
        affiliateId: affiliateData.id,
        affiliateEmail: affiliateData.email,
        affiliateName: affiliateData.displayName,
        amount: requestAmount,
        netAmount: netAmount,
        taxAmount: taxAmount,
        processingFee: processingFee,
        taxRate: taxRate,
        status: 'pending',
        paymentMethod: paymentMethod,
        bankDetails: finalBankDetails,
        requestedAt: new Date().toISOString(),
        notes: `Payout request from ${affiliateData.displayName}`,
      };

      await addDoc(collection(db, 'bitkode_affiliate_payouts'), payoutData);

      // Update affiliate's approved commission
      const affiliateRef = doc(db, 'bitkode_affiliates', affiliateData.id);
      await updateDoc(affiliateRef, {
        approvedCommission: affiliateData.approvedCommission - requestAmount,
        lastPayoutRequest: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Save payment method if it's new
      if (!useSavedMethod && bankDetails.bankName) {
        const newMethod: PaymentMethod = {
          id: `${paymentMethod}_${Date.now()}`,
          type: paymentMethod as 'japan_bank' | 'indonesia_bank',
          country: paymentMethod === 'japan_bank' ? 'Japan' : 'Indonesia',
          flag: paymentMethod === 'japan_bank' ? '🇯🇵' : '🇮🇩',
          bankAccount: bankDetails,
        };

        const paymentMethodsRef = doc(db, 'affiliate_payment_methods', affiliateData.id);
        const existingDoc = await getDoc(paymentMethodsRef);
        
        if (existingDoc.exists()) {
          const existingMethods = existingDoc.data().methods || [];
          await updateDoc(paymentMethodsRef, {
            methods: [...existingMethods, newMethod],
            updatedAt: new Date().toISOString(),
          });
        } else {
          await addDoc(collection(db, 'affiliate_payment_methods'), {
            affiliateId: affiliateData.id,
            methods: [newMethod],
            createdAt: new Date().toISOString(),
          });
        }
      }

      toast({
        title: 'Success! 🎉',
        description: 'Your payout request has been submitted successfully',
      });

      // Reset form
      setAmount('');
      setBankDetails({
        bankName: '',
        accountName: '',
        accountNumber: '',
        branchCode: '',
        swiftCode: '',
      });
      setPaymentMethod('');
      setUseSavedMethod(false);
      setSelectedSavedMethod('');

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit payout request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canRequestPayout = affiliateData.approvedCommission >= minimumPayout;
  const requestAmount = parseFloat(amount) || 0;
  const isAmountValid = requestAmount >= minimumPayout && requestAmount <= affiliateData.approvedCommission;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-green-600" />
            Request Payout
          </DialogTitle>
          <DialogDescription>
            Submit a request to withdraw your available commission balance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Balance Overview */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ¥{affiliateData.approvedCommission.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Minimum Payout</p>
                <p className="text-2xl font-bold text-gray-700">
                  ¥{minimumPayout.toLocaleString()}
                </p>
              </div>
            </div>
            {!canRequestPayout && (
              <Alert className="mt-3 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  You need at least ¥{minimumPayout.toLocaleString()} to request a payout.
                  Current balance: ¥{affiliateData.approvedCommission.toLocaleString()}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-method" className="text-base font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={handlePaymentMethodChange}
                disabled={!canRequestPayout}
              >
                <SelectTrigger id="payment-method" className="w-full">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="japan_bank">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇯🇵</span>
                      <span>Japan Bank Transfer</span>
                      <Badge variant="outline" className="ml-2">10% Tax</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="indonesia_bank">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇮🇩</span>
                      <span>Indonesia Bank Transfer</span>
                      <Badge variant="outline" className="ml-2">No Tax</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank Details */}
            {paymentMethod && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Bank Details
                  </Label>
                  {savedPaymentMethods.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUseSavedMethod(!useSavedMethod)}
                    >
                      {useSavedMethod ? 'Enter New' : 'Use Saved'}
                    </Button>
                  )}
                </div>

                {useSavedMethod && savedPaymentMethods.length > 0 ? (
                  <Select value={selectedSavedMethod} onValueChange={setSelectedSavedMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select saved payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedPaymentMethods
                        .filter(m => m.type === paymentMethod)
                        .map(method => (
                          <SelectItem key={method.id} value={method.id}>
                            <div className="flex items-center gap-2">
                              <span>{method.flag}</span>
                              <span>{method.bankAccount?.bankName}</span>
                              <span className="text-gray-500">
                                (...{method.bankAccount?.accountNumber.slice(-4)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bank-name">Bank Name *</Label>
                        <Input
                          id="bank-name"
                          value={bankDetails.bankName}
                          onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                          placeholder={paymentMethod === 'japan_bank' ? 'e.g., Mitsubishi UFJ' : 'e.g., Bank Mandiri'}
                          disabled={!canRequestPayout}
                        />
                      </div>
                      <div>
                        <Label htmlFor="account-name">Account Name *</Label>
                        <Input
                          id="account-name"
                          value={bankDetails.accountName}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                          placeholder="Account holder name"
                          disabled={!canRequestPayout}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="account-number">Account Number *</Label>
                        <Input
                          id="account-number"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                          placeholder="Enter account number"
                          disabled={!canRequestPayout}
                        />
                      </div>
                      {paymentMethod === 'japan_bank' && (
                        <div>
                          <Label htmlFor="branch-code">Branch Code</Label>
                          <Input
                            id="branch-code"
                            value={bankDetails.branchCode}
                            onChange={(e) => setBankDetails({ ...bankDetails, branchCode: e.target.value })}
                            placeholder="3-digit branch code"
                            disabled={!canRequestPayout}
                          />
                        </div>
                      )}
                      {paymentMethod === 'indonesia_bank' && (
                        <div>
                          <Label htmlFor="swift-code">SWIFT Code</Label>
                          <Input
                            id="swift-code"
                            value={bankDetails.swiftCode}
                            onChange={(e) => setBankDetails({ ...bankDetails, swiftCode: e.target.value })}
                            placeholder="Bank SWIFT code"
                            disabled={!canRequestPayout}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Amount Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-base font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payout Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className="pl-8 text-lg font-semibold"
                  disabled={!canRequestPayout || !paymentMethod}
                />
              </div>
              {amount && !isAmountValid && (
                <p className="text-sm text-red-600 mt-1">
                  {requestAmount < minimumPayout
                    ? `Amount must be at least ¥${minimumPayout.toLocaleString()}`
                    : `Amount exceeds available balance`}
                </p>
              )}
            </div>

            {/* Quick Amount Buttons */}
            {canRequestPayout && paymentMethod && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(minimumPayout.toString())}
                  disabled={minimumPayout > affiliateData.approvedCommission}
                >
                  Min (¥{minimumPayout.toLocaleString()})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(Math.floor(affiliateData.approvedCommission / 2).toString())}
                  disabled={affiliateData.approvedCommission / 2 < minimumPayout}
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(affiliateData.approvedCommission.toString())}
                >
                  Max (¥{affiliateData.approvedCommission.toLocaleString()})
                </Button>
              </div>
            )}

            {/* Payout Summary */}
            {amount && isAmountValid && paymentMethod && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Payout Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Requested Amount:</span>
                    <span className="font-semibold">¥{requestAmount.toLocaleString()}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(0)}%):</span>
                      <span className="text-red-600">-¥{(requestAmount * taxRate).toLocaleString()}</span>
                    </div>
                  )}
                  {processingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing Fee:</span>
                      <span className="text-red-600">-¥{processingFee.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base font-bold">
                    <span>Net Amount:</span>
                    <span className="text-green-600">¥{calculateNetAmount().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Alert */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Payout requests are typically processed within 3-5 business days.
              You will receive an email notification once your payout is processed.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              loading ||
              !canRequestPayout ||
              !paymentMethod ||
              !isAmountValid ||
              (!useSavedMethod && (!bankDetails.bankName || !bankDetails.accountName || !bankDetails.accountNumber))
            }
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutRequestModal;
