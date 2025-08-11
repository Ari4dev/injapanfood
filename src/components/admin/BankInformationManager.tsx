import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { toast } from '@/hooks/use-toast';

interface BankInformation {
  id?: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchName?: string;
  branchCode?: string;
  swiftCode?: string;
  routingNumber?: string;
  bankAddress?: string;
  country: string;
  currency: string;
  accountType: string;
  isActive: boolean;
  isDefault: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const BankInformationManager = () => {
  const [bankAccounts, setBankAccounts] = useState<BankInformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankInformation | null>(null);
  const [showAccountNumbers, setShowAccountNumbers] = useState<{[key: string]: boolean}>({});
  
  const [formData, setFormData] = useState<BankInformation>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    branchName: '',
    branchCode: '',
    swiftCode: '',
    routingNumber: '',
    bankAddress: '',
    country: 'Japan',
    currency: 'JPY',
    accountType: 'checking',
    isActive: true,
    isDefault: false,
    notes: '',
    createdAt: '',
    updatedAt: ''
  });

  const countries = [
    { code: 'JP', name: 'Japan', currency: 'JPY' },
    { code: 'ID', name: 'Indonesia', currency: 'IDR' },
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'SG', name: 'Singapore', currency: 'SGD' }
  ];

  const accountTypes = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'business', label: 'Business Account' },
    { value: 'foreign', label: 'Foreign Currency Account' }
  ];

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'admin_bank_accounts'));
      const accounts: BankInformation[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Skip migration markers
        if (data.bankName === 'MIGRATION_MARKER' || data._migration) {
          return;
        }
        
        accounts.push({
          id: doc.id,
          ...data
        } as BankInformation);
      });

      // Sort by isDefault (default first), then by createdAt (newest first)
      accounts.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bank accounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setFormData({
        ...formData,
        country: country.name,
        currency: country.currency
      });
    }
  };

  const validateForm = (): boolean => {
    if (!formData.bankName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Bank name is required',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.accountNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Account number is required',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.accountHolder.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Account holder name is required',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const timestamp = new Date().toISOString();
      
      // Convert to new format with proper field mappings
      const newFormatData = {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolder, // Map accountHolder -> accountHolderName
        country: mapCountryNameToCode(formData.country), // Map country name to code
        currency: formData.currency === 'JPY' ? 'JPY' : 'IDR' as 'JPY' | 'IDR',
        isActive: formData.isActive,
        isDefault: formData.isDefault,
        branch: formData.branchName,
        swiftCode: formData.swiftCode,
        bankCode: formData.branchCode,
        branchCode: formData.branchCode,
        createdAt: selectedAccount?.createdAt || timestamp,
        updatedAt: timestamp
      };
      
      if (selectedAccount?.id) {
        // Update existing account
        const accountRef = doc(db, 'admin_bank_accounts', selectedAccount.id);
        await updateDoc(accountRef, newFormatData);

        toast({
          title: 'Success',
          description: 'Bank account updated successfully'
        });
      } else {
        // Add new account
        await addDoc(collection(db, 'admin_bank_accounts'), {
          ...newFormatData,
          createdAt: timestamp
        });

        toast({
          title: 'Success',
          description: 'Bank account added successfully'
        });
      }

      // If this account is set as default, update other accounts
      if (formData.isDefault) {
        await handleSetDefault(selectedAccount?.id || 'new');
      }

      resetForm();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      loadBankAccounts();
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast({
        title: 'Error',
        description: 'Failed to save bank account',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (account: BankInformation) => {
    setSelectedAccount(account);
    setFormData(account);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this bank account? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'admin_bank_accounts', accountId));
      toast({
        title: 'Success',
        description: 'Bank account deleted successfully'
      });
      loadBankAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bank account',
        variant: 'destructive'
      });
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      // First, remove default status from all accounts
      const querySnapshot = await getDocs(collection(db, 'admin_bank_accounts'));
      const updatePromises: Promise<void>[] = [];

      querySnapshot.forEach((docSnapshot) => {
        if (docSnapshot.id !== accountId && !docSnapshot.data()._migration) {
          const accountRef = doc(db, 'admin_bank_accounts', docSnapshot.id);
          updatePromises.push(updateDoc(accountRef, { isDefault: false }));
        }
      });

      await Promise.all(updatePromises);

      // Then set the selected account as default
      if (accountId !== 'new') {
        const accountRef = doc(db, 'admin_bank_accounts', accountId);
        await updateDoc(accountRef, { isDefault: true });
      }

      toast({
        title: 'Success',
        description: 'Default account updated successfully'
      });
      
      loadBankAccounts();
    } catch (error) {
      console.error('Error setting default account:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default account',
        variant: 'destructive'
      });
    }
  };

  const toggleAccountStatus = async (accountId: string, currentStatus: boolean) => {
    try {
      const accountRef = doc(db, 'admin_bank_accounts', accountId);
      await updateDoc(accountRef, {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: 'Success',
        description: `Account ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      
      loadBankAccounts();
    } catch (error) {
      console.error('Error toggling account status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update account status',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      branchName: '',
      branchCode: '',
      swiftCode: '',
      routingNumber: '',
      bankAddress: '',
      country: 'Japan',
      currency: 'JPY',
      accountType: 'checking',
      isActive: true,
      isDefault: false,
      notes: '',
      createdAt: '',
      updatedAt: ''
    });
    setSelectedAccount(null);
  };

  const toggleAccountNumberVisibility = (accountId: string) => {
    setShowAccountNumbers(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const maskAccountNumber = (accountNumber: string, show: boolean = false): string => {
    if (show) return accountNumber;
    if (accountNumber.length <= 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  };

  // Helper function to map country names to country codes
  const mapCountryNameToCode = (countryName: string): 'ID' | 'JP' => {
    const countryLower = countryName.toLowerCase();
    
    if (countryLower.includes('japan') || countryLower.includes('jp')) {
      return 'JP';
    } else if (countryLower.includes('indonesia') || countryLower.includes('id')) {
      return 'ID';
    }
    
    // Default to Japan since that's what we mostly use
    return 'JP';
  };

  const BankAccountForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bankName">Bank Name *</Label>
          <Input
            id="bankName"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            placeholder="e.g., Mitsubishi UFJ Bank"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="accountHolder">Account Holder Name *</Label>
          <Input
            id="accountHolder"
            value={formData.accountHolder}
            onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
            placeholder="Full name as on account"
            required
          />
        </div>

        <div>
          <Label htmlFor="accountNumber">Account Number *</Label>
          <Input
            id="accountNumber"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            placeholder="1234567890"
            required
          />
        </div>

        <div>
          <Label htmlFor="accountType">Account Type</Label>
          <Select
            value={formData.accountType}
            onValueChange={(value) => setFormData({ ...formData, accountType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accountTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="country">Country</Label>
          <Select
            value={countries.find(c => c.name === formData.country)?.code || 'JP'}
            onValueChange={handleCountryChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name} ({country.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={formData.currency}
            readOnly
            className="bg-gray-50"
          />
        </div>

        <div>
          <Label htmlFor="branchName">Branch Name</Label>
          <Input
            id="branchName"
            value={formData.branchName}
            onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
            placeholder="e.g., Tokyo Main Branch"
          />
        </div>

        <div>
          <Label htmlFor="branchCode">Branch Code</Label>
          <Input
            id="branchCode"
            value={formData.branchCode}
            onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
            placeholder="e.g., 001"
          />
        </div>

        <div>
          <Label htmlFor="swiftCode">SWIFT/BIC Code</Label>
          <Input
            id="swiftCode"
            value={formData.swiftCode}
            onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
            placeholder="e.g., MUFGJPJT"
          />
        </div>

        <div>
          <Label htmlFor="routingNumber">Routing Number</Label>
          <Input
            id="routingNumber"
            value={formData.routingNumber}
            onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
            placeholder="For US banks (optional)"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bankAddress">Bank Address</Label>
        <Input
          id="bankAddress"
          value={formData.bankAddress}
          onChange={(e) => setFormData({ ...formData, bankAddress: e.target.value })}
          placeholder="Bank's physical address"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional information (optional)"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-gray-300"
          />
          <Label htmlFor="isActive">Account is active</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isDefault"
            checked={formData.isDefault}
            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            className="rounded border-gray-300"
          />
          <Label htmlFor="isDefault">Set as default account</Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1">
          <Building2 className="w-4 h-4 mr-2" />
          {selectedAccount ? 'Update Account' : 'Add Account'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            resetForm();
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading bank accounts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Bank Information Management
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage bank accounts for payment processing and affiliate payouts
              </p>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bank Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Bank Account</DialogTitle>
                  <DialogDescription>
                    Add a new bank account for payment processing or affiliate payouts.
                  </DialogDescription>
                </DialogHeader>
                <BankAccountForm />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Accounts</p>
                <p className="text-xl font-bold">{bankAccounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Accounts</p>
                <p className="text-xl font-bold">{bankAccounts.filter(acc => acc.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Default Account</p>
                <p className="text-xl font-bold">{bankAccounts.filter(acc => acc.isDefault).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-xl font-bold">{bankAccounts.filter(acc => !acc.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No bank accounts found. Add your first bank account to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Country/Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{account.bankName}</p>
                            {account.isDefault && (
                              <Badge className="bg-blue-500 text-white">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{account.accountHolder}</p>
                          {account.branchName && (
                            <p className="text-xs text-gray-500">{account.branchName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {maskAccountNumber(account.accountNumber, showAccountNumbers[account.id || ''])}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleAccountNumberVisibility(account.id || '')}
                          >
                            {showAccountNumbers[account.id || ''] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {accountTypes.find(type => type.value === account.accountType)?.label || account.accountType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{account.country}</p>
                          <p className="text-sm text-gray-600">{account.currency}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant={account.isActive ? "default" : "secondary"}
                            className={account.isActive ? "bg-green-500" : "bg-gray-400"}
                          >
                            {account.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!account.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefault(account.id || '')}
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleAccountStatus(account.id || '', account.isActive)}
                          >
                            {account.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Dialog open={isEditModalOpen && selectedAccount?.id === account.id} onOpenChange={(open) => {
                            setIsEditModalOpen(open);
                            if (!open) resetForm();
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(account)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Bank Account</DialogTitle>
                                <DialogDescription>
                                  Update the bank account information.
                                </DialogDescription>
                              </DialogHeader>
                              <BankAccountForm />
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(account.id || '')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BankInformationManager;
