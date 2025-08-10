import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';
import {
  CreditCard, Building, Wallet, Globe, DollarSign, Bitcoin,
  Plus, Edit, Trash2, CheckCircle, AlertCircle, Info, Shield,
  ArrowRight, Clock, TrendingUp, Calendar, FileText, Download,
  Smartphone, Banknote, Coins, PiggyBank, Receipt, ArrowUpDown
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'bank' | 'paypal' | 'crypto' | 'ewallet' | 'wire';
  name: string;
  details: any;
  isDefault: boolean;
  isVerified: boolean;
  addedDate: Date;
  lastUsed?: Date;
}

interface PaymentHistory {
  id: string;
  date: Date;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  commission: number;
  bonus?: number;
}

interface PaymentSettings {
  minimumPayout: number;
  payoutSchedule: 'weekly' | 'biweekly' | 'monthly' | 'ondemand';
  currency: string;
  autoPayoutEnabled: boolean;
  taxWithholding: boolean;
  taxRate?: number;
}

const PaymentMethods = ({ affiliateId }: { affiliateId?: string }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'bank',
      name: 'Primary Bank Account',
      details: {
        bankName: 'Mitsubishi UFJ',
        accountNumber: '****1234',
        accountHolder: 'John Doe',
        swiftCode: 'MUFGJPJT'
      },
      isDefault: true,
      isVerified: true,
      addedDate: new Date('2023-06-15'),
      lastUsed: new Date('2024-01-25')
    },
    {
      id: '2',
      type: 'paypal',
      name: 'PayPal Account',
      details: {
        email: 'john***@gmail.com'
      },
      isDefault: false,
      isVerified: true,
      addedDate: new Date('2023-08-20')
    },
    {
      id: '3',
      type: 'crypto',
      name: 'Bitcoin Wallet',
      details: {
        walletAddress: 'bc1q***...***xyz',
        network: 'Bitcoin'
      },
      isDefault: false,
      isVerified: false,
      addedDate: new Date('2024-01-10')
    }
  ]);

  const [paymentHistory] = useState<PaymentHistory[]>([
    {
      id: '1',
      date: new Date('2024-01-25'),
      amount: 385000,
      method: 'Bank Transfer',
      status: 'completed',
      reference: 'PAY-2024-0125-001',
      commission: 350000,
      bonus: 35000
    },
    {
      id: '2',
      date: new Date('2024-01-15'),
      amount: 275000,
      method: 'PayPal',
      status: 'completed',
      reference: 'PAY-2024-0115-002',
      commission: 275000
    },
    {
      id: '3',
      date: new Date('2024-01-05'),
      amount: 450000,
      method: 'Bank Transfer',
      status: 'pending',
      reference: 'PAY-2024-0105-003',
      commission: 425000,
      bonus: 25000
    }
  ]);

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    minimumPayout: 100000,
    payoutSchedule: 'monthly',
    currency: 'JPY',
    autoPayoutEnabled: true,
    taxWithholding: true,
    taxRate: 10
  });

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [selectedMethodType, setSelectedMethodType] = useState('');

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bank': return Building;
      case 'paypal': return Wallet;
      case 'crypto': return Bitcoin;
      case 'ewallet': return Smartphone;
      case 'wire': return Globe;
      default: return CreditCard;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const PaymentMethodCard = ({ method }: { method: PaymentMethod }) => {
    const Icon = getMethodIcon(method.type);
    
    return (
      <Card className={`${method.isDefault ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                method.isVerified ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Icon className={`w-5 h-5 ${
                  method.isVerified ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{method.name}</h4>
                  {method.isDefault && (
                    <Badge className="bg-blue-500 text-white">Default</Badge>
                  )}
                  {method.isVerified ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {method.type === 'bank' && (
                    <>
                      <p>{method.details.bankName}</p>
                      <p>Account: {method.details.accountNumber}</p>
                    </>
                  )}
                  {method.type === 'paypal' && (
                    <p>{method.details.email}</p>
                  )}
                  {method.type === 'crypto' && (
                    <>
                      <p>{method.details.network}</p>
                      <p className="font-mono text-xs">{method.details.walletAddress}</p>
                    </>
                  )}
                </div>
                {method.lastUsed && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last used: {method.lastUsed.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!method.isDefault && (
                <Button size="sm" variant="outline">
                  Set Default
                </Button>
              )}
              <Button size="sm" variant="ghost">
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const AddPaymentMethodForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Add New Payment Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Payment Method Type</Label>
          <RadioGroup value={selectedMethodType} onValueChange={setSelectedMethodType}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank" className="cursor-pointer flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Bank Transfer
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="cursor-pointer flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  PayPal
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="crypto" id="crypto" />
                <Label htmlFor="crypto" className="cursor-pointer flex items-center gap-2">
                  <Bitcoin className="w-4 h-4" />
                  Cryptocurrency
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="ewallet" id="ewallet" />
                <Label htmlFor="ewallet" className="cursor-pointer flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  E-Wallet
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="wire" id="wire" />
                <Label htmlFor="wire" className="cursor-pointer flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Wire Transfer
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {selectedMethodType === 'bank' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input id="bank-name" placeholder="e.g., Mitsubishi UFJ" />
              </div>
              <div>
                <Label htmlFor="branch">Branch Name</Label>
                <Input id="branch" placeholder="e.g., Tokyo Main Branch" />
              </div>
              <div>
                <Label htmlFor="account-number">Account Number</Label>
                <Input id="account-number" placeholder="1234567890" />
              </div>
              <div>
                <Label htmlFor="account-holder">Account Holder Name</Label>
                <Input id="account-holder" placeholder="Full name as on account" />
              </div>
              <div>
                <Label htmlFor="swift">SWIFT/BIC Code</Label>
                <Input id="swift" placeholder="e.g., MUFGJPJT" />
              </div>
              <div>
                <Label htmlFor="routing">Routing Number (if applicable)</Label>
                <Input id="routing" placeholder="Optional" />
              </div>
            </div>
          </div>
        )}

        {selectedMethodType === 'paypal' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="paypal-email">PayPal Email Address</Label>
              <Input id="paypal-email" type="email" placeholder="your@email.com" />
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Make sure this email is associated with a verified PayPal account to receive payments.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {selectedMethodType === 'crypto' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="crypto-type">Cryptocurrency</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select cryptocurrency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="eth">Ethereum (ETH)</SelectItem>
                  <SelectItem value="usdt">Tether (USDT)</SelectItem>
                  <SelectItem value="usdc">USD Coin (USDC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="wallet-address">Wallet Address</Label>
              <Input id="wallet-address" placeholder="Enter your wallet address" />
            </div>
            <div>
              <Label htmlFor="network">Network (if applicable)</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mainnet">Mainnet</SelectItem>
                  <SelectItem value="erc20">ERC-20</SelectItem>
                  <SelectItem value="trc20">TRC-20</SelectItem>
                  <SelectItem value="bep20">BEP-20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {selectedMethodType && (
          <div className="flex gap-3">
            <Button className="flex-1">
              <Shield className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
            <Button variant="outline" onClick={() => {
              setShowAddMethod(false);
              setSelectedMethodType('');
            }}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Methods & Settings</h2>
        <Button onClick={() => setShowAddMethod(!showAddMethod)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {showAddMethod && <AddPaymentMethodForm />}

      <Tabs defaultValue="methods" className="space-y-4">
        <TabsList>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="settings">Payout Settings</TabsTrigger>
          <TabsTrigger value="tax">Tax Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="methods">
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Security Note:</strong> All payment information is encrypted and stored securely. 
                We use bank-level encryption to protect your financial data.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              {paymentMethods.map(method => (
                <PaymentMethodCard key={method.id} method={method} />
              ))}
            </div>

            <Card className="bg-gray-50">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Supported Payment Methods</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-gray-600" />
                    <span className="text-sm">Bank Transfer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-gray-600" />
                    <span className="text-sm">PayPal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bitcoin className="w-5 h-5 text-gray-600" />
                    <span className="text-sm">Cryptocurrency</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <span className="text-sm">E-Wallets</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payment History</CardTitle>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentHistory.map(payment => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Receipt className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold">
                            ¥{payment.amount.toLocaleString()}
                          </span>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p>{payment.date.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Method</p>
                            <p>{payment.method}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Commission</p>
                            <p>¥{payment.commission.toLocaleString()}</p>
                          </div>
                          {payment.bonus && (
                            <div>
                              <p className="text-xs text-gray-500">Bonus</p>
                              <p className="text-green-600">+¥{payment.bonus.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Reference: {payment.reference}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-1" />
                        Invoice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>
                Configure your payment preferences and automatic payout settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="min-payout">Minimum Payout Amount</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="min-payout" 
                      type="number" 
                      value={paymentSettings.minimumPayout}
                      onChange={(e) => setPaymentSettings({
                        ...paymentSettings,
                        minimumPayout: parseInt(e.target.value)
                      })}
                    />
                    <Select value={paymentSettings.currency}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JPY">JPY</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500">
                    Payments will be held until this threshold is reached
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">Payout Schedule</Label>
                  <Select 
                    value={paymentSettings.payoutSchedule}
                    onValueChange={(value: any) => setPaymentSettings({
                      ...paymentSettings,
                      payoutSchedule: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly (Every Friday)</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly (1st & 15th)</SelectItem>
                      <SelectItem value="monthly">Monthly (Last day)</SelectItem>
                      <SelectItem value="ondemand">On Demand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-payout">Automatic Payout</Label>
                    <Switch 
                      id="auto-payout"
                      checked={paymentSettings.autoPayoutEnabled}
                      onCheckedChange={(checked) => setPaymentSettings({
                        ...paymentSettings,
                        autoPayoutEnabled: checked
                      })}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Automatically process payments on schedule
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tax-withholding">Tax Withholding</Label>
                    <Switch 
                      id="tax-withholding"
                      checked={paymentSettings.taxWithholding}
                      onCheckedChange={(checked) => setPaymentSettings({
                        ...paymentSettings,
                        taxWithholding: checked
                      })}
                    />
                  </div>
                  {paymentSettings.taxWithholding && (
                    <Input 
                      type="number" 
                      placeholder="Tax rate %" 
                      value={paymentSettings.taxRate}
                      onChange={(e) => setPaymentSettings({
                        ...paymentSettings,
                        taxRate: parseInt(e.target.value)
                      })}
                    />
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button>
                  Save Payout Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <PiggyBank className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold">¥567,890</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">¥123,456</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold">¥891,234</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button className="flex-1">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
                <Button variant="outline">
                  View Statement
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Documents</CardTitle>
              <CardDescription>
                Manage your tax forms and documents for compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Tax documents are generated automatically based on your earnings and location. 
                  Please ensure your tax information is up to date.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-semibold">2023 Annual Statement</p>
                      <p className="text-sm text-gray-600">Generated on Jan 31, 2024</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    Download PDF
                  </Button>
                </div>

                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-semibold">W-9 Form</p>
                      <p className="text-sm text-gray-600">Submitted on Jun 15, 2023</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Tax Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentMethods;
